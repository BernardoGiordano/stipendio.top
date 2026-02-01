import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  input,
  signal,
  viewChild,
  AfterViewInit,
  OnDestroy,
} from '@angular/core';
import { OutputCalcoloStipendio } from '../../../calculator/types';

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
    const padding = { top: 30, right: 110, bottom: 30, left: 110 };
    const nodeWidth = 18;
    const nodePadding = 10;

    const innerWidth = width - padding.left - padding.right;
    const innerHeight = height - padding.top - padding.bottom;

    // Extract values
    const ral = result.ral;
    const inps = result.contributiInps.totaleContributi;
    const irpefFinale = result.irpefFinale;
    const addizionali = result.addizionali.totaleAddizionali;
    const totalePercepito = result.totalePercepito;
    const cuneoIndennita = result.cuneoFiscale.indennitaEsente;
    const trattamentoIntegrativo = result.trattamentoIntegrativo.importo;
    const rimborsiEsenti = result.rimborsiTrasferta.totaleEsente;
    const benefitEsenti = result.benefitNonTassati.totaleEsente;
    const totalBonus = cuneoIndennita + trattamentoIntegrativo;
    const nettoBase = result.nettoAnnuo - totalBonus;

    // Colors
    const colors: Record<string, string> = {
      ral: '#78716c',
      inps: '#ef4444',
      irpef: '#f97316',
      addizionali: '#eab308',
      nettoBase: '#84cc16',
      cuneo: '#3b82f6',
      trattamento: '#8b5cf6',
      rimborsi: '#14b8a6',
      benefit: '#06b6d4',
      totale: '#22c55e',
    };

    // Column X positions
    const columnGap = (innerWidth - nodeWidth * 3) / 2;
    const col0X = padding.left;
    const col1X = padding.left + nodeWidth + columnGap;
    const col2X = padding.left + (nodeWidth + columnGap) * 2;

    // Collect all values
    const col1Values = [
      { id: 'inps', value: inps, label: 'INPS' },
      { id: 'irpef', value: irpefFinale, label: 'IRPEF' },
      { id: 'addizionali', value: addizionali, label: 'Addizionali' },
      { id: 'nettoBase', value: nettoBase, label: 'Netto Base' },
    ].filter((v) => v.value > 0);

    const bonusSources = [
      { id: 'cuneo', value: cuneoIndennita, label: 'Cuneo Fiscale' },
      { id: 'trattamento', value: trattamentoIntegrativo, label: 'Tratt. Integrativo' },
      { id: 'rimborsi', value: rimborsiEsenti, label: 'Rimborsi Esenti' },
      { id: 'benefit', value: benefitEsenti, label: 'Benefit Esenti' },
    ].filter((v) => v.value > 0);

    // Calculate scale: use RAL + bonuses as the reference (everything flows through this)
    const totalSourceValue = ral + bonusSources.reduce((s, b) => s + b.value, 0);

    // Account for padding between nodes
    const col1NodeCount = col1Values.length;
    const col0NodeCount = 1 + bonusSources.length; // RAL + bonuses
    const maxNodeCount = Math.max(col0NodeCount, col1NodeCount);
    const totalPadding = nodePadding * (maxNodeCount - 1);

    const scale = (innerHeight - totalPadding) / totalSourceValue;

    // Helper to get height
    const getHeight = (value: number) => value * scale;

    const nodes: SankeyNode[] = [];
    const links: SankeyLink[] = [];

    // === Calculate all heights first ===
    const ralHeight = getHeight(ral);
    const col1Heights = col1Values.map((v) => getHeight(v.value));
    const bonusHeights = bonusSources.map((v) => getHeight(v.value));
    const totaleHeight = getHeight(totalePercepito);

    // === Position col1 nodes (align top with RAL) ===
    // Col1 total height with padding
    const col1TotalHeight =
      col1Heights.reduce((s, h) => s + h, 0) + nodePadding * (col1Values.length - 1);

    // Calculate starting Y to center the entire chart
    const bonusTotalHeight =
      bonusHeights.reduce((s, h) => s + h, 0) +
      (bonusSources.length > 0 ? nodePadding * bonusSources.length : 0);
    const totalChartHeight = Math.max(col1TotalHeight, ralHeight) + bonusTotalHeight;
    const startY = padding.top + (innerHeight - totalChartHeight) / 2;

    // Position col1 nodes
    let col1Y = startY;
    const col1Nodes: SankeyNode[] = [];
    for (let i = 0; i < col1Values.length; i++) {
      const v = col1Values[i];
      const h = col1Heights[i];
      col1Nodes.push({
        id: v.id,
        label: v.label,
        value: v.value,
        color: colors[v.id],
        column: 1,
        x: col1X,
        y: col1Y,
        height: h,
      });
      col1Y += h + nodePadding;
    }
    nodes.push(...col1Nodes);

    // === Position RAL (same height, aligned with col1) ===
    const ralNode: SankeyNode = {
      id: 'ral',
      label: 'RAL (Lordo)',
      value: ral,
      color: colors['ral'],
      column: 0,
      x: col0X,
      y: startY,
      height: ralHeight,
    };
    nodes.push(ralNode);

    // === Position bonus sources below RAL ===
    const bonusNodes: SankeyNode[] = [];
    let bonusY = startY + ralHeight + nodePadding;
    for (let i = 0; i < bonusSources.length; i++) {
      const bonus = bonusSources[i];
      const h = bonusHeights[i];
      bonusNodes.push({
        id: bonus.id,
        label: bonus.label,
        value: bonus.value,
        color: colors[bonus.id],
        column: 0,
        x: col0X,
        y: bonusY,
        height: h,
      });
      bonusY += h + nodePadding;
    }
    nodes.push(...bonusNodes);

    // === Position Totale Percepito ===
    // Its height equals the sum of incoming flows: nettoBase + all bonuses
    const nettoBaseNode = col1Nodes.find((n) => n.id === 'nettoBase');
    const totaleY = nettoBaseNode ? nettoBaseNode.y : startY;

    const totaleNode: SankeyNode = {
      id: 'totale',
      label: 'Totale Percepito',
      value: totalePercepito,
      color: colors['totale'],
      column: 2,
      x: col2X,
      y: totaleY,
      height: totaleHeight,
    };
    nodes.push(totaleNode);

    // === Build links ===
    // Track offsets for stacking flows
    const sourceOffsets = new Map<string, number>();
    const targetOffsets = new Map<string, number>();
    nodes.forEach((n) => {
      sourceOffsets.set(n.id, n.y);
      targetOffsets.set(n.id, n.y);
    });

    // RAL → Col1 links (flows split from RAL to each col1 node)
    for (const col1Node of col1Nodes) {
      const flowHeight = col1Node.height; // Same height as target
      const sourceY = sourceOffsets.get('ral')!;

      links.push({
        from: 'ral',
        to: col1Node.id,
        value: col1Node.value,
        sourceY,
        sourceHeight: flowHeight,
        targetY: col1Node.y,
        targetHeight: col1Node.height,
      });

      sourceOffsets.set('ral', sourceY + flowHeight);
    }

    // NettoBase → Totale link
    if (nettoBaseNode) {
      const flowHeight = nettoBaseNode.height;
      const targetY = targetOffsets.get('totale')!;

      links.push({
        from: 'nettoBase',
        to: 'totale',
        value: nettoBase,
        sourceY: nettoBaseNode.y,
        sourceHeight: flowHeight,
        targetY,
        targetHeight: flowHeight,
      });

      targetOffsets.set('totale', targetY + flowHeight);
    }

    // Bonus → Totale links
    for (const bonusNode of bonusNodes) {
      const flowHeight = bonusNode.height;
      const targetY = targetOffsets.get('totale')!;

      links.push({
        from: bonusNode.id,
        to: 'totale',
        value: bonusNode.value,
        sourceY: bonusNode.y,
        sourceHeight: flowHeight,
        targetY,
        targetHeight: flowHeight,
      });

      targetOffsets.set('totale', targetY + flowHeight);
    }

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

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }
}
