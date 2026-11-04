import { TestBed } from '@angular/core/testing';
import {
  createDefaultFormModel,
  createDefaultTrasferta,
} from '../components/form-container/form-group';
import { FormStateShare } from './form-state-share';

describe('FormStateShare', () => {
  const merge = (rimborsiTrasferta: Record<string, unknown>) =>
    TestBed.inject(FormStateShare).mergeWithDefaults({ rimborsiTrasferta }).rimborsiTrasferta;

  it('converts the days of an old link to trip rows, without the old fields', () => {
    const rimborsi = merge({
      modalitaRimborso: 'forfettario',
      giorniTrasfertaItalia: 10,
      giorniTrasfertaEstero: 5,
    });

    expect(rimborsi.trasferte).toEqual([
      { ...createDefaultTrasferta(), destinazione: 'italia', giorni: 10 },
      { ...createDefaultTrasferta(), destinazione: 'estero', giorni: 5 },
    ]);
    expect(rimborsi).not.toHaveProperty('giorniTrasfertaItalia');
  });

  it('derives the reduction of an old mixed link from its amounts', () => {
    const giorni = { modalitaRimborso: 'misto', giorniTrasfertaItalia: 10 };

    expect(merge(giorni).trasferte[0].vittoAlloggioACarico).toBe('nessuno');
    expect(merge({ ...giorni, rimborsoVitto: 500 }).trasferte[0].vittoAlloggioACarico).toBe('uno');
    expect(
      merge({ ...giorni, rimborsoVitto: 500, rimborsoAlloggio: 300 }).trasferte[0]
        .vittoAlloggioACarico,
    ).toBe('entrambi');
  });

  it('keeps the trip rows of a new link', () => {
    const trasferte = [
      {
        destinazione: 'estero',
        giorni: 3,
        indennitaGiornaliera: 90,
        vittoAlloggioACarico: 'entrambi',
      },
    ];

    expect(merge({ modalitaRimborso: 'misto', trasferte }).trasferte).toEqual(trasferte);
  });

  it('restores an empty allowance as NaN, so it stays a number field', () => {
    const trasferte = [{ giorni: 3, indennitaGiornaliera: null }];

    expect(merge({ trasferte }).trasferte[0].indennitaGiornaliera).toBeNaN();
  });

  it('round-trips a model through serialization', () => {
    const share = TestBed.inject(FormStateShare);
    const model = createDefaultFormModel();
    model.rimborsiTrasferta.trasferte = [
      { ...createDefaultTrasferta(), giorni: 12, indennitaGiornaliera: 60 },
    ];

    const partial = share.deserializeFormState(share.serializeFormState(model));

    expect(share.mergeWithDefaults(partial!).rimborsiTrasferta.trasferte).toEqual(
      model.rimborsiTrasferta.trasferte,
    );
  });
});
