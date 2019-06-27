export interface TraceObservablePipesConfiguration {
    excludePackages?: string[],
    origRxJs?: typeof import("rxjs"),
    origRxJsOperators?: typeof import("rxjs/operators")
}
