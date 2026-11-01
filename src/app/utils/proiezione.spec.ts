import type { InputCalcoloStipendio } from '../../calculator/types';
import {
  aumentoNetto,
  confrontoRal,
  conRal,
  conWelfare,
  grigliaWelfare,
  inputConRal,
  serieRal,
} from './proiezione';

/** The reference scenario of the redesign (regione Basilicata, flat 1,23%) */
const riferimento: InputCalcoloStipendio = {
  ral: 35_000,
  mensilita: 13,
  tipoContratto: 'indeterminato',
  annoFiscale: 2026,
  regione: 'BA',
  comune: 'DEFAULT',
  figli: [{ eta: 8, disabile: false, percentualeCarico: 50 }],
  fondoPensioneIntegrativo: {
    contributoLavoratore: 1,
    ralLavoratore: 35_000,
    contributoDatoreLavoro: 1.5,
    ralDatoreLavoro: 35_000,
  },
  benefitNonTassati: { buoniPasto: 1_760, giorniBuoniPasto: 220, buoniPastoElettronici: true },
};

describe('proiezione', () => {
  it('reproduces the reference scenario at its own RAL', () => {
    const r = conRal(riferimento, 35_000)!;
    expect(r.nettoMensilePercepito).toBeCloseTo(2_138.92, 2);
    expect(r.nettoAnnuo).toBeCloseTo(25_899.25, 2);
    expect(r.costoAziendale).toBeCloseTo(49_898.09, 2);
  });

  it('gives the netto of 1.000 € more RAL', () => {
    expect(aumentoNetto(riferimento)).toBeCloseTo(464.07, 2);
  });

  it('moves pension fund reference RALs that match the RAL, and keeps the others', () => {
    const input = inputConRal(
      {
        ...riferimento,
        fondoPensioneIntegrativo: {
          ...riferimento.fondoPensioneIntegrativo!,
          ralDatoreLavoro: 30_000,
        },
      },
      40_000,
    );
    expect(input.ral).toBe(40_000);
    expect(input.fondoPensioneIntegrativo).toMatchObject({
      ralLavoratore: 40_000,
      ralDatoreLavoro: 30_000,
    });
  });
});

describe('projection grids', () => {
  it('draws the RAL series from 15.000 to 80.000 € with the current RAL as a point', () => {
    const serie = serieRal(riferimento);
    expect(serie[0].ral).toBe(15_000);
    expect(serie.at(-1)!.ral).toBe(80_000);
    expect(serie.length).toBe(14);
    const tu = serie.find((p) => p.ral === 35_000)!;
    expect(tu.nettoMensile).toBeCloseTo(1_992.25, 2);
    expect(tu.percepitoMensile).toBeCloseTo(2_138.92, 2);
  });

  it('widens the series around a RAL outside the default range', () => {
    const serie = serieRal({ ...riferimento, ral: 123_456 });
    expect(serie.some((p) => p.ral === 123_456)).toBe(true);
    expect(serie.at(-1)!.ral).toBeGreaterThanOrEqual(123_456);
    expect(serie.length).toBeLessThanOrEqual(16);
  });

  it('compares nearby RALs and marks the current one', () => {
    const righe = confrontoRal(riferimento);
    expect(righe.map((r) => r.ral)).toEqual([
      20_000, 25_000, 30_000, 35_000, 40_000, 45_000, 50_000, 60_000, 80_000,
    ]);
    const tu = righe.filter((r) => r.attuale);
    expect(tu).toHaveLength(1);
    expect(tu[0].nettoAnnuo).toBeCloseTo(25_899.25, 2);
    expect(righe[4].nettoMensile - tu[0].nettoMensile).toBeCloseTo(151.7, 2);
  });

  it('floors the other comparison RALs at 10.000 €', () => {
    const rals = confrontoRal({ ...riferimento, ral: 8_000 }).map((r) => r.ral);
    expect(rals[0]).toBe(8_000);
    expect(rals.filter((ral) => ral < 10_000)).toEqual([8_000]);
  });

  it('crosses RAL and extra welfare, keeping the buoni pasto already set', () => {
    const griglia = grigliaWelfare(riferimento);
    expect(griglia.welfare).toEqual([0, 1_000, 2_000, 3_000, 4_000, 5_000]);
    expect(griglia.righe.map((r) => r.ral)).toEqual([
      45_000, 42_500, 40_000, 37_500, 35_000, 32_500, 30_000, 27_500, 25_000,
    ]);
    const tu = griglia.righe.find((r) => r.attuale)!;
    expect(tu.ral).toBe(35_000);
    expect(tu.celle[0].mensile).toBeCloseTo(2_138.92, 2);
    expect(tu.celle[0].annuale).toBeCloseTo(27_659.25, 2);
    // 1.000 € more welfare reaches the percepito in full
    expect(tu.celle[1].annuale - tu.celle[0].annuale).toBeCloseTo(1_000, 2);
  });

  it('adds welfare to the existing benefit instead of replacing it', () => {
    const input = conWelfare(riferimento, 2_000);
    expect(input.benefitNonTassati).toMatchObject({ buoniPasto: 1_760, serviziWelfare: 2_000 });
    expect(conWelfare(riferimento, 0)).toBe(riferimento);
  });
});
