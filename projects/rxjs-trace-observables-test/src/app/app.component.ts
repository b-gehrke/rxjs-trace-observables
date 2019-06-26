import {Component, OnInit} from "@angular/core";
import {combineLatest, interval, Observable, of} from "rxjs";
import {delay, first, map, skip, switchMap, take} from "rxjs/operators";
import {trace} from "rxjs-trace-observables";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"]
})
export class AppComponent implements OnInit {
  title = "rxjs-trace-observables-test";

  public obs$: Observable<any>;

  public ngOnInit() {
    const first$ = interval(20).pipe(
      first(),
      delay(1)
    );
    const second$ = interval(20).pipe(
      skip(4),
      take(2),
    );

    this.obs$ = combineLatest(first$, second$)
      .pipe(
        map(i => {
          return i.reverse();
        }),
        switchMap(a => {
          return combineLatest(
            of(a).pipe(first()),
            interval(40).pipe(
              first(),
              map(x => x)
            )
          ).pipe(
            first()
          );
        }),
        take(2),
        trace("Tracer 1")
      );
  }
}
