import { TestBed } from '@angular/core/testing';
import { calcolaStipendioNetto } from '../../../calculator/calculator';
import type { InputCalcoloStipendio, OutputCalcoloStipendio } from '../../../calculator/types';
import { GraphFunnel } from './graph-funnel';

const baseInput: InputCalcoloStipendio = {
  ral: 35_000,
  mensilita: 13,
  tipoContratto: 'indeterminato',
  annoFiscale: 2026,
  regione: 'LO',
  comune: 'F205',
};

const sum = (values: number[]) => values.reduce((s, v) => s + v, 0);

function layout(result: OutputCalcoloStipendio) {
  const component = TestBed.createComponent(GraphFunnel).componentInstance;
  return component['buildSankeyLayout'](result, 1000, 800);
}

function nodeValue(data: ReturnType<typeof layout>, id: string) {
  return data.nodes.find((n) => n.id === id)?.value ?? 0;
}

function expectBalanced(result: OutputCalcoloStipendio) {
  const data = layout(result);

  for (const node of data.nodes) {
    const incoming = data.links.filter((l) => l.to === node.id);
    const outgoing = data.links.filter((l) => l.from === node.id);
    if (incoming.length > 0) {
      expect(sum(incoming.map((l) => l.value)), `${node.id} in`).toBeCloseTo(node.value, 2);
    }
    if (outgoing.length > 0) {
      expect(sum(outgoing.map((l) => l.value)), `${node.id} out`).toBeCloseTo(node.value, 2);
    }
  }

  const column1 = sum(data.nodes.filter((n) => n.column === 1).map((n) => n.value));
  expect(column1).toBeCloseTo(nodeValue(data, 'costoAziendale'), 2);
  expect(nodeValue(data, 'costoAziendale')).toBeCloseTo(result.costoAziendale.totaleAnnuo, 2);
  expect(nodeValue(data, 'netto')).toBeCloseTo(result.nettoAnnuo - result.totaleBonus, 2);
  expect(nodeValue(data, 'totale')).toBeCloseTo(result.totalePercepito, 2);
}

describe('GraphFunnel sankey', () => {
  it('balances with RAL only', () => {
    expectBalanced(calcolaStipendioNetto(baseInput));
  });

  it('balances with taxed welfare, exempt fringe and contributo volontario', () => {
    expectBalanced(
      calcolaStipendioNetto({
        ...baseInput,
        fringeBenefit: { buoniAcquisto: 800 },
        benefitNonTassati: { buoniPasto: 2_640, previdenzaComplementare: 1_000 },
      }),
    );
  });

  it('balances with taxed fringe, auto aziendale, rimborsi tassati, fondi and borsa', () => {
    expectBalanced(
      calcolaStipendioNetto({
        ...baseInput,
        ral: 80_000,
        fondoMarioNegri: true,
        fondoPastore: true,
        cfmt: true,
        fasdac: true,
        fondoPensioneIntegrativo: {
          contributoLavoratore: 2,
          ralLavoratore: 80_000,
          contributoDatoreLavoro: 2,
          ralDatoreLavoro: 80_000,
        },
        fringeBenefit: {
          buoniAcquisto: 1_500,
          autoAziendale: {
            costoKmAci: 0.542,
            tipoAlimentazione: 'altro',
            mesiUtilizzo: 12,
            trattenutaDipendente: 500,
            assegnatoPre2025: true,
            emissioniCO2: 127,
          },
        },
        rimborsiTrasferta: {
          modalitaRimborso: 'misto',
          giorniTrasfertaItalia: 10,
          rimborsoVitto: 500,
          pagamentiTracciabili: false,
        },
        borsaDiStudio: { importoAnnuo: 16_243 },
      }),
    );
  });
});
