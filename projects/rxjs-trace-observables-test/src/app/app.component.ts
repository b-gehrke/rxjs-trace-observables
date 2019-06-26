import {Component, OnInit} from "@angular/core";
import {combineLatest, interval, Observable, of} from "rxjs";
import {delay, first, map, mapTo, skip, switchMap, take, tap} from "rxjs/operators";
import {trace} from "rxjs-trace-observables";
import {HttpClient} from "@angular/common/http";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"]
})
export class AppComponent implements OnInit {
  title = "rxjs-trace-observables-test";

  public obs$: Observable<any>;

  constructor(private http: HttpClient) {
  }

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
        take(2)
      );

    interval(1000).pipe(
      take(3),
      map(x => x ** 2),
      trace("First")
    ).subscribe();

    interval(1000).pipe(
      take(7),
      delay(500),
      map(x => x ** 4),
      trace("Second")
    ).subscribe();

    of("favicon.ico").pipe(
      delay(100),
      map(x => "http://localhost:4200/" + x),
      switchMap(url => this.http.get(url, {responseType: "blob"}).pipe(
        first())),
      trace("Http")
    ).subscribe(console.log);

    of("hello").pipe(
      delay(100),
      map(x => x + " "),
      tap(() => {
        throw new Error("This is the error");
      }),
      map(x => x + "world"),
      mapTo("Here comes the error"),
      trace("Error")
    ).subscribe();
  }
}
