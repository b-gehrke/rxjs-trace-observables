"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
var rxjs = require("rxjs");
var rxjs_1 = require("rxjs");
var rxjsOperators = require("rxjs/operators");
var traceableCombinationOperatorFactory_1 = require("./traceableCombinationOperatorFactory");
var traceableOperatorFactory_1 = require("./traceableOperatorFactory");
var stackData_1 = require("./stackData");
exports.origRxJsOperators = __assign({}, rxjsOperators);
var origRxJs = __assign({}, rxjs);
function traceObservablePipes() {
    var orig = rxjs_1.Observable.prototype.lift;
    rxjs_1.Observable.prototype.lift = function (operator) {
        var thisArg = this;
        var newObs = orig.call(thisArg, operator);
        newObs["__stack__"] = this["__stack__"];
        return newObs;
    };
    for (var opName in rxjsOperators) {
        var operator = rxjsOperators[opName];
        if (typeof operator === "function" && opName !== "switchMap") {
            Object.defineProperty(rxjsOperators, opName, {
                value: traceableOperatorFactory_1.traceableOperatorFactory(exports.origRxJsOperators[opName], opName)
            });
        }
    }
    Object.defineProperty(rxjsOperators, "switchMap", {
        value: function (project, resultSelector) {
            var stack = new stackData_1.StackData("switchMap");
            return function (source) {
                var sourceStack = (source["__stack__"] || []).concat([stack]);
                source["__stack__"] = sourceStack;
                var nestedStackStart = sourceStack.length;
                var nestedStackLength = 0;
                var origProject = project;
                project = function (value, index) {
                    var _a;
                    var newObs = origProject(value, index);
                    console.log({ newObsStack: newObs["__stack__"] });
                    (_a = source["__stack__"]).splice.apply(_a, [nestedStackStart, nestedStackLength].concat((newObs["__stack__"] || [])));
                    nestedStackLength = (newObs["__stack__"] && newObs["__stack__"].length) || 0;
                    return newObs;
                };
                return source.pipe(exports.origRxJsOperators.switchMap(project, resultSelector), exports.origRxJsOperators.catchError(function (err, caught) {
                    // if (!(err instanceof ObservablePipeError)) {
                    // console.warn("An error occurred in an observable pipe: \n\n" + getKNode(caught['__stack__']).prettyPrint());
                    // }
                    return rxjs_1.throwError(err);
                }));
            };
        }
    });
    for (var _i = 0, _a = ["zip", "combineLatest", "forkJoin"]; _i < _a.length; _i++) {
        var opName = _a[_i];
        var operator = rxjs[opName];
        if (typeof operator === "function") {
            Object.defineProperty(rxjs, opName, {
                value: traceableCombinationOperatorFactory_1.traceableCombinationOperatorFactory(origRxJs[opName], opName)
            });
        }
    }
}
exports.traceObservablePipes = traceObservablePipes;
function hashString(str) {
    var hash = 0, i, chr;
    if (str.length === 0) {
        return hash;
    }
    for (i = 0; i < str.length; i++) {
        chr = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
}
exports.hashString = hashString;
//# sourceMappingURL=traceObservablePipes.js.map