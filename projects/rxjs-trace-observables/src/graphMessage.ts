import {isMessage, Message} from "./message";
import {GraphMessageContent} from "./graphMessageContent";

export interface GraphMessage extends Message<GraphMessageContent> {
    type: "graph"
}

export function isGraphMessage(message: any): message is GraphMessage {
    return isMessage(message) && message.type === "graph";
}
