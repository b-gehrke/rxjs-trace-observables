"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var node_1 = require("./node");
var Graph = /** @class */ (function () {
    function Graph(directed) {
        if (directed === void 0) { directed = true; }
        this.directed = directed;
        this.nodes = [];
        this.adjacencyList = {};
    }
    Graph.prototype.getNode = function (id) {
        if (typeof id === "number") {
            return this.nodes.find(function (x) { return x.id === id; });
        }
        else {
            return this.nodes.find(function (x) { return x.id === id.getHash(); });
        }
    };
    Graph.prototype.addNode = function (data) {
        var existingNode = this.nodes.find(function (x) { return x.id === data.getHash(); });
        if (existingNode) {
            return existingNode;
        }
        var node = new node_1.Node(data);
        this.nodes.push(node);
        return node;
    };
    Graph.prototype.addEdge = function (from, to) {
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
    };
    return Graph;
}());
exports.Graph = Graph;
function fillGraphWithStack(g, stack, rootNodes) {
    if (rootNodes === void 0) { rootNodes = []; }
    if (!Array.isArray(stack)) {
        var node_2 = g.addNode(stack);
        rootNodes.forEach(function (n) { return g.addEdge(n, node_2); });
        return [node_2];
    }
    else {
        var lastNodes = rootNodes;
        var _loop_1 = function (s) {
            if (Array.isArray(s)) {
                var nextLastNodes = [];
                for (var _i = 0, s_1 = s; _i < s_1.length; _i++) {
                    var subS = s_1[_i];
                    nextLastNodes.push.apply(nextLastNodes, fillGraphWithStack(g, subS, lastNodes));
                }
                lastNodes = nextLastNodes;
            }
            else {
                var node_3 = g.addNode(s);
                lastNodes.forEach(function (n) { return g.addEdge(n, node_3); });
                lastNodes = [node_3];
            }
        };
        for (var _i = 0, stack_1 = stack; _i < stack_1.length; _i++) {
            var s = stack_1[_i];
            _loop_1(s);
        }
        return lastNodes;
    }
}
function getGraphFromStack(stack) {
    var g = new Graph();
    fillGraphWithStack(g, stack);
    return g;
}
exports.getGraphFromStack = getGraphFromStack;
//# sourceMappingURL=graph.js.map