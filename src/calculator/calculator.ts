import { InputCalcoloStipendio, OutputCalcoloStipendio } from './types';
import { Calculator2025 } from './impl/2025';
import { Calculator2026 } from './impl/2026';

export interface StipendioCalculator {
  calcolaStipendioNetto(input: InputCalcoloStipendio): OutputCalcoloStipendio;
}

const DEFAULT_CALCULATOR = 2026;

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
    console.error('Calculator not found. Defaulting to', DEFAULT_CALCULATOR);
    return calculators[DEFAULT_CALCULATOR].calcolaStipendioNetto(input);
  }
  return calculator.calcolaStipendioNetto(input);
}
