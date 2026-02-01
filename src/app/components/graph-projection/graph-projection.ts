import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  OnDestroy,
  signal,
  viewChild,
} from '@angular/core';
import { InputCalcoloStipendio, OutputCalcoloStipendio } from '../../../calculator/types';
import { calcolaStipendioNetto } from '../../../calculator/calculator';
import { DisplayMode } from '../../services/display-mode';
import type { Config, Layout, PlotData } from 'plotly.js-dist-min';

type ViewMode = 'monthly' | 'annual';

/** Metric options for the Y-axis (extensible) */
type MetricType = 'benefitNonTassati';

interface MetricConfig {
  label: string;
  labelShort: string;
  getValueFromInput: (input: InputCalcoloStipendio) => number;
  setValueOnInput: (input: InputCalcoloStipendio, value: number) => InputCalcoloStipendio;
  min: number;
  max: number;
  step: number;
}

const METRIC_CONFIGS: Record<MetricType, MetricConfig> = {
  benefitNonTassati: {
    label: 'Altri benefit non tassati (€)',
    labelShort: 'Welfare (€)',
    getValueFromInput: (input) => {
      const bn = input.benefitNonTassati;
      if (!bn) return 0;
      return (
        (bn.previdenzaComplementare ?? 0) +
        (bn.assistenzaSanitaria ?? 0) +
        (bn.buoniPasto ?? 0) +
        (bn.abbonamentoTrasporto ?? 0) +
        (bn.serviziWelfare ?? 0) +
        (bn.altri ?? 0)
      );
    },
    setValueOnInput: (input, value) => ({
      ...input,
      benefitNonTassati: value > 0 ? { serviziWelfare: value } : undefined,
    }),
    min: 0,
    max: 5000,
    step: 200,
  },
};

// RAL range configuration
const RAL_CONFIG = {
  min: 20000,
  max: 80000,
  step: 2000,
};

// Lazy-loaded Plotly module
let PlotlyModule: typeof import('plotly.js-dist-min').default | null = null;

async function loadPlotly() {
  if (!PlotlyModule) {
    const module = await import('plotly.js-dist-min');
    PlotlyModule = module.default;
  }
  return PlotlyModule;
}

