import {Component, ElementRef, OnInit, ViewChild} from "@angular/core";
import {fromEventPattern, Observable, Subject} from "rxjs";
import * as vis from "vis";
import {filter, map, scan, tap} from "rxjs/operators";
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
  public currentGraphsSet$ = this.currentGraphsSetSource.asObservable();
  public currentGraphSource: Subject<GraphContent> = new Subject();
  public currentGraph$ = this.currentGraphSource.asObservable();
  public currentValue$: Observable<any>;

  constructor() {
    // @ts-ignore Initialize must be called but is not available in the node module
    SourceMapConsumer.initialize({
      "lib/mappings.wasm": "https://unpkg.com/source-map@0.7.3/lib/mappings.wasm"
    });
  }

  public ngOnInit(): void {
    if (window.chrome) {

      this.connectToBackgroundPage();


      this.graphs$ = this.messages$.pipe(
        map((message) => {
          const {graphId, graph} = message.content;

          console.log("Drawing graph with id " + graphId);
          console.log({graph});

          const nodes = new vis.DataSet<vis.Node>(graph.nodes.map(
            x => ({
              id: x.id,
              label: `${x.data.name} (${x.data.value})\n${x.data.call.replace(/^\s*at\s([^(]+\s)?\(?.*\)?\s*$/, "$1")}`,
              title: x.data.call.match(/at\s([^(]+)?\s?/)[1]
            })));
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
            graph: new Graph(graph)
          };
        })
      );

      this.graphsById$ = this.graphs$.pipe(
        scan<GraphContent, { graphId: number, graphs: GraphContent[] }[]>((prev, cur) => {
          const retVal = [...prev];

          let graphSet = prev.find(x => x.graphId === cur.graphId);

          if (!graphSet) {
            graphSet = {graphId: cur.graphId, graphs: []};
            retVal.push(graphSet);
          }

          graphSet.graphs.push(cur);

          return retVal;
        }, [])
      );

      this.currentGraph$.subscribe(data => this.drawGraph(data));
    }

  }


  public drawGraph(data) {
    const network = new vis.Network(this.container.nativeElement, data.data, {
      interaction: {
        hover: true
      },
      edges: {
        arrows: {to: {enabled: true}}
      },
      physics: false
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
  }

  public getLastValue(graph: Graph<StackData>): any {
    const lastNodeId = +Object.keys(graph.adjacencyList).find(key => graph.adjacencyList[+key].length === 0);

    const lastNode = graph.getNode(lastNodeId);

    console.log({lastNodeId, lastNode, graph});

    return lastNode.data.value;
  }

  private connectToBackgroundPage() {

// Create a connection to the background page
    const backgroundPageConnection = chrome.runtime.connect({
      name: "panel"
    });


    this.messages$ =
      fromEventPattern(handler => backgroundPageConnection.onMessage.addListener(handler),
        handler => backgroundPageConnection.onMessage.removeListener(handler)).pipe(
        tap(console.log),
        map(([message]) => message),
        filter(message => isGraphMessage(message))
      );

    backgroundPageConnection.postMessage({
      name: "init",
      tabId: chrome.devtools.inspectedWindow.tabId
    });
  }
}
