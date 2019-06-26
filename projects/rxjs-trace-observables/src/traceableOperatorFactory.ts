import {Observable, throwError} from "rxjs";
import {StackData} from "./stackData";
import {catchError, tap} from "rxjs/operators";
import {TraceObservablePipesConfiguration} from "./traceObservablePipesConfiguration";

export function traceableOperatorFactory<T extends Function>(operator: T, opName: string, config: TraceObservablePipesConfiguration) {
    return function (...args) {
        const stack = new StackData(opName);
        return (source: Observable<T>) => {
            source["__stack__"] = (source["__stack__"] || []);
            if (config.excludePackages.some(x => stack.call.indexOf(x) >= 0)) {
                return source;
            } else {
                source["__stack__"] = [...source["__stack__"], stack];

                return source.pipe(
                    operator(...args),
                    tap(val => stack.value = val),
                    catchError((err) => {
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
