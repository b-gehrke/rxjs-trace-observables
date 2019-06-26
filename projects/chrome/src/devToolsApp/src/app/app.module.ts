import {BrowserModule} from "@angular/platform-browser";
import {NgModule} from "@angular/core";

import {AppComponent} from "./app.component";
import {ResizeableDirective} from "./resizeable.directive";
import {CommonModule} from "@angular/common";

@NgModule({
  declarations: [
    AppComponent,
    ResizeableDirective
  ],
  imports: [
    CommonModule,
    BrowserModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {
}
