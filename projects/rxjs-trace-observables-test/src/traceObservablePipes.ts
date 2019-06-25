import * as rxjs from "rxjs";
import {Observable, ObservedValueOf, throwError} from "rxjs";
import * as rxjsOperators from "rxjs/operators";
import {ObservableInput} from "rxjs/src/internal/types";
import {getGraphFromStack, Hashable} from "rxjs-trace-observables";

const origRxJsOperators = {...rxjsOperators};
const origRxJs = {...rxjs};


export function traceObservablePipes() {
  const orig = Observable.prototype.lift;
  Observable.prototype.lift = function (operator) {
    const thisArg = this;

    const newObs = orig.call(thisArg, operator);

    newObs["__stack__"] = this["__stack__"];

    return newObs;
  };


  for (const opName in rxjsOperators) {
    const operator = rxjsOperators[opName];
    if (typeof operator === "function" && opName !== "switchMap") {
      Object.defineProperty(rxjsOperators, opName, {
        value: traceableOperatorFactory(origRxJsOperators[opName], opName)
      });
    }
  }

  Object.defineProperty(rxjsOperators, "switchMap", {
    value:
      <T, R, O extends ObservableInput<any>>(project: (value: T, index: number) => O,
                                             resultSelector: (outerValue: T,
                                                              innerValue: ObservedValueOf<O>,
                                                              outerIndex: number,
                                                              innerIndex: number) => R) => {
        const stack = new StackData("switchMap");

        return (source: Observable<T>) => {
          const sourceStack = [...(source["__stack__"] || []), stack];
          source["__stack__"] = sourceStack;

          let nestedStackStart = sourceStack.length;
          let nestedStackLength = 0;


          const origProject = project;
          project = (value: T, index: number) => {
            const newObs = origProject(value, index);

            console.log({newObsStack: newObs["__stack__"]});

            source["__stack__"].splice(nestedStackStart, nestedStackLength, ...(newObs["__stack__"] || []));
            nestedStackLength = (newObs["__stack__"] && newObs["__stack__"].length) || 0;

            return newObs;
          };

          return source.pipe(
            origRxJsOperators.switchMap(project, resultSelector),
            origRxJsOperators.catchError((err, caught) => {
              // if (!(err instanceof ObservablePipeError)) {
              // console.warn("An error occurred in an observable pipe: \n\n" + getKNode(caught['__stack__']).prettyPrint());


              // }

              return throwError(err);
            })
          );
        };
      }
  });

  for (const opName of ["zip", "combineLatest", "forkJoin"]) {
    const operator = rxjs[opName];
    if (typeof operator === "function") {
      Object.defineProperty(rxjs, opName, {
        value: traceableCombinationOperatorFactory(origRxJs[opName], opName)
      });
    }
  }
}

function hashString(str: string): number {
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

class StackData implements Hashable {
  public readonly call: string;

  public constructor(public readonly name: string, public value: any = undefined) {
    this.call = new Error().stack.split("\n")[3];
  }

  getHash(): number {
    return hashString(this.call);
  }
}

// const tracedObservables: Map<Observable<any>, { lastGraph: Graph<any>, id: number }> = new Map<Observable<any>, { lastGraph: Graph<any>, id: number }>();
let nextId = 0;

export const trace = () => <T>(source: Observable<T>) => {
  // extension: trace keeps track of its source and UPDATES (and don't create a new) the graph for each observable.

  // if(tracedObservables.has(source)) {
  //   console.log("Tracing it twice?? Aborting trace");
  //   return source;
  // }
  //
  // tracedObservables.set(source, {lastGraph: null, id: nextId++});

  const obsId = nextId++;
  let counter = 0;

  return source.pipe(
    origRxJsOperators.tap(x => {
      const stack = source["__stack__"];


      // console.log({stack});

      const graph = getGraphFromStack(stack);
      console.log(`Tracing observable with id ${obsId}. Current value: ${x}\n

${Object.keys(graph.adjacencyList)
        .flatMap(
          from => graph.adjacencyList[+from].map(to => `${graph.getNode(+from).data.name} -> ${graph.getNode(+to).data.name}`))
        .join("\n")}

${graph.nodes.map(x => (`${x.data.name}: ${x.data}`)).join("\n")} 
`);
      const message = {type: "graph", content: {graph, id: obsId, counter: counter++}};

      setTimeout(() => window.postMessage(message, "*"), 0);

      // if (document["onObservableTraced"] && typeof document["onObservableTraced"] === "function") {
      //   document["onObservableTraced"](graph);
      // } else {
      //   console.log("No handler found");
      //   console.log(document["onObservableTraced"]);
      // }

    })
  );
};

function traceableOperatorFactory<T extends Function>(operator: T, opName: string) {
  return function (...args) {
    const stack = new StackData(opName);

    return (source: Observable<T>) => {
      source["__stack__"] = [...(source["__stack__"] || []), stack];

      return source.pipe(
        origRxJsOperators.tap(val => stack.value = val),
        operator(...args),
        origRxJsOperators.catchError((err, caught) => {
          // if (!(err instanceof ObservablePipeError)) {
          // console.warn("An error occurred in an observable pipe: \n\n" + getKNode(caught['__stack__']).prettyPrint());

          // }

          return throwError(err);
        })
      );
    };
  };
}

function traceableCombinationOperatorFactory<T extends Function>(operator: T, opName: string) {
  // @ts-ignore
  return (...args: Observable[]) => {

    if (args.length === 1 && Array.isArray(args[0])) {
      args = args[0];
    }


    const result = operator(args);
    const stack = new StackData(opName);

    result["__stack__"] = [
      args.filter(x => x["__stack__"]).map(arg => arg["__stack__"]),
      stack
    ];

    return result.pipe(
      origRxJsOperators.tap(val => stack.value = val)
    );
  };
}
