import { Hashable } from "./hashable";
export declare class Node<T extends Hashable> {
    private static nextNodeId;
    readonly id: number;
    readonly data: T;
    constructor(data: T);
    toString(): string;
}
