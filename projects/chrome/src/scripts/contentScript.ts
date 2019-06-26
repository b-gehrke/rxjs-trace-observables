const port = chrome.runtime.connect();

chrome.runtime.onMessage.addListener((message) => {
    console.debug(`Message to ContentPage: ${message}`);
});

window.addEventListener("message", message => {
    console.debug("Content page received message");
    console.debug({message});

    if (message.data.type && message.data.type === "graph") {
        chrome.runtime.sendMessage(message.data);
    }
});
