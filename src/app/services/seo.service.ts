import { inject, Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

interface MetaTagsConfig {
  title?: string;
  description?: string;
  ogTitle?: string;
  ogDescription?: string;
}

const DEFAULT_TITLE = 'Stipendio.top - Calcola il tuo stipendio netto';
const DEFAULT_DESCRIPTION =
  'Calcola il tuo stipendio netto in Italia partendo dal lordo. Simulatore gratuito con IRPEF, contributi INPS, detrazioni e bonus aggiornati.';

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  updateTitle(title: string): void {
    this.title.setTitle(title);
    this.meta.updateTag({ property: 'og:title', content: title });
    this.meta.updateTag({ name: 'twitter:title', content: title });
  }

  updateDescription(description: string): void {
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ name: 'twitter:description', content: description });
  }

  updateMetaTags(config: MetaTagsConfig): void {
    if (config.title) {
      this.updateTitle(config.title);
    }
    if (config.description) {
      this.updateDescription(config.description);
    }
    if (config.ogTitle) {
      this.meta.updateTag({ property: 'og:title', content: config.ogTitle });
    }
    if (config.ogDescription) {
      this.meta.updateTag({ property: 'og:description', content: config.ogDescription });
    }
  }

  updateForSharedState(nettoMensile: number): void {
    const formatted = new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(nettoMensile);

    const title = `${formatted}/mese netto - Stipendio.top`;
    const description = `Calcolo stipendio netto: ${formatted} al mese. Condividi o modifica questa simulazione su Stipendio.top.`;

    this.updateTitle(title);
    this.updateDescription(description);
  }

  resetToDefaults(): void {
    this.updateTitle(DEFAULT_TITLE);
    this.updateDescription(DEFAULT_DESCRIPTION);
  }
}
