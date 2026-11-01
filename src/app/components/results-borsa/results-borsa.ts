import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { OutputCalcoloStipendio } from '../../../calculator/types';
import { formatCurrency } from '../../utils/intl';
import { LedgerCard, LedgerRow } from '../ledger/ledger';
import { ripartizioneRal } from '../tray/breakdown';
import { Kpi, Stat, Tray } from '../tray/tray';

@Component({
  selector: 'app-results-borsa',
  imports: [LedgerCard, LedgerRow, Tray],
  templateUrl: './results-borsa.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResultsBorsa {
  readonly result = input<OutputCalcoloStipendio | null>(null);

  readonly ripartizione = computed(() => {
    const r = this.result();
    return r ? ripartizioneRal(r) : null;
  });

  readonly kpi = computed<Kpi[]>(() => {
    const r = this.result();
    if (!r) return [];
    return [
      { label: 'Netto mensile', value: r.nettoMensile, note: 'su 12 rate mensili' },
      { label: 'Netto annuo', value: r.nettoAnnuo, note: 'esente IRPEF e addizionali' },
      { label: 'Lordo annuo', value: r.ral, note: 'importo della borsa' },
    ];
  });

  readonly stats = computed<Stat[]>(() => {
    const r = this.result();
    if (!r) return [];
    return [
      {
        label: "Costo per l'ente",
        value: formatCurrency(r.costoAziendale),
        hue: 'terracotta',
        icon: 'building',
      },
    ];
  });
}
