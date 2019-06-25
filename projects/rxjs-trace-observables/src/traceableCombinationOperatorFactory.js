"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var traceObservablePipes_1 = require("./traceObservablePipes");
var stackData_1 = require("./stackData");
function traceableCombinationOperatorFactory(operator, opName) {
    // @ts-ignore
    return function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        if (args.length === 1 && Array.isArray(args[0])) {
            args = args[0];
        }
        var result = operator(args);
        var stack = new stackData_1.StackData(opName);
        result["__stack__"] = [
            args.filter(function (x) { return x["__stack__"]; }).map(function (arg) { return arg["__stack__"]; }),
            stack
        ];
        return result.pipe(traceObservablePipes_1.origRxJsOperators.tap(function (val) { return stack.value = val; }));
    };
}
exports.traceableCombinationOperatorFactory = traceableCombinationOperatorFactory;
//# sourceMappingURL=traceableCombinationOperatorFactory.js.map