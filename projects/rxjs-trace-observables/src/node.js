"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Node = /** @class */ (function () {
    function Node(data) {
        this.data = data;
        this.id = data.getHash();
    }
    Node.prototype.toString = function () {
        return "id: " + this.id + ", data: " + JSON.stringify(this.data);
    };
    Node.nextNodeId = 0;
    return Node;
}());
exports.Node = Node;
//# sourceMappingURL=node.js.map