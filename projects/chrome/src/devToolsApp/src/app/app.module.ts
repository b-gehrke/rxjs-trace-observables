import {BrowserModule} from "@angular/platform-browser";
import {NgModule} from "@angular/core";

import {AppComponent} from "./app.component";
import {ResizeableDirective} from "./resizeable.directive";
import {CommonModule} from "@angular/common";
import {FormsModule} from "@angular/forms";

@NgModule({
  declarations: [
    AppComponent,
    ResizeableDirective
  ],
  imports: [
    CommonModule,
    BrowserModule,
    FormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {
}
