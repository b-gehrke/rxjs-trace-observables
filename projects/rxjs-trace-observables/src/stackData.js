"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var traceObservablePipes_1 = require("./traceObservablePipes");
var StackData = /** @class */ (function () {
    function StackData(name, value) {
        if (value === void 0) { value = undefined; }
        this.name = name;
        this.value = value;
        this.call = new Error().stack.split("\n")[3];
    }
    StackData.prototype.getHash = function () {
        return traceObservablePipes_1.hashString(this.call);
    };
    return StackData;
}());
exports.StackData = StackData;
//# sourceMappingURL=stackData.js.map