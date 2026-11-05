import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
  signal,
  viewChild,
} from '@angular/core';
import {
  BustaPaga,
  DettaglioFondoContrattuale,
  InputCalcoloStipendio,
  OutputCalcoloStipendio,
  TrattamentoFiscaleFondo,
} from '../../../calculator/types';
import { REGIONE_LABELS } from '../../../calculator/addizionali/2026.regionali';
import { PLAFOND_PREVIDENZA_COMPLEMENTARE } from '../../../calculator/fondi/2026';
import { VOCE_INPS_DATORE } from '../../../calculator/datore/2026';
import { ALIQUOTA_FONDO_PENSIONE } from '../../../calculator/tfr/2026';
import { GraphFunnel } from '../graph-funnel/graph-funnel';
import { GraphProjection } from '../graph-projection/graph-projection';
import { LedgerCard, LedgerRow, LedgerVoce } from '../ledger/ledger';
import { Kpi, Stat, Tray } from '../tray/tray';
import { ripartizioneRal } from '../tray/breakdown';
import { aumentoNetto } from '../../utils/proiezione';
import { formatCurrency, formatNumber, formatPercent } from '../../utils/intl';

type TabId = 'cedolino' | 'flusso' | 'proiezione';

/** A row of the costo aziendale card, with the rate it applies in brackets */
type RigaCosto = LedgerVoce & { nota?: string };

/** The monthly line of a fund row, by how the worker's contribution is taxed */
const EFFETTO_FONDO: Record<
  TrattamentoFiscaleFondo,
  (fondo: DettaglioFondoContrattuale) => string
> = {
  deducibileSenzaLimite: () => "al mese, dedotto dall'imponibile IRPEF senza limite",
  previdenzaComplementare: (fondo) =>
    fondo.deduzione >= fondo.contributoAnnuo - 0.005
      ? 'al mese, dedotto entro il plafond della previdenza'
      : `al mese, dedotti ${formatCurrency(fondo.deduzione)} entro il plafond della previdenza`,
  assistenzaSanitaria: (fondo) =>
    fondo.contributoAnnuo <= 0
      ? 'al mese, nessuna trattenuta'
      : fondo.deduzione >= fondo.contributoAnnuo - 0.005
        ? 'al mese, esente da IRPEF entro il limite sanitario'
        : fondo.deduzione > 0
          ? `al mese, esenti ${formatCurrency(fondo.deduzione)} entro il limite sanitario`
          : 'al mese, oltre il limite sanitario: trattenuta dal netto',
  nonDeducibile: () => 'al mese, trattenuta diretta dal netto',
};

/** Tailwind's lg breakpoint, where the tab bar pins to the top */
const PINNED_BAR_QUERY = '(min-width: 64rem)';

const TABS: readonly { id: TabId; label: string }[] = [
  { id: 'cedolino', label: 'Dettaglio' },
  { id: 'flusso', label: 'Flusso' },
  { id: 'proiezione', label: 'Proiezione' },
];

@Component({
  selector: 'app-results',
  imports: [GraphFunnel, GraphProjection, LedgerCard, LedgerRow, Tray],
  templateUrl: './results.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Results {
  readonly formatPercent = formatPercent;
  readonly formatCurrency = formatCurrency;
  readonly plafond = PLAFOND_PREVIDENZA_COMPLEMENTARE;
  readonly tabs = TABS;
  /** A line of context under a card's rows */
  readonly note = 'pt-0.5 pb-1.5 pl-3.5 text-[13px]/[18px] text-muted';
  /** Panels clear the pinned tab bar when scrolled into view */
  readonly panel =
    'scroll-mt-[74px] rounded-[20px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus';

  /** The tab bar while pinned: a frosted sheet flush with the top of the viewport */
  readonly pinnedBar =
    'lg:rounded-b-xl lg:bg-surface/95 lg:shadow-md lg:ring-1 lg:ring-ring-card lg:backdrop-blur-md';

  private readonly injector = inject(Injector);
  private readonly bar = viewChild<ElementRef<HTMLElement>>('bar');

  /** True while the tab bar sits pinned at the top of the viewport */
  readonly barStuck = signal(false);

  readonly result = input<OutputCalcoloStipendio | null>(null);
  readonly baseInput = input<InputCalcoloStipendio | null>(null);

  readonly ripartizione = computed(() => {
    const r = this.result();
    return r ? ripartizioneRal(r) : null;
  });

  /** Extra netto annuo from 1.000 € more RAL */
  readonly aumento = computed(() => {
    const base = this.baseInput();
    return base ? aumentoNetto(base) : null;
  });

  readonly kpi = computed<Kpi[]>(() => {
    const r = this.result();
    if (!r) return [];
    const aggiuntive = r.bustePaga.numeroAggiuntive;
    const mensilita = aggiuntive > 0 ? 'mensilità ordinaria' : `su ${r.mensilita} mensilità`;
    const percepitoMensile = { label: 'Percepito mensile', value: r.nettoMensilePercepito };
    const nettoMensile = { label: 'Netto mensile', value: r.nettoMensile };
    return [
      { ...percepitoMensile, note: `${mensilita}, welfare e rimborsi compresi` },
      {
        ...nettoMensile,
        note:
          aggiuntive > 0
            ? `${this.mensilitaAggiuntive()} ${formatCurrency(r.nettoMensilitaAggiuntiva)}`
            : 'in busta paga',
      },
      {
        label: 'Percepito annuo',
        value: r.totalePercepito,
        note: `netto ${formatCurrency(r.nettoAnnuo)}`,
      },
    ];
  });

  /** "tredicesima", "tredicesima e quattordicesima" or "mensilità aggiuntive", by their number */
  readonly mensilitaAggiuntive = computed(() => {
    const aggiuntive = this.result()?.bustePaga.numeroAggiuntive ?? 0;
    return aggiuntive === 1
      ? 'tredicesima'
      : aggiuntive === 2
        ? 'tredicesima e quattordicesima'
        : 'mensilità aggiuntive';
  });

  /** The rows of a busta paga, read like a payslip: lordo, trattenute, bonus, netto */
  private righeBusta(busta: BustaPaga): LedgerVoce[] {
    const se = (condizione: boolean, voce: LedgerVoce): LedgerVoce[] => (condizione ? [voce] : []);
    return [
      { label: 'Lordo', amount: busta.lordo },
      ...se(busta.altreEntrate > 0, { label: 'Altre voci tassate', amount: busta.altreEntrate }),
      { label: 'Contributi INPS', amount: busta.contributiInps, flow: 'out' },
      ...se(busta.fondi > 0, { label: 'Fondi', amount: busta.fondi, flow: 'out' }),
      { label: 'IRPEF', amount: busta.irpef, flow: 'out' },
      { label: 'Imponibile IRPEF', amount: busta.imponibileIrpef, level: 'detail' },
      { label: 'IRPEF lorda', amount: busta.irpefLorda, level: 'detail' },
      ...se(busta.detrazioni > 0, {
        label: 'Detrazioni',
        amount: busta.detrazioni,
        flow: 'reduce',
        level: 'detail',
      }),
      ...se(busta.addizionali > 0, {
        label: 'Addizionali',
        amount: busta.addizionali,
        flow: 'out',
      }),
      ...se(busta.altreTrattenute > 0, {
        label: 'Altre trattenute',
        amount: busta.altreTrattenute,
        flow: 'out',
      }),
      ...se(busta.bonus > 0, { label: 'Bonus fiscali', amount: busta.bonus, flow: 'in' }),
      { label: 'Netto', amount: busta.netto, level: 'total' },
    ];
  }

  /** The ordinary month and, with 13 or 14 mensilità, the extra one */
  readonly bustePaga = computed(() => {
    const r = this.result();
    if (!r) return null;
    const { ordinaria, aggiuntiva } = r.bustePaga;
    const nome = this.mensilitaAggiuntive();
    return {
      ordinaria: { heading: 'Mensilità ordinaria', righe: this.righeBusta(ordinaria) },
      aggiuntiva: aggiuntiva && {
        heading: nome.charAt(0).toUpperCase() + nome.slice(1),
        righe: this.righeBusta(aggiuntiva),
      },
    };
  });

  readonly stats = computed<Stat[]>(() => {
    const r = this.result();
    if (!r) return [];
    const stats: Stat[] = [
      {
        label: 'Costo aziendale',
        value: formatCurrency(r.costoAziendale),
        hue: 'terracotta',
        icon: 'building',
      },
    ];
    const aumento = this.aumento();
    if (aumento !== null) {
      stats.push({
        label: 'Con 1.000 € di RAL in più',
        value: `+ ${formatCurrency(aumento)} netti l'anno`,
        hue: 'verde',
        icon: 'trend',
      });
    }
    if (r.fondoPensioneIntegrativo) {
      stats.push({
        label: 'Risparmio fondo pensione',
        value: `${formatCurrency(r.fondoPensioneIntegrativo.risparmoFiscaleStimato)} l'anno`,
        hue: 'viola',
        icon: 'sprout',
      });
    }
    if (r.tfr) {
      stats.push({
        label: 'TFR netto stimato',
        value: `${formatCurrency(r.tfr.nettoAnnuo)} l'anno`,
        hue: 'ocra',
        icon: 'check',
      });
    }
    if (r.premioRisultato && r.premioRisultato.imponibileSostitutiva > 0) {
      stats.push({
        label: 'Risparmio premio detassato',
        value: `${formatCurrency(r.premioRisultato.risparmioFiscaleStimato)} l'anno`,
        hue: 'ocra',
        icon: 'trend',
      });
    }
    return stats;
  });

  /**
   * Riepilogo rows, read top to bottom like a payslip: what reaches the busta,
   * the trattenute with their breakdown, the netto, then what is paid on top.
   */
  readonly riepilogo = computed<LedgerVoce[]>(() => {
    const r = this.result();
    const ripartizione = this.ripartizione();
    if (!r || !ripartizione) return [];
    const entrate: LedgerVoce[] = r.ripartizione.entrate
      .filter((voce) => voce.destinazione === 'netto' && voce.categoria !== 'bonus')
      .map((voce) => ({ label: voce.descrizione, amount: voce.importo }));

    const trattenute: LedgerVoce[] = ripartizione.quote
      .filter((quota) => quota.id !== 'netto')
      .map((quota) => ({
        label: quota.label,
        amount: quota.importo,
        flow: 'out',
        level: 'detail',
      }));

    const esenti: LedgerVoce[] = r.ripartizione.entrate
      .filter((voce) => voce.destinazione === 'esente')
      .map((voce) => ({ label: voce.descrizione, amount: voce.importo, flow: 'in' }));

    const bonus: LedgerVoce[] =
      r.totaleBonus > 0 ? [{ label: 'Bonus fiscali', amount: r.totaleBonus, flow: 'in' }] : [];

    return [
      ...entrate,
      { label: 'Trattenute', amount: r.totaleTrattenute, flow: 'out' },
      ...trattenute,
      ...bonus,
      { label: 'Netto annuo', amount: r.nettoAnnuo, level: 'total' },
      { label: 'Aliquota effettiva', percent: r.aliquotaEffettiva, level: 'detail' },
      ...(esenti.length
        ? [
            ...esenti,
            { label: 'Totale percepito', amount: r.totalePercepito, level: 'total' } as const,
          ]
        : []),
    ];
  });

  /** Detrazioni that actually lowered IRPEF, and the part left unused */
  readonly detrazioniIrpef = computed(() => {
    const r = this.result();
    if (!r) return null;
    const applicate = r.irpef.irpefLorda - r.irpefFinale;
    const nonUtilizzabili = r.riepilogoDetrazioni.totale - applicate;
    return { applicate, nonUtilizzabili: nonUtilizzabili >= 0.005 ? nonUtilizzabili : 0 };
  });

  /**
   * The datore's voci, with INPS before the exemption and TFR before the 0,50% IVS recovery,
   * each followed by its reduction, so the rows still add up to the costo aziendale
   */
  readonly righeCostoAziendale = computed<RigaCosto[]>(() => {
    const r = this.result();
    if (!r) return [];
    const d = r.contributiDatore;
    const inps: RigaCosto[] = [
      {
        label: VOCE_INPS_DATORE,
        amount: d.contributiInpsLordi,
        nota: formatPercent(d.aliquotaInps),
      },
      ...(d.decontribuzionePremio > 0
        ? [
            {
              label: 'Decontribuzione premio di risultato',
              amount: d.decontribuzionePremio,
              flow: 'reduce',
              level: 'detail',
            } as const,
          ]
        : []),
      ...(d.esonero > 0
        ? [
            {
              label: 'Esonero contributivo',
              amount: d.esonero,
              flow: 'reduce',
              level: 'detail',
            } as const,
          ]
        : []),
    ];
    const datore = r.ripartizione.entrate.filter((voce) => voce.pagatore === 'datore');

    const righe = datore.flatMap((voce): RigaCosto[] => {
      if (voce.descrizione === VOCE_INPS_DATORE) return inps;
      if (voce.categoria === 'tfr') {
        return [
          { label: 'TFR (RAL / 13,5)', amount: d.tfrLordo },
          ...(d.riduzioneTfr > 0
            ? [
                {
                  label: 'Recupero 0,50% IVS',
                  amount: d.riduzioneTfr,
                  flow: 'reduce',
                  level: 'detail',
                } as const,
              ]
            : []),
        ];
      }
      const nota =
        voce.categoria === 'inail'
          ? `${formatNumber(d.tassoInail * 1000, 1)}‰`
          : voce.aliquota !== undefined
            ? formatPercent(voce.aliquota)
            : undefined;
      return [{ label: voce.descrizione, amount: voce.importo, nota }];
    });

    // A full exemption leaves no INPS voce: show the contributions and the exemption after the RAL
    if (
      (d.esonero > 0 || d.decontribuzionePremio > 0) &&
      !datore.some((voce) => voce.descrizione === VOCE_INPS_DATORE)
    ) {
      righe.splice(1, 0, ...inps);
    }
    return righe;
  });

  /**
   * The TFR card, read like a liquidation: what is set aside, how it revalues, the tax at the
   * end and what is left, with the per-year figure when more years of service are set
   */
  readonly righeTfr = computed<LedgerVoce[]>(() => {
    const tfr = this.result()?.tfr;
    if (!tfr) return [];
    const anni = tfr.anniServizio;
    const azienda = tfr.destinazione === 'azienda';
    const righe: LedgerVoce[] = [{ label: 'Accantonamento annuo', amount: tfr.quotaAnnua }];
    if (anni > 1) {
      righe.push({ label: `Quote accantonate in ${anni} anni`, amount: tfr.quoteAccantonate });
    }
    if (tfr.rivalutazione > 0) {
      righe.push(
        {
          label: `Rivalutazione (${formatPercent(tfr.tassoRivalutazione)} l'anno)`,
          amount: tfr.rivalutazione,
          flow: 'in',
        },
        {
          label: 'imposta sostitutiva 17%',
          amount: tfr.impostaSostitutiva,
          flow: 'out',
          level: 'detail',
        },
      );
    }
    righe.push({
      label: azienda ? 'Imposta (tassazione separata)' : 'Imposta sulla prestazione',
      amount: tfr.imposta,
      flow: 'out',
    });
    if (azienda) {
      righe.push({
        label: `aliquota media ${formatPercent(tfr.aliquota)} sul reddito di riferimento`,
        amount: tfr.redditoRiferimento,
        level: 'detail',
      });
      if (tfr.detrazione > 0) {
        righe.push({
          label: 'detrazione D.M. 20 marzo 2008',
          amount: tfr.detrazione,
          flow: 'reduce',
          level: 'detail',
        });
      }
    } else {
      const base = formatPercent(ALIQUOTA_FONDO_PENSIONE.base, 0);
      righe.push({
        label:
          anni > ALIQUOTA_FONDO_PENSIONE.anniPieni
            ? `${base} meno 0,30 punti per ${anni - ALIQUOTA_FONDO_PENSIONE.anniPieni} anni oltre il 15°`
            : `${base} fino a 15 anni di iscrizione`,
        percent: tfr.aliquota,
        level: 'detail',
      });
    }
    righe.push({
      label: anni > 1 ? `TFR netto stimato in ${anni} anni` : 'TFR netto stimato',
      amount: tfr.nettoTotale,
      level: 'total',
    });
    if (anni > 1) {
      righe.push({ label: 'per anno di servizio', amount: tfr.nettoAnnuo, level: 'detail' });
    }
    righe.push({ label: 'aliquota effettiva', percent: tfr.aliquotaEffettiva, level: 'detail' });
    return righe;
  });

  /** What the TFR estimate leaves out, under its rows */
  readonly notaTfr = computed(() => {
    const tfr = this.result()?.tfr;
    if (!tfr) return undefined;
    const busta = 'Fuori dal netto in busta, a RAL costante.';
    return tfr.destinazione === 'azienda'
      ? `${busta} L'Agenzia delle Entrate riliquida l'imposta con l'aliquota media IRPEF dei 5 anni precedenti la cessazione`
      : `${busta} Senza i rendimenti del fondo, tassati a parte al 20%`;
  });

  /** INPS the employer pays on top of the worker's share */
  readonly inpsDatore = computed(
    () =>
      this.result()
        ?.ripartizione.entrate.filter((voce) => voce.categoria === 'contributiDatore')
        .reduce((sum, voce) => sum + voce.importo, 0) ?? 0,
  );

  readonly fondiTotale = computed(
    () => this.result()?.fondiContrattuali.reduce((sum, f) => sum + f.contributoAnnuo, 0) ?? 0,
  );

  /** Fund rows with the text of their monthly line */
  readonly righeFondi = computed(() =>
    (this.result()?.fondiContrattuali ?? []).map((fondo) => ({
      ...fondo,
      effetto: EFFETTO_FONDO[fondo.trattamento](fondo),
    })),
  );

  /** Use of the shared healthcare exemption limit, under the fund rows */
  readonly notaSanitaria = computed(() => {
    const sanita = this.result()?.assistenzaSanitaria;
    if (!sanita) return undefined;
    const esenti = `Contributi sanitari esenti ${formatCurrency(sanita.esente)} su ${formatCurrency(sanita.limite)}`;
    return sanita.eccedenza > 0
      ? `${esenti}, ${formatCurrency(sanita.eccedenza)} imponibili`
      : esenti;
  });

  readonly regione = computed(() => {
    const codice = this.baseInput()?.regione;
    return codice ? REGIONE_LABELS[codice] : undefined;
  });

  readonly comuneNonIndicato = computed(() => this.baseInput()?.comune === 'DEFAULT');

  /** Daily value of the buoni pasto, when they are set */
  readonly buonoPastoGiornaliero = computed(() => {
    const benefit = this.baseInput()?.benefitNonTassati;
    if (!benefit?.buoniPasto || !benefit.giorniBuoniPasto) return null;
    return {
      importo: benefit.buoniPasto / benefit.giorniBuoniPasto,
      giorni: benefit.giorniBuoniPasto,
    };
  });

  readonly activeTab = signal<TabId>('cedolino');

  constructor() {
    effect((onCleanup) => {
      const bar = this.bar()?.nativeElement;
      if (!bar || typeof IntersectionObserver === 'undefined') return;
      // A pinned bar sits at top 0, so the 1px inset clips it and its ratio drops below 1
      const observer = new IntersectionObserver(
        ([entry]) =>
          this.barStuck.set(entry.intersectionRatio < 1 && entry.boundingClientRect.top < 1),
        { rootMargin: '-1px 0px 0px 0px', threshold: 1 },
      );
      observer.observe(bar);
      onCleanup(() => {
        observer.disconnect();
        this.barStuck.set(false);
      });
    });
  }

  /** Selects a tab; with the bar pinned, brings the top of the new panel into view */
  setActiveTab(tab: TabId): void {
    this.activeTab.set(tab);
    if (!this.barStuck() || !matchMedia(PINNED_BAR_QUERY).matches) return;
    afterNextRender(() => document.getElementById(`panel-${tab}`)?.scrollIntoView(), {
      injector: this.injector,
    });
  }

  /** Arrow keys, Home and End move between tabs and select them */
  onTabKeydown(event: KeyboardEvent): void {
    const index = TABS.findIndex((tab) => tab.id === this.activeTab());
    const next =
      event.key === 'ArrowRight'
        ? (index + 1) % TABS.length
        : event.key === 'ArrowLeft'
          ? (index - 1 + TABS.length) % TABS.length
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? TABS.length - 1
              : -1;
    if (next < 0) return;
    event.preventDefault();
    this.setActiveTab(TABS[next].id);
    document.getElementById(`tab-${TABS[next].id}`)?.focus({ preventScroll: true });
  }
}
