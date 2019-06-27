import {Component, ElementRef, NgZone, OnInit, ViewChild} from "@angular/core";
import {merge, Observable, Subject} from "rxjs";
import * as vis from "vis";
import {filter, map, mapTo, scan, share, shareReplay, startWith, switchMap, tap, withLatestFrom} from "rxjs/operators";
import {Graph, GraphMessage, GraphMessageContent, isGraphMessage, StackData} from "rxjs-trace-observables";
import {SourceMapConsumer} from "source-map";

interface GraphContent extends GraphMessageContent {
  /**
   * Data for vis to draw the graph
   */
  data: vis.Data;
}

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"]
})
export class AppComponent implements OnInit {


  title = "devTools";
  @ViewChild("container", {static: true})
  public container: ElementRef;
  public messages$: Observable<GraphMessage>;
  public graphs$: Observable<GraphContent>;

  public graphsById$: Observable<{ graphId: number, graphs: GraphContent[] }[]>;
  public currentGraphsSetSource: Subject<GraphContent[]> = new Subject();
  public currentGraphsSet$: Observable<GraphContent[]>;

  public currentGraphSource: Subject<GraphContent> = new Subject();
  public currentGraph$: Observable<GraphContent>;
  public resetSource = new Subject();

  private reset$: Observable<any>;

  constructor(private _zone: NgZone) {
    // @ts-ignore Initialize must be called but is not available in the node module
    SourceMapConsumer.initialize({
      "lib/mappings.wasm": "https://unpkg.com/source-map@0.7.3/lib/mappings.wasm"
    });
  }

