// background.js

const connections = {};

chrome.runtime.onConnect.addListener(function (port) {
    const extensionListener = function (message, port: chrome.runtime.Port) {

        // The original connection event doesn't include the tab ID of the
        // DevTools page, so we need to send it explicitly.
        if (message.name == "init") {
            connections[message.tabId] = port;
            return;
        }

        // other message handling
        console.log(`Forwarding message from devTools to ContentScripts: ${message}`);

        chrome.tabs.sendMessage(message.tabId, message);
    };

    // Listen to messages sent from the DevTools page
    port.onMessage.addListener(extensionListener);

    port.onDisconnect.addListener(function (port) {
        port.onMessage.removeListener(extensionListener);

        const tabs = Object.keys(connections);
        for (let i = 0, len = tabs.length; i < len; i++) {
            if (connections[tabs[i]] == port) {
                delete connections[tabs[i]];
                break;
            }
        }
    });
});

// Receive message from content script and relay to the devTools page for the
// current tab
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    // Messages from content scripts should have sender.tab set
    if (sender.tab) {
        const tabId = sender.tab.id;
        if (tabId in connections) {
            console.log("forwarding message to devTools");
            console.log({message});

            connections[tabId].postMessage(message);
        } else {
            console.log("Tab not found in connection list.");
        }
    } else {
        console.log("sender.tab not defined.");
    }
    return true;
});
