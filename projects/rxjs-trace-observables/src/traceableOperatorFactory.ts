import {Observable, throwError} from "rxjs";
import {StackData} from "./stackData";
import {catchError, tap} from "rxjs/operators";

export function traceableOperatorFactory<T extends Function>(operator: T, opName: string) {
    return function (...args) {
        const stack = new StackData(opName);
        return (source: Observable<T>) => {
            source["__stack__"] = [...(source["__stack__"] || []), stack];

            return source.pipe(
                tap(val => stack.value = val),
                operator(...args),
                catchError((err, caught) => {
                    // if (!(err instanceof ObservablePipeError)) {
                    // console.warn("An error occurred in an observable pipe: \n\n" + getKNode(caught['__stack__']).prettyPrint());
                    // }
                    return throwError(err);
                })
            );
        };
    };
}
