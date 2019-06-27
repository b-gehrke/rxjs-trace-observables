import {hashString} from "./traceObservablePipes";
import {Hashable} from "./hashable";

export class StackData implements Hashable {
    public readonly call: string;

    public constructor(public readonly name: string, public value: any = undefined, public hasError = false, public isRoot = false) {
        this.call = new Error().stack.split("\n")[3];
    }

    getHash(): number {
        return hashString(this.call);
    }
}

