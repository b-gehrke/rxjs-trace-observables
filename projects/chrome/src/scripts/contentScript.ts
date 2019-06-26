const port = chrome.runtime.connect();

chrome.runtime.onMessage.addListener((message) => {
    console.log(`Message to ContentPage: ${message}`);
});

window.addEventListener("message", message => {
    console.log("Content page received message");
    console.log({message});

    if (message.data.type && message.data.type === "graph") {
        chrome.runtime.sendMessage(message.data);
    }
});
