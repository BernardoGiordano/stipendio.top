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
import type {
  CategoriaEntrata,
  CategoriaTrattenuta,
  OutputCalcoloStipendio,
  PagatoreVoce,
  VoceEntrata,
} from '../../../calculator/types';
import { formatCurrency } from '../../utils/intl';
import { SERIE } from '../../services/chart-palette';

// Flows under one cent are rounding noise
const MIN_FLOW = 0.01;

interface NodeStyle {
  label: string;
  color: string;
}

interface NodeValue extends NodeStyle {
  id: string;
  value: number;
}

// Column 0: who pays
const PAGATORI: Record<PagatoreVoce, NodeStyle> = {
  datore: { label: 'Costo Aziendale', color: SERIE.datore },
  ente: { label: 'Borsa di Studio', color: SERIE.ente },
  stato: { label: 'Bonus Fiscali', color: SERIE.stato },
};

// Column 1: what the datore pays for
const ENTRATE: Record<CategoriaEntrata, NodeStyle> = {
  retribuzione: { label: 'RAL (Lordo)', color: SERIE.retribuzione },
  contributiDatore: { label: 'INPS Datore', color: SERIE.contributiDatore },
  tfr: { label: 'TFR', color: SERIE.tfr },
  fondi: { label: 'Fondi Datore', color: SERIE.fondiDatore },
  fringeBenefit: { label: 'Fringe Benefit', color: SERIE.fringeBenefit },
  rimborsiTrasferta: { label: 'Rimborsi', color: SERIE.rimborsiTrasferta },
  welfare: { label: 'Welfare', color: SERIE.welfare },
  borsaDiStudio: { label: 'Borsa di Studio', color: SERIE.ente },
  bonus: { label: 'Bonus Fiscali', color: SERIE.stato },
};

// Column 2: where the money paid in busta goes
const TRATTENUTE: Record<CategoriaTrattenuta, NodeStyle> = {
  contributi: { label: 'INPS Dip.', color: SERIE.contributi },
  irpef: { label: 'IRPEF', color: SERIE.irpef },
  addizionali: { label: 'Addizionali', color: SERIE.addizionali },
  fondi: { label: 'Fondi Dip.', color: SERIE.fondi },
  autoAziendale: { label: 'Trattenuta Auto', color: SERIE.autoAziendale },
};

const NETTO: NodeStyle = { label: 'Netto', color: SERIE.netto };
const TOTALE: NodeStyle = { label: 'Totale Percepito', color: SERIE.percepito };

/** Sums voci by node id, keeping first-seen order */
function group<T extends { importo: number }>(
  voci: readonly T[],
  id: (voce: T) => string,
  style: (voce: T) => NodeStyle,
): NodeValue[] {
  const nodes = new Map<string, NodeValue>();
  for (const voce of voci) {
    const key = id(voce);
    const node = nodes.get(key) ?? { id: key, value: 0, ...style(voce) };
    node.value += voce.importo;
    nodes.set(key, node);
  }
  return [...nodes.values()].filter((node) => node.value >= MIN_FLOW);
}

// A datore voce leaves from its categoria in column 1; any other from its payer in column 0
const sourceId = (voce: VoceEntrata) =>
  voce.pagatore === 'datore' ? `entrata:${voce.categoria}` : `pagatore:${voce.pagatore}`;
const sourceStyle = (voce: VoceEntrata) =>
  voce.pagatore === 'datore' ? ENTRATE[voce.categoria] : PAGATORI[voce.pagatore];

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

    const { entrate, trattenute } = result.ripartizione;

    // === Column X positions (4 columns) ===
    const columnGap = (innerWidth - nodeWidth * 4) / 3;
    const col0X = padding.left;
    const col1X = padding.left + nodeWidth + columnGap;
    const col2X = padding.left + (nodeWidth + columnGap) * 2;
    const col3X = padding.left + (nodeWidth + columnGap) * 3;

    // === Build column value arrays ===

    // Col0: payers. Costo Aziendale sums the datore's voci
    const col0Sources = group(
      entrate,
      (voce) => `pagatore:${voce.pagatore}`,
      (voce) => PAGATORI[voce.pagatore],
    );

    // Col1: the datore's voci by categoria
    const col1Values = group(
      entrate.filter((voce) => voce.pagatore === 'datore'),
      (voce) => `entrata:${voce.categoria}`,
      (voce) => ENTRATE[voce.categoria],
    );

    // Col2: voci paid in busta split into trattenute and netto
    const col2Values = [
      ...group(
        trattenute,
        (voce) => `trattenuta:${voce.categoria}`,
        (voce) => TRATTENUTE[voce.categoria],
      ),
      { id: 'netto', value: result.nettoAnnuo, ...NETTO },
    ].filter((v) => v.value >= MIN_FLOW);

    const totalePercepito = result.totalePercepito;

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
    const positionColumn = (values: NodeValue[], colX: number, column: number): SankeyNode[] => {
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
          color: v.color,
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
      [{ id: 'totale', value: totalePercepito, ...TOTALE }],
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

    // === Col0 → Col1: Costo Aziendale decomposes into its categorie ===
    for (const col1Node of col1Nodes) {
      addLink('pagatore:datore', col1Node.id, col1Node.value);
    }

    // === → Col2: voci paid in busta fill trattenute, then netto, in order ===
    const nettoSources = group(
      entrate.filter((voce) => voce.destinazione === 'netto'),
      sourceId,
      sourceStyle,
    ).map((source) => ({ id: source.id, remaining: source.value }));
    for (const col2Node of col2Nodes) {
      let needed = col2Node.value;
      for (const source of nettoSources) {
        const amount = Math.min(needed, source.remaining);
        addLink(source.id, col2Node.id, amount);
        source.remaining -= amount;
        needed -= amount;
      }
    }

    // === → Col3: netto and esenti reach Totale Percepito ===
    addLink('netto', 'totale', result.nettoAnnuo);
    const esenti = group(
      entrate.filter((voce) => voce.destinazione === 'esente'),
      sourceId,
      sourceStyle,
    );
    for (const esente of esenti) {
      addLink(esente.id, 'totale', esente.value);
    }

    // Accantonate and in-natura voci have no outgoing link: they end in their column 1 node
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
    if (!data) return this.hexToRgba(SERIE.retribuzione, 0.3);

    const sourceNode = data.nodes.find((n) => n.id === link.from);
    return this.hexToRgba(sourceNode?.color ?? SERIE.retribuzione, sourceNode ? 0.45 : 0.3);
  }

  private hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
}
