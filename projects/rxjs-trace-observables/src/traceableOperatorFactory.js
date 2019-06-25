"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var rxjs_1 = require("rxjs");
var traceObservablePipes_1 = require("./traceObservablePipes");
var stackData_1 = require("./stackData");
function traceableOperatorFactory(operator, opName) {
    return function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var stack = new stackData_1.StackData(opName);
        return function (source) {
            source["__stack__"] = (source["__stack__"] || []).concat([stack]);
            return source.pipe(traceObservablePipes_1.origRxJsOperators.tap(function (val) { return stack.value = val; }), operator.apply(void 0, args), traceObservablePipes_1.origRxJsOperators.catchError(function (err, caught) {
                // if (!(err instanceof ObservablePipeError)) {
                // console.warn("An error occurred in an observable pipe: \n\n" + getKNode(caught['__stack__']).prettyPrint());
                // }
                return rxjs_1.throwError(err);
            }));
        };
    };
}
exports.traceableOperatorFactory = traceableOperatorFactory;
//# sourceMappingURL=traceableOperatorFactory.js.map