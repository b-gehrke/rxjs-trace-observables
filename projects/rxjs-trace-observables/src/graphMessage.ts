import {Message} from "./message";
import {GraphMessageContent} from "./graphMessageContent";

export interface GraphMessage extends Message<GraphMessageContent> {
    type: "graph"
}
