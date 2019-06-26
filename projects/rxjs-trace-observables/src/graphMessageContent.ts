import {Graph} from "./graph";
import {StackData} from "./stackData";

/**
 * Content of a message from the <pre>trace</pre> operator.
 *
 */
export interface GraphMessageContent {
    /**
     * Dependency graph of the observable
     */
    graph: Graph<StackData>;

    /**
     * Id of the graph. Unique for every traced observable.
     * Allows to differentiate between observables and plot multiple observables.
     */
    graphId: number;

    /**
     * Time of the current emission.
     * Allows to show the (emission) history of the traced observable
     */
    time: number;

    /**
     * Name of the traced observable
     */
    name: string;
}
