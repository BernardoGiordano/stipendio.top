import { signal, WritableSignal } from '@angular/core';
import {
  apply,
  applyEach,
  FieldTree,
  form,
  max,
  min,
  minLength,
  required,
  schema,
  validate,
} from '@angular/forms/signals';
import {
  AnnoFiscale,
  AscendenteACarico,
  AutoAziendale,
  BenefitNonTassati,
  ConiugeACarico,
  FiglioACarico,
  FringeBenefit,
  InputCalcoloStipendio,
  RimborsiTrasferta,
  TipoAlimentazioneAuto,
  TipoContratto,
} from '../../../calculator/types';

export interface AutoAziendaleFormModel {
  costoKmAci: number | null;
  tipoAlimentazione: TipoAlimentazioneAuto;
  mesiUtilizzo: number;
  trattenutaDipendente: number | null;
  assegnatoPre2025: boolean;
  emissioniCO2: number | null;
}

export interface FringeBenefitFormModel {
  enabled: boolean;
  buoniAcquisto: number | null;
  buoniCarburante: number | null;
  autoAziendaleEnabled: boolean;
  autoAziendale: AutoAziendaleFormModel;
  rimborsoUtenze: number | null;
  rimborsoAffitto: number | null;
  rimborsoInteressiMutuo: number | null;
  altri: number | null;
}

export interface RimborsiTrasfertaFormModel {
  enabled: boolean;
  modalitaRimborso: 'forfettario' | 'misto' | 'analitico' | null;
  giorniTrasfertaItalia: number | null;
  giorniTrasfertaEstero: number | null;
  rimborsoVitto: number | null;
  rimborsoAlloggio: number | null;
  rimborsoViaggio: number | null;
  rimborsoKm: number | null;
  pagamentiTracciabili: boolean;
}

export interface BenefitNonTassatiFormModel {
  enabled: boolean;
  previdenzaComplementare: number | null;
  assistenzaSanitaria: number | null;
  buoniPasto: number | null;
  buoniPastoElettronici: boolean;
  abbonamentoTrasporto: number | null;
  serviziWelfare: number | null;
  altri: number | null;
}

export interface ConiugeACaricoFormModel {
  enabled: boolean;
  redditoAnnuo: number | null;
  percentualeCarico: number;
}

export interface FiglioACaricoFormModel {
  eta: number | null;
  disabile: boolean;
  percentualeCarico: number;
}

export interface AscendenteACaricoFormModel {
  redditoAnnuo: number | null;
  convivente: boolean;
}

export interface StipendioFormModel {
  // Mandatory fields
  ral: number | null;
  mensilita: number;
  tipoContratto: TipoContratto;
  annoFiscale: AnnoFiscale;
  regione: string;
  comune: string;

  // Optional simple fields
  giorniLavorati: number | null;
  aziendaConCigs: boolean;
  iscrittoPost1996: boolean;
  altriRedditi: number | null;
  altreDetrazioni: number | null;
  haFigliACarico: boolean;
  neoassuntoFuoriSede2025: boolean;

  // Optional nested objects
  coniuge: ConiugeACaricoFormModel;
  fringeBenefit: FringeBenefitFormModel;
  rimborsiTrasferta: RimborsiTrasfertaFormModel;
  benefitNonTassati: BenefitNonTassatiFormModel;

  // Dynamic arrays
  figli: FiglioACaricoFormModel[];
  ascendenti: AscendenteACaricoFormModel[];
}

function createDefaultAutoAziendale(): AutoAziendaleFormModel {
  return {
    costoKmAci: null,
    tipoAlimentazione: 'altro',
    mesiUtilizzo: 12,
    trattenutaDipendente: null,
    assegnatoPre2025: false,
    emissioniCO2: null,
  };
}

function createDefaultFringeBenefit(): FringeBenefitFormModel {
  return {
    enabled: false,
    buoniAcquisto: null,
    buoniCarburante: null,
    autoAziendaleEnabled: false,
    autoAziendale: createDefaultAutoAziendale(),
    rimborsoUtenze: null,
    rimborsoAffitto: null,
    rimborsoInteressiMutuo: null,
    altri: null,
  };
}

