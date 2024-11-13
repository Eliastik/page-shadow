/* Page Shadow
 *
 * Copyright (C) 2015-2024 Eliastik (eliastiksofts.com)
 *
 * This file is part of Page Shadow.
 *
 * Page Shadow is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Page Shadow is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Page Shadow.  If not, see <http://www.gnu.org/licenses/>. */
import { pageShadowAllowed, getSettings, getCurrentURL, hasSettingsChanged, sendMessageWithPromise, sha256 } from "./utils/util.js";
import browser from "webextension-polyfill";
import ContentProcessor from "./classes/contentProcessor.js";
import SafeTimer from "./classes/safeTimer.js";
import ContentProcessorConstants from "./classes/contentProcessorConstants.js";

const contentProcessor = new ContentProcessor();

let settings = null;
let precUrl = null;
let initFinished = false;
let initProcessing = false;

async function applyIfSettingsChanged(statusChanged, storageChanged, isEnabled, customThemeChanged) {
    const result = await browser.storage.local.get("liveSettings");
    const isLiveSettings = result.liveSettings !== "false";

    if(isLiveSettings && contentProcessor.runningInPopup) {
        const allowed = await pageShadowAllowed(getCurrentURL());
        statusChanged = contentProcessor.hasEnabledStateChanged(allowed);
    }

    if(statusChanged && ((!isLiveSettings && !storageChanged) || isLiveSettings)) {
        contentProcessor.precEnabled = isEnabled;
        return await contentProcessor.main(ContentProcessorConstants.TYPE_RESET, ContentProcessorConstants.TYPE_ALL);
    }

    if(isLiveSettings && storageChanged) {
        if(contentProcessor.runningInIframe) {
            const response = await sendMessageWithPromise({ "type": "applySettingsChanged" }, "applySettingsChangedResponse");
            const changed = contentProcessor.hasEnabledStateChanged(response.enabled);

            if(changed || hasSettingsChanged(contentProcessor.currentSettings, response.settings)) {
                contentProcessor.precEnabled = response.enabled;
                await contentProcessor.main(ContentProcessorConstants.TYPE_RESET, ContentProcessorConstants.TYPE_ALL, true);
            }
        } else {
            if(hasSettingsChanged(contentProcessor.currentSettings, await getSettings(getCurrentURL(), true), customThemeChanged)) {
                contentProcessor.precEnabled = isEnabled;
                await contentProcessor.main(ContentProcessorConstants.TYPE_RESET, ContentProcessorConstants.TYPE_ALL, true);
            }
        }
    }
}

/**
 * Execute to pre-apply settings when a page is loaded before full settings are loaded. Limit flash effect.
 */
function preApplyContrast(data, contentProcessor) {
    if (!data.enabled) {
        return true;
    }

    if(document.body && document.getElementsByTagName("html")[0] && !contentProcessor.started) {
        contentProcessor.initClassBatchers();

        // Pre-apply contrast, brightness, blue light filter and invert entire page
        if (data.settings.pageShadowEnabled == "true") {
            contentProcessor.applyContrastPage(true, data.settings.pageShadowEnabled, data.settings.theme, "false", "false", data.customThemes);
        }

        if (data.settings.pageLumEnabled == "true") {
            contentProcessor.brightnessPage(data.settings.pageLumEnabled, data.settings.pourcentageLum);
        }

        if (data.settings.blueLightReductionEnabled == "true") {
            contentProcessor.blueLightFilterPage(data.settings.blueLightReductionEnabled, data.settings.percentageBlueLightReduction, data.settings.colorTemp);
        }

        if (data.settings.colorInvert == "true" && data.settings.invertEntirePage == "true") {
            contentProcessor.invertColor(data.settings.colorInvert, data.settings.invertImageColors, data.settings.invertEntirePage, data.settings.invertVideoColors, data.settings.invertBgColor, data.settings.selectiveInvert, null, null, null, null, null, null, data.settings.invertBrightColors);

            contentProcessor.bodyClassBatcher.apply();
            contentProcessor.bodyClassBatcherRemover.apply();
            contentProcessor.htmlClassBatcher.apply();
        }

        contentProcessor.started = true;

        return true;
    }

    return false;
}

// Global content processor start function
const timerStart = new SafeTimer(async () => {
    if(!initFinished && !initProcessing) {
        initProcessing = true;

        await contentProcessor.main(ContentProcessorConstants.TYPE_START);

        initFinished = true;
        initProcessing = false;
        precUrl = getCurrentURL();
    }
});

// Pre-apply function
const timerPreApply = new SafeTimer(async() => {
    if(settings) {
        if(preApplyContrast(settings, contentProcessor)) {
            timerStart.start();
        } else {
            timerPreApply.start();
        }
    }
});

// Message/response handling
browser.runtime.onMessage.addListener(async(message) => {
    if(message && message.type == "preApplySettings") {
        settings = message.data;
        timerPreApply.start();
    } else if(message && message.type == "websiteUrlUpdated") { // Execute when the page URL changes in Single Page Applications
        const currentURL = getCurrentURL();

        if(contentProcessor && contentProcessor.websiteSpecialFiltersConfig.enableURLChangeDetection &&
            message && message.url == await sha256(currentURL)) {
            const urlUpdated = precUrl != getCurrentURL();
            const changed = initFinished && (contentProcessor.hasEnabledStateChanged(message.enabled) || urlUpdated);

            if(urlUpdated) {
                precUrl = getCurrentURL();

                if(contentProcessor) {
                    contentProcessor.precUrl = getCurrentURL();

                    if (contentProcessor.filterProcessor) {
                        contentProcessor.filterProcessor.filtersCache = null;
                    }

                    if (contentProcessor.pageAnalyzer) {
                        contentProcessor.pageAnalyzer.backgroundDetected = false;
                    }
                }
            }

            if(changed) {
                await applyIfSettingsChanged(true, message.storageChanged, message.enabled);
            }
        }
    }
});

// If storage/settings have changed
browser.storage.onChanged.addListener((changes, areaName) => {
    if(changes && areaName == "local") {
        applyIfSettingsChanged(false, true, null, changes.customThemes != null);
    }
});

browser.runtime.sendMessage({ type: "ready" });