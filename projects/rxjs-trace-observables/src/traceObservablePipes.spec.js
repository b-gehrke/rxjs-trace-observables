"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var operators_1 = require("rxjs/operators");
var rxjs_1 = require("rxjs");
var chai_1 = require("chai");
var observablePipeError_1 = require("./observablePipeError");
var traceObservablePipes_1 = require("./traceObservablePipes");
var trace_1 = require("./trace");
var KStackNode_1 = require("./KStackNode");
describe("Main", function () {
    traceObservablePipes_1.traceObservablePipes();
    it("should catch pipe errors from pipeable operators", function (done) {
        rxjs_1.interval(20).pipe(operators_1.map(function (i) { return Math.pow(i, 2); }), operators_1.take(10))
            .pipe(operators_1.map(function (i) {
            throw new Error("Error");
        }))
            .subscribe(function () { return null; }, function (err) {
            chai_1.expect(observablePipeError_1.isObservablePipeError(err), "[" + err + "] is an ObservablePipeError").to.be.true;
            console.log(KStackNode_1.getTreeFromError(err).prettyPrint());
            chai_1.expect(err.pipeStack).to.have.lengthOf(3, "pipeStack");
            done();
        });
    });
    it("should catch pipe errors from switchMap operators", function (done) {
        rxjs_1.interval(20).pipe(operators_1.map(function (i) { return Math.pow(i, 2); }), operators_1.take(10))
            .pipe(operators_1.switchMap(function () {
            return rxjs_1.interval(20).pipe(operators_1.take(4), operators_1.map(function (i) {
                throw new Error("Error");
            }));
        }))
            .subscribe(function () { return null; }, function (err) {
            chai_1.expect(observablePipeError_1.isObservablePipeError(err), "[" + err + "] is an ObservablePipeError").to.be.true;
            console.log(KStackNode_1.getTreeFromError(err).prettyPrint());
            chai_1.expect(err.pipeStack).to.have.lengthOf(5, "pipeStack");
            done();
        });
    });
    it("should catch pipe errors from combineLatest", function (done) {
        var first$ = rxjs_1.interval(20).pipe(operators_1.take(5), operators_1.skip(1));
        var second$ = rxjs_1.interval(20).pipe(operators_1.skip(4));
        rxjs_1.combineLatest([first$, second$])
            .pipe(operators_1.map(function (i) {
            throw new Error("Stuff");
        }))
            .subscribe(function () { return null; }, function (err) {
            chai_1.expect(observablePipeError_1.isObservablePipeError(err), "[" + err + "] is an ObservablePipeError").to.be.true;
            console.log(KStackNode_1.getTreeFromError(err).prettyPrint());
            chai_1.expect(err.pipeStack).to.have.lengthOf(2, "pipeStack");
            chai_1.expect(err.pipeStack[1]).to.be.a("string");
            chai_1.expect(err.pipeStack[0]).to.be.an("array");
            chai_1.expect(err.pipeStack[0]).to.have.lengthOf(2, "Two paths coming into combineLatest");
            chai_1.expect(err.pipeStack[0][0]).to.be.an("array");
            chai_1.expect(err.pipeStack[0][0]).to.have.lengthOf(2);
            chai_1.expect(err.pipeStack[0][1]).to.be.an("array");
            chai_1.expect(err.pipeStack[0][1]).to.have.lengthOf(1);
            done();
        });
    });
    it("should trace pipes from combineLatest", function (done) {
        var first$ = rxjs_1.interval(20).pipe(operators_1.take(5), operators_1.skip(1));
        var second$ = rxjs_1.interval(20).pipe(operators_1.skip(4), operators_1.take(2));
        rxjs_1.combineLatest([first$, second$])
            .pipe(operators_1.map(function (i) {
            return i.reverse();
        }), operators_1.switchMap(function (a) {
            return rxjs_1.combineLatest([
                rxjs_1.of(a).pipe(operators_1.first()),
                rxjs_1.interval(40).pipe(operators_1.first(), operators_1.map(function () {
                    // throw new Error("S");
                }))
            ]).pipe(operators_1.first());
        }), trace_1.trace())
            .subscribe(function () { return null; }, function (err) {
            done(err);
            // console.log(getTreeFromError(err).prettyPrint());
        }, done);
    });
    it("Should follow switchMap", function (done) {
        var a = true;
        var a$ = rxjs_1.of(3).pipe(operators_1.map(function (x) { return Math.pow(x, 2); }));
        rxjs_1.of("1").pipe(operators_1.map(function (x) { return x + "1"; }), operators_1.switchMap(function (x) {
            if (a) {
                return a$;
            }
            else {
                return rxjs_1.of(x + "2").pipe(operators_1.map(function (x) { return x + "2"; }));
            }
        }), trace_1.trace())
            .subscribe(function () { return done(); });
    });
    it("Should split at switchMap and merge at combineLatest", function (done) {
        var a$ = rxjs_1.of("a").pipe(operators_1.first());
        var b$ = rxjs_1.of("b").pipe(operators_1.take(1));
        rxjs_1.of("1").pipe(operators_1.map(function (x) { return x + "1"; }), operators_1.switchMap(function (x) { return rxjs_1.combineLatest([a$, b$]); }), trace_1.trace())
            .subscribe(function () { return null; }, function (error) { return done(error); }, function () { return done(); });
    });
});
//# sourceMappingURL=traceObservablePipes.spec.js.map