import {Hashable} from "./hashable";

export class Node<T extends Hashable> {
    private static nextNodeId: number = 0;

    public readonly id: number;
    public readonly data: T;


    constructor(data: T) {
        this.data = data;
        this.id = data.getHash();
    }

    public toString(): string {
        return `id: ${this.id}, data: ${JSON.stringify(this.data)}`;
    }
}