  public ngOnInit(): void {
    if (window.chrome) {

      this.connectToBackgroundPage();

      this.reset$ = merge(
        fromEventPatternWithinAngular(this._zone, chrome.tabs.onUpdated)
          .pipe(
            filter(([tabId, changeInfo]) => tabId === chrome.devtools.inspectedWindow.tabId && changeInfo.status === "complete"),
            mapTo(null)
          ),
        this.resetSource).pipe();

      this.currentGraph$ = merge(
        this.currentGraphSource,
        this.reset$).pipe(shareReplay(1), tap(a => console.log({a})));

      this.currentGraphsSet$ = merge(this.currentGraphsSetSource.asObservable(), this.reset$.pipe(mapTo([])));


      this.graphs$ = this.messages$.pipe(
        map((message) => {
          let {graphId, graph} = message.content;
          graph = new Graph(graph);

          console.log("Drawing graph with id " + graphId);
          console.log(message);

          const nodes = new vis.DataSet<vis.Node>(graph.nodes.map(
            x => ({
              id: x.id,
              label: `${x.data.name} (${x.data.value})\n${x.data.call.replace(/^\s*at\s([^(]+\s)?\(?.*\)?\s*$/, "$1")}`,
              title: x.data.call.match(/at\s([^(]+)?\s?/)[1],
              // highlight last node
              color: (x.data.hasError ?
                      "#ff0000" :
                      (graph.adjacencyList[x.id].length === 0 ? "#b97dff" : (graph.ingoing(x).length === 0 ? "#9affd2" : undefined)))
            } as vis.Node)));
          const edges = new vis.DataSet<vis.Edge>(Object.keys(graph.adjacencyList)
            .flatMap(from => graph.adjacencyList[from].map(to => ({from, to}))));

          return {
            data: {
              nodes,
              edges

            },
            graphId,
            time: message.content.time,
            // clone the graph to get access to the functions
            graph: new Graph(graph),
            name: message.content.name
          };
        }),
      );


      this.graphsById$ = this.reset$.pipe(
        startWith(null),
        switchMap(() => this.graphs$.pipe(
          scan<GraphContent, { graphId: number, graphs: GraphContent[] }[]>((prev, cur) => {
            const retVal = [...prev];

            let graphSet = prev.find(x => x.graphId === cur.graphId);

            if (!graphSet) {
              graphSet = {graphId: cur.graphId, graphs: []};
              retVal.push(graphSet);
            }

            graphSet.graphs.push(cur);

            return retVal;
          }, []),
          startWith([]))));

      const network$ = this.currentGraph$.pipe(filter(x => !!x), map(data => this.drawGraph(data)));

      this.reset$.pipe(
        withLatestFrom(network$)
      ).subscribe(([, network]) => network.destroy());

      network$.subscribe();
    }

  }


  public drawGraph(data): vis.Network {
    const network = new vis.Network(this.container.nativeElement, data.data, {
      interaction: {
        hover: true
      },
      edges: {
        arrows: {to: {enabled: true}}
      },

    });

    network.on("click", async (event: {
      nodes: number[],
      edges: string[],
      event: PointerEvent,
      pointer: {
        DOM: { x: number, y: number },
        canvas: { x: number, y: number }
      }
    }) => {
      const node = event.nodes[0];

      const gNode = data.graph.nodes.find(x => x.id === node);

      if (gNode) {

        const match = gNode.data.call.match(/^\s*at\s(?:[^(]+\s)?\(?(.*):(\d+):(\d+)\)?\s*$/);

        const source = match[1];
        const lineNumber = +match[2];
        const col = +match[3];

        const response = await fetch(source + ".map");

        if (response.ok) {
          const sm = await response.json();

          await SourceMapConsumer.with(sm, null, consumer => {

            const original = consumer.originalPositionFor({line: lineNumber, column: col});

            // Check if the found source actually exists
            if (sm.sources.indexOf(original.source) < 0) {
              // if the source is a webpack source, check if it has removed leading periods (./)
              if (original.source && original.source.startsWith("webpack:///")) {
                const fixedUrl = original.source.replace("webpack:///", "webpack:///./");
                if (sm.sources.indexOf(fixedUrl) >= 0) {
                  original.source = fixedUrl;
                }
              }
            }

            chrome.devtools.panels.openResource(original.source || source,
              (original.source ? original.line : lineNumber) - 1,
              () => null);
          });

        } else {
          chrome.devtools.panels.openResource(source, lineNumber - 1, () => console.log("Opened resource"));
        }
      }
    });

    return network;
  }

  public getLastValue(graph: Graph<StackData>): any {
    if (!graph) {
      return;
    }

    const lastNodeId = +Object.keys(graph.adjacencyList).find(key => graph.adjacencyList[+key].length === 0);

    const lastNode = graph.getNode(lastNodeId);

    return lastNode.data.value;
  }

  public selectGraphSet(graphSet: { graphId: number; graphs: GraphContent[] }) {
    console.log({graphSet});

    this.currentGraphSource.next(graphSet.graphs[graphSet.graphs.length - 1]);
    this.currentGraphsSetSource.next(graphSet.graphs);
  }

  private connectToBackgroundPage(): chrome.runtime.Port {

// Create a connection to the background page
    const backgroundPageConnection = chrome.runtime.connect({
      name: "panel"
    });

    this.messages$ =
      fromEventPatternWithinAngular(this._zone, backgroundPageConnection.onMessage).pipe(
        map(([message]) => message),
        filter(message => isGraphMessage(message)),
        share()
      );

    backgroundPageConnection.postMessage({
      name: "init",
      tabId: chrome.devtools.inspectedWindow.tabId
    });

    return backgroundPageConnection;
  }
}

function fromEventPatternWithinAngular<T>(zone: NgZone,
                                          event: { addListener: (callback: (...e: T[]) => void) => void, removeListener: (callback: (...e: T[]) => void) => void }): Observable<any> {
  return new Observable<T[]>(subscriber => {
    const handler = (...e: T[]) => zone.run(() => subscriber.next(e));

    try {
      event.addListener(handler);
    } catch (err) {
      subscriber.error(err);
      return undefined;
    }

    return () => event.removeListener(handler);
  });
}
