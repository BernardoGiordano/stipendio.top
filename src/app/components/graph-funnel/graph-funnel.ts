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
    const padding = { top: 20, right: 120, bottom: 20, left: 120 };
    const nodePadding = 16;
    const nodeWidth = 16;

    const innerHeight = height - padding.top - padding.bottom;

    // Build raw data
    const ral = result.ral;
    const inps = result.contributiInps.totaleContributi;
    const irpefFinale = result.irpefFinale;
    const addizionali = result.addizionali.totaleAddizionali;
    const nettoAnnuo = result.nettoAnnuo;
    const bonus = result.totaleBonus;

    // Calculate flows
    const cuneoIndennita = result.cuneoFiscale.indennitaEsente;
    const trattamentoIntegrativo = result.trattamentoIntegrativo.importo;
    const nettoFromRal = nettoAnnuo - bonus;

    // Colors (semantic)
    const colors = {
      ral: '#78716c', // stone-500
      inps: '#ef4444', // red-500
      irpef: '#f97316', // orange-500
      addizionali: '#f59e0b', // amber-500
      netto: '#22c55e', // green-500
      cuneo: '#3b82f6', // blue-500
      trattamento: '#8b5cf6', // violet-500
    };

    // Define columns
    // Column 0: RAL, Cuneo, Trattamento (sources)
    // Column 1: INPS, IRPEF, Addizionali, Netto (targets)

    // Build nodes
    const nodes: SankeyNode[] = [];
    const links: SankeyLink[] = [];

    // Column 0 nodes (left side - sources)
    const col0Nodes: { id: string; value: number; color: string; label: string }[] = [];
    col0Nodes.push({ id: 'ral', value: ral, color: colors.ral, label: 'RAL (Lordo)' });
    if (cuneoIndennita > 0) {
      col0Nodes.push({
        id: 'cuneo',
        value: cuneoIndennita,
        color: colors.cuneo,
        label: 'Cuneo Fiscale',
      });
    }
    if (trattamentoIntegrativo > 0) {
      col0Nodes.push({
        id: 'trattamento',
        value: trattamentoIntegrativo,
        color: colors.trattamento,
        label: 'Tratt. Integrativo',
      });
    }

    // Column 1 nodes (right side - targets)
    const col1Nodes: { id: string; value: number; color: string; label: string }[] = [];
    if (inps > 0) {
      col1Nodes.push({ id: 'inps', value: inps, color: colors.inps, label: 'INPS' });
    }
    if (irpefFinale > 0) {
      col1Nodes.push({ id: 'irpef', value: irpefFinale, color: colors.irpef, label: 'IRPEF' });
    }
    if (addizionali > 0) {
      col1Nodes.push({
        id: 'addizionali',
        value: addizionali,
        color: colors.addizionali,
        label: 'Addizionali',
      });
    }
    col1Nodes.push({ id: 'netto', value: nettoAnnuo, color: colors.netto, label: 'Netto Annuo' });

    // Calculate total values for scaling
    const col0Total = col0Nodes.reduce((sum, n) => sum + n.value, 0);
    const col1Total = col1Nodes.reduce((sum, n) => sum + n.value, 0);
    const maxTotal = Math.max(col0Total, col1Total);

    // Scale factor to fit nodes in available height
    const availableHeight =
      innerHeight - nodePadding * (Math.max(col0Nodes.length, col1Nodes.length) - 1);
    const scale = availableHeight / maxTotal;

    // Position column 0 nodes
    let y0 = padding.top;
    for (const n of col0Nodes) {
      const nodeHeight = Math.max(n.value * scale, 2);
      nodes.push({
        id: n.id,
        label: n.label,
        value: n.value,
        color: n.color,
        column: 0,
        y: y0,
        height: nodeHeight,
      });
      y0 += nodeHeight + nodePadding;
    }

    // Position column 1 nodes
    let y1 = padding.top;
    for (const n of col1Nodes) {
      const nodeHeight = Math.max(n.value * scale, 2);
      nodes.push({
        id: n.id,
        label: n.label,
        value: n.value,
        color: n.color,
        column: 1,
        y: y1,
        height: nodeHeight,
      });
      y1 += nodeHeight + nodePadding;
    }

    // Build links with proper positioning
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));

    // Track current Y position for each node's outgoing/incoming links
    const sourceOffsets = new Map<string, number>();
    const targetOffsets = new Map<string, number>();
    nodes.forEach((n) => {
      sourceOffsets.set(n.id, n.y);
      targetOffsets.set(n.id, n.y);
    });

    // Define links (from -> to)
    const linkDefs = [
      { from: 'ral', to: 'inps', value: inps },
      { from: 'ral', to: 'irpef', value: irpefFinale },
      { from: 'ral', to: 'addizionali', value: addizionali },
      { from: 'ral', to: 'netto', value: nettoFromRal },
      { from: 'cuneo', to: 'netto', value: cuneoIndennita },
      { from: 'trattamento', to: 'netto', value: trattamentoIntegrativo },
    ].filter((l) => l.value > 0 && nodeMap.has(l.from) && nodeMap.has(l.to));

    for (const def of linkDefs) {
      const sourceNode = nodeMap.get(def.from)!;
      const targetNode = nodeMap.get(def.to)!;

      const linkHeight = Math.max(def.value * scale, 1);
      const sourceY = sourceOffsets.get(def.from)!;
      const targetY = targetOffsets.get(def.to)!;

      links.push({
        from: def.from,
        to: def.to,
        value: def.value,
        sourceY,
        sourceHeight: linkHeight,
        targetY,
        targetHeight: linkHeight,
      });

      sourceOffsets.set(def.from, sourceY + linkHeight);
      targetOffsets.set(def.to, targetY + linkHeight);
    }

    // Adjust node x positions
    const col0X = padding.left;
    const col1X = width - padding.right - nodeWidth;

    nodes.forEach((n) => {
      (n as SankeyNode & { x: number }).x = n.column === 0 ? col0X : col1X;
    });

    return {
      nodes: nodes as (SankeyNode & { x: number })[],
      links,
      width,
      height,
    };
  }

  getNodeX(node: SankeyNode): number {
    const data = this.chartData();
    if (!data) return 0;
    const padding = { left: 120, right: 120 };
    const nodeWidth = 16;
    return node.column === 0 ? padding.left : data.width - padding.right - nodeWidth;
  }

  getLinkPath(link: SankeyLink): string {
    const data = this.chartData();
    if (!data) return '';

    const padding = { left: 120, right: 120 };
    const nodeWidth = 16;

    const x0 = padding.left + nodeWidth;
    const x1 = data.width - padding.right - nodeWidth;

    const y0Top = link.sourceY;
    const y0Bottom = link.sourceY + link.sourceHeight;
    const y1Top = link.targetY;
    const y1Bottom = link.targetY + link.targetHeight;

    const midX = (x0 + x1) / 2;

    // Bezier curve path
    return `
      M ${x0} ${y0Top}
      C ${midX} ${y0Top}, ${midX} ${y1Top}, ${x1} ${y1Top}
      L ${x1} ${y1Bottom}
      C ${midX} ${y1Bottom}, ${midX} ${y0Bottom}, ${x0} ${y0Bottom}
      Z
    `;
  }

  getLinkColor(link: SankeyLink): string {
    const data = this.chartData();
    if (!data) return 'rgba(120, 113, 108, 0.3)';

    const sourceNode = data.nodes.find((n) => n.id === link.from);
    return sourceNode ? this.hexToRgba(sourceNode.color, 0.4) : 'rgba(120, 113, 108, 0.3)';
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

  getTextAnchor(node: SankeyNode): string {
    return node.column === 0 ? 'end' : 'start';
  }

  getLabelX(node: SankeyNode): number {
    const nodeWidth = 16;
    const x = this.getNodeX(node);
    return node.column === 0 ? x - 8 : x + nodeWidth + 8;
  }
}
