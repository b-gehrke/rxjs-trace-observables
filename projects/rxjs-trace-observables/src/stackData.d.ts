import { Hashable } from "./hashable";
export declare class StackData implements Hashable {
    readonly name: string;
    value: any;
    readonly call: string;
    constructor(name: string, value?: any);
    getHash(): number;
}
