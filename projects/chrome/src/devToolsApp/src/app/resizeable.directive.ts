import {Directive, HostListener, Input, OnDestroy, OnInit, Renderer2} from '@angular/core';

@Directive({
  selector: '[appResizeable]',
})
export class ResizeableDirective implements OnInit, OnDestroy {
  @Input()
  public target: Element;
  private moveStart: number | null = null;
  private heightBacking = NaN;

  constructor(private renderer: Renderer2) {
  }

  public get height(): number {
    return this.heightBacking;
  }

  @Input()
  public set height(value: number) {
    this.renderer.setStyle(this.target, 'height', value ? value + 'px' : 'auto');

    this.heightBacking = value;
  }

  ngOnDestroy(): void {
  }

  ngOnInit(): void {
    document.addEventListener('mousemove', $event => this.updateOffset($event));
    document.addEventListener('mouseup', $event => this.endOffset($event));
  }

  @HostListener('mousedown', ['$event'])
  public startOffset($event: MouseEvent) {

    if (this.moveStart === null) {

      this.moveStart = $event.clientY;
      $event.preventDefault();
    }
  }

  public updateOffset($event: MouseEvent): boolean {
    if (this.moveStart !== null) {

      const offset = $event.clientY - this.moveStart;

      this.height = (isNaN(this.height) ? this.target.scrollHeight || 0 : this.height) + offset;
      this.moveStart = $event.clientY;

      $event.preventDefault();

      return true;
    }

    return false;
  }

  public endOffset($event: MouseEvent) {
    if (this.updateOffset($event)) {
      this.moveStart = null;
    }

  }

}
