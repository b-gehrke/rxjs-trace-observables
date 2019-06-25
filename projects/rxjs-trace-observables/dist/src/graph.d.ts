import { Hashable } from "./hashable";
import { Node } from "./node";
export declare class Graph<T extends Hashable> {
    readonly directed: boolean;
    readonly nodes: Node<T>[];
    readonly adjacencyList: {
        [k: number]: number[];
    };
    constructor(directed?: boolean);
    getNode(id: number | T): Node<T> | null;
    addNode(data: T): Node<T>;
    addEdge(from: Node<T>, to: Node<T>): void;
}
export declare function getGraphFromStack(stack: any[]): Graph<any>;
