import { first, map, skip, switchMap, take } from "rxjs/operators";
import { combineLatest, interval, of } from "rxjs";
import { expect } from "chai";
import { isObservablePipeError, ObservablePipeError } from "./observablePipeError";
import { traceObservablePipes } from "./traceObservablePipes";
import { trace } from "./trace";
import { getTreeFromError } from "./KStackNode";

describe("Main", () =>
{
    traceObservablePipes();

    it("should catch pipe errors from pipeable operators", done =>
    {
        interval(20).pipe(
            map(i => i ** 2),
            take(10),
        )
            .pipe(
                map(i =>
                {
                    throw new Error("Error");
                })
            )
            .subscribe(() => null, (err: ObservablePipeError) =>
            {

                expect(isObservablePipeError(err), `[${err}] is an ObservablePipeError`).to.be.true;

                console.log(getTreeFromError(err).prettyPrint());

                expect(err.pipeStack).to.have.lengthOf(3, "pipeStack");

                done();
            });
    });

    it("should catch pipe errors from switchMap operators", done =>
    {
        interval(20).pipe(
            map(i => i ** 2),
            take(10),
        )
            .pipe(
                switchMap(() =>
                    interval(20).pipe(
                        take(4),
                        map(i =>
                        {
                            throw new Error("Error");
                        })
                    ))
            )
            .subscribe(() => null, (err: ObservablePipeError) =>
            {

                expect(isObservablePipeError(err), `[${err}] is an ObservablePipeError`).to.be.true;

                console.log(getTreeFromError(err).prettyPrint());

                expect(err.pipeStack).to.have.lengthOf(5, "pipeStack");

                done();
            });
    });
    it("should catch pipe errors from combineLatest", done =>
    {
        const first$ = interval(20).pipe(
            take(5),
            skip(1)
        );
        const second$ = interval(20).pipe(
            skip(4)
        );

        combineLatest([first$, second$])
            .pipe(
                map(i =>
                {
                    throw new Error("Stuff");
                })
            )
            .subscribe(() => null, (err: ObservablePipeError) =>
            {

                expect(isObservablePipeError(err), `[${err}] is an ObservablePipeError`).to.be.true;

                console.log(getTreeFromError(err).prettyPrint());

                expect(err.pipeStack).to.have.lengthOf(2, "pipeStack");
                expect(err.pipeStack[1]).to.be.a("string");
                expect(err.pipeStack[0]).to.be.an("array");
                expect(err.pipeStack[0]).to.have.lengthOf(2, "Two paths coming into combineLatest");
                expect(err.pipeStack[0][0]).to.be.an("array");
                expect(err.pipeStack[0][0]).to.have.lengthOf(2);
                expect(err.pipeStack[0][1]).to.be.an("array");
                expect(err.pipeStack[0][1]).to.have.lengthOf(1);

                done();
            });
    });
    it("should trace pipes from combineLatest", done =>
    {
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
                map(i =>
                {
                    return i.reverse();
                }),
                switchMap(a =>
                {
                    return combineLatest([
                        of(a).pipe(first()),
                        interval(40).pipe(
                            first(),
                            map(() =>
                            {
                                // throw new Error("S");
                            })
                        )
                    ]).pipe(
                        first()
                    );
                }),
                trace()
            )
            .subscribe(() => null, (err) =>
            {
                done(err);
                // console.log(getTreeFromError(err).prettyPrint());
            }, done);
    });

    it("Should follow switchMap", done =>
    {
        const a = true;
        const a$ = of(3).pipe(
            map(x => x ** 2)
        );
        of("1").pipe(
            map(x => x + "1"),
            switchMap(x =>
            {
                if (a)
                {
                    return a$;
                } else
                {
                    return of(x + "2").pipe(
                        map(x => x + "2")
                    );
                }
            }),

            trace())
            .subscribe(() => done());
    });

    it("Should split at switchMap and merge at combineLatest", done =>
    {
        const a$ = of("a").pipe(first());
        const b$ = of("b").pipe(take(1));
        of("1").pipe(
            map(x => x + "1"),
            switchMap(x => combineLatest([a$, b$])),

            trace())
            .subscribe(() => null, error => done(error), () => done());
    });
});
