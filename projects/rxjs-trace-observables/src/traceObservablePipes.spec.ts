import * as rxjsOperators from "rxjs/operators";
import {distinctUntilChanged, first, map, mergeMap, skip, switchMap, take} from "rxjs/operators";
import * as rxjs from "rxjs";
import {combineLatest, interval, merge, of} from "rxjs";
import {traceObservablePipes} from "./traceObservablePipes";
import {trace} from "./trace";

describe("Main", () => {
    traceObservablePipes(rxjs, rxjsOperators);


    it("should trace pipes from combineLatest", done => {
        const first$ = interval(20).pipe(
            take(5),
            skip(1)
        );
        const second$ = interval(20).pipe(
            skip(4),
            take(2)
        );

        combineLatest([first$, second$])
            .pipe(
                map(i => {
                    return i.reverse();
                }),
                switchMap(a => {
                    return combineLatest([
                        of(a).pipe(first()),
                        interval(40).pipe(
                            first(),
                            map(() => {
                                // throw new Error("S");
                            })
                        )
                    ]).pipe(
                        first()
                    );
                }),
                trace()
            )
            .subscribe(() => null, (err) => {
                done(err);
                // console.log(getTreeFromError(err).prettyPrint());
            }, done);
    });

    it("Should follow switchMap", done => {
        const a = true;
        const a$ = of(3).pipe(
            map(x => x ** 2)
        );
        of("1").pipe(
            map(x => x + "1"),
            switchMap(x => {
                if (a) {
                    return a$;
                } else {
                    return of(x + "2").pipe(
                        map(x => x + "2")
                    );
                }
            }),

            trace())
            .subscribe(() => done());
    });

    it("Should split at switchMap and merge at combineLatest", done => {
        const a$ = of("a").pipe(first());
        const b$ = of("b").pipe(take(1));
        of("1").pipe(
            map(x => x + "1"),
            switchMap(() => combineLatest([a$, b$])),

            trace())
            .subscribe(() => null, error => done(error), () => done());
    });

    it("should support merge", done => {

        const a$ = of("a").pipe(first());
        const b$ = of("b").pipe(take(1));

        merge(a$, b$).pipe(
            take(4),
            trace()
        ).subscribe(() => null, done, done);
    });

    it("should support mergeMap", done => {

        const a$ = of("a").pipe(first());
        const b$ = of("b").pipe(take(1));

        a$.pipe(
            switchMap(() => b$.pipe(distinctUntilChanged())),
            trace("SwitchMap")
        ).subscribe();

        a$.pipe(
            mergeMap(() => b$.pipe(distinctUntilChanged())),
            take(4),
            take(4),
            trace("MergeMap")
        ).subscribe();

        a$.pipe(
            mergeMap(val => b$.pipe(
                map(x => x + val)
            )),
            take(4),
            trace()
        ).subscribe(() => null, done, done);
    });
});
