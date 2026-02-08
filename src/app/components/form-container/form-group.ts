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
  FondoPensioneIntegrativo,
  FringeBenefit,
  InputCalcoloStipendio,
  RimborsiTrasferta,
  TipoAlimentazioneAuto,
  TipoContratto,
} from '../../../calculator/types';

export interface AutoAziendaleFormModel {
  costoKmAci: number;
  tipoAlimentazione: TipoAlimentazioneAuto;
  mesiUtilizzo: number;
  trattenutaDipendente: number;
  assegnatoPre2025: boolean;
  emissioniCO2: number;
}

export interface FringeBenefitFormModel {
  enabled: boolean;
  buoniAcquisto: number;
  buoniCarburante: number;
  autoAziendaleEnabled: boolean;
  autoAziendale: AutoAziendaleFormModel;
  rimborsoUtenze: number;
  rimborsoAffitto: number;
  rimborsoInteressiMutuo: number;
  altri: number;
}

export interface RimborsiTrasfertaFormModel {
  enabled: boolean;
  modalitaRimborso: 'nessuna' | 'forfettario' | 'misto' | 'analitico';
  giorniTrasfertaItalia: number;
  giorniTrasfertaEstero: number;
  rimborsoVitto: number;
  rimborsoAlloggio: number;
  rimborsoViaggio: number;
  rimborsoKm: number;
  pagamentiTracciabili: boolean;
}

export interface BenefitNonTassatiFormModel {
  enabled: boolean;
  previdenzaComplementare: number;
  assistenzaSanitaria: number;
  buoniPasto: number;
  buoniPastoElettronici: boolean;
  abbonamentoTrasporto: number;
  serviziWelfare: number;
  altri: number;
}

export interface FondoPensioneIntegrativoFormModel {
  enabled: boolean;
  contributoLavoratore: number;
  ralLavoratore: number;
  contributoDatoreLavoro: number;
  ralDatoreLavoro: number;
}

export interface ConiugeACaricoFormModel {
  enabled: boolean;
  redditoAnnuo: number;
  percentualeCarico: number;
}

export interface FiglioACaricoFormModel {
  eta: number;
  disabile: boolean;
  percentualeCarico: number;
}

export interface AscendenteACaricoFormModel {
  redditoAnnuo: number;
  convivente: boolean;
}

export interface StipendioFormModel {
  // Mandatory fields
  ral: number;
  mensilita: string;
  tipoContratto: TipoContratto;
  annoFiscale: string;
  regione: string;
  comune: string;

  // Optional simple fields
  giorniLavorati: number;
  aziendaConCigs: boolean;
  iscrittoPost1996: boolean;
  altriRedditi: number;
  altreDetrazioni: number;
  haFigliACarico: boolean;
  fondoMarioNegri: boolean;
  fondoPastore: boolean;
  cfmt: boolean;
  regimeImpatriati: boolean;
  regimeImpatriatiMinorenni: boolean;

  // Optional nested objects
  fondoPensioneIntegrativo: FondoPensioneIntegrativoFormModel;
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
    costoKmAci: 0,
    tipoAlimentazione: 'altro',
    mesiUtilizzo: 12,
    trattenutaDipendente: 0,
    assegnatoPre2025: false,
    emissioniCO2: 0,
  };
}

function createDefaultFringeBenefit(): FringeBenefitFormModel {
  return {
    enabled: false,
    buoniAcquisto: 0,
    buoniCarburante: 0,
    autoAziendaleEnabled: false,
    autoAziendale: createDefaultAutoAziendale(),
    rimborsoUtenze: 0,
    rimborsoAffitto: 0,
    rimborsoInteressiMutuo: 0,
    altri: 0,
  };
}

function createDefaultRimborsiTrasferta(): RimborsiTrasfertaFormModel {
  return {
    enabled: false,
    modalitaRimborso: 'nessuna',
    giorniTrasfertaItalia: 0,
    giorniTrasfertaEstero: 0,
    rimborsoVitto: 0,
    rimborsoAlloggio: 0,
    rimborsoViaggio: 0,
    rimborsoKm: 0,
    pagamentiTracciabili: true,
  };
}

function createDefaultBenefitNonTassati(): BenefitNonTassatiFormModel {
  return {
    enabled: false,
    previdenzaComplementare: 0,
    assistenzaSanitaria: 0,
    buoniPasto: 0,
    buoniPastoElettronici: true,
    abbonamentoTrasporto: 0,
    serviziWelfare: 0,
    altri: 0,
  };
}

function createDefaultFondoPensioneIntegrativo(): FondoPensioneIntegrativoFormModel {
  return {
    enabled: false,
    contributoLavoratore: 0,
    ralLavoratore: 0,
    contributoDatoreLavoro: 0,
    ralDatoreLavoro: 0,
  };
}

