import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

interface IconPath {
  d: string;
  evenodd?: boolean;
  opacity?: number;
}

interface IconDef {
  viewBox: string;
  /** Outline icons are stroked, solid icons are filled */
  stroke?: number;
  paths: IconPath[];
}

const ICONS = {
  linkedin: {
    viewBox: '0 0 24 24',
    paths: [
      {
        d: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z',
      },
    ],
  },
  github: {
    viewBox: '0 0 24 24',
    paths: [
      {
        evenodd: true,
        d: 'M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z',
      },
    ],
  },
  paypal: {
    viewBox: '0 0 24 24',
    paths: [
      {
        d: 'M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.72a.77.77 0 0 1 .757-.649h6.403c2.12 0 3.804.482 4.873 1.392.996.849 1.39 2.063 1.174 3.617l-.005.023c-.42 2.72-2.043 4.461-4.732 5.085-.608.14-1.275.212-1.988.212H9.042l-.934 6.072a.77.77 0 0 1-.757.649H7.35l.001-.001h-.275z',
      },
      {
        opacity: 0.7,
        d: 'M19.873 8.38c-.064.418-.163.86-.3 1.327-.89 3.043-3.266 4.607-7.064 4.607h-.477l-1.017 6.598a.642.642 0 0 1-.632.551H7.42l.234-1.519.094-.609.934-6.072h2.384c.713 0 1.38-.072 1.988-.212 2.689-.624 4.312-2.365 4.732-5.085l.005-.023c.09-.594.085-1.109-.026-1.563h.025c.627.292 1.06.733 1.324 1.35.235.55.336 1.22.286 2.011l-.001.013a8.073 8.073 0 0 1-.527 1.626z',
      },
    ],
  },
  sun: {
    viewBox: '0 0 24 24',
    stroke: 1.5,
    paths: [
      {
        d: 'M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z',
      },
    ],
  },
  moon: {
    viewBox: '0 0 24 24',
    stroke: 1.5,
    paths: [
      {
        d: 'M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z',
      },
    ],
  },
  menu: {
    viewBox: '0 0 24 24',
    stroke: 1.5,
    paths: [{ d: 'M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5' }],
  },
  check: {
    viewBox: '0 0 20 20',
    paths: [
      {
        evenodd: true,
        d: 'M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z',
      },
    ],
  },
  'check-bold': {
    viewBox: '0 0 24 24',
    stroke: 2,
    paths: [{ d: 'm4.5 12.75 6 6 9-13.5' }],
  },
  info: {
    viewBox: '0 0 24 24',
    stroke: 1.5,
    paths: [
      {
        d: 'M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z',
      },
    ],
  },
  link: {
    viewBox: '0 0 24 24',
    stroke: 1.5,
    paths: [
      {
        d: 'M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244',
      },
    ],
  },
  plus: {
    viewBox: '0 0 15 15',
    paths: [{ d: 'M7 0h1v15H7zM0 7h15v1H0z' }],
  },
  'arrow-right': {
    viewBox: '0 0 20 20',
    paths: [
      {
        evenodd: true,
        d: 'M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z',
      },
    ],
  },
} satisfies Record<string, IconDef>;

export type IconName = keyof typeof ICONS;

/** Decorative icon from the app's icon set; size and colour come from the host class */
@Component({
  selector: 'app-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'inline-block shrink-0', 'aria-hidden': 'true' },
  template: `
    @let icon = def();
    <svg
      [attr.viewBox]="icon.viewBox"
      class="block size-full"
      [attr.fill]="icon.stroke ? 'none' : 'currentColor'"
      [attr.stroke]="icon.stroke ? 'currentColor' : null"
      [attr.stroke-width]="icon.stroke ?? null"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      @for (path of icon.paths; track $index) {
        <path
          [attr.d]="path.d"
          [attr.fill-rule]="path.evenodd ? 'evenodd' : null"
          [attr.clip-rule]="path.evenodd ? 'evenodd' : null"
          [attr.opacity]="path.opacity ?? null"
        />
      }
    </svg>
  `,
})
export class Icon {
  readonly name = input.required<IconName>();
  protected readonly def = computed<IconDef>(() => ICONS[this.name()]);
}