function createDefaultRimborsiTrasferta(): RimborsiTrasfertaFormModel {
  return {
    enabled: false,
    modalitaRimborso: null,
    giorniTrasfertaItalia: null,
    giorniTrasfertaEstero: null,
    rimborsoVitto: null,
    rimborsoAlloggio: null,
    rimborsoViaggio: null,
    rimborsoKm: null,
    pagamentiTracciabili: true,
  };
}

function createDefaultBenefitNonTassati(): BenefitNonTassatiFormModel {
  return {
    enabled: false,
    previdenzaComplementare: null,
    assistenzaSanitaria: null,
    buoniPasto: null,
    buoniPastoElettronici: true,
    abbonamentoTrasporto: null,
    serviziWelfare: null,
    altri: null,
  };
}

function createDefaultConiuge(): ConiugeACaricoFormModel {
  return {
    enabled: false,
    redditoAnnuo: null,
    percentualeCarico: 100,
  };
}

export function createDefaultFiglio(): FiglioACaricoFormModel {
  return {
    eta: null,
    disabile: false,
    percentualeCarico: 100,
  };
}

export function createDefaultAscendente(): AscendenteACaricoFormModel {
  return {
    redditoAnnuo: null,
    convivente: true,
  };
}

const currentYear = new Date().getFullYear() as AnnoFiscale;

export function createDefaultFormModel(): StipendioFormModel {
  return {
    ral: null,
    mensilita: 13,
    tipoContratto: 'indeterminato',
    annoFiscale: currentYear,
    regione: '',
    comune: '',
    giorniLavorati: null,
    aziendaConCigs: false,
    iscrittoPost1996: true,
    altriRedditi: null,
    altreDetrazioni: null,
    haFigliACarico: false,
    neoassuntoFuoriSede2025: false,
    coniuge: createDefaultConiuge(),
    fringeBenefit: createDefaultFringeBenefit(),
    rimborsiTrasferta: createDefaultRimborsiTrasferta(),
    benefitNonTassati: createDefaultBenefitNonTassati(),
    figli: [],
    ascendenti: [],
  };
}

// ============================================================================
// Validation Schemas
// ============================================================================

const autoAziendaleSchema = schema<AutoAziendaleFormModel>((path) => {
  validate(path.costoKmAci, ({ value, valueOf }) => {
    const parentEnabled = valueOf(path).costoKmAci !== null;
    if (parentEnabled && (value() === null || value()! <= 0)) {
      return { kind: 'required', message: 'Costo km ACI obbligatorio' };
    }
    return null;
  });

  min(path.mesiUtilizzo, 1, { message: 'Minimo 1 mese' });
  max(path.mesiUtilizzo, 12, { message: 'Massimo 12 mesi' });

  validate(path.trattenutaDipendente, ({ value }) => {
    if (value() !== null && value()! < 0) {
      return { kind: 'min', message: 'Valore non valido' };
    }
    return null;
  });

  validate(path.emissioniCO2, ({ value, valueOf }) => {
    if (valueOf(path).assegnatoPre2025 && (value() === null || value()! <= 0)) {
      return { kind: 'required', message: 'Emissioni CO2 obbligatorie per veicoli pre-2025' };
    }
    return null;
  });
});

const fringeBenefitSchema = schema<FringeBenefitFormModel>((path) => {
  validate(path.buoniAcquisto, ({ value }) => {
    if (value() !== null && value()! < 0) {
      return { kind: 'min', message: 'Valore non valido' };
    }
    return null;
  });

  validate(path.buoniCarburante, ({ value }) => {
    if (value() !== null && value()! < 0) {
      return { kind: 'min', message: 'Valore non valido' };
    }
    return null;
  });

  validate(path.rimborsoUtenze, ({ value }) => {
    if (value() !== null && value()! < 0) {
      return { kind: 'min', message: 'Valore non valido' };
    }
    return null;
  });

  validate(path.rimborsoAffitto, ({ value }) => {
    if (value() !== null && value()! < 0) {
      return { kind: 'min', message: 'Valore non valido' };
    }
    return null;
  });

  validate(path.rimborsoInteressiMutuo, ({ value }) => {
    if (value() !== null && value()! < 0) {
      return { kind: 'min', message: 'Valore non valido' };
    }
    return null;
  });

  validate(path.altri, ({ value }) => {
    if (value() !== null && value()! < 0) {
      return { kind: 'min', message: 'Valore non valido' };
    }
    return null;
  });

  apply(path.autoAziendale, autoAziendaleSchema);
});