function createDefaultConiuge(): ConiugeACaricoFormModel {
  return {
    enabled: false,
    redditoAnnuo: 0,
    percentualeCarico: 100,
  };
}

export function createDefaultFiglio(): FiglioACaricoFormModel {
  return {
    eta: 0,
    disabile: false,
    percentualeCarico: 100,
  };
}

export function createDefaultAscendente(): AscendenteACaricoFormModel {
  return {
    redditoAnnuo: 0,
    convivente: true,
  };
}

const currentYear = new Date().getFullYear() as AnnoFiscale;

export function createDefaultFormModel(): StipendioFormModel {
  return {
    ral: 0,
    mensilita: '13',
    tipoContratto: 'indeterminato',
    annoFiscale: String(currentYear),
    regione: 'AB',
    comune: 'DEFAULT',
    giorniLavorati: 365,
    aziendaConCigs: false,
    iscrittoPost1996: true,
    altriRedditi: 0,
    altreDetrazioni: 0,
    haFigliACarico: false,
    fondoMarioNegri: false,
    fondoPastore: false,
    cfmt: false,
    regimeImpatriati: false,
    regimeImpatriatiMinorenni: false,
    fondoPensioneIntegrativo: createDefaultFondoPensioneIntegrativo(),
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
    const parentEnabled = valueOf(path).costoKmAci > 0;
    if (parentEnabled && value() <= 0) {
      return { kind: 'required', message: 'Costo km ACI obbligatorio' };
    }
    return null;
  });

  min(path.mesiUtilizzo, 1, { message: 'Minimo 1 mese' });
  max(path.mesiUtilizzo, 12, { message: 'Massimo 12 mesi' });

  validate(path.trattenutaDipendente, ({ value }) => {
    if (value() < 0) {
      return { kind: 'min', message: 'Valore non valido' };
    }
    return null;
  });

  validate(path.emissioniCO2, ({ value, valueOf }) => {
    if (valueOf(path).assegnatoPre2025 && value() <= 0) {
      return { kind: 'required', message: 'Emissioni CO2 obbligatorie per veicoli pre-2025' };
    }
    return null;
  });
});

const fringeBenefitSchema = schema<FringeBenefitFormModel>((path) => {
  min(path.buoniAcquisto, 0, { message: 'Valore non valido' });
  min(path.buoniCarburante, 0, { message: 'Valore non valido' });
  min(path.rimborsoUtenze, 0, { message: 'Valore non valido' });
  min(path.rimborsoAffitto, 0, { message: 'Valore non valido' });
  min(path.rimborsoInteressiMutuo, 0, { message: 'Valore non valido' });
  min(path.altri, 0, { message: 'Valore non valido' });

  apply(path.autoAziendale, autoAziendaleSchema);
});

const rimborsiTrasfertaSchema = schema<RimborsiTrasfertaFormModel>((path) => {
  min(path.giorniTrasfertaItalia, 0, { message: 'Valore tra 0 e 365' });
  max(path.giorniTrasfertaItalia, 365, { message: 'Valore tra 0 e 365' });

  min(path.giorniTrasfertaEstero, 0, { message: 'Valore tra 0 e 365' });
  max(path.giorniTrasfertaEstero, 365, { message: 'Valore tra 0 e 365' });

  min(path.rimborsoVitto, 0, { message: 'Valore non valido' });
  min(path.rimborsoAlloggio, 0, { message: 'Valore non valido' });
  min(path.rimborsoViaggio, 0, { message: 'Valore non valido' });
  min(path.rimborsoKm, 0, { message: 'Valore non valido' });
});

const benefitNonTassatiSchema = schema<BenefitNonTassatiFormModel>((path) => {
  min(path.previdenzaComplementare, 0, { message: 'Valore non valido' });
  min(path.assistenzaSanitaria, 0, { message: 'Valore non valido' });
  min(path.buoniPasto, 0, { message: 'Valore non valido' });
  min(path.abbonamentoTrasporto, 0, { message: 'Valore non valido' });
  min(path.serviziWelfare, 0, { message: 'Valore non valido' });
  min(path.altri, 0, { message: 'Valore non valido' });
});

const fondoPensioneIntegrativoSchema = schema<FondoPensioneIntegrativoFormModel>((path) => {
  min(path.contributoLavoratore, 0, { message: 'La percentuale non può essere negativa' });
  max(path.contributoLavoratore, 100, { message: 'La percentuale non può superare 100%' });
  min(path.ralLavoratore, 0, { message: 'La RAL non può essere negativa' });
  min(path.contributoDatoreLavoro, 0, { message: 'La percentuale non può essere negativa' });
  max(path.contributoDatoreLavoro, 100, { message: 'La percentuale non può superare 100%' });
  min(path.ralDatoreLavoro, 0, { message: 'La RAL non può essere negativa' });
});

