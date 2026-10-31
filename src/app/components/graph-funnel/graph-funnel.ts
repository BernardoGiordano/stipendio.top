import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  input,
  OnDestroy,
  signal,
  viewChild,
} from '@angular/core';
import { OutputCalcoloStipendio } from '../../../calculator/types';
import { formatCurrency } from '../../utils/intl';

// Flows under one cent are rounding noise
const MIN_FLOW = 0.01;

interface SankeyNode {
  id: string;
  label: string;
  value: number;
  color: string;
  column: number;
  x: number;
  y: number;
  height: number;
}

interface SankeyLink {
  from: string;
  to: string;
  value: number;
  sourceY: number;
  sourceHeight: number;
  targetY: number;
  targetHeight: number;
}

@Component({
  selector: 'app-graph-funnel',
  imports: [],
  templateUrl: './graph-funnel.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block w-full h-full',
  },
})
export class GraphFunnel implements AfterViewInit, OnDestroy {
  readonly formatCurrency = formatCurrency;
  readonly result = input<OutputCalcoloStipendio | null>(null);

  private readonly svgContainer = viewChild<ElementRef<HTMLDivElement>>('svgContainer');
  private resizeObserver: ResizeObserver | null = null;
  private readonly containerSize = signal({ width: 0, height: 0 });

  readonly chartData = computed(() => {
    const result = this.result();
    if (!result) return null;

    const size = this.containerSize();
    if (size.width === 0 || size.height === 0) return null;

    return this.buildSankeyLayout(result, size.width, size.height);
  });

