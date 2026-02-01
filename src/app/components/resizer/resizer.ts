import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  output,
  signal,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-resizer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="hidden lg:block w-4 self-stretch relative mx-1">
      <div
        class="fixed top-1/2 -translate-y-1/2 w-4 h-12 flex items-center justify-center cursor-col-resize group"
        (mousedown)="onMouseDown($event)"
        (touchstart)="onTouchStart($event)"
        role="separator"
        aria-orientation="vertical"
        aria-label="Ridimensiona pannelli"
        tabindex="0"
        (keydown)="onKeyDown($event)"
      >
        <div
          class="w-1 h-12 rounded-full transition-colors"
          [class]="
            isDragging()
              ? 'bg-stone-400 dark:bg-stone-500'
              : 'bg-stone-300 group-hover:bg-stone-400 dark:bg-stone-600 dark:group-hover:bg-stone-500'
          "
        ></div>
      </div>
    </div>
  `,
  host: {
    class: 'contents',
  },
})
export class Resizer {
  private readonly elementRef = inject(ElementRef);
  private readonly platformId = inject(PLATFORM_ID);

  readonly isDragging = signal(false);
  readonly resize = output<number>();

  private startX = 0;
  private containerWidth = 0;
  private startRatio = 0.5;

  onMouseDown(event: MouseEvent): void {
    event.preventDefault();
    this.startDrag(event.clientX);
  }

  onTouchStart(event: TouchEvent): void {
    if (event.touches.length === 1) {
      event.preventDefault();
      this.startDrag(event.touches[0].clientX);
    }
  }

  onKeyDown(event: KeyboardEvent): void {
    const step = event.shiftKey ? 0.05 : 0.01;
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.resize.emit(-step);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.resize.emit(step);
    }
  }

  private startDrag(clientX: number): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.isDragging.set(true);
    this.startX = clientX;

    const container = this.elementRef.nativeElement.parentElement;
    if (container) {
      this.containerWidth = container.offsetWidth;
    }

    const onMouseMove = (e: MouseEvent) => this.onDrag(e.clientX);
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        this.onDrag(e.touches[0].clientX);
      }
    };
    const onEnd = () => {
      this.isDragging.set(false);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onEnd);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onEnd);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onEnd);
    document.addEventListener('touchmove', onTouchMove);
    document.addEventListener('touchend', onEnd);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }

  private onDrag(clientX: number): void {
    if (this.containerWidth === 0) return;

    const deltaX = clientX - this.startX;
    const deltaRatio = deltaX / this.containerWidth;

    this.startX = clientX;
    this.resize.emit(deltaRatio);
  }
}
