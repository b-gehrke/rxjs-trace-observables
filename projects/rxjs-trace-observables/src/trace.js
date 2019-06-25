"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var graph_1 = require("./graph");
var traceObservablePipes_1 = require("./traceObservablePipes");
exports.trace = function () { return function (source) {
    return source.pipe(traceObservablePipes_1.origRxJsOperators.tap(function (x) {
        var stack = source["__stack__"];
        var graph = graph_1.getGraphFromStack(stack);
        console.log("Tracing observable. Current value: " + x + "\n\n\n" + Object.keys(graph.adjacencyList)
            .flatMap(function (from) { return graph.adjacencyList[+from].map(function (to) { return graph.getNode(+from).data.name + " -> " + graph.getNode(+to).data.name; }); })
            .join("\n") + "\n\n" + graph.nodes.map(function (x) { return (x.data.name + ": " + x.data); }).join("\n") + " \n");
        var message = { type: "graph", content: graph };
        setTimeout(function () { return window.postMessage(message, "*"); }, 0);
    }));
}; };
//# sourceMappingURL=trace.js.map