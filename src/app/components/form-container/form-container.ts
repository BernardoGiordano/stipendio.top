import { ChangeDetectionStrategy, Component, input, WritableSignal } from '@angular/core';
import { createDefaultAscendente, createDefaultFiglio, StipendioFormModel } from './form-group';
import { ADDIZIONALI_REGIONALI, ADDIZIONALI_COMUNALI } from '../../../calculator/addizionali';
import { AnnoFiscale, TipoContratto, TipoAlimentazioneAuto } from '../../../calculator/types';

@Component({
  selector: 'app-form-container',
  imports: [],
  templateUrl: './form-container.html',
  styleUrl: './form-container.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormContainer {
  readonly formModel = input.required<WritableSignal<StipendioFormModel>>();

  readonly regioniDisponibili: { value: string; label: string }[] = [
    { value: 'DEFAULT', label: 'Altro' },
    ...Object.keys(ADDIZIONALI_REGIONALI)
      .filter((r) => r !== 'DEFAULT')
      .map((r) => ({ value: r, label: this.formatLabel(r) })),
  ];

  readonly comuniDisponibili: { value: string; label: string }[] = [
    { value: 'DEFAULT', label: 'Altro' },
    ...Object.keys(ADDIZIONALI_COMUNALI)
      .filter((c) => c !== 'DEFAULT')
      .map((c) => ({ value: c, label: this.formatLabel(c) })),
  ];

  private formatLabel(key: string): string {
    return key
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  readonly tipiContratto: { value: TipoContratto; label: string }[] = [
    { value: 'indeterminato', label: 'Tempo indeterminato' },
    { value: 'determinato', label: 'Tempo determinato' },
    { value: 'apprendistato', label: 'Apprendistato' },
  ];

  readonly anniFiscali: AnnoFiscale[] = [2025, 2026];

  readonly mensilita = [15, 14, 13, 12];

  readonly modalitaRimborso: { value: 'forfettario' | 'misto' | 'analitico'; label: string }[] = [
    { value: 'forfettario', label: 'Forfettario' },
    { value: 'misto', label: 'Misto' },
    { value: 'analitico', label: 'Analitico' },
  ];

  readonly tipiAlimentazione: { value: TipoAlimentazioneAuto; label: string }[] = [
    { value: 'elettrico', label: 'Elettrico' },
    { value: 'ibrido_plugin', label: 'Ibrido plug-in' },
    { value: 'altro', label: 'Altro (benzina, diesel, GPL, metano)' },
  ];

  updateField<K extends keyof StipendioFormModel>(field: K, value: StipendioFormModel[K]): void {
    this.formModel().update((model) => ({ ...model, [field]: value }));
  }

  updateConiuge<K extends keyof StipendioFormModel['coniuge']>(
    field: K,
    value: StipendioFormModel['coniuge'][K],
  ): void {
    this.formModel().update((model) => ({
      ...model,
      coniuge: { ...model.coniuge, [field]: value },
    }));
  }

  updateFringeBenefit<K extends keyof StipendioFormModel['fringeBenefit']>(
    field: K,
    value: StipendioFormModel['fringeBenefit'][K],
  ): void {
    this.formModel().update((model) => ({
      ...model,
      fringeBenefit: { ...model.fringeBenefit, [field]: value },
    }));
  }

  updateAutoAziendale<K extends keyof StipendioFormModel['fringeBenefit']['autoAziendale']>(
    field: K,
    value: StipendioFormModel['fringeBenefit']['autoAziendale'][K],
  ): void {
    this.formModel().update((model) => ({
      ...model,
      fringeBenefit: {
        ...model.fringeBenefit,
        autoAziendale: { ...model.fringeBenefit.autoAziendale, [field]: value },
      },
    }));
  }

  updateRimborsiTrasferta<K extends keyof StipendioFormModel['rimborsiTrasferta']>(
    field: K,
    value: StipendioFormModel['rimborsiTrasferta'][K],
  ): void {
    this.formModel().update((model) => ({
      ...model,
      rimborsiTrasferta: { ...model.rimborsiTrasferta, [field]: value },
    }));
  }

  updateBenefitNonTassati<K extends keyof StipendioFormModel['benefitNonTassati']>(
    field: K,
    value: StipendioFormModel['benefitNonTassati'][K],
  ): void {
    this.formModel().update((model) => ({
      ...model,
      benefitNonTassati: { ...model.benefitNonTassati, [field]: value },
    }));
  }

  updateFiglio(
    index: number,
    field: keyof StipendioFormModel['figli'][number],
    value: unknown,
  ): void {
    this.formModel().update((model) => ({
      ...model,
      figli: model.figli.map((f, i) => (i === index ? { ...f, [field]: value } : f)),
    }));
  }

  addFiglio(): void {
    this.formModel().update((model) => ({
      ...model,
      figli: [...model.figli, createDefaultFiglio()],
    }));
  }

  removeFiglio(index: number): void {
    this.formModel().update((model) => ({
      ...model,
      figli: model.figli.filter((_, i) => i !== index),
    }));
  }

  updateAscendente(
    index: number,
    field: keyof StipendioFormModel['ascendenti'][number],
    value: unknown,
  ): void {
    this.formModel().update((model) => ({
      ...model,
      ascendenti: model.ascendenti.map((a, i) => (i === index ? { ...a, [field]: value } : a)),
    }));
  }

  addAscendente(): void {
    this.formModel().update((model) => ({
      ...model,
      ascendenti: [...model.ascendenti, createDefaultAscendente()],
    }));
  }

  removeAscendente(index: number): void {
    this.formModel().update((model) => ({
      ...model,
      ascendenti: model.ascendenti.filter((_, i) => i !== index),
    }));
  }
}
