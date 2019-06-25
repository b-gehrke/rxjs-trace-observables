import {Hashable} from "./hashable";
import {Node} from "./node";

export class Graph<T extends Hashable> {
    public readonly nodes: Node<T>[] = [];
    public readonly adjacencyList: { [k: number]: number[] } = {};

    public constructor(public readonly directed: boolean = true) {

    }

    public getNode(id: number | T): Node<T> | null {
        if (typeof id === "number") {
            return this.nodes.find(x => x.id === id);
        } else {
            return this.nodes.find(x => x.id === id.getHash());
        }
    }

    public addNode(data: T): Node<T> {
        const existingNode = this.nodes.find(x => x.id === data.getHash());

        if (existingNode) {
            return existingNode;
        }

        const node = new Node<T>(data);

        this.nodes.push(node);
        return node;
    }

    public addEdge(from: Node<T>, to: Node<T>): void {
        if (!this.adjacencyList.hasOwnProperty(from.id)) {
            this.adjacencyList[from.id] = [];
        }

        if (this.adjacencyList[from.id].indexOf(to.id) < 0) {
            this.adjacencyList[from.id].push(to.id);
        }

        if (!this.directed) {
            if (!this.adjacencyList.hasOwnProperty(to.id)) {
                this.adjacencyList[to.id] = [];
            }

            if (this.adjacencyList[to.id].indexOf(from.id) < 0) {
                this.adjacencyList[to.id].push(from.id);
            }
        }

    }
}

function fillGraphWithStack(g: Graph<any>, stack: any[] | string, rootNodes: Node<any>[] = []): Node<any>[] {

    if (!Array.isArray(stack)) {
        const node = g.addNode(stack);

        rootNodes.forEach(n => g.addEdge(n, node));

        return [node];
    } else {
        let lastNodes: Node<any>[] = rootNodes;
        for (let s of stack) {
            if (Array.isArray(s)) {
                const nextLastNodes = [];
                for (const subS of s) {
                    nextLastNodes.push(...fillGraphWithStack(g, subS, lastNodes));
                }
                lastNodes = nextLastNodes;
            } else {
                const node = g.addNode(s);


                lastNodes.forEach(n => g.addEdge(n, node));

                lastNodes = [node];
            }
        }

        return lastNodes;
    }
}

export function getGraphFromStack(stack: any[]): Graph<any> {
    const g = new Graph<any>();

    fillGraphWithStack(g, stack);

    return g;
}
