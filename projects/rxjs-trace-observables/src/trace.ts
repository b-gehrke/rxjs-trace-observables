import {Observable} from "rxjs";
import {getGraphFromStack} from "./graph";
import {tap} from "rxjs/operators";

export const trace = () => <T>(source: Observable<T>) => {
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
        const message = {type: "graph", content: graph};
        setTimeout(() => window.postMessage(message, "*"), 0);
    }));
};
