import {traceableCombinationOperatorFactory} from "./traceableCombinationOperatorFactory";
import {traceableOperatorFactory} from "./traceableOperatorFactory";
import {TraceObservablePipesConfiguration} from "./traceObservablePipesConfiguration";

export function traceObservablePipes(rxjs_: typeof import("rxjs"),
                                     rxjsOperators_: typeof import("rxjs/operators"),
                                     config: TraceObservablePipesConfiguration = {
                                         excludePackages: []
                                     }) {
    const origRxJsOperators = {...rxjsOperators_};
    const origRxJs = {...rxjs_};

    config.origRxJsOperators = origRxJsOperators;
    config.origRxJs = origRxJs;

    const orig = origRxJs.Observable.prototype.lift;
    rxjs_.Observable.prototype.lift = function (operator) {
        const thisArg = this;

        const newObs = orig.call(thisArg, operator);

        newObs["__stack__"] = this["__stack__"];
        newObs["__node__"] = this["__node__"];
        newObs["__parent__"] = [...(newObs["__parent__"] || []), this];

        return newObs;
    };


    for (const opName in rxjsOperators_) {
        if (rxjsOperators_.hasOwnProperty(opName)) {
            const operator = rxjsOperators_[opName];
            if (typeof operator === "function") {
                Object.defineProperty(rxjsOperators_, opName, {
                    value: traceableOperatorFactory(origRxJsOperators[opName], opName, config)
                });
            }
        }
    }

    for (const opName of ["zip", "combineLatest", "forkJoin", "merge", "concat"]) {
        const operator = rxjs_[opName];
        if (typeof operator === "function") {
            Object.defineProperty(rxjs_, opName, {
                value: traceableCombinationOperatorFactory(origRxJs[opName], opName, config)
            });
        }
    }
}

export function hashString(str: string): number {
    let hash = 0, i, chr;
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