@Component({
  selector: 'app-graph-projection',
  imports: [],
  templateUrl: './graph-projection.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GraphProjection implements AfterViewInit, OnDestroy {
  private readonly destroyRef = inject(DestroyRef);
  readonly displayMode = inject(DisplayMode);

  /** Current calculation result */
  readonly result = input<OutputCalcoloStipendio | null>(null);

  /** Base input to use for projections (without varying parameters) */
  readonly baseInput = input<InputCalcoloStipendio | null>(null);

  /** View mode: monthly or annual */
  readonly viewMode = signal<ViewMode>('monthly');

  /** Active metric type (for future extensibility) */
  readonly activeMetric = signal<MetricType>('benefitNonTassati');

  /** Loading state for Plotly */
  readonly isLoading = signal(true);

  /** Reference to the chart container */
  readonly chartContainer = viewChild<ElementRef<HTMLDivElement>>('chartContainer');

  private resizeObserver: ResizeObserver | null = null;
  private plotInitialized = false;

  constructor() {
    // Reactively update plot when data changes
    effect(() => {
      const data = this.heatmapData();
      // Also track these to trigger re-render
      this.currentPosition();
      this.viewMode();
      this.displayMode.mode();

      if (this.plotInitialized && data) {
        const container = this.chartContainer()?.nativeElement;
        if (container) {
          this.renderPlot(container, data);
        }
      }
    });
  }

  /** Current metric configuration */
  readonly metricConfig = computed(() => METRIC_CONFIGS[this.activeMetric()]);

  /** Computed heatmap data */
  readonly heatmapData = computed(() => {
    const base = this.baseInput();
    if (!base) return null;

    const metric = this.metricConfig();
    const isMonthly = this.viewMode() === 'monthly';
    const isPercepito = this.displayMode.isPercepito();

    // Generate RAL values for Y-axis
    const ralValues: number[] = [];
    for (let ral = RAL_CONFIG.min; ral <= RAL_CONFIG.max; ral += RAL_CONFIG.step) {
      ralValues.push(ral);
    }

    // Generate metric values for X-axis
    const metricValues: number[] = [];
    for (let v = metric.min; v <= metric.max; v += metric.step) {
      metricValues.push(v);
    }

    // Calculate Z values (net income) for each combination
    const zValues: number[][] = [];
    for (const ral of ralValues) {
      const row: number[] = [];
      for (const metricValue of metricValues) {
        try {
          const input = metric.setValueOnInput({ ...base, ral }, metricValue);
          const result = calcolaStipendioNetto(input);
          let netIncome: number;
          if (isMonthly) {
            netIncome = isPercepito ? result.nettoMensilePercepito : result.nettoMensile;
          } else {
            netIncome = isPercepito ? result.totalePercepito : result.nettoAnnuo;
          }
          row.push(Math.round(netIncome));
        } catch {
          row.push(0);
        }
      }
      zValues.push(row);
    }

    return {
      x: metricValues,
      y: ralValues,
      z: zValues,
    };
  });

  /** Current position on the plot (based on form values) */
  readonly currentPosition = computed(() => {
    const res = this.result();
    const base = this.baseInput();
    if (!res || !base) return null;

    const metric = this.metricConfig();
    const metricValue = metric.getValueFromInput(base);
    const isMonthly = this.viewMode() === 'monthly';
    const isPercepito = this.displayMode.isPercepito();

    let zValue: number;
    if (isMonthly) {
      zValue = isPercepito ? res.nettoMensilePercepito : res.nettoMensile;
    } else {
      zValue = isPercepito ? res.totalePercepito : res.nettoAnnuo;
    }

    return {
      x: metricValue,
      y: res.ral,
      z: zValue,
    };
  });

  async ngAfterViewInit(): Promise<void> {
    await this.initPlot();

    // Set up resize observer
    const container = this.chartContainer()?.nativeElement;
    if (container && PlotlyModule) {
      this.resizeObserver = new ResizeObserver(() => {
        if (this.plotInitialized && PlotlyModule) {
          PlotlyModule.Plots.resize(container);
        }
      });
      this.resizeObserver.observe(container);
    }

    this.destroyRef.onDestroy(() => {
      this.resizeObserver?.disconnect();
      const el = this.chartContainer()?.nativeElement;
      if (el && PlotlyModule) {
        PlotlyModule.purge(el);
      }
    });
  }

  ngOnDestroy(): void {
    // Cleanup handled by destroyRef
  }

  setViewMode(mode: ViewMode): void {
    this.viewMode.set(mode);
    // Effect will handle the plot update
  }

  private getValueLabel(isMonthly: boolean, isPercepito: boolean): string {
    if (isMonthly) {
      return isPercepito ? 'Percepito mensile' : 'Netto mensile';
    }
    return isPercepito ? 'Totale percepito' : 'Netto annuo';
  }

  private async initPlot(): Promise<void> {
    const container = this.chartContainer()?.nativeElement;
    const data = this.heatmapData();
    if (!container || !data) {
      this.isLoading.set(false);
      return;
    }

    await loadPlotly();
    this.renderPlot(container, data);
    this.plotInitialized = true;
    this.isLoading.set(false);
  }

  private renderPlot(
    container: HTMLDivElement,
    data: { x: number[]; y: number[]; z: number[][] },
  ): void {
    if (!PlotlyModule) return;

    const isMonthly = this.viewMode() === 'monthly';
    const isPercepito = this.displayMode.isPercepito();
    const metric = this.metricConfig();
    const position = this.currentPosition();

    // Calculate min and max Z for color scale
    const flatZ = data.z.flat();
    const minZ = Math.min(...flatZ);
    const maxZ = Math.max(...flatZ);

    // Generate contour levels
    const numContours = 12;
    const contourStep = (maxZ - minZ) / numContours;

    // Detect dark mode
    const isDark = document.documentElement.classList.contains('dark');

    // Main contour trace
    const contourTrace: Partial<PlotData> = {
      type: 'contour',
      x: data.x,
      y: data.y,
      z: data.z,
      colorscale: 'Viridis',
      contours: {
        coloring: 'heatmap',
        showlabels: true,
        labelfont: {
          size: 11,
          color: 'white',
        },
        start: minZ,
        end: maxZ,
        size: contourStep,
      },
      line: {
        color: 'rgba(255, 255, 255, 0.4)',
        width: 1,
      },
      colorbar: {
        title: {
          text: this.getValueLabel(isMonthly, isPercepito) + ' (€)',
          side: 'right',
          font: {
            size: 12,
            color: isDark ? '#e7e5e4' : '#292524',
          },
        },
        tickfont: {
          size: 10,
          color: isDark ? '#a8a29e' : '#57534e',
        },
        thickness: 15,
        len: 0.9,
        outlinewidth: 0,
        bgcolor: 'transparent',
      },
      hovertemplate:
        `<b>${metric.labelShort}</b>: %{x:,.0f} €<br>` +
        `<b>RAL</b>: %{y:,.0f} €<br>` +
        `<b>${this.getValueLabel(isMonthly, isPercepito)}</b>: %{z:,.0f} €` +
        '<extra></extra>',
    } as Partial<PlotData>;

    const traces: Partial<PlotData>[] = [contourTrace];

    // Add current position marker if available
    if (position && position.y >= RAL_CONFIG.min && position.y <= RAL_CONFIG.max) {
      const markerTrace: Partial<PlotData> = {
        type: 'scatter',
        x: [position.x],
        y: [position.y],
        mode: 'markers+text',
        marker: {
          size: 14,
          color: '#ef4444',
          symbol: 'circle',
          line: {
            color: 'white',
            width: 2,
          },
        },
        text: [`${Math.round(position.z).toLocaleString('it-IT')} €`],
        textposition: 'top center',
        textfont: {
          size: 12,
          color: isDark ? '#fafaf9' : '#1c1917',
          family: 'system-ui, sans-serif',
        },
        hovertemplate:
          `<b>Posizione attuale</b><br>` +
          `${metric.labelShort}: %{x:,.0f} €<br>` +
          `RAL: %{y:,.0f} €<br>` +
          `${this.getValueLabel(isMonthly, isPercepito)}: ${Math.round(position.z).toLocaleString('it-IT')} €` +
          '<extra></extra>',
        showlegend: false,
      } as Partial<PlotData>;
      traces.push(markerTrace);
    }

    const layout: Partial<Layout> = {
      xaxis: {
        title: {
          text: metric.label,
          font: {
            size: 12,
            color: isDark ? '#a8a29e' : '#57534e',
          },
        },
        tickfont: {
          size: 10,
          color: isDark ? '#a8a29e' : '#57534e',
        },
        tickformat: ',.0f',
        gridcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
        zerolinecolor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
      },
      yaxis: {
        title: {
          text: 'RAL (€)',
          font: {
            size: 12,
            color: isDark ? '#a8a29e' : '#57534e',
          },
        },
        tickfont: {
          size: 10,
          color: isDark ? '#a8a29e' : '#57534e',
        },
        tickformat: ',.0f',
        gridcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
        zerolinecolor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
      },
      paper_bgcolor: 'transparent',
      plot_bgcolor: 'transparent',
      margin: {
        l: 70,
        r: 80,
        t: 20,
        b: 50,
      },
      hoverlabel: {
        bgcolor: isDark ? '#292524' : '#fafaf9',
        bordercolor: isDark ? '#57534e' : '#d6d3d1',
        font: {
          color: isDark ? '#e7e5e4' : '#1c1917',
          size: 12,
        },
      },
    };

    const config: Partial<Config> = {
      responsive: true,
      displayModeBar: false,
      staticPlot: false,
    };

    PlotlyModule.react(container, traces, layout, config);
  }
}
