// background.js

const connections = {};
const pendingMessages: { tabId: number, messages: any[] }[] = [];

chrome.runtime.onConnect.addListener(function (port) {
    const extensionListener = function (message, port: chrome.runtime.Port) {

        // The original connection event doesn't include the tab ID of the
        // DevTools page, so we need to send it explicitly.
        if (message.name == "init") {
            const tabId = message.tabId;
            connections[tabId] = port;

            console.debug(`Tab ${tabId} connected.`);

            if (tabId in pendingMessages) {
                console.debug(`Sending ${pendingMessages[tabId].messages.length} pending messages`);
                console.debug({pendingMessages: [...pendingMessages[tabId].messages]});

                for (const pendingMessage of pendingMessages[tabId].messages) {
                    connections[tabId].postMessage(pendingMessage);
                }

                delete pendingMessages[tabId];
            }

            return;
        }

        // other message handling
        console.debug(`Forwarding message from devTools to ContentScripts: ${message}`);

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
chrome.runtime.onMessage.addListener(function (message, sender) {
    // Messages from content scripts should have sender.tab set
    if (sender.tab) {
        const tabId = sender.tab.id;
        if (tabId in connections) {
            console.debug("forwarding message to devTools");
            console.debug({message});

            connections[tabId].postMessage(message);
        } else {
            pendingMessages[tabId] = pendingMessages[tabId] || {tabId, messages: []};
            pendingMessages[tabId].messages.push(message);
            console.debug(`Tab ${tabId} not found in connection list. Queued message until connection`);
        }
    } else {
        console.error("sender.tab not defined.");
    }
    return true;
});
