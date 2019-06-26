import {enableProdMode} from "@angular/core";
import {platformBrowserDynamic} from "@angular/platform-browser-dynamic";

import {AppModule} from "./app/app.module";
import {environment} from "./environments/environment";
import {traceObservablePipes} from "rxjs-trace-observables";

import * as rxjsOperators from "rxjs/operators";
import * as rxjs from "rxjs";

if (environment.production) {
  enableProdMode();
}

traceObservablePipes(rxjs, rxjsOperators, {excludePackages: ["vendor.js"]});


platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
