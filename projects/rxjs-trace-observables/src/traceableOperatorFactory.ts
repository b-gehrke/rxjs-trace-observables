import {isObservable, Observable, throwError} from "rxjs";
import {StackData} from "./stackData";
import {TraceObservablePipesConfiguration} from "./traceObservablePipesConfiguration";
import {Node} from "./node";
import {graph} from "./global";

export function traceableOperatorFactory<T extends Function>(operator: T, opName: string, config: TraceObservablePipesConfiguration) {
    return function (...args) {
        const stack = new StackData(opName);
        return (source: Observable<any>) => {
            if (config.excludePackages.some(x => stack.call.indexOf(x) >= 0)) {
                return operator(...args)(source);
            } else {
                const ownNode = graph.addNode(stack);

                if (source["__node__"]) {
                    const sourceNode = source["__node__"] as Node<StackData>;
                    graph.addEdge(sourceNode, ownNode);
                } else {
                    ownNode.data.isRoot = true;
                }

                // Check whether the operator is a -Map operator ("switchMap")
                if (opName.endsWith("Map") && typeof args[0] === "function") {
                    const origProject = args[0];
                    args[0] = (...args) => {
                        const ret = origProject(...args);

                        if (isObservable(ret)) {
                            // find outgoing edges to map operator
                            const outgoing = graph.outgoing(ownNode);

                            //remove the edges from the map operator and add those edges to the last node of the returned obs (if it exists)
                            const lastNode = ret["__node__"] as Node<StackData>;
                            if (lastNode) {
                                for (let outgoingElement of outgoing) {
                                    if (!graph.breadthSearch(outgoingElement, node => node.id === lastNode.id, true)) {
                                        console.log(`removing edge from ${ownNode.data.name} to ${outgoingElement.data.name}`);
                                        graph.removeEdge(ownNode, outgoingElement);
                                        console.log(`adding edge from ${lastNode.data.name} to ${outgoingElement.data.name} while on ${ownNode.data.name}`);
                                        graph.addEdge(lastNode, outgoingElement);
                                    }
                                }
                            }

                            // find the first nodes(s) and add an edge from own node to those
                            const firstNodes = graph.breadthSearch(lastNode, node => node.data.isRoot, true);

                            // for (let firstNode of firstNodes) {
                            if (firstNodes[0]) {
                                // graph.addEdge(ownNode, firstNode);
                                console.log(`adding edge from ${ownNode.data.name} to ${firstNodes[0].data.name}`);
                                graph.addEdge(ownNode, firstNodes[0]);
                                // }
                            }
                        }

                        return ret;
                    };
                }
                const nextFn = operator(...args);
                const next = nextFn(source);

                next["__node__"] = ownNode;

                return next.pipe(
                    config.origRxJsOperators.tap(val => stack.value = val),
                    config.origRxJsOperators.catchError((err) => {
                        stack.hasError = true;
                        // if (!(err instanceof ObservablePipeError)) {
                        // console.warn("An error occurred in an observable pipe: \n\n" + getKNode(caught['__stack__']).prettyPrint());
                        // }
                        return throwError(err);
                    })
                );
            }
        };
    };
}
