import * as vis from "vis";
import {Graph} from "rxjs-trace-observables";

require("../../lib/source-map.js");

// @ts-ignore
sourceMap.SourceMapConsumer.initialize({
    "lib/mappings.wasm": "https://unpkg.com/source-map@0.7.3/lib/mappings.wasm"
});


function createNewGraph(name: string, id: string): HTMLElement {
    const templateButton = document.createElement("template");
    templateButton.innerHTML = `<div class="switch-container" data-reference-id="${id}">${name}</div>`;
    const switcher = templateButton.content.firstChild as HTMLElement;

    document.getElementById("nav").appendChild(switcher);

    const templateGraph = document.createElement("template");
    templateGraph.innerHTML = `<div class="container" id="container-${id}" style="display: none;"></div>`;
    const container = templateGraph.content.firstChild as HTMLElement;

    document.getElementById("main").appendChild(container);


    switcher.addEventListener("click", () => {
        document.querySelectorAll(".container").forEach(x => {
            x.setAttribute("style", "display: none");
        });

        document.querySelectorAll(".switch-container").forEach(x => x.classList.remove("active"));
        switcher.classList.add("active");

        container.setAttribute("style", "");
    });

    return container;
}

function getOrAddGraphContainer(id: string, name: string): HTMLElement {
    const element = document.getElementById("container-" + id);
    if (element) {
        return element;
    }

    return createNewGraph(name, id);
}

function createContainer(name: string, id: string): HTMLElement {
    const template = document.createElement("template");
    template.innerHTML = `<div id="container-${id}">
<h3>${name}</h3>
<div id="paper-${id}"></div>
</div>`;
    return template.content.firstChild as HTMLElement;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Panel received message");
    console.log({message});

    if (message.type === "traceGraph" && message.content) {
        const graphId: number = message.content.id;
        const graph: Graph<any> = message.content.graph;

        console.log("Drawing graph with id " + graphId);
        console.log({graph});

        const nodes = new vis.DataSet(graph.nodes.map(
            x => ({
                id: x.id,
                label: `${x.data.name} (${x.data.value})\n${x.data.call.replace(/^\s*at\s([^(]+\s)?\(?.*\)?\s*$/, "$1")}`,
                title: x.data.call.match(/at\s([^(]+)?\s?/)[1]
            })));
        const edges = new vis.DataSet(Object.keys(graph.adjacencyList).flatMap(from => graph.adjacencyList[from].map(to => ({from, to}))));

        const data = {
            nodes,
            edges
        };

        const container = getOrAddGraphContainer(graphId + "", graphId + "");

        const network = new vis.Network(container, data, {
            interaction: {
                hover: true
            },
            edges: {
                arrows: {to: {enabled: true}}
            },
            physics: false
        });

        network.on("click", async (event: {
            nodes: number[],
            edges: string[],
            event: PointerEvent,
            pointer: {
                DOM: { x: number, y: number },
                canvas: { x: number, y: number }
            }
        }) => {
            const node = event.nodes[0];

            const gNode = graph.nodes.find(x => x.id === node);

            if (gNode) {

                const match = gNode.data.call.match(/^\s*at\s(?:[^(]+\s)?\(?(.*):(\d+):(\d+)\)?\s*$/);

                const source = match[1];
                const lineNumber = +match[2];
                const col = +match[3];

                const response = await fetch(source + ".map");

                if (response.ok) {
                    const sm = await response.json();

                    // @ts-ignore
                    await sourceMap.SourceMapConsumer.with(sm, null, consumer => {

                        const original = consumer.originalPositionFor({line: lineNumber, column: col});

                        // Check if the found source actually exists
                        if (sm.sources.indexOf(original.source) < 0) {
                            // if the source is a webpack source, check if it has removed leading periods (./)
                            if (original.source && original.source.startsWith("webpack:///")) {
                                const fixedUrl = original.source.replace("webpack:///", "webpack:///./");
                                if (sm.sources.indexOf(fixedUrl) >= 0) {
                                    original.source = fixedUrl;
                                }
                            }
                        }

                        chrome.devtools.panels.openResource(original.source || source,
                            (original.source ? original.line : lineNumber) - 1,
                            () => null);
                    });
                } else {
                    chrome.devtools.panels.openResource(source, lineNumber - 1, () => console.log("Opened resource"));
                }
            }
        });

    }
});

document.getElementById("clear-all-button").addEventListener("click", () => {
    document.querySelectorAll("#nav .switch-container:not(#clear-all-button)").forEach(x => x.remove());
    document.querySelectorAll("#main .container").forEach(x => x.remove());
});
