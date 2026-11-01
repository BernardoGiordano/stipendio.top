import type { IconName } from './components/icon/icon';

export interface ShellLink {
  /** Short label for the desktop bar */
  label: string;
  /** Longer label for the mobile menu */
  menuLabel: string;
  href: string;
  icon: IconName;
}

/** External links shared by the desktop bar, the mobile menu and the footer */
export const LINKS = {
  linkedin: {
    label: 'LinkedIn',
    menuLabel: 'LinkedIn',
    href: 'https://www.linkedin.com/in/bernardogiordano',
    icon: 'linkedin',
  },
  github: {
    label: 'GitHub',
    menuLabel: 'Sorgente su GitHub',
    href: 'https://github.com/BernardoGiordano/stipendio.top',
    icon: 'github',
  },
  paypal: {
    label: 'Supporta',
    menuLabel: 'Supporta con PayPal',
    href: 'https://www.paypal.com/paypalme/BernardoGiordano',
    icon: 'paypal',
  },
} as const satisfies Record<string, ShellLink>;

export const NAV_LINKS: readonly ShellLink[] = [LINKS.linkedin, LINKS.github, LINKS.paypal];