  ngAfterViewInit(): void {
    const container = this.svgContainer();
    if (container) {
      this.resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          this.containerSize.set({
            width: entry.contentRect.width,
            height: entry.contentRect.height,
          });
        }
      });
      this.resizeObserver.observe(container.nativeElement);
    }
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }

  private buildSankeyLayout(
    result: OutputCalcoloStipendio,
    width: number,
    height: number,
  ): { nodes: SankeyNode[]; links: SankeyLink[]; width: number; height: number } {
    const padding = { top: 30, right: 10, bottom: 30, left: 10 };
    const nodeWidth = 18;
    const nodePadding = 10;

    const innerWidth = width - padding.left - padding.right;
    const innerHeight = height - padding.top - padding.bottom;

    // === Extract values ===
    const ca = result.costoAziendale;
    const ral = result.ral;
    const fringe = result.fringeBenefit;
    const irpefFinale = result.irpefFinale;
    const addizionali = result.addizionali.totaleAddizionali;
    const cuneoIndennita = result.cuneoFiscale.indennitaEsente;
    const trattamentoIntegrativo = result.trattamentoIntegrativo.importo;
    const borsaLordo = result.borsaDiStudio?.importoLordo ?? 0;
    const totalePercepito = result.totalePercepito;

    // Taxed benefits join RAL in the taxable base; exempt ones go straight to Totale
    const benefitTassati =
      fringe.valoreMonetarioImponibile +
      result.rimborsiTrasferta.rimborsiTassati +
      result.benefitNonTassati.totaleTassato;
    const rimborsiEsenti = result.rimborsiTrasferta.totaleEsente;
    const benefitEsenti = fringe.valoreEsente + result.benefitNonTassati.totaleEsente;

    // Taxable auto aziendale is paid in kind, so it never reaches the netto
    const autoAziendale = fringe.valoreAutoImponibile;

    // Costo aziendale components
    const inpsDatore = ca.contributiInpsDatore;
    const tfr = ca.tfr;

    // Fondi datore (raggruppati)
    const fondiDatoreComponents = [
      ca.fondoNegriDatore,
      ca.fondoPastoreDatore,
      ca.cfmtDatore,
      ca.fasdacDatore,
      ca.fondoEstDatore,
      ca.fondoPensioneIntegrativoDatore,
    ];
    const fondiDatore = fondiDatoreComponents.reduce((s, v) => s + v, 0);

    // Trattenute split out of the calculator's totale, so column 2 always balances.
    // Fondi contrattuali and previdenza complementare make up the remainder.
    const inpsDip =
      result.contributiInps.totaleContributi +
      (result.borsaDiStudio?.contributoGestioneSeparataBorsista ?? 0);
    const fondiDip = result.totaleTrattenute - inpsDip - irpefFinale - addizionali;
    const trattenutaAuto = fringe.trattenutaAutoDipendente;

    // Cuneo and trattamento integrativo reach Totale on their own links
    const netto = result.nettoAnnuo - result.totaleBonus;

    // Costo aziendale totale
    const costoAziendale = ca.totaleAnnuo;

    // === Colors ===
    const colors: Record<string, string> = {
      costoAziendale: '#a8a29e',
      ral: '#78716c',
      inpsDatore: '#dc2626',
      tfr: '#d97706',
      fondiDatore: '#7c3aed',
      benefitTassati: '#0891b2',
      autoAziendale: '#64748b',
      rimborsi: '#14b8a6',
      benefit: '#06b6d4',
      inpsDip: '#ef4444',
      irpef: '#f97316',
      addizionali: '#eab308',
      fondiDip: '#a855f7',
      trattenutaAuto: '#fb7185',
      netto: '#84cc16',
      borsa: '#ec4899',
      cuneo: '#3b82f6',
      trattamento: '#8b5cf6',
      totale: '#22c55e',
    };

    // === Column X positions (4 columns) ===
    const columnGap = (innerWidth - nodeWidth * 4) / 3;
    const col0X = padding.left;
    const col1X = padding.left + nodeWidth + columnGap;
    const col2X = padding.left + (nodeWidth + columnGap) * 2;
    const col3X = padding.left + (nodeWidth + columnGap) * 3;

    // === Build column value arrays ===

    // Col1 sums to Costo Aziendale
    const col1Values = [
      { id: 'ral', value: ral, label: 'RAL (Lordo)' },
      { id: 'benefitTassati', value: benefitTassati, label: 'Benefit Tassati' },
      { id: 'inpsDatore', value: inpsDatore, label: 'INPS Datore' },
      { id: 'tfr', value: tfr, label: 'TFR' },
      { id: 'fondiDatore', value: fondiDatore, label: 'Fondi Datore' },
      { id: 'autoAziendale', value: autoAziendale, label: 'Auto Aziendale' },
      { id: 'rimborsi', value: rimborsiEsenti, label: 'Rimborsi Esenti' },
      { id: 'benefit', value: benefitEsenti, label: 'Benefit Esenti' },
    ].filter((v) => v.value >= MIN_FLOW);

    // Col2 sums to the taxable base: RAL + benefit tassati + borsa
    const col2Values = [
      { id: 'inpsDip', value: inpsDip, label: 'INPS Dip.' },
      { id: 'irpef', value: irpefFinale, label: 'IRPEF' },
      { id: 'addizionali', value: addizionali, label: 'Addizionali' },
      { id: 'fondiDip', value: fondiDip, label: 'Fondi Dip.' },
      { id: 'trattenutaAuto', value: trattenutaAuto, label: 'Trattenuta Auto' },
      { id: 'netto', value: netto, label: 'Netto' },
    ].filter((v) => v.value >= MIN_FLOW);

    // Col0 sources: Costo Aziendale + income the employer does not pay
    const col0Sources = [
      { id: 'costoAziendale', value: costoAziendale, label: 'Costo Aziendale' },
      { id: 'borsa', value: borsaLordo, label: 'Borsa di Studio' },
      { id: 'cuneo', value: cuneoIndennita, label: 'Cuneo Fiscale' },
      { id: 'trattamento', value: trattamentoIntegrativo, label: 'Tratt. Integrativo' },
    ].filter((v) => v.value >= MIN_FLOW);

    // === Scale based on the tallest column ===
    const colCounts = [col0Sources.length, col1Values.length, col2Values.length, 1 /* totale */];
    const colSums = [
      col0Sources.reduce((s, v) => s + v.value, 0),
      col1Values.reduce((s, v) => s + v.value, 0),
      col2Values.reduce((s, v) => s + v.value, 0),
      totalePercepito,
    ];

    // Find the column that needs the most vertical space
    let maxRequiredHeight = 0;
    for (let c = 0; c < 4; c++) {
      const totalPad = nodePadding * Math.max(0, colCounts[c] - 1);
      if (colSums[c] > 0) {
        const s = (innerHeight - totalPad) / colSums[c];
        if (maxRequiredHeight === 0 || s < maxRequiredHeight) {
          maxRequiredHeight = s;
        }
      }
    }
    const scale = maxRequiredHeight;

    const getHeight = (value: number) => Math.max(value * scale, 2); // min 2px for visibility

    const nodes: SankeyNode[] = [];
    const links: SankeyLink[] = [];

    // === Helper: position nodes in a column centered vertically ===
    const positionColumn = (
      values: { id: string; value: number; label: string }[],
      colX: number,
      column: number,
    ): SankeyNode[] => {
      const heights = values.map((v) => getHeight(v.value));
      const totalH =
        heights.reduce((s, h) => s + h, 0) + nodePadding * Math.max(0, values.length - 1);
      const startY = padding.top + (innerHeight - totalH) / 2;

      const result: SankeyNode[] = [];
      let y = startY;
      for (let i = 0; i < values.length; i++) {
        const v = values[i];
        const h = heights[i];
        result.push({
          id: v.id,
          label: v.label,
          value: v.value,
          color: colors[v.id],
          column,
          x: colX,
          y,
          height: h,
        });
        y += h + nodePadding;
      }
      return result;
    };

    // === Position all columns ===
    const col0Nodes = positionColumn(col0Sources, col0X, 0);
    const col1Nodes = positionColumn(col1Values, col1X, 1);
    const col2Nodes = positionColumn(col2Values, col2X, 2);
    const col3Nodes = positionColumn(
      [
        {
          id: 'totale',
          value: totalePercepito,
          label: 'Totale Percepito',
        },
      ],
      col3X,
      3,
    );

    nodes.push(...col0Nodes, ...col1Nodes, ...col2Nodes, ...col3Nodes);

    // === Build node map for quick lookup ===
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));

    // === Track source/target Y offsets for stacking flows ===
    const sourceOffsets = new Map<string, number>();
    const targetOffsets = new Map<string, number>();
    nodes.forEach((n) => {
      sourceOffsets.set(n.id, n.y);
      targetOffsets.set(n.id, n.y);
    });

    const addLink = (fromId: string, toId: string, value: number) => {
      if (value < MIN_FLOW) return;
      const fromNode = nodeMap.get(fromId);
      const toNode = nodeMap.get(toId);
      if (!fromNode || !toNode) return;

      const flowHeight = getHeight(value);
      const sourceY = sourceOffsets.get(fromId)!;
      const targetY = targetOffsets.get(toId)!;

      links.push({
        from: fromId,
        to: toId,
        value,
        sourceY,
        sourceHeight: flowHeight,
        targetY,
        targetHeight: flowHeight,
      });

      sourceOffsets.set(fromId, sourceY + flowHeight);
      targetOffsets.set(toId, targetY + flowHeight);
    };

    // === Col0 → Col1: Costo Aziendale decomposes into its components ===
    for (const col1Node of col1Nodes) {
      addLink('costoAziendale', col1Node.id, col1Node.value);
    }

    // === Col1 → Col2: taxable sources fill deductions + netto, in order ===
    const taxableSources = [
      { id: 'ral', remaining: ral },
      { id: 'benefitTassati', remaining: benefitTassati },
      { id: 'borsa', remaining: borsaLordo },
    ];
    for (const col2Node of col2Nodes) {
      let needed = col2Node.value;
      for (const source of taxableSources) {
        const amount = Math.min(needed, source.remaining);
        addLink(source.id, col2Node.id, amount);
        source.remaining -= amount;
        needed -= amount;
      }
    }

    // === Col2 → Col3: Netto flows to Totale Percepito ===
    addLink('netto', 'totale', netto);

    // === Col1 → Col3: Rimborsi/Benefit skip col2, go directly to Totale ===
    addLink('rimborsi', 'totale', rimborsiEsenti);
    addLink('benefit', 'totale', benefitEsenti);

    // === Col0 → Col3: External bonuses go directly to Totale ===
    addLink('cuneo', 'totale', cuneoIndennita);
    addLink('trattamento', 'totale', trattamentoIntegrativo);

    return { nodes, links, width, height };
  }

  getLinkPath(link: SankeyLink): string {
    const data = this.chartData();
    if (!data) return '';

    const nodeWidth = 18;
    const nodeMap = new Map(data.nodes.map((n) => [n.id, n]));

    const sourceNode = nodeMap.get(link.from);
    const targetNode = nodeMap.get(link.to);
    if (!sourceNode || !targetNode) return '';

    const x0 = sourceNode.x + nodeWidth;
    const x1 = targetNode.x;

    const y0Top = link.sourceY;
    const y0Bottom = link.sourceY + link.sourceHeight;
    const y1Top = link.targetY;
    const y1Bottom = link.targetY + link.targetHeight;

    const dx = x1 - x0;
    const cpOffset = dx * 0.5;

    return `
      M ${x0} ${y0Top}
      C ${x0 + cpOffset} ${y0Top}, ${x1 - cpOffset} ${y1Top}, ${x1} ${y1Top}
      L ${x1} ${y1Bottom}
      C ${x1 - cpOffset} ${y1Bottom}, ${x0 + cpOffset} ${y0Bottom}, ${x0} ${y0Bottom}
      Z
    `;
  }

  getLinkColor(link: SankeyLink): string {
    const data = this.chartData();
    if (!data) return 'rgba(120, 113, 108, 0.3)';

    const sourceNode = data.nodes.find((n) => n.id === link.from);
    return sourceNode ? this.hexToRgba(sourceNode.color, 0.45) : 'rgba(120, 113, 108, 0.3)';
  }

  private hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
}
