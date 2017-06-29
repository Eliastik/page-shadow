function openPopupTab() {
    chrome.tabs.create({
        url: "extension.html"
    });
}

chrome.browserAction.onClicked.addListener(openPopupTab);
