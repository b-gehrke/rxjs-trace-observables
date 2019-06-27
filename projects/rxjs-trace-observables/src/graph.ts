import {Hashable} from "./hashable";
import {Node} from "./node";

/**
 * Graph structure
 */
export class Graph<T extends Hashable> {
    public readonly nodes: Node<T>[] = [];
    public readonly adjacencyList: { [k: number]: number[] } = {};
    public readonly directed: boolean = true;

    /**
     * Initializes a new instance of the {@link Graph} class.
     * @param directed - whether the graph is directed or not.
     */
    public constructor(directed?: boolean);
    /**
     * Initializes a new instance of the {@link Graph} class from an existing graph.
     * This can be used to turn a stripped down deserialized graph back to a class instance.
     * @param clone - Graph to clone
     */
    public constructor(clone?: Graph<T>);
    public constructor(directedOrClone?: boolean | Graph<T>) {
        if (directedOrClone !== undefined) {
            if (typeof directedOrClone === "boolean") {
                this.directed = directedOrClone;
            } else {
                this.directed = directedOrClone.directed;
                this.adjacencyList = directedOrClone.adjacencyList;
                this.nodes = directedOrClone.nodes;
            }
        }
    }

    /**
     * Get a node by its id or its data
     * @param id - id of the node OR data of the node. In that case the {@link Hashable.getHash} function is called.
     */
    public getNode(id: number | T): Node<T> | null {
        if (typeof id === "number") {
            return this.nodes.find(x => x.id === id);
        } else {
            return this.nodes.find(x => x.id === id.getHash());
        }
    }

    /**
     * Adds a node to the graph and returns it.
     *
     * @remarks
     * If a node with the same ID / the same hash already exists in the graph it is **reused**.
     * So do the edges containing the node.
     * @param data - Node data
     */
    public addNode(data: T): Node<T> {
        const existingNode = this.nodes.find(x => x.id === data.getHash());

        if (existingNode) {
            return existingNode;
        }

        const node = new Node<T>(data);

        this.adjacencyList[node.id] = [];

        this.nodes.push(node);
        return node;
    }

    /**
     * Adds an edge between two nodes
     *
     * @remarks
     * If the graph is not directed, the inverted edge is obviously as well.
     *
     * @param from - Starting node
     * @param to - Receiving node
     */
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

    /**
     * Performs a depth first search on the graph and returns the found nodes.
     *
     * @param start - Starting node
     * @param predicate - Filter predicate
     * @param options - Whether the search should go in the opposite direction of the edges.
     *
     * `inverse`: Whether the search should go in the opposite direction of the edges
     *
     * `followMatchingPaths`: Whether the search should continue on a path beyond a match
     *
     * Defaults
     * ```
     * {
     *      inverse: false,
     *      followMatchingPaths: true,
     * }
     * ```
     *
     */
    public depthSearch(start: Node<T>, predicate: (node: Node<T>) => boolean, options?: {
        followMatchingPaths?: boolean,
        direction?: "standard" | "inverse" | "both"
    }): Node<T>[] {
        options = {
            direction: "standard",
            followMatchingPaths: true,

            ...options
        };

        const open = [start];
        const marked: number[] = [];
        const results: Node<T>[] = [];

        let current: Node<T>;
        while ((current = open.pop())) {
            marked.push(current.id);

            if (predicate(current)) {
                results.push(current);

                if (!options.followMatchingPaths) {
                    continue;
                }
            }

            let nextNodes: Node<T>[];

            if (options.direction === "standard") {
                nextNodes = this.outgoing(current);
            } else if (options.direction === "inverse") {
                nextNodes = this.ingoing(current);
            } else {
                nextNodes = [...this.outgoing(current), ...this.ingoing(current)];
            }

            open.push(...nextNodes.filter((v, i, self) => self.indexOf(v) === i).filter(x => marked.indexOf(x.id) < 0));
        }

        return results;
    }

    /**
     * Performs a depth first search on the graph and returns the found nodes.
     *
     * @param start - Starting node
     * @param predicate - Filter predicate
     * @param options - Whether the search should go in the opposite direction of the edges.
     *
     * `inverse`: Whether the search should go in the opposite direction of the edges
     *
     * `followMatchingPaths`: Whether the search should continue on a path beyond a match
     *
     * Defaults
     * ```
     * {
     *      inverse: false,
     *      followMatchingPaths: true,
     * }
     * ```
     *
     */
    public breadthSearch(start: Node<T>, predicate: (node: Node<T>) => boolean, options?: {
        inverse: boolean,
        followMatchingPaths: boolean
    }): Node<T>[] {
        options = {
            inverse: false,
            followMatchingPaths: true,

            ...options
        };

        const open = [start];
        const marked: number[] = [];
        const results: Node<T>[] = [];

        let current: Node<T>;
        while ((current = open.splice(0, 1)[0])) {
            marked.push(current.id);

            if (predicate(current)) {
                results.push(current);

                if (!options.followMatchingPaths) {
                    continue;
                }
            }

            const nextNodes = (options.inverse ? this.ingoing(current) : this.outgoing(current));
            open.push(...nextNodes.filter(x => marked.indexOf(x.id) < 0));
        }

        return results;
    }

    /**
     * Lists the nodes which point to a given node.
     *
     * @param node - Given node
     */
    public ingoing(node: Node<T>): Node<T> [] {
        return this.nodes.filter(x => this.outgoing(x).indexOf(node) >= 0);
    }

    /**
     * Lists the nodes to which a given node points.
     *
     * @param node - Given node
     */
    public outgoing(node: Node<T>): Node<T>[] {
        return this.nodes.filter(x => this.adjacencyList[node.id].indexOf(x.id) >= 0);
    }

    /**
     * Removes an edge
     * @param from - Starting node
     * @param to - Receiving node
     */
    public removeEdge(from: Node<T>, to: Node<T>): void {
        this.adjacencyList[from.id].splice(this.adjacencyList[from.id].indexOf(to.id), 1);
    }
}
