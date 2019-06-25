rxjs-better-stacktrace
=====
Projects
-----

### rxjs-trace-observables
This project tracks the pipe call stack of observables by overriding the operator functions of rxjs/operators. 

Pipe an observable with the `trace` operator to view its pipe dependency tree. The script will send an event via `window.postMessage` in the format
```ts
interface Message {
    type: "graph";
    content: {
        // The generated dependency graph
        graph: Graph<T extends Hashable>;

        // Unique id of the observable
        id: number;

        // Number of invoked traces <=> number of values pushed to the observable
        counter: number;
    }
}
```

### chrome

Chrome extension which adds a DevTools Panel "Trace Observables". It connects to the `rxjs-trace-observables` project and draws the traced graphes.

### rxjs-trace-observables-test

A local test app to test the interaction of `rxjs-trace-observables` and the Chrome Extension.

