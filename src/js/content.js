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
import { sendMessageWithPromise } from "./utils/browserUtils.js";
import { getCurrentURL } from "./utils/urlUtils.js";
import { getSettings, hasSettingsChanged } from "./utils/settingsUtils.js";
import { pageShadowAllowed } from "./utils/enableDisableUtils.js";
import browser from "webextension-polyfill";
import ContentProcessor from "./classes/contentProcessor.js";
import SafeTimer from "./classes/safeTimer.js";
import ContentProcessorConstants from "./classes/contentProcessorConstants.js";
import DebugLogger from "./classes/debugLogger.js";

const contentProcessor = new ContentProcessor();
const debugLogger = new DebugLogger();

let settings = null;
let initFinished = false;
let initProcessing = false;

async function applyIfSettingsChanged(statusChanged, storageChanged, isEnabled, customThemeChanged, resetPageAnalysisState) {
    const result = await browser.storage.local.get("liveSettings");
    const isLiveSettings = result.liveSettings !== "false";

    if(isLiveSettings && contentProcessor.runningInPopup) {
        const allowed = await pageShadowAllowed(getCurrentURL());
        statusChanged = contentProcessor.hasEnabledStateChanged(allowed);
    }

    if(statusChanged && ((!isLiveSettings && !storageChanged) || isLiveSettings)) {
        if(isEnabled != null) {
            contentProcessor.precEnabled = isEnabled;
        }

        if(resetPageAnalysisState) {
            contentProcessor.resetPageAnalysisState();
        }

        return contentProcessor.start(ContentProcessorConstants.TYPE_RESET, ContentProcessorConstants.TYPE_ALL);
    }

    if(isLiveSettings && storageChanged) {
        if(contentProcessor.runningInIframe) {
            const response = await sendMessageWithPromise({ "type": "applySettingsChanged" }, "applySettingsChangedResponse");
            const changed = contentProcessor.hasEnabledStateChanged(response.enabled);

            if(changed || hasSettingsChanged(contentProcessor.currentSettings, response.settings)) {
                if(response.enabled != null) {
                    contentProcessor.precEnabled = response.enabled;
                }

                if(resetPageAnalysisState) {
                    contentProcessor.resetPageAnalysisState();
                }

                return contentProcessor.start(ContentProcessorConstants.TYPE_RESET, ContentProcessorConstants.TYPE_ALL, true);
            }
        } else if(hasSettingsChanged(contentProcessor.currentSettings, await getSettings(getCurrentURL(), true), customThemeChanged)) {
            if(isEnabled != null) {
                contentProcessor.precEnabled = isEnabled;
            }

            if(resetPageAnalysisState) {
                contentProcessor.resetPageAnalysisState();
            }

            return contentProcessor.start(ContentProcessorConstants.TYPE_RESET, ContentProcessorConstants.TYPE_ALL, true);
        }
    }
}

/**
 * Execute to pre-apply settings when a page is loaded before full settings are loaded. Limit flash effect.
 */
function fastPreApply(data) {
    if (!data.enabled) {
        return true;
    }

    if(document.body && document.getElementsByTagName("html")[0] && !contentProcessor.started) {
        debugLogger.log("Content script - Pre-applying settings");

        contentProcessor.fastPreApply(data.settings, data.customThemes);

        debugLogger.log("Content script - Finished pre-applying settings");

        return true;
    }

    return false;
}

// Global content processor start function
const timerStart = new SafeTimer(async () => {
    if(initFinished || initProcessing) {
        return;
    }

    initProcessing = true;

    try {
        await contentProcessor.start(ContentProcessorConstants.TYPE_START);
    } catch(e) {
        debugLogger.log("Content timerStart - Error executing main", "error", e);
    } finally {
        initFinished = true;
        initProcessing = false;
    }
});

// Pre-apply function
const timerPreApply = new SafeTimer(() => {
    if(settings) {
        if(fastPreApply(settings)) {
            timerStart.start();
        } else {
            timerPreApply.start();
        }
    }
});

// Message/response handling
browser.runtime.onMessage.addListener((message) => {
    if(!message) {
        return;
    }

    if(message.type == "preApplySettings") {
        settings = message.data;
        timerPreApply.start();
    } else if(message.type == "websiteUrlUpdated" && contentProcessor) {
        // Execute when the page URL changes in Single Page Applications
        const currentURL = getCurrentURL();
        const precURL = contentProcessor.precUrl;

        if(precURL) {
            if(contentProcessor.websiteSpecialFiltersConfig.enableURLChangeDetection) {
                const urlUpdated = precURL != getCurrentURL();
                const enabledStateChanged = contentProcessor.hasEnabledStateChanged(message.enabled);
                const changed = initFinished && (enabledStateChanged || urlUpdated);

                if(urlUpdated) {
                    contentProcessor.precUrl = getCurrentURL();
                }

                if(changed) {
                    debugLogger.log(`Content script - websiteUrlUpdated - URL has changed, or enabled state has changed. Re-applying settings. Current URL = ${currentURL} / Previous URL = ${precURL} / Enabled state changed? ${enabledStateChanged}`);
                    applyIfSettingsChanged(true, message.storageChanged, message.enabled, false, urlUpdated);
                }
            }
        }
    }
});

// If storage/settings have changed
browser.storage.onChanged.addListener((changes, areaName) => {
    if(changes && areaName == "local") {
        applyIfSettingsChanged(false, true, null, changes.customThemes != null, false);
    }
});

browser.runtime.sendMessage({ type: "ready" });