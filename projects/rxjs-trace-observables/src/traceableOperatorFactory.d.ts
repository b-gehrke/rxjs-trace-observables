import { Observable } from "rxjs";
export declare function traceableOperatorFactory<T extends Function>(operator: T, opName: string): (...args: any[]) => (source: Observable<T>) => Observable<unknown>;