const rimborsiTrasfertaSchema = schema<RimborsiTrasfertaFormModel>((path) => {
  validate(path.giorniTrasfertaItalia, ({ value }) => {
    if (value() !== null && (value()! < 0 || value()! > 365)) {
      return { kind: 'range', message: 'Valore tra 0 e 365' };
    }
    return null;
  });

  validate(path.giorniTrasfertaEstero, ({ value }) => {
    if (value() !== null && (value()! < 0 || value()! > 365)) {
      return { kind: 'range', message: 'Valore tra 0 e 365' };
    }
    return null;
  });

  validate(path.rimborsoVitto, ({ value }) => {
    if (value() !== null && value()! < 0) {
      return { kind: 'min', message: 'Valore non valido' };
    }
    return null;
  });

  validate(path.rimborsoAlloggio, ({ value }) => {
    if (value() !== null && value()! < 0) {
      return { kind: 'min', message: 'Valore non valido' };
    }
    return null;
  });

  validate(path.rimborsoViaggio, ({ value }) => {
    if (value() !== null && value()! < 0) {
      return { kind: 'min', message: 'Valore non valido' };
    }
    return null;
  });

  validate(path.rimborsoKm, ({ value }) => {
    if (value() !== null && value()! < 0) {
      return { kind: 'min', message: 'Valore non valido' };
    }
    return null;
  });
});

const benefitNonTassatiSchema = schema<BenefitNonTassatiFormModel>((path) => {
  validate(path.previdenzaComplementare, ({ value }) => {
    if (value() !== null && value()! < 0) {
      return { kind: 'min', message: 'Valore non valido' };
    }
    return null;
  });

  validate(path.assistenzaSanitaria, ({ value }) => {
    if (value() !== null && value()! < 0) {
      return { kind: 'min', message: 'Valore non valido' };
    }
    return null;
  });

  validate(path.buoniPasto, ({ value }) => {
    if (value() !== null && value()! < 0) {
      return { kind: 'min', message: 'Valore non valido' };
    }
    return null;
  });

  validate(path.abbonamentoTrasporto, ({ value }) => {
    if (value() !== null && value()! < 0) {
      return { kind: 'min', message: 'Valore non valido' };
    }
    return null;
  });

  validate(path.serviziWelfare, ({ value }) => {
    if (value() !== null && value()! < 0) {
      return { kind: 'min', message: 'Valore non valido' };
    }
    return null;
  });

  validate(path.altri, ({ value }) => {
    if (value() !== null && value()! < 0) {
      return { kind: 'min', message: 'Valore non valido' };
    }
    return null;
  });
});

const coniugeSchema = schema<ConiugeACaricoFormModel>((path) => {
  validate(path.redditoAnnuo, ({ value, valueOf }) => {
    if (valueOf(path).enabled && (value() === null || value()! < 0)) {
      return { kind: 'required', message: 'Reddito annuo obbligatorio' };
    }
    return null;
  });

  validate(path.percentualeCarico, ({ value }) => {
    if (value() < 0 || value() > 100) {
      return { kind: 'percentage', message: 'La percentuale deve essere tra 0 e 100' };
    }
    return null;
  });
});

const figlioSchema = schema<FiglioACaricoFormModel>((path) => {
  required(path.eta, { message: 'Età obbligatoria' });
  min(path.eta, 0, { message: 'Età non valida' });
  max(path.eta, 30, { message: 'Età massima 30 anni' });

  validate(path.percentualeCarico, ({ value }) => {
    if (value() < 0 || value() > 100) {
      return { kind: 'percentage', message: 'La percentuale deve essere tra 0 e 100' };
    }
    return null;
  });
});

const ascendenteSchema = schema<AscendenteACaricoFormModel>((path) => {
  required(path.redditoAnnuo, { message: 'Reddito annuo obbligatorio' });
  min(path.redditoAnnuo, 0, { message: 'Valore non valido' });
});

