chrome.devtools.panels.create("Trace Observables",
    null,
    "devToolsApp/index.html",

    function (panel) {


        // Create a connection to the background page
        const backgroundPageConnection = chrome.runtime.connect({
            name: "panel"
        });

        backgroundPageConnection.postMessage({
            name: "init",
            tabId: chrome.devtools.inspectedWindow.tabId
        });

        backgroundPageConnection.onMessage.addListener(message => {
            if (message.type === "traceGraph") {
                document.write(JSON.stringify(message.content));
            }
        });
    }
);

document.write("TEST");
