import {Observable, throwError} from "rxjs";
import {traceableCombinationOperatorFactory} from "./traceableCombinationOperatorFactory";
import {traceableOperatorFactory} from "./traceableOperatorFactory";
import {StackData} from "./stackData";
import {TraceObservablePipesConfiguration} from "./traceObservablePipesConfiguration";

export function traceObservablePipes(rxjs_, rxjsOperators_, config: TraceObservablePipesConfiguration = {
    excludePackages: []
}) {
    const origRxJsOperators = {...rxjsOperators_};
    const origRxJs = {...rxjs_};

    const orig = origRxJs.Observable.prototype.lift;
    rxjs_.Observable.prototype.lift = function (operator) {
        const thisArg = this;

        const newObs = orig.call(thisArg, operator);

        newObs["__stack__"] = this["__stack__"];

        return newObs;
    };


    for (const opName in rxjsOperators_) {
        if (rxjsOperators_.hasOwnProperty(opName)) {
            const operator = rxjsOperators_[opName];
            if (typeof operator === "function" && opName !== "switchMap") {
                Object.defineProperty(rxjsOperators_, opName, {
                    value: traceableOperatorFactory(origRxJsOperators[opName], opName, config)
                });
            }
        }
    }

    Object.defineProperty(rxjsOperators_, "switchMap", {
        value:
            (project: (value: any, index: number) => any,
             resultSelector: (outerValue: any,
                              innerValue: any,
                              outerIndex: number,
                              innerIndex: number) => any) => {
                const stack = new StackData("switchMap");

                return (source: Observable<any>) => {
                    source["__stack__"] = (source["__stack__"] || []);
                    if (config.excludePackages.some(x => stack.call.indexOf(x) >= 0)) {
                        return source;
                    } else {
                        const sourceStack = [...(source["__stack__"] || []), stack];
                        source["__stack__"] = sourceStack;

                        let nestedStackStart = sourceStack.length;
                        let nestedStackLength = 0;


                        const origProject = project;
                        project = (value: any, index: number) => {
                            const newObs = origProject(value, index);

                            source["__stack__"].splice(nestedStackStart, nestedStackLength, ...(newObs["__stack__"] || []));
                            nestedStackLength = (newObs["__stack__"] && newObs["__stack__"].length) || 0;

                            return newObs;
                        };

                        return source.pipe(
                            origRxJsOperators.switchMap(project, resultSelector),
                            origRxJsOperators.catchError((err) => {
                                // if (!(err instanceof ObservablePipeError)) {
                                // console.warn("An error occurred in an observable pipe: \n\n" + getKNode(caught['__stack__']).prettyPrint());


                                // }

                                return throwError(err);
                            })
                        );
                    }
                };
            }
    });

    for (const opName of ["zip", "combineLatest", "forkJoin"]) {
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