export const stipendioFormSchema = schema<StipendioFormModel>((path) => {
  // Mandatory fields
  required(path.ral, { message: 'RAL obbligatoria' });
  min(path.ral, 0, { message: 'RAL non valida' });

  min(path.mensilita, 12, { message: 'Minimo 12 mensilità' });
  max(path.mensilita, 14, { message: 'Massimo 14 mensilità' });

  required(path.regione, { message: 'Regione obbligatoria' });
  minLength(path.regione, 2, { message: 'Codice regione non valido' });

  required(path.comune, { message: 'Comune obbligatorio' });
  minLength(path.comune, 2, { message: 'Codice comune non valido' });

  // Optional fields with range validation
  validate(path.giorniLavorati, ({ value }) => {
    if (value() !== null && (value()! < 1 || value()! > 365)) {
      return { kind: 'range', message: 'Giorni lavorati tra 1 e 365' };
    }
    return null;
  });

  validate(path.altriRedditi, ({ value }) => {
    if (value() !== null && value()! < 0) {
      return { kind: 'min', message: 'Valore non valido' };
    }
    return null;
  });

  validate(path.altreDetrazioni, ({ value }) => {
    if (value() !== null && value()! < 0) {
      return { kind: 'min', message: 'Valore non valido' };
    }
    return null;
  });

  // Nested objects
  apply(path.coniuge, coniugeSchema);
  apply(path.fringeBenefit, fringeBenefitSchema);
  apply(path.rimborsiTrasferta, rimborsiTrasfertaSchema);
  apply(path.benefitNonTassati, benefitNonTassatiSchema);

  // Arrays
  applyEach(path.figli, figlioSchema);
  applyEach(path.ascendenti, ascendenteSchema);
});

// ============================================================================
// Form Creation
// ============================================================================

export type StipendioFieldTree = FieldTree<StipendioFormModel>;

export function createStipendioForm(
  modelSignal: WritableSignal<StipendioFormModel> = signal(createDefaultFormModel()),
): StipendioFieldTree {
  return form(modelSignal, stipendioFormSchema);
}

// ============================================================================
// Conversion to Domain Model
// ============================================================================

function toAutoAziendale(model: AutoAziendaleFormModel): AutoAziendale | undefined {
  if (model.costoKmAci === null) return undefined;

  return {
    costoKmAci: model.costoKmAci,
    tipoAlimentazione: model.tipoAlimentazione,
    ...(model.mesiUtilizzo !== 12 && { mesiUtilizzo: model.mesiUtilizzo }),
    ...(model.trattenutaDipendente !== null && {
      trattenutaDipendente: model.trattenutaDipendente,
    }),
    ...(model.assegnatoPre2025 && { assegnatoPre2025: true }),
    ...(model.emissioniCO2 !== null && { emissioniCO2: model.emissioniCO2 }),
  };
}

function toFringeBenefit(model: FringeBenefitFormModel): FringeBenefit | undefined {
  if (!model.enabled) return undefined;

  const result: FringeBenefit = {};

  if (model.buoniAcquisto !== null) result.buoniAcquisto = model.buoniAcquisto;
  if (model.buoniCarburante !== null) result.buoniCarburante = model.buoniCarburante;
  if (model.autoAziendaleEnabled) {
    const auto = toAutoAziendale(model.autoAziendale);
    if (auto) result.autoAziendale = auto;
  }
  if (model.rimborsoUtenze !== null) result.rimborsoUtenze = model.rimborsoUtenze;
  if (model.rimborsoAffitto !== null) result.rimborsoAffitto = model.rimborsoAffitto;
  if (model.rimborsoInteressiMutuo !== null)
    result.rimborsoInteressiMutuo = model.rimborsoInteressiMutuo;
  if (model.altri !== null) result.altri = model.altri;

  return Object.keys(result).length > 0 ? result : undefined;
}

function toRimborsiTrasferta(model: RimborsiTrasfertaFormModel): RimborsiTrasferta | undefined {
  if (!model.enabled) return undefined;

  const result: RimborsiTrasferta = {};

  if (model.modalitaRimborso !== null) result.modalitaRimborso = model.modalitaRimborso;
  if (model.giorniTrasfertaItalia !== null)
    result.giorniTrasfertaItalia = model.giorniTrasfertaItalia;
  if (model.giorniTrasfertaEstero !== null)
    result.giorniTrasfertaEstero = model.giorniTrasfertaEstero;
  if (model.rimborsoVitto !== null) result.rimborsoVitto = model.rimborsoVitto;
  if (model.rimborsoAlloggio !== null) result.rimborsoAlloggio = model.rimborsoAlloggio;
  if (model.rimborsoViaggio !== null) result.rimborsoViaggio = model.rimborsoViaggio;
  if (model.rimborsoKm !== null) result.rimborsoKm = model.rimborsoKm;
  if (!model.pagamentiTracciabili) result.pagamentiTracciabili = false;

  return Object.keys(result).length > 0 ? result : undefined;
}

