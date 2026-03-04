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
  - [Fondo EST (CCNL Commercio)](#10b-fondo-est-ccnl-commercio)
  - [Previdenza Complementare](#11-previdenza-complementare-fondo-pensione-integrativo)
  - [Regime Impatriati](#12-regime-impatriati-rientro-cervelli)
  - [Costo Aziendale](#13-costo-aziendale)
  - [Borse di Studio](#14-borse-di-studio-dottoratopost-laurea)
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

> Il contributo aziendale (ordinario 12,86% + integrativo 2,52% = 15,38% della retribuzione convenzionale) non impatta il netto del dirigente, ma è incluso nel calcolo del [Costo Aziendale](#13-costo-aziendale).

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

##### FASDAC (Fondo Mario Besusso)

Fondo di assistenza sanitaria integrativa obbligatorio per i dirigenti del terziario.

**Parametri 2026:**

| Parametro                     | Valore     |
| ----------------------------- | ---------- |
| Retribuzione convenzionale    | €45.940,00 |
| Aliquota contributo dirigente | 1,87%      |
| Contributo annuo dirigente    | €859,08    |
| Contributo mensile            | €71,59     |

**Caratteristiche fiscali:**

- Il contributo **NON riduce l'imponibile IRPEF** (non deducibile)
- Il contributo **non riduce l'imponibile previdenziale** (INPS)
- È una **trattenuta diretta dal netto** in busta paga, senza beneficio fiscale
- A differenza del Fondo Negri, non genera risparmio fiscale

> La quota azienda (5,29% dirigenti in servizio + 2,78% gestione pensionati = 8,07% della retribuzione convenzionale) non impatta il netto del dirigente, ma è inclusa nel calcolo del [Costo Aziendale](#13-costo-aziendale).

---

#### 10b. Fondo EST (CCNL Commercio)

Il Fondo EST (Ente di assistenza Sanitaria integrativa per i dipendenti delle aziende del Commercio, Turismo, Servizi e Settori affini) è il fondo di assistenza sanitaria integrativa per i **dipendenti non dirigenti** del CCNL Commercio/Terziario.

**Parametri 2026 (dal 1 aprile 2025, Art. 104 CCNL Commercio):**

| Parametro                     | Valore |
| ----------------------------- | ------ |
| Contributo mensile dipendente | €2     |
| Contributo annuo dipendente   | €24    |
| Contributo mensile datore     | €13    |
| Contributo annuo datore       | €156   |

**Caratteristiche fiscali:**

- Il contributo dipendente **NON riduce l'imponibile IRPEF** (non deducibile)
- Il contributo **non riduce l'imponibile previdenziale** (INPS)
- È una **trattenuta diretta dal netto** in busta paga, senza beneficio fiscale
- Il contributo datore è esente per il dipendente (Art. 51, c.2, lett. a) TUIR, entro €3.615,20/anno)

> La quota azienda (€156/anno) non impatta il netto del dipendente, ma è inclusa nel calcolo del [Costo Aziendale](#13-costo-aziendale).

---

#### 11. Previdenza Complementare (Fondo Pensione Integrativo)

La previdenza complementare consente al lavoratore dipendente di versare contributi a un fondo pensione integrativo, ottenendo un beneficio fiscale sotto forma di deduzione dall'imponibile IRPEF.

##### Struttura dei Contributi

| Fonte                 | Descrizione                                                                   |
| --------------------- | ----------------------------------------------------------------------------- |
| Contributo lavoratore | Percentuale della RAL trattenuta dalla busta paga                             |
| Contributo datore     | Percentuale della RAL versata dall'azienda (costo aggiuntivo)                 |
| Contributo EBITEMP    | Percentuale della RAL versata dall'ente bilaterale (lavoratori somministrati) |

Le percentuali dipendono dal CCNL applicato e dalla scelta individuale del lavoratore. Valori tipici: 0,55% - 2% per il lavoratore, 1% - 2% per il datore.

Per i **lavoratori somministrati** iscritti a Fon.Te., l'ente bilaterale EBITEMP (Ente Bilaterale Nazionale per il Lavoro Temporaneo) versa un contributo aggiuntivo al fondo pensione. Il contributo EBITEMP non è una trattenuta dalla busta paga del lavoratore, ma concorre al limite annuo di deducibilità. Valore tipico: 2%.

##### Deducibilità Fiscale (Art. 10, c.1, lett. e-bis, TUIR - aggiornato da L. 199/2025)

| Parametro                    | Valore                                   |
| ---------------------------- | ---------------------------------------- |
| Limite annuo di deducibilità | €5.300 (dal 2026)                        |
| Cosa concorre al limite      | Contributo lavoratore + datore + EBITEMP |
| TFR destinato al fondo       | Escluso dal limite                       |

**Formula:**

```
Contributo Lavoratore = RAL × Percentuale Lavoratore
Contributo Datore = RAL × Percentuale Datore
Contributo EBITEMP = RAL × Percentuale EBITEMP (se lavoratore somministrato)
Totale Contributi = Contributo Lavoratore + Contributo Datore + Contributo EBITEMP
Deduzione Effettiva = MIN(Totale Contributi, €5.300)
Eccedenza Non Deducibile = MAX(0, Totale Contributi − €5.300)
```

##### Effetto sul Calcolo

- **IRPEF:** La deduzione riduce l'imponibile IRPEF (e quindi anche le addizionali regionale e comunale)
- **Contributi INPS:** Calcolati sull'imponibile previdenziale **pieno** (nessuna riduzione)
- **Netto in busta:** Solo il contributo lavoratore è una trattenuta reale dal netto
- **Contributo datore:** Non è una trattenuta dalla busta paga, ma concorre al limite di deducibilità
- **Contributo EBITEMP:** Come il contributo datore, non è una trattenuta dal netto, ma concorre al limite di deducibilità

##### Esempio

Con RAL €40.000, contributo lavoratore 1%, contributo datore 1,5%:

```
Contributo lavoratore: €40.000 × 1% = €400/anno
Contributo datore: €40.000 × 1,5% = €600/anno
Totale: €1.000 (sotto il limite di €5.300)
Deduzione effettiva: €1.000
Risparmio IRPEF (aliquota marginale 33%): €330/anno
Costo netto per il lavoratore: €400 − €330 = €70/anno
```

> **Nota:** L'eventuale eccedenza non deducibile non genera risparmio fiscale nell'anno di versamento, ma sarà esente da tassazione al momento dell'erogazione della prestazione pensionistica.

##### Interazione con fondi in squilibrio finanziario (Fondo Mario Negri)

Il Fondo Mario Negri è un fondo preesistente ammesso al regime transitorio di deroga (art. 20, c.7, D.Lgs. 252/2005), che riconosce la **completa deducibilità** dei contributi senza alcun limite annuo. Tuttavia, i contributi versati al Fondo Negri **riducono il plafond di €5.300** disponibile per la deducibilità di eventuali contributi a fondi pensione integrativi ordinari.

```
Plafond residuo = MAX(0, €5.300 − Contributo dirigente Fondo Negri)
Esempio: €5.300 − €1.184,49 = €4.115,51 disponibili per altri fondi
```

> **Nota:** nel calcolo, il plafond è ridotto dalla quota del contributo Fondo Negri a carico del dirigente, essendo l'unica componente modellata. La quota aziendale, non inclusa nel calcolo, in realtà concorre anch'essa alla riduzione del plafond.

> **Riferimento normativo:** D.Lgs. 252/2005 (Disciplina delle forme pensionistiche complementari), Art. 10, c.1, lett. e-bis, TUIR (DPR 917/1986), L. 199/2025 (Legge di Bilancio 2026, art. 1, c. 201).

---

#### 12. Regime Impatriati (Rientro Cervelli)

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

#### 13. Costo Aziendale

Il costo aziendale rappresenta la spesa complessiva che l'azienda sostiene per un dipendente, ed è sempre significativamente superiore alla RAL. Viene calcolato automaticamente a partire dai dati già inseriti, senza necessità di input aggiuntivi.

##### Formula

```
COSTO AZIENDALE = RAL + Contributi INPS Datore + TFR
                + Fondi Dirigenti (datore) + Fondo EST (datore)
                + Fondo Pensione (datore)
                + Fringe Benefit + Rimborsi Trasferta + Benefit Non Tassati (Welfare)
```

##### Contributi INPS a Carico del Datore di Lavoro

I contributi INPS a carico del datore sono calcolati sull'imponibile previdenziale (lo stesso utilizzato per la quota lavoratore) e includono IVS, NASpI, malattia, maternità, CUAF, CIG e Fondo Garanzia TFR.

| Tipologia                     | Aliquota Datore |
| ----------------------------- | --------------- |
| Operai/impiegati (senza CIGS) | 28,98%          |
| Operai/impiegati (con CIGS)   | 29,68%          |
| Apprendisti                   | 11,61%          |
| Dirigenti (senza CIGS)        | 26,54%          |
| Dirigenti (con CIGS)          | 27,24%          |

> Le aliquote si riferiscono al settore Commercio/Terziario 2026 (fonte: tabelle INPS/Kitech). La qualifica di dirigente viene rilevata automaticamente dall'attivazione dei fondi contrattuali (Fondo Negri, Pastore, CFMT, FASDAC).

##### TFR (Trattamento di Fine Rapporto)

```
TFR Annuo = RAL / 13,5
```

Il TFR è un accantonamento obbligatorio a carico del datore (Art. 2120 c.c.), indipendentemente da dove viene destinato (azienda, INPS o fondo pensione).

##### Fondi Contrattuali Dirigenti (Quota Datore - CCNL Terziario 2026)

Per i dirigenti del CCNL Terziario, il datore sostiene costi aggiuntivi per i fondi obbligatori:

| Fondo                 | Base di Calcolo    | Aliquota/Importo | Costo Annuo Datore |
| --------------------- | ------------------ | ---------------- | ------------------ |
| Fondo Mario Negri     | €59.224,54 (conv.) | 15,38%           | ~€9.112            |
| Fondo Antonio Pastore | Importo fisso      | —                | €4.856,45          |
| CFMT                  | Importo fisso      | —                | €276               |
| FASDAC                | €45.940 (conv.)    | 8,07%            | ~€3.707            |

Dettaglio aliquote:

- **Fondo Mario Negri**: contributo ordinario azienda 12,86% + integrativo 2,52% = 15,38% della retribuzione convenzionale
- **FASDAC**: 5,29% per dirigenti in servizio + 2,78% per gestione pensionati = 8,07% della retribuzione convenzionale

##### Fondo EST (Quota Datore - CCNL Commercio 2026)

Per i dipendenti non dirigenti del CCNL Commercio, il datore versa un contributo al Fondo EST:

| Fondo     | Importo          | Costo Annuo Datore |
| --------- | ---------------- | ------------------ |
| Fondo EST | €13/mese (fisso) | €156               |

##### Fondo Pensione Integrativo (Quota Datore)

Se attiva la previdenza complementare con contributo a carico del datore, tale importo è incluso nel costo aziendale.

##### Fringe Benefit, Rimborsi Trasferta e Benefit Non Tassati

Il costo aziendale include anche le componenti variabili erogate dall'azienda, se presenti:

- **Fringe Benefit:** il valore totale dei fringe benefit erogati (buoni acquisto, buoni carburante, rimborsi utenze/affitto/mutuo, auto aziendale, altri). Per l'auto aziendale, viene utilizzato il valore convenzionale ai fini fiscali.
- **Rimborsi Trasferta:** il totale dei rimborsi spese per trasferte (forfettari ed analitici, sia esenti che tassati).
- **Benefit Non Tassati (Welfare):** il totale dei benefit di welfare aziendale erogati (buoni pasto, previdenza complementare, assistenza sanitaria, abbonamento trasporti, servizi welfare).

> Queste voci contribuiscono anche all'imponibile previdenziale per le eventuali parti tassabili, e il relativo costo INPS datore è già incluso nella voce "Contributi INPS Datore".

##### Esempio

Per un impiegato con RAL €35.000, senza CIGS:

```
RAL:                   €35.000,00
INPS Datore (28,98%):  €10.143,00
TFR (35.000/13,5):     € 2.592,59
────────────────────────────────────
Costo Aziendale:       €47.735,59
```

Per un dirigente con RAL €80.000, con tutti i fondi CCNL Terziario:

```
RAL:                   €80.000,00
INPS Datore (26,54%):  €21.232,00
TFR (80.000/13,5):     € 5.925,93
Fondo Negri (datore):  € 9.112,82
Fondo Pastore (datore):€ 4.856,45
CFMT (datore):         €   276,00
FASDAC (datore):       € 3.707,36
────────────────────────────────────
Costo Aziendale:       €125.110,56
```

> **Nota:** Il calcolo non include INAIL (assicurazione infortuni), il cui premio varia significativamente per settore e rischio professionale (da 0,3% a oltre 12%).

#### 14. Borse di Studio (Dottorato/Post-laurea)

Dal 7 giugno 2025, le borse di studio post-laurea assegnate da università italiane sono soggette a tassazione come **redditi assimilati al lavoro dipendente** (Art. 50, comma 1, lett. c, TUIR), per effetto del D.L. 45/2025 convertito in L. 79/2025.

##### INPS Gestione Separata

Le borse sono soggette a INPS Gestione Separata con le seguenti aliquote (2026):

| Voce                     | Aliquota      | A carico di     |
| ------------------------ | ------------- | --------------- |
| Gestione Separata totale | 35,03%        | -               |
| Quota borsista           | 1/3 (~11,68%) | Borsista        |
| Quota ente               | 2/3 (~23,35%) | Università/Ente |

##### Cumulo IRPEF

L'imponibile IRPEF della borsa (importo lordo − contributo GS borsista) si **cumula** con il reddito da lavoro dipendente per il calcolo di:

- Scaglioni IRPEF
- Detrazioni lavoro dipendente (ricalcolate sul reddito complessivo)
- Addizionali regionali e comunali
- Cuneo fiscale e trattamento integrativo

##### Non influisce su

- INPS ordinario (lavoro dipendente)
- Costo aziendale
- TFR

##### Formula

```
Imponibile Borsa = Importo Lordo − (Importo Lordo × 35,03% / 3)
Reddito Complessivo = Reddito Lavoro Dipendente + Imponibile Borsa + Altri Redditi
Netto Borsa = Importo Lordo − Contributo GS Borsista − Quota IRPEF/Addizionali sulla Borsa
```

#### 15. Borsa di Studio come Tipo di Contratto (Dottorato di Ricerca)

Le borse di dottorato di ricerca, specializzazione medica e corsi di perfezionamento all'estero sono **totalmente esenti da IRPEF** (Art. 4, L. 476/1984; Art. 6, co. 6, L. 398/1989). Questa esenzione **non** è stata toccata dal D.L. 45/2025 che ha colpito solo le borse post-laurea generiche.

Quando si seleziona "Borsa di studio" come tipo di contratto, il calcolo è drasticamente semplificato rispetto al lavoro dipendente.

##### Cosa si applica

| Voce                                      | Si applica? |
| ----------------------------------------- | ----------- |
| INPS Gestione Separata                    | Sì          |
| IRPEF e scaglioni                         | No (esente) |
| Addizionali regionali/comunali            | No (esente) |
| Detrazioni lavoro dipendente              | No          |
| Cuneo fiscale / Trattamento integrativo   | No          |
| TFR                                       | No          |
| Tredicesima / Quattordicesima             | No          |
| CCNL, fondi dirigenti, Fondo EST          | No          |
| Regime impatriati                         | No          |
| Previdenza complementare (fondo pensione) | No          |

##### INPS Gestione Separata

| Copertura pensionistica          | Aliquota totale | Borsista (1/3) | Ente (2/3) |
| -------------------------------- | --------------- | -------------- | ---------- |
| Senza altra copertura            | 35,03%          | ~11,68%        | ~23,35%    |
| Con altra copertura obbligatoria | 24,00%          | ~8,00%         | ~16,00%    |

L'aliquota ridotta al 24% si applica quando il borsista ha un'altra posizione previdenziale obbligatoria (es. iscrizione a una cassa professionale).

##### Formula

```
Netto Annuo = Importo Lordo − (Importo Lordo × Aliquota GS / 3)
Netto Mensile = Netto Annuo / 12
Costo Ente = Importo Lordo + (Importo Lordo × Aliquota GS × 2/3)
```

##### Esempio: Borsa di dottorato €16.243 (senza altra copertura)

```
Importo Lordo:         € 16.243,00
GS Totale (35,03%):    €  5.690,33
GS Borsista (1/3):     € -1.896,78
────────────────────────────────────
Netto Annuo:           € 14.346,22
Netto Mensile:         €  1.195,52

Costo per l'Ente:      € 20.036,55
```

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
│  6d. FASDAC (se dirigente CCNL Terziario)                       │
│      = €859,08/anno (contributo fisso 2026)                     │
│      → NON riduce l'imponibile IRPEF                            │
│      → Trattenuta diretta dal netto                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  6d2. FONDO EST (se dipendente CCNL Commercio)                  │
│       = €24/anno (€2/mese, contributo fisso 2026)               │
│       → NON riduce l'imponibile IRPEF                           │
│       → Trattenuta diretta dal netto                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  6e. PREVIDENZA COMPLEMENTARE (se attiva)                       │
│      Contributo lav. + datore + EBITEMP, deduc. fino a €5.300  │
│      → Riduce l'imponibile IRPEF (con cap)                     │
│      → Solo contributo lavoratore è trattenuta dal netto        │
│      → Contributo datore e EBITEMP non sono trattenute          │
│      → NON riduce l'imponibile previdenziale (INPS)            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  6f. REGIME IMPATRIATI (se attivo)                              │
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
│       − Deduzione previdenza complementare (max €5.300)         │
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
│     − Addizionali − Contributi obb. qualifica − Prev. compl.    │
│     + Bonus                                                     │
│                                                                 │
│      Totale Percepito = Netto + Esenti                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  14. COSTO AZIENDALE                                            │
│      = RAL + INPS Datore + TFR + Fondi Dirigenti (datore)       │
│        + Fondo EST (datore) + Fondo Pensione (datore)           │
│        + Fringe Benefit + Rimborsi Trasferta + Benefit Non Tass.│
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
| **D.Lgs. 252/2005**     | Previdenza complementare                 |
| **Art. 10 TUIR**        | Deduzioni dal reddito complessivo        |
| **D.Lgs. 209/2023**     | Regime impatriati (rientro cervelli)     |
| **Art. 2120 c.c.**      | Trattamento di Fine Rapporto (TFR)       |

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
