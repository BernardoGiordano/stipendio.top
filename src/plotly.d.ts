declare module 'plotly.js-dist-min' {
  export interface PlotData {
    type: string;
    x?: (number | string | Date)[];
    y?: (number | string | Date)[];
    z?: number[][];
    mode?: string;
    name?: string;
    text?: string | string[];
    textposition?: string;
    textfont?: Partial<Font>;
    hovertemplate?: string;
    hoverinfo?: string;
    marker?: Partial<Marker>;
    line?: Partial<Line>;
    colorscale?: string | [number, string][];
    colorbar?: Partial<ColorBar>;
    contours?: Partial<Contours>;
    showlegend?: boolean;
    fill?: string;
    fillcolor?: string;
    opacity?: number;
  }

  export interface Font {
    family: string;
    size: number;
    color: string;
  }

  export interface Marker {
    size: number | number[];
    color: string | number[] | string[];
    symbol: string;
    line: Partial<Line>;
    colorscale: string | [number, string][];
    showscale: boolean;
    colorbar: Partial<ColorBar>;
  }

  export interface Line {
    color: string;
    width: number;
    dash: string;
  }

  export interface ColorBar {
    title: string | Partial<{ text: string; side: string; font: Partial<Font> }>;
    titleside: string;
    titlefont: Partial<Font>;
    tickfont: Partial<Font>;
    thickness: number;
    len: number;
    outlinewidth: number;
    bgcolor: string;
  }

  export interface Contours {
    coloring: string;
    showlabels: boolean;
    labelfont: Partial<Font>;
    start: number;
    end: number;
    size: number;
  }

  export interface Layout {
    title:
      | string
      | Partial<{
          text: string;
          font: Partial<Font>;
          xref: string;
          yref: string;
          x: number;
          y: number;
        }>;
    xaxis: Partial<Axis>;
    yaxis: Partial<Axis>;
    paper_bgcolor: string;
    plot_bgcolor: string;
    margin: Partial<Margin>;
    width: number;
    height: number;
    showlegend: boolean;
    legend: Partial<Legend>;
    hoverlabel: Partial<HoverLabel>;
    hovermode: string;
    autosize: boolean;
  }

  export interface Axis {
    title: string | Partial<{ text: string; font: Partial<Font> }>;
    titlefont: Partial<Font>;
    tickfont: Partial<Font>;
    tickformat: string;
    range: [number, number];
    gridcolor: string;
    zerolinecolor: string;
    showgrid: boolean;
    zeroline: boolean;
    showline: boolean;
    autorange: boolean | 'reversed';
  }

  export interface Margin {
    l: number;
    r: number;
    t: number;
    b: number;
    pad: number;
  }

  export interface Legend {
    x: number;
    y: number;
    orientation: string;
    font: Partial<Font>;
    bgcolor: string;
    bordercolor: string;
    borderwidth: number;
  }

  export interface HoverLabel {
    bgcolor: string;
    bordercolor: string;
    font: Partial<Font>;
  }

  export interface Config {
    responsive: boolean;
    displayModeBar: boolean;
    staticPlot: boolean;
    scrollZoom: boolean;
    displaylogo: boolean;
    modeBarButtonsToRemove: string[];
  }

  export interface Plots {
    resize(root: HTMLElement | string): void;
  }

  const Plotly: {
    newPlot(
      root: HTMLElement | string,
      data: Partial<PlotData>[],
      layout?: Partial<Layout>,
      config?: Partial<Config>,
    ): Promise<HTMLElement>;
    react(
      root: HTMLElement | string,
      data: Partial<PlotData>[],
      layout?: Partial<Layout>,
      config?: Partial<Config>,
    ): Promise<HTMLElement>;
    purge(root: HTMLElement | string): void;
    Plots: Plots;
  };

  export default Plotly;
}