function toBenefitNonTassati(model: BenefitNonTassatiFormModel): BenefitNonTassati | undefined {
  if (!model.enabled) return undefined;

  const result: BenefitNonTassati = {};

  if (model.previdenzaComplementare !== null)
    result.previdenzaComplementare = model.previdenzaComplementare;
  if (model.assistenzaSanitaria !== null) result.assistenzaSanitaria = model.assistenzaSanitaria;
  if (model.buoniPasto !== null) {
    result.buoniPasto = model.buoniPasto;
    result.buoniPastoElettronici = model.buoniPastoElettronici;
  }
  if (model.abbonamentoTrasporto !== null) result.abbonamentoTrasporto = model.abbonamentoTrasporto;
  if (model.serviziWelfare !== null) result.serviziWelfare = model.serviziWelfare;
  if (model.altri !== null) result.altri = model.altri;

  return Object.keys(result).length > 0 ? result : undefined;
}

function toConiuge(model: ConiugeACaricoFormModel): ConiugeACarico | undefined {
  if (!model.enabled || model.redditoAnnuo === null) return undefined;

  return {
    redditoAnnuo: model.redditoAnnuo,
    ...(model.percentualeCarico !== 100 && { percentualeCarico: model.percentualeCarico }),
  };
}

function toFigli(models: FiglioACaricoFormModel[]): FiglioACarico[] | undefined {
  const result = models
    .filter((m) => m.eta !== null)
    .map((m) => ({
      eta: m.eta!,
      disabile: m.disabile,
      ...(m.percentualeCarico !== 100 && { percentualeCarico: m.percentualeCarico }),
    }));

  return result.length > 0 ? result : undefined;
}

function toAscendenti(models: AscendenteACaricoFormModel[]): AscendenteACarico[] | undefined {
  const result = models
    .filter((m) => m.redditoAnnuo !== null)
    .map((m) => ({
      redditoAnnuo: m.redditoAnnuo!,
      convivente: m.convivente,
    }));

  return result.length > 0 ? result : undefined;
}

/**
 * Converts the form model to the domain InputCalcoloStipendio type.
 * Returns null if required fields are missing.
 */
export function toInputCalcoloStipendio(model: StipendioFormModel): InputCalcoloStipendio | null {
  if (model.ral === null || !model.regione || !model.comune) {
    return null;
  }

  return {
    ral: model.ral,
    mensilita: model.mensilita,
    tipoContratto: model.tipoContratto,
    annoFiscale: model.annoFiscale,
    regione: model.regione.toUpperCase(),
    comune: model.comune.toUpperCase(),

    // Optional fields
    ...(model.giorniLavorati !== null && { giorniLavorati: model.giorniLavorati }),
    ...(model.aziendaConCigs && { aziendaConCigs: true }),
    ...(!model.iscrittoPost1996 && { iscrittoPost1996: false }),
    ...(model.altriRedditi !== null && { altriRedditi: model.altriRedditi }),
    ...(model.altreDetrazioni !== null && { altreDetrazioni: model.altreDetrazioni }),
    ...(model.haFigliACarico && { haFigliACarico: true }),
    ...(model.neoassuntoFuoriSede2025 && { neoassuntoFuoriSede2025: true }),

    // Nested objects
    ...(() => {
      const coniuge = toConiuge(model.coniuge);
      return coniuge ? { coniuge } : {};
    })(),
    ...(() => {
      const fringeBenefit = toFringeBenefit(model.fringeBenefit);
      return fringeBenefit ? { fringeBenefit } : {};
    })(),
    ...(() => {
      const rimborsiTrasferta = toRimborsiTrasferta(model.rimborsiTrasferta);
      return rimborsiTrasferta ? { rimborsiTrasferta } : {};
    })(),
    ...(() => {
      const benefitNonTassati = toBenefitNonTassati(model.benefitNonTassati);
      return benefitNonTassati ? { benefitNonTassati } : {};
    })(),

    // Arrays
    ...(() => {
      const figli = toFigli(model.figli);
      return figli ? { figli } : {};
    })(),
    ...(() => {
      const ascendenti = toAscendenti(model.ascendenti);
      return ascendenti ? { ascendenti } : {};
    })(),
  };
}
