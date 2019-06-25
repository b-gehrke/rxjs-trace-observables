import {Observable} from "rxjs";
import {StackData} from "./stackData";
import {tap} from "rxjs/operators";

export function traceableCombinationOperatorFactory<T extends Function>(operator: T, opName: string) {
    // @ts-ignore
    return (...args: Observable[]) => {
        if (args.length === 1 && Array.isArray(args[0])) {
            args = args[0];
        }
        const result = operator(args);
        const stack = new StackData(opName);
        result["__stack__"] = [
            args.filter(x => x["__stack__"]).map(arg => arg["__stack__"]),
            stack
        ];
        return result.pipe(tap(val => stack.value = val));
    };
}
