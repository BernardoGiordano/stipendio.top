import { calcolaStipendioNetto } from '../../calculator/calculator';
import type { InputCalcoloStipendio, OutputCalcoloStipendio } from '../../calculator/types';

/**
 * The same input at another RAL. Pension fund contributions whose reference
 * RAL is the current RAL follow the new RAL, as they would after a raise.
 */
export function inputConRal(input: InputCalcoloStipendio, ral: number): InputCalcoloStipendio {
  const fondo = input.fondoPensioneIntegrativo;
  const segue = (riferimento: number | undefined) =>
    riferimento === input.ral ? ral : riferimento;
  return {
    ...input,
    ral,
    ...(fondo && {
      fondoPensioneIntegrativo: {
        ...fondo,
        ralLavoratore: segue(fondo.ralLavoratore),
        ralDatoreLavoro: segue(fondo.ralDatoreLavoro),
        ralEbitemp: segue(fondo.ralEbitemp),
      },
    }),
  };
}

/** The result at another RAL, or null when the calculator rejects the input */
export function conRal(input: InputCalcoloStipendio, ral: number): OutputCalcoloStipendio | null {
  try {
    return calcolaStipendioNetto(inputConRal(input, ral));
  } catch {
    return null;
  }
}

/** Extra netto annuo from `delta` euro more RAL */
export function aumentoNetto(input: InputCalcoloStipendio, delta = 1000): number | null {
  const ora = conRal(input, input.ral);
  const dopo = conRal(input, input.ral + delta);
  return ora && dopo ? dopo.nettoAnnuo - ora.nettoAnnuo : null;
}

/** The same input with `welfare` euro more servizi welfare, on top of the benefit already set */
export function conWelfare(input: InputCalcoloStipendio, welfare: number): InputCalcoloStipendio {
  if (welfare <= 0) return input;
  const benefit = input.benefitNonTassati ?? {};
  return {
    ...input,
    benefitNonTassati: { ...benefit, serviziWelfare: (benefit.serviziWelfare ?? 0) + welfare },
  };
}

export interface PuntoRal {
  ral: number;
  nettoMensile: number;
  percepitoMensile: number;
}

/**
 * Netto and percepito mensile from 15.000 to 80.000 € of RAL in steps of
 * 5.000, widened to keep the current RAL inside, which is always a point.
 */
export function serieRal(input: InputCalcoloStipendio): PuntoRal[] {
  const min = Math.max(5_000, Math.min(15_000, Math.floor((input.ral * 0.8) / 5_000) * 5_000));
  const max = Math.max(80_000, Math.ceil((input.ral * 1.2) / 5_000) * 5_000);
  const step = 5_000 * Math.max(1, Math.round((max - min) / 5_000 / 13));

  const rals = new Set<number>([input.ral]);
  for (let ral = min; ral <= max; ral += step) rals.add(ral);

  return [...rals]
    .sort((a, b) => a - b)
    .flatMap((ral) => {
      const result = conRal(input, ral);
      return result
        ? [
            {
              ral,
              nettoMensile: result.nettoMensile,
              percepitoMensile: result.nettoMensilePercepito,
            },
          ]
        : [];
    });
}

export interface RigaConfronto {
  ral: number;
  nettoMensile: number;
  nettoAnnuo: number;
  aliquotaEffettiva: number;
  attuale: boolean;
}

const SCARTI_CONFRONTO = [-15_000, -10_000, -5_000, 0, 5_000, 10_000, 15_000, 25_000, 45_000];

/** Nearby RALs with the same options; other RALs never go below 10.000 € */
export function confrontoRal(input: InputCalcoloStipendio): RigaConfronto[] {
  const rals = new Set(
    SCARTI_CONFRONTO.map((scarto) =>
      scarto === 0 ? input.ral : Math.max(10_000, input.ral + scarto),
    ),
  );
  return [...rals]
    .sort((a, b) => a - b)
    .flatMap((ral) => {
      const result = conRal(input, ral);
      return result
        ? [
            {
              ral,
              nettoMensile: result.nettoMensile,
              nettoAnnuo: result.nettoAnnuo,
              aliquotaEffettiva: result.aliquotaEffettiva,
              attuale: ral === input.ral,
            },
          ]
        : [];
    });
}

export interface GrigliaWelfare {
  /** Extra servizi welfare per column, in euro l'anno */
  welfare: number[];
  righe: { ral: number; attuale: boolean; celle: { mensile: number; annuale: number }[] }[];
}

const WELFARE_AGGIUNTIVO = [0, 1_000, 2_000, 3_000, 4_000, 5_000];

/** Percepito for RAL from +10.000 to −10.000 € around the current one, against extra welfare */
export function grigliaWelfare(input: InputCalcoloStipendio): GrigliaWelfare {
  const righe: GrigliaWelfare['righe'] = [];
  for (let scarto = 10_000; scarto >= -10_000; scarto -= 2_500) {
    const ral = input.ral + scarto;
    if (ral <= 0) continue;
    const celle = WELFARE_AGGIUNTIVO.map((welfare) => {
      const result = conRal(conWelfare(input, welfare), ral);
      return {
        mensile: result?.nettoMensilePercepito ?? 0,
        annuale: result?.totalePercepito ?? 0,
      };
    });
    righe.push({ ral, attuale: scarto === 0, celle });
  }
  return { welfare: WELFARE_AGGIUNTIVO, righe };
}