const coniugeSchema = schema<ConiugeACaricoFormModel>((path) => {
  validate(path.redditoAnnuo, ({ value, valueOf }) => {
    if (valueOf(path).enabled && value() < 0) {
      return { kind: 'min', message: 'Reddito annuo non valido' };
    }
    return null;
  });

  min(path.percentualeCarico, 0, { message: 'La percentuale deve essere tra 0 e 100' });
  max(path.percentualeCarico, 100, { message: 'La percentuale deve essere tra 0 e 100' });
});

const figlioSchema = schema<FiglioACaricoFormModel>((path) => {
  min(path.eta, 0, { message: 'Età non valida' });

  min(path.percentualeCarico, 0, { message: 'La percentuale deve essere tra 0 e 100' });
  max(path.percentualeCarico, 100, { message: 'La percentuale deve essere tra 0 e 100' });
});

const ascendenteSchema = schema<AscendenteACaricoFormModel>((path) => {
  min(path.redditoAnnuo, 0, { message: 'Valore non valido' });
});

export const stipendioFormSchema = schema<StipendioFormModel>((path) => {
  // Mandatory fields
  validate(path.ral, ({ value }) => {
    const v = value();
    if (v == null || Number.isNaN(v) || v <= 0) {
      return { kind: 'required', message: 'RAL obbligatoria' };
    }
    return null;
  });

  validate(path.mensilita, ({ value }) => {
    const v = Number(value());
    if (v < 12) return { kind: 'min', message: 'Minimo 12 mensilità' };
    if (v > 15) return { kind: 'max', message: 'Massimo 15 mensilità' };
    return null;
  });

  required(path.regione, { message: 'Regione obbligatoria' });
  minLength(path.regione, 2, { message: 'Codice regione non valido' });

  // Optional fields with range validation
  validate(path.giorniLavorati, ({ value }) => {
    const v = value();
    if (v !== 0 && (v < 1 || v > 365)) {
      return { kind: 'range', message: 'Giorni lavorati tra 1 e 365' };
    }
    return null;
  });

  min(path.altriRedditi, 0, { message: 'Valore non valido' });
  min(path.altreDetrazioni, 0, { message: 'Valore non valido' });

  // Nested objects
  apply(path.fondoPensioneIntegrativo, fondoPensioneIntegrativoSchema);
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
  if (model.costoKmAci === 0) return undefined;

  return {
    costoKmAci: model.costoKmAci,
    tipoAlimentazione: model.tipoAlimentazione,
    ...(model.mesiUtilizzo !== 12 && { mesiUtilizzo: model.mesiUtilizzo }),
    ...(model.trattenutaDipendente > 0 && {
      trattenutaDipendente: model.trattenutaDipendente,
    }),
    ...(model.assegnatoPre2025 && { assegnatoPre2025: true }),
    ...(model.emissioniCO2 > 0 && { emissioniCO2: model.emissioniCO2 }),
  };
}

function toFringeBenefit(model: FringeBenefitFormModel): FringeBenefit | undefined {
  if (!model.enabled) return undefined;

  const result: FringeBenefit = {};

  if (model.buoniAcquisto > 0) result.buoniAcquisto = model.buoniAcquisto;
  if (model.buoniCarburante > 0) result.buoniCarburante = model.buoniCarburante;
  if (model.autoAziendaleEnabled) {
    const auto = toAutoAziendale(model.autoAziendale);
    if (auto) result.autoAziendale = auto;
  }
  if (model.rimborsoUtenze > 0) result.rimborsoUtenze = model.rimborsoUtenze;
  if (model.rimborsoAffitto > 0) result.rimborsoAffitto = model.rimborsoAffitto;
  if (model.rimborsoInteressiMutuo > 0)
    result.rimborsoInteressiMutuo = model.rimborsoInteressiMutuo;
  if (model.altri > 0) result.altri = model.altri;

  return Object.keys(result).length > 0 ? result : undefined;
}

function toRimborsiTrasferta(model: RimborsiTrasfertaFormModel): RimborsiTrasferta | undefined {
  if (!model.enabled) return undefined;

  const result: RimborsiTrasferta = {};

  if (model.modalitaRimborso !== 'nessuna') result.modalitaRimborso = model.modalitaRimborso;
  if (model.giorniTrasfertaItalia > 0) result.giorniTrasfertaItalia = model.giorniTrasfertaItalia;
  if (model.giorniTrasfertaEstero > 0) result.giorniTrasfertaEstero = model.giorniTrasfertaEstero;
  if (model.rimborsoVitto > 0) result.rimborsoVitto = model.rimborsoVitto;
  if (model.rimborsoAlloggio > 0) result.rimborsoAlloggio = model.rimborsoAlloggio;
  if (model.rimborsoViaggio > 0) result.rimborsoViaggio = model.rimborsoViaggio;
  if (model.rimborsoKm > 0) result.rimborsoKm = model.rimborsoKm;
  if (!model.pagamentiTracciabili) result.pagamentiTracciabili = false;

  return Object.keys(result).length > 0 ? result : undefined;
}

function toBenefitNonTassati(model: BenefitNonTassatiFormModel): BenefitNonTassati | undefined {
  if (!model.enabled) return undefined;

  const result: BenefitNonTassati = {};

  if (model.previdenzaComplementare > 0)
    result.previdenzaComplementare = model.previdenzaComplementare;
  if (model.assistenzaSanitaria > 0) result.assistenzaSanitaria = model.assistenzaSanitaria;
  if (model.buoniPasto > 0) {
    result.buoniPasto = model.buoniPasto;
    result.buoniPastoElettronici = model.buoniPastoElettronici;
  }
  if (model.abbonamentoTrasporto > 0) result.abbonamentoTrasporto = model.abbonamentoTrasporto;
  if (model.serviziWelfare > 0) result.serviziWelfare = model.serviziWelfare;
  if (model.altri > 0) result.altri = model.altri;

  return Object.keys(result).length > 0 ? result : undefined;
}

function toFondoPensioneIntegrativo(
  model: FondoPensioneIntegrativoFormModel,
): FondoPensioneIntegrativo | undefined {
  if (!model.enabled || model.contributoLavoratore <= 0) return undefined;

  return {
    contributoLavoratore: model.contributoLavoratore,
    ralLavoratore: model.ralLavoratore,
    ...(model.contributoDatoreLavoro > 0 && {
      contributoDatoreLavoro: model.contributoDatoreLavoro,
      ralDatoreLavoro: model.ralDatoreLavoro,
    }),
  };
}

function toConiuge(model: ConiugeACaricoFormModel): ConiugeACarico | undefined {
  if (!model.enabled) return undefined;

  return {
    redditoAnnuo: model.redditoAnnuo,
    ...(model.percentualeCarico !== 100 && { percentualeCarico: model.percentualeCarico }),
  };
}

function toFigli(models: FiglioACaricoFormModel[]): FiglioACarico[] | undefined {
  if (models.length === 0) return undefined;

  return models.map((m) => ({
    eta: m.eta,
    disabile: m.disabile,
    ...((m.percentualeCarico ?? 0) !== 100 && { percentualeCarico: m.percentualeCarico ?? 0 }),
  }));
}

function toAscendenti(models: AscendenteACaricoFormModel[]): AscendenteACarico[] | undefined {
  if (models.length === 0) return undefined;

  return models.map((m) => ({
    redditoAnnuo: m.redditoAnnuo,
    convivente: m.convivente,
  }));
}

/**
 * Converts the form model to the domain InputCalcoloStipendio type.
 * Returns null if required fields are missing.
 */
export function toInputCalcoloStipendio(model: StipendioFormModel): InputCalcoloStipendio | null {
  if (!model.ral || Number.isNaN(model.ral) || !model.regione || !model.comune) {
    return null;
  }

  return {
    ral: model.ral,
    mensilita: Number(model.mensilita) as 12 | 13 | 14 | 15,
    tipoContratto: model.tipoContratto,
    annoFiscale: Number(model.annoFiscale) as AnnoFiscale,
    regione: model.regione.toUpperCase(),
    comune: model.comune.toUpperCase(),

    // Optional fields
    ...(model.giorniLavorati > 0 && { giorniLavorati: model.giorniLavorati }),
    ...(model.aziendaConCigs && { aziendaConCigs: true }),
    ...(!model.iscrittoPost1996 && { iscrittoPost1996: false }),
    ...(model.altriRedditi > 0 && { altriRedditi: model.altriRedditi }),
    ...(model.altreDetrazioni > 0 && { altreDetrazioni: model.altreDetrazioni }),
    ...(model.haFigliACarico && { haFigliACarico: true }),
    ...(model.fondoMarioNegri && { fondoMarioNegri: true }),
    ...(model.fondoPastore && { fondoPastore: true }),
    ...(model.cfmt && { cfmt: true }),
    ...(model.regimeImpatriati && { regimeImpatriati: true }),
    ...(model.regimeImpatriati &&
      model.regimeImpatriatiMinorenni && { regimeImpatriatiMinorenni: true }),

    // Nested objects
    ...(() => {
      const fondoPensioneIntegrativo = toFondoPensioneIntegrativo(model.fondoPensioneIntegrativo);
      return fondoPensioneIntegrativo ? { fondoPensioneIntegrativo } : {};
    })(),
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
