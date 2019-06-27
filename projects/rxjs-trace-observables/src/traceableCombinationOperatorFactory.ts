import {Observable} from "rxjs";
import {StackData} from "./stackData";
import {TraceObservablePipesConfiguration} from "./traceObservablePipesConfiguration";
import {graph} from "./global";

export function traceableCombinationOperatorFactory<T extends Function>(operator: T,
                                                                        opName: string,
                                                                        config: TraceObservablePipesConfiguration) {
    // @ts-ignore
    return (...args: Observable[]) => {
        if (args.length === 1 && Array.isArray(args[0])) {
            args = args[0];
        }
        const result = operator(...args);
        const stack = new StackData(opName);

        const ownNode = graph.addNode(stack);

        for (let arg of args) {
            if (arg["__node__"]) {
                graph.addEdge(ownNode, arg["__node__"]);
            }
        }

        return result.pipe(config.origRxJsOperators.tap(val => stack.value = val));
    };
}
