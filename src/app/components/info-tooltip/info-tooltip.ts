import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  OnDestroy,
  Renderer2,
  viewChild,
} from '@angular/core';

@Component({
  selector: 'app-info-tooltip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'inline-flex items-center ml-1',
  },
  template: `
    <button
      #trigger
      type="button"
      class="cursor-pointer inline-flex items-center justify-center w-4 h-4 text-stone-400 hover:text-stone-600 focus:text-stone-600 focus:outline-none focus:ring-2 focus:ring-stone-500 focus:ring-offset-1 rounded-full transition-colors dark:text-stone-500 dark:hover:text-stone-300 dark:focus:text-stone-300"
      [attr.aria-label]="'Informazioni: ' + text()"
      [attr.aria-describedby]="tooltipId()"
      (mouseenter)="show()"
      (mouseleave)="hide()"
      (focus)="show()"
      (blur)="hide()"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        class="w-4 h-4"
        aria-hidden="true"
      >
        <path
          fill-rule="evenodd"
          d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z"
          clip-rule="evenodd"
        />
      </svg>
    </button>
  `,
})
export class InfoTooltip implements OnDestroy {
  readonly text = input.required<string>();
  readonly tooltipId = input.required<string>();

  private readonly document = inject(DOCUMENT);
  private readonly renderer = inject(Renderer2);
  protected readonly trigger = viewChild.required<ElementRef<HTMLButtonElement>>('trigger');

  private tooltipEl: HTMLElement | null = null;

  show(): void {
    if (this.tooltipEl) return;

    const triggerRect = this.trigger().nativeElement.getBoundingClientRect();
    const triggerCenterX = triggerRect.left + triggerRect.width / 2;
    const viewportWidth = this.document.documentElement.clientWidth;
    const padding = 8;

    // Create tooltip container
    const tooltipEl: HTMLElement = this.renderer.createElement('div');
    this.tooltipEl = tooltipEl;
    this.renderer.setAttribute(tooltipEl, 'id', this.tooltipId());
    this.renderer.setAttribute(tooltipEl, 'role', 'tooltip');
    this.renderer.setAttribute(
      tooltipEl,
      'class',
      'fixed z-[9999] px-3 py-2 text-xs leading-relaxed text-white bg-stone-800 rounded-lg shadow-lg max-w-xs w-max pointer-events-none dark:bg-stone-700',
    );
    this.renderer.setStyle(tooltipEl, 'top', `${triggerRect.top - 8}px`);
    this.renderer.setStyle(tooltipEl, 'transform', 'translateY(-100%)');

    // Add text
    const textNode = this.renderer.createText(this.text());
    this.renderer.appendChild(tooltipEl, textNode);

    // Add arrow (will adjust position after measuring)
    const arrow = this.renderer.createElement('div');
    this.renderer.setAttribute(
      arrow,
      'class',
      'absolute top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-stone-800 dark:border-t-stone-700',
    );
    this.renderer.setAttribute(arrow, 'aria-hidden', 'true');
    this.renderer.appendChild(tooltipEl, arrow);

    // Append to body to measure actual width
    this.renderer.appendChild(this.document.body, tooltipEl);

    // Calculate clamped position to keep tooltip within viewport
    const tooltipRect = tooltipEl.getBoundingClientRect();
    const tooltipHalfWidth = tooltipRect.width / 2;

    let tooltipLeft = triggerCenterX - tooltipHalfWidth;
    const minLeft = padding;
    const maxLeft = viewportWidth - tooltipRect.width - padding;

    tooltipLeft = Math.max(minLeft, Math.min(maxLeft, tooltipLeft));
    this.renderer.setStyle(tooltipEl, 'left', `${tooltipLeft}px`);

    // Position arrow to point at trigger center
    const arrowLeft = triggerCenterX - tooltipLeft;
    this.renderer.setStyle(arrow, 'left', `${arrowLeft}px`);
    this.renderer.setStyle(arrow, 'transform', 'translateX(-50%)');
  }

  hide(): void {
    if (this.tooltipEl) {
      this.renderer.removeChild(this.document.body, this.tooltipEl);
      this.tooltipEl = null;
    }
  }

  ngOnDestroy(): void {
    this.hide();
  }
}
