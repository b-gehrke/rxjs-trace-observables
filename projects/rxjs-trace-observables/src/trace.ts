import {Observable} from "rxjs";
import {tap} from "rxjs/operators";
import {GraphMessage} from "./graphMessage";
import {graph} from "./global";
import {StackData} from "./stackData";
import {Node} from "./node";

let nextId = 0;

export function trace(name?: string): <T>(source: Observable<T>) => Observable<T> {
    return <T>(source: Observable<T>) => {

        const traceId = nextId++;
        let counter = 0;

        return source.pipe(
            tap(traceFn, traceFn));

        function traceFn(x) {
            const node = source["__node__"] as Node<StackData>;

            if (node.data.traceIds.indexOf(traceId) < 0) {
                node.data.traceIds.push(traceId);
            }

            graph.depthSearch(node, n => {
                if (n.data.traceIds.indexOf(traceId) < 0) {
                    n.data.traceIds.push(traceId);
                }
                return false;
            }, {
                direction: "both"
            });


            console.debug(`Tracing observable. Current value: ${x}\n
    
${Object.keys(graph.adjacencyList)
                .flatMap(
                    from => graph.adjacencyList[+from].map(to => `${graph.getNode(+from).data.name} -> ${graph.getNode(+to).data.name}`))
                .join("\n")}

${graph.nodes.map(x => (`${x.data.name}: ${x.data}`)).join("\n")} 
    `);
            let message: GraphMessage = {type: "graph", content: {graph, traceId, time: counter++, name: name || traceId.toString()}};


            const getCircularReplacer = () => {
                const seen = new WeakSet();
                return (key, value) => {
                    if (typeof value === "object" && value !== null) {
                        if (seen.has(value)) {
                            return;
                        }
                        seen.add(value);
                    }
                    return value;
                };
            };

            message = JSON.parse(JSON.stringify(message, getCircularReplacer()));

            if (window && window.postMessage) {
                setTimeout(() => window.postMessage(message, "*"), 0);
            }
        }
    };
}
