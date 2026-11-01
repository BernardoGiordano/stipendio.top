import type { CategoriaTrattenuta, OutputCalcoloStipendio } from '../../../calculator/types';
import type { Hue } from '../../services/chart-palette';

export interface QuotaRal {
  id: 'netto' | CategoriaTrattenuta;
  label: string;
  importo: number;
  /** Share of the base, 0 to 1 */
  quota: number;
  hue: Hue;
}

export interface RipartizioneRal {
  /** Money paid into the busta: the RAL plus any bonus that reaches the netto */
  base: number;
  /** Netto first, then the trattenute by category, largest first */
  quote: QuotaRal[];
}

const TRATTENUTE: Record<CategoriaTrattenuta, { label: string; hue: Hue }> = {
  contributi: { label: 'INPS', hue: 'arancio' },
  irpef: { label: 'IRPEF', hue: 'rosa' },
  addizionali: { label: 'Addizionali', hue: 'ocra' },
  fondi: { label: 'Fondi', hue: 'viola' },
  autoAziendale: { label: 'Auto aziendale', hue: 'blu' },
};

/** Where the money paid into the busta goes: netto and each kind of trattenuta */
export function ripartizioneRal(result: OutputCalcoloStipendio): RipartizioneRal {
  const base = result.ripartizione.entrate
    .filter((voce) => voce.destinazione === 'netto')
    .reduce((sum, voce) => sum + voce.importo, 0);
  const quota = (importo: number) => (base > 0 ? Math.max(0, importo) / base : 0);

  const gruppi = new Map<CategoriaTrattenuta, number>();
  for (const voce of result.ripartizione.trattenute) {
    gruppi.set(voce.categoria, (gruppi.get(voce.categoria) ?? 0) + voce.importo);
  }

  // A fondi group made only of the pension fund reads better under its own name
  const soloFondoPensione =
    result.fondoPensioneIntegrativo !== null && result.fondiContrattuali.length === 0;

  const trattenute: QuotaRal[] = [...gruppi]
    .filter(([, importo]) => importo >= 0.005)
    .map(([categoria, importo]) => ({
      id: categoria,
      label:
        categoria === 'fondi' && soloFondoPensione ? 'Fondo pensione' : TRATTENUTE[categoria].label,
      importo,
      quota: quota(importo),
      hue: TRATTENUTE[categoria].hue,
    }))
    .sort((a, b) => b.importo - a.importo);

  const netto: QuotaRal = {
    id: 'netto',
    label: 'Netto',
    importo: result.nettoAnnuo,
    quota: quota(result.nettoAnnuo),
    hue: 'verde',
  };

  return { base, quote: [netto, ...trattenute] };
}
