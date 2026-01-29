import { InputCalcoloStipendio, OutputCalcoloStipendio } from './types';
import { Calculator2025 } from './impl/2025';
import { Calculator2026 } from './impl/2026';

export interface StipendioCalculator {
  calcolaStipendioNetto(input: InputCalcoloStipendio): OutputCalcoloStipendio;
}

const calculators: Record<number, StipendioCalculator> = {
  2025: new Calculator2025(),
  2026: new Calculator2026(),
};

/**
 * Calcola lo stipendio netto completo a partire dal RAL
 *
 * @param input - Oggetto contenente tutti i parametri di input
 * @returns Oggetto con tutti i dettagli del calcolo e gli importi netti
 */
export function calcolaStipendioNetto(input: InputCalcoloStipendio): OutputCalcoloStipendio {
  const calculator = calculators[input.annoFiscale];
  if (!calculator) {
    throw new Error(`Anno fiscale ${input.annoFiscale} non supportato`);
  }
  return calculator.calcolaStipendioNetto(input);
}
