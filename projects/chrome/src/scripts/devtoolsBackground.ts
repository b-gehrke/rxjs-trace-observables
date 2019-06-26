chrome.devtools.panels.create("Trace Observables",
    null,
    "devToolsApp/index.html",

    function () {


        // Create a connection to the background page
        const backgroundPageConnection = chrome.runtime.connect({
            name: "panel"
        });

        backgroundPageConnection.postMessage({
            name: "init",
            tabId: chrome.devtools.inspectedWindow.tabId
        });
    }
);
