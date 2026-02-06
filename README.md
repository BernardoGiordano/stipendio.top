# Stipendio.🔝

Il [calcolatore dello stipendio netto](https://stipendio.top) per lavoratori dipendenti privati in Italia.

Di calcolatori, o di strumenti che assolvono a questo scopo, ne esistono a decine. Tuttavia, la maggior parte di essi non espone in modo chiaro e trasparente le formule e i metodi di calcolo adottati, rendendo difficile per l'utente comprendere come viene determinato il proprio stipendio netto. Inoltre, la maggior parte di essi non sembra stare al passo con la costante evoluzione della normativa fiscale e previdenziale italiana.

Questo progetto, che rilascio con piacere sotto licenza open source, vuole mettere a disposizione di tutti un calcolatore trasparente, aggiornato e aggiornabile nel tempo.

Nota: questo progetto è stato scritto nel corso di un weekend tramite il parziale aiuto di Claude Code con modello Opus 4.5, per la raccolta e la rielaborazione delle fonti teoriche dalla rete e per una parte dell'implementazione.

## Funzionalità:

- Calcolo dello stipendio netto a partire dalla RAL (Retribuzione Annua Lorda), situazione familiare e da eventuali benefit, fringe benefit e rimborsi spese.
- Dettaglio di tutte le componenti del calcolo, con formule e spiegazioni.
- Calcolo differenziato per gli anni fiscali (Attualmente solo 2026, ma aggiornabile nel tempo, preservando la retrocompatibilità).
- Grafico Sankey per mostrare l'incidenza di ogni componente sul totale percepito.
- Grafico a gradiente per visualizzare la proiezione dello stipendio netto/percepito in funzione della RAL e dei parametri desiderati.
- Possibilità di salvare e condividere le impostazioni inserite nella form di calcolo in maniera completamente anonima (il sito non memorizza nessuna informazione sulla vostra sessione e sui dati inseriti).

## Riferimenti e documentazione

I seguenti appunti raccolgono le principali formule per il calcolo dello stipendio netto di un lavoratore dipendente privato in Italia, includendo contributi, imposte, detrazioni e benefit.

Le note sono state prodotte e rielaborate da Claude Opus 4.5 a partire dalle fonti ufficiali e dal materiale reperibile su Internet.

Eventuali incongruenze, correzioni, imprecisioni o suggerimenti sono ben accetti e possono essere segnalati aprendo una issue su questa repo.

### Indice

- [Formula Generale](#formula-generale)
- [Componenti del Calcolo](#componenti-del-calcolo)
  - [Contributi INPS](#1-contributi-inps)
  - [IRPEF](#2-irpef)
  - [Detrazioni Fiscali](#3-detrazioni-fiscali)
  - [Cuneo Fiscale](#4-cuneo-fiscale)
  - [Trattamento Integrativo](#5-trattamento-integrativo)
  - [Addizionali Regionali e Comunali](#6-addizionali-regionali-e-comunali)
  - [Fringe Benefit](#7-fringe-benefit)
  - [Rimborsi Spese](#8-rimborsi-spese)
  - [Benefit Non Tassati](#9-benefit-non-tassati-welfare)
  - [Dirigenti CCNL Terziario](#10-dirigenti-ccnl-terziario)
  - [Regime Impatriati](#11-regime-impatriati-rientro-cervelli)
- [Sequenza di Calcolo](#sequenza-di-calcolo)
- [Riferimenti Normativi](#riferimenti-normativi)

---

### Formula Generale

```
STIPENDIO NETTO = Imponibile − Contributi INPS − IRPEF Finale − Addizionali − Contributi obbligatori per qualifica + Bonus
```

Dove:

- `IMPONIBILE = RAL + Fringe Benefit Tassabili + Rimborsi Tassati + Benefit Eccedenti`
- `IMPONIBILE IRPEF = IMPONIBILE − Contributi INPS − Contributi obbligatori per qualifica`
- `IRPEF NETTA = IRPEF Lorda − Detrazioni Lavoro − Detrazioni Familiari − Altre Detrazioni`
- `IRPEF FINALE = MAX(0, IRPEF Netta − Detrazione Cuneo Fiscale)`
- `BONUS = Indennità Cuneo Fiscale + Trattamento Integrativo`

Il **Totale percepito** include anche le componenti esenti:

```
TOTALE PERCEPITO = Stipendio Netto + Fringe Benefit Esenti + Rimborsi Esenti + Welfare Esente
```

---

### Componenti del Calcolo

#### 1. Contributi INPS

I contributi previdenziali a carico del lavoratore dipendente.

##### Aliquote

| Tipologia                               | Aliquota |
| --------------------------------------- | -------- |
| Base (aziende ≤15 dipendenti)           | 9,19%    |
| Con CIGS (aziende >15 dipendenti)       | 9,49%    |
| Apprendisti                             | 5,84%    |
| Contributo aggiuntivo (oltre 1ª fascia) | +1,00%   |

##### Soglie e Massimali

| Parametro                                   | Valore 2025 |
| ------------------------------------------- | ----------- |
| Soglia contributo aggiuntivo 1%             | €55.448     |
| Massimale contributivo (iscritti post-1996) | €120.607    |
| Minimale giornaliero                        | €57,32      |

##### Formula

```
Contributi Base = Imponibile Previdenziale × Aliquota

Se Imponibile > Soglia Aggiuntivo:
    Contributo Aggiuntivo = (Imponibile − Soglia) × 1%

Totale Contributi = Contributi Base + Contributo Aggiuntivo
```

---

#### 2. IRPEF

L'Imposta sul Reddito delle Persone Fisiche è calcolata per scaglioni progressivi.

##### Scaglioni 2026

| Scaglione | Reddito           | Aliquota |
| --------- | ----------------- | -------- |
| 1°        | Fino a €28.000    | 23%      |
| 2°        | €28.001 − €50.000 | **33%**  |
| 3°        | Oltre €50.000     | 43%      |

##### Formule di Calcolo Rapido

**2026:**

```
Se RC ≤ €28.000:
    IRPEF = RC × 23%

Se €28.000 < RC ≤ €50.000:
    IRPEF = €6.440 + (RC − €28.000) × 33%

Se RC > €50.000:
    IRPEF = €13.700 + (RC − €50.000) × 43%
```

> **RC** = Reddito Complessivo (Imponibile IRPEF)

---

#### 3. Detrazioni Fiscali

##### 3.1 Detrazioni Lavoro Dipendente (art. 13 TUIR)

| Fascia di Reddito | Formula                                      |
| ----------------- | -------------------------------------------- |
| ≤ €15.000         | €1.955 (min €690 T.I. / €1.380 T.D.)         |
| €15.001 − €28.000 | €1.910 + €1.190 × [(€28.000 − RC) / €13.000] |
| €28.001 − €50.000 | €1.910 × [(€50.000 − RC) / €22.000]          |
| > €50.000         | €0                                           |

**Maggiorazione:** +€65 per redditi tra €25.001 e €35.000

**Rapporto ai giorni:** `Detrazione Effettiva = Detrazione × (Giorni Lavorati / 365)`

##### 3.2 Detrazioni Carichi Familiari

###### Coniuge a Carico

| Fascia di Reddito | Formula                           |
| ----------------- | --------------------------------- |
| ≤ €15.000         | €800 − €110 × (RC / €15.000)      |
| €15.001 − €40.000 | €690 + maggiorazioni              |
| €40.001 − €80.000 | €690 × [(€80.000 − RC) / €40.000] |
| > €80.000         | €0                                |

###### Figli a Carico (dal 2025)

Spetta solo per figli dai 21 ai 29 anni (compiuti) non disabili, oppure figli disabili di qualsiasi età.

```
Detrazione = €950 × [(Coefficiente − RC) / Coefficiente]

Coefficiente Base = €95.000
Coefficiente = €95.000 + €15.000 × (N. figli − 1)
```

###### Ascendenti a Carico (conviventi)

```
Detrazione = €750 × [(€80.000 − RC) / €80.000]
```

###### Limiti di Reddito per Essere a Carico

| Familiare       | Limite Reddito |
| --------------- | -------------- |
| Coniuge / Altri | €2.840,51      |
| Figli ≤ 24 anni | €4.000,00      |
| Figli > 24 anni | €2.840,51      |

---

#### 4. Cuneo Fiscale

Il cuneo fiscale 2025 sostituisce l'esonero contributivo 6-7% con un sistema duale.

##### Per Redditi ≤ €20.000: Indennità Esente

| Fascia di Reddito | Percentuale |
| ----------------- | ----------- |
| ≤ €8.500          | 7,1%        |
| €8.501 − €15.000  | 5,3%        |
| €15.001 − €20.000 | 4,8%        |

```
Indennità = Reddito Lavoro Dipendente × Percentuale
```

> L'indennità è **esente** da IRPEF e contributi.

##### Per Redditi €20.001 − €40.000: Detrazione Fiscale

| Fascia di Reddito | Detrazione                         |
| ----------------- | ---------------------------------- |
| €20.001 − €32.000 | €1.000                             |
| €32.001 − €40.000 | €1.000 × [(€40.000 − RC) / €8.000] |

> La detrazione opera **fino a concorrenza** dell'imposta lorda.

---

#### 5. Trattamento Integrativo

Ex "Bonus Renzi" - Importo massimo: **€1.200/anno** (€100/mese)

##### Condizioni di Spettanza

| Fascia di Reddito | Condizione                              | Importo                |
| ----------------- | --------------------------------------- | ---------------------- |
| ≤ €15.000         | IRPEF Lorda > (Detrazione art.13 − €75) | €1.200                 |
| €15.001 − €28.000 | Detrazioni > IRPEF Lorda                | MIN(€1.200, Eccedenza) |
| > €28.000         | —                                       | Non spetta             |

---

#### 6. Addizionali Regionali e Comunali

##### Addizionale Regionale

Calcolata sull'imponibile IRPEF con aliquote variabili per regione.

| Regione        | Aliquota Min | Aliquota Max |
| -------------- | ------------ | ------------ |
| Lombardia      | 1,23%        | 1,73%        |
| Lazio          | 1,73%        | 3,33%        |
| Campania       | 1,73%        | 3,33%        |
| Piemonte       | 1,62%        | 3,33%        |
| Veneto         | 1,23%        | 2,23%        |
| Emilia-Romagna | 1,33%        | 2,23%        |
| Toscana        | 1,42%        | 2,33%        |

> Trattenuta in 11 rate mensili (gennaio-novembre dell'anno successivo)

##### Addizionale Comunale

- **Range:** 0% − 0,8%
- **Esenzioni:** variabili per comune (es. Roma: esenzione ≤€14.000)
- **Trattenuta:** Acconto 30% (9 rate mar-nov) + Saldo 70% (11 rate gen-nov anno successivo)

---

#### 7. Fringe Benefit

Compensi in natura erogati dal datore di lavoro.

##### Soglie di Esenzione (2025-2027)

| Condizione           | Soglia |
| -------------------- | ------ |
| Senza figli a carico | €1.000 |
| Con figli a carico   | €2.000 |

> ⚠️ **Sistema a soglia secca:** se superata anche di €0,01, **tutto** l'importo diventa imponibile.

##### Tipologie Incluse nella Soglia

- Buoni acquisto / spesa
- Buoni carburante
- Rimborso utenze domestiche (acqua, luce, gas)
- Rimborso affitto prima casa
- Rimborso interessi mutuo prima casa
- Auto aziendale uso promiscuo
- Telefono, PC, alloggio

##### Auto Aziendale Uso Promiscuo

**Formula:**

```
Fringe Benefit = (Costo €/km ACI × 15.000 km × Percentuale) × (Mesi / 12) − Trattenuta
```

**Percentuali dal 2025 (per tipo alimentazione):**

| Alimentazione                        | Percentuale |
| ------------------------------------ | ----------- |
| Elettrico (BEV)                      | 10%         |
| Ibrido Plug-in (PHEV)                | 20%         |
| Altri (benzina, diesel, GPL, metano) | 50%         |

**Percentuali pre-2025 (per emissioni CO₂):**

| Emissioni CO₂  | Percentuale |
| -------------- | ----------- |
| ≤ 60 g/km      | 25%         |
| 61 − 160 g/km  | 30%         |
| 161 − 190 g/km | 50%         |
| > 190 g/km     | 60%         |

---

#### 8. Rimborsi Spese

##### Trasferte Fuori Comune

**Rimborso Forfettario (esente):**

| Destinazione | Importo Giornaliero |
| ------------ | ------------------- |
| Italia       | €46,48              |
| Estero       | €77,47              |

**Riduzioni con rimborso misto:**

- Vitto O alloggio rimborsati: −1/3
- Vitto E alloggio rimborsati: −2/3

**Rimborso Analitico:**
Totalmente esente se documentato e con pagamento tracciabile (dal 2025).

##### Trasferte nel Comune

Dal 2025: rimborso km e trasporto esenti se documentati.

##### Obbligo Tracciabilità (dal 2025)

| Voce               | Tracciabilità Richiesta |
| ------------------ | ----------------------- |
| Vitto              | ✅ Sì                   |
| Alloggio           | ✅ Sì                   |
| Taxi / NCC         | ✅ Sì                   |
| Trasporto pubblico | ❌ No                   |
| Rimborso km        | ❌ No                   |

> ⚠️ Rimborsi non tracciabili diventano **imponibili** per il dipendente.

---

#### 9. Benefit Non Tassati (Welfare)

Voci completamente esenti o con limiti specifici (art. 51 comma 2 TUIR).

| Voce                                        | Limite Annuo  |
| ------------------------------------------- | ------------- |
| Previdenza complementare                    | €5.164,57     |
| Assistenza sanitaria integrativa            | €3.615,20     |
| Buoni pasto cartacei                        | €4,00/giorno  |
| Buoni pasto elettronici (2025)              | €8,00/giorno  |
| Buoni pasto elettronici (dal 2026)          | €10,00/giorno |
| Abbonamento trasporto pubblico              | 100% esente   |
| Servizi welfare (asili, borse studio, ecc.) | 100% esenti   |

---

#### 10. Dirigenti CCNL Terziario

I dirigenti del settore terziario (commercio, distribuzione, servizi) sono soggetti a trattenute obbligatorie per fondi di previdenza e assistenza sanitaria integrativa.

##### Fondo Mario Negri

Fondo di previdenza complementare obbligatorio per i dirigenti del terziario.

**Parametri 2026:**

| Parametro                     | Valore     |
| ----------------------------- | ---------- |
| Retribuzione convenzionale    | €59.224,54 |
| Aliquota contributo dirigente | 2%         |
| Contributo annuo dirigente    | €1.184,49  |
| Contributo mensile            | €98,71     |

**Caratteristiche:**

- Il contributo **riduce l'imponibile IRPEF** (deduzione integrale, senza massimale di deducibilità come per la previdenza complementare generica)
- Il contributo **non riduce l'imponibile previdenziale** (INPS)
- È una **trattenuta reale** che si sottrae dal netto in busta paga
- Il risparmio fiscale dipende dall'aliquota marginale IRPEF del dirigente

> Il contributo aziendale (aliquota integrativa) non impatta il netto del dirigente e non è calcolato.

##### Fondo Antonio Pastore

Fondo assicurativo-previdenziale integrativo obbligatorio per i dirigenti del terziario.

**Parametri 2026:**

| Parametro                  | Valore    |
| -------------------------- | --------- |
| Contributo annuo dirigente | €464,81   |
| Contributo annuo azienda   | €4.856,45 |
| Contributo totale          | €5.321,26 |

**Caratteristiche fiscali:**

- Il contributo **NON riduce l'imponibile IRPEF** (non deducibile)
- Il contributo **non riduce l'imponibile previdenziale** (INPS)
- È una **trattenuta diretta dal netto** in busta paga, senza beneficio fiscale
- A differenza del Fondo Negri, non genera risparmio fiscale

---

#### 11. Regime Impatriati (Rientro Cervelli)

Agevolazione fiscale per i lavoratori che trasferiscono la residenza fiscale in Italia, disciplinata dall'art. 5 del D.Lgs. 209/2023 (in vigore dal 1° gennaio 2024).

##### Percentuali di Esenzione

| Condizione                                         | Reddito Esente | Reddito Tassabile |
| -------------------------------------------------- | -------------- | ----------------- |
| Standard (senza figli minorenni)                   | 50%            | 50%               |
| Con almeno un figlio minorenne residente in Italia | 60%            | 40%               |

##### Parametri

| Parametro                 | Valore                            |
| ------------------------- | --------------------------------- |
| Tetto reddito agevolabile | €600.000/anno                     |
| Durata                    | 5 anni fiscali                    |
| Proroga                   | Non prevista (nuovo regime 2024+) |

##### Effetto sul Calcolo

- **IRPEF:** La base imponibile viene ridotta della percentuale di esenzione (50% o 60%)
- **Addizionali regionali e comunali:** Calcolate sulla base imponibile ridotta
- **Contributi INPS:** Calcolati sull'imponibile previdenziale **pieno** (nessuna riduzione)
- **Detrazioni e bonus:** Calcolati sul reddito complessivo ridotto

##### Formula

```
Reddito Agevolabile = MIN(Reddito Lavoro Dipendente, €600.000)
Importo Esente = Reddito Agevolabile × Percentuale Esenzione
Reddito Tassabile = Reddito Lavoro Dipendente − Importo Esente
Reddito Complessivo = Reddito Tassabile + Altri Redditi
```

##### Requisiti di Accesso

1. Non essere stati residenti fiscali in Italia nei 3 periodi d'imposta precedenti (6 se stesso datore/gruppo, 7 se già lavorato in Italia per lo stesso gruppo)
2. Impegno a mantenere la residenza fiscale in Italia per almeno 4 anni consecutivi
3. Attività lavorativa prevalentemente in territorio italiano (>183 giorni/anno)
4. Possesso di laurea (almeno triennale) o esperienza professionale documentata

> Il vecchio regime (art. 16 D.Lgs. 147/2015), con esenzione 70% (90% per il Sud Italia), si applica solo a chi ha trasferito la residenza entro il 31 dicembre 2023.

---

### Sequenza di Calcolo

```
┌─────────────────────────────────────────────────────────────────┐
│  1. INPUT                                                       │
│     RAL + Fringe Benefit + Rimborsi + Welfare                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. CALCOLO FRINGE BENEFIT                                      │
│     → Verifica soglia esenzione                                 │
│     → Determina parte imponibile e parte esente                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. CALCOLO RIMBORSI TRASFERTA                                  │
│     → Forfettario vs Analitico                                  │
│     → Verifica tracciabilità pagamenti                          │
│     → Determina parte esente e parte tassata                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. CALCOLO BENEFIT WELFARE                                     │
│     → Verifica limiti per categoria                             │
│     → Determina eccedenze tassabili                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  5. IMPONIBILE PREVIDENZIALE                                    │
│     = RAL + Fringe Imponibili + Rimborsi Tassati + Eccedenze    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  6. CONTRIBUTI INPS                                             │
│     = Imponibile × Aliquota + Eventuale 1% Aggiuntivo           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  6b. FONDO MARIO NEGRI (se dirigente CCNL Terziario)            │
│      = €1.184,49/anno (contributo fisso 2026)                   │
│      → Riduce l'imponibile IRPEF                                │
│      → È una trattenuta reale dal netto                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  6c. FONDO ANTONIO PASTORE (se dirigente CCNL Terziario)        │
│      = €464,81/anno (contributo fisso 2026)                     │
│      → NON riduce l'imponibile IRPEF                            │
│      → Trattenuta diretta dal netto                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  6d. REGIME IMPATRIATI (se attivo)                              │
│      → Reddito agevolabile = MIN(Reddito lavoro, €600.000)      │
│      → Importo esente = Agevolabile × 50% (o 60%)               │
│      → Riduce imponibile IRPEF e addizionali, NON INPS          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  7. IMPONIBILE IRPEF                                            │
│     = Imponibile Previdenziale − Contributi INPS                │
│       − Contributi obbligatori per qualifica                    │
│       − Importo esente impatriati (se attivo)                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  8. IRPEF LORDA                                                 │
│     → Calcolo per scaglioni progressivi                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  9. DETRAZIONI                                                  │
│     → Lavoro dipendente (+ maggiorazione)                       │
│     → Carichi familiari (coniuge, figli, ascendenti)            │
│     → Cuneo fiscale (se reddito 20k-40k)                        │
│     → Altre detrazioni                                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  10. IRPEF NETTA                                                │
│      = MAX(0, IRPEF Lorda − Detrazioni Lavoro − Detrazioni      │
│        Familiari − Altre Detrazioni)                            │
│                                                                 │
│  10b. IRPEF FINALE                                              │
│       = MAX(0, IRPEF Netta − Detrazione Cuneo Fiscale)          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  11. ADDIZIONALI                                                │
│      → Regionale (per scaglioni)                                │
│      → Comunale (aliquota unica, con eventuale esenzione)       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  12. BONUS                                                      │
│      → Indennità cuneo fiscale (se reddito ≤ 20k)               │
│      → Trattamento integrativo (se spettante)                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  13. RISULTATO FINALE                                           │
│      Netto = Imponibile − Contributi INPS − IRPEF Finale        │
│     − Addizionali − Contributi obb. per qualifica + Bonus       │
│                                                                 │
│      Totale Percepito = Netto + Esenti                          │
└─────────────────────────────────────────────────────────────────┘
```

### Riferimenti Normativi

| Normativa               | Contenuto                                |
| ----------------------- | ---------------------------------------- |
| **TUIR (DPR 917/1986)** | Testo Unico Imposte sui Redditi          |
| **Art. 51 TUIR**        | Determinazione reddito lavoro dipendente |
| **Art. 13 TUIR**        | Detrazioni lavoro dipendente             |
| **Art. 12 TUIR**        | Detrazioni carichi familiari             |
| **L. 207/2024**         | Legge di Bilancio 2025                   |
| **L. 199/2025**         | Legge di Bilancio 2026                   |
| **D.Lgs. 192/2024**     | Riforma IRPEF-IRES                       |
| **L. 438/1992**         | Contributo aggiuntivo 1%                 |
| **Circ. AE 5/E/2024**   | Chiarimenti fringe benefit               |
| **Circ. AE 10/E/2025**  | Auto aziendali uso promiscuo             |
| **Circ. AE 15/E/2025**  | Rimborsi trasferta e tracciabilità       |
| **D.Lgs. 209/2023**     | Regime impatriati (rientro cervelli)     |

---

### Note Importanti

1. **Fringe Benefit a Soglia Secca:** Il superamento anche minimo della soglia rende tassabile l'**intero** importo, non solo l'eccedenza.

2. **Tracciabilità Rimborsi (2025):** I pagamenti per vitto, alloggio e taxi devono essere tracciabili per mantenere l'esenzione fiscale.

3. **Cuneo Fiscale vs Esonero Contributivo:** Dal 2025 il meccanismo è cambiato: non più riduzione contributi, ma indennità esente (≤€20k) o detrazione fiscale (€20k-€40k).

4. **Figli a Carico:** Le detrazioni per figli <21 anni sono sostituite dall'Assegno Unico INPS. Rimangono solo per figli 21-30 anni o disabili.

5. **Addizionali:** Variano significativamente per residenza. Verificare sempre le aliquote della propria regione e comune.

6. **Trattamento Integrativo:** Richiede verifica della "capienza fiscale". Non spetta automaticamente.

## Licenza

Questo progetto è rilasciato sotto la licenza GPLv3. Vedi il file [LICENSE](LICENSE) per i dettagli.

## Supporta

Se questo progetto ti è stato utile, o vuoi aiutare a mantenere il servizio online per tutti, considera di supportarlo con una donazione su [PayPal](https://www.paypal.com/paypalme/BernardoGiordano). Grazie!
