import {Observable} from "rxjs";
import {getGraphFromStack} from "./graph";
import {tap} from "rxjs/operators";
import {GraphMessage} from "./graphMessage";

let nextId = 0;
export const trace = (name?: string) => <T>(source: Observable<T>) => {

    const obsId = nextId++;
    let counter = 0;

    return source.pipe(tap(x => {
        const stack = source["__stack__"];

        if (!stack) {
            console.warn("Tried to trace an observable but there is no stack. Is the library imported correctly?");
            return;
        }

        const graph = getGraphFromStack(stack);
        console.debug(`Tracing observable. Current value: ${x}\n

${Object.keys(graph.adjacencyList)
            .flatMap(from => graph.adjacencyList[+from].map(to => `${graph.getNode(+from).data.name} -> ${graph.getNode(+to).data.name}`))
            .join("\n")}

${graph.nodes.map(x => (`${x.data.name}: ${x.data}`)).join("\n")} 
`);
        const message: GraphMessage = {type: "graph", content: {graph, graphId: obsId, time: counter++, name: name || obsId.toString()}};
        setTimeout(() => window.postMessage(message, "*"), 0);
    }));
};
