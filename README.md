# Stipendio.🔝

Il [calcolatore dello stipendio netto](https://stipendio.top) per lavoratori dipendenti privati in Italia.

Di calcolatori, o di strumenti che assolvono a questo scopo, ne esistono a decine. Tuttavia, la maggior parte di essi non espone in modo chiaro e trasparente le formule e i metodi di calcolo adottati, rendendo difficile per l'utente comprendere come viene determinato il proprio stipendio netto. Inoltre, la maggior parte di essi non sembra stare al passo con la costante evoluzione della normativa fiscale e previdenziale italiana.

Questo progetto, che rilascio con piacere sotto licenza open source, vuole mettere a disposizione di tutti un calcolatore trasparente, aggiornato e aggiornabile nel tempo.

Nota: questo progetto è stato scritto nel corso di un weekend tramite il parziale aiuto di Claude Code con modello Opus 4.5, per la raccolta e la rielaborazione delle fonti teoriche dalla rete e per una parte dell'implementazione.

## Funzionalità:

- Calcolo dello stipendio netto a partire dalla RAL (Retribuzione Annua Lorda), situazione familiare e da eventuali benefit, fringe benefit e rimborsi spese.
- Fondi contrattuali dei principali CCNL (Commercio e Turismo, Dirigenti Terziario, Metalmeccanici, Dirigenti Industria), preset per i fondi pensione negoziali (Cometa, Fon.Te., Previndai) e fondi personalizzati con trattamento fiscale a scelta.
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
  - [Fondi Contrattuali (CCNL)](#10-fondi-contrattuali-ccnl)
  - [Previdenza Complementare](#11-previdenza-complementare-fondo-pensione-integrativo)
  - [Regime Impatriati](#12-regime-impatriati-rientro-cervelli)
  - [Costo Aziendale](#13-costo-aziendale)
  - [Borse di Studio](#14-borse-di-studio-dottoratopost-laurea)
  - [Mensilità Ordinaria, Tredicesima e Quattordicesima](#16-mensilità-ordinaria-tredicesima-e-quattordicesima)
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

Il **Netto mensile** è quello della mensilità ordinaria, non la media sulle mensilità: con tredicesima e quattordicesima il mese ordinario è più alto della media e la mensilità aggiuntiva più bassa, perché detrazioni, bonus e addizionali competono alle sole dodici mensilità ordinarie (vedi [sezione 16](#16-mensilità-ordinaria-tredicesima-e-quattordicesima)).

```
NETTO ANNUO = 12 × Netto Mensilità Ordinaria + (Mensilità − 12) × Netto Mensilità Aggiuntiva
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

| Parametro                                   | Valore 2026 |
| ------------------------------------------- | ----------- |
| Soglia contributo aggiuntivo 1%             | €56.224     |
| Massimale contributivo (iscritti post-1996) | €122.295    |
| Minimale giornaliero                        | €58,13      |

> Fonte: [Circolare INPS n. 6 del 30 gennaio 2026](https://www.inps.it/it/it/inps-comunica/notizie/dettaglio-news-page.news.2026.02.lavoratori-dipendenti-limite-minimo-di-retribuzione-giornaliera-2026.html), valori in vigore dal 1° gennaio 2026.

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

**Maggiorazione:** +€65 per redditi tra €25.001 e €35.000, non rapportata al periodo di lavoro (Circ. AdE 4/E/2022, par. 1.2)

**Rapporto ai giorni:** `Detrazione Effettiva = Detrazione × (Giorni Lavorati / 365) + Maggiorazione`

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
Detrazione per figlio = Importo Teorico × [(Coefficiente − RC) / Coefficiente]

Importo Teorico = €950
                + €400 se il figlio è disabile
                + €200 per ciascun figlio, se i figli a carico sono più di tre

Coefficiente = €95.000 + €15.000 × (N. figli a carico − 1)
```

Il coefficiente è lo stesso per tutti i figli. Nel numero di figli a carico rientrano anche quelli con meno di 21 anni, per i quali la detrazione non spetta ma che rilevano per il coefficiente e per la maggiorazione oltre tre figli (art. 12, c. 1, lett. c, TUIR; Circ. AdE 4/E/2022, par. 1.1).

###### Ascendenti a Carico (conviventi)

```
Detrazione = €750 × [(€80.000 − RC) / €80.000]
```

###### Rapporto ai Mesi

Le detrazioni per coniuge, figli e ascendenti sono rapportate a mese e competono dal mese in cui si verificano a quello in cui cessano le condizioni (art. 12, c. 3, TUIR):

```
Detrazione Effettiva = Detrazione × (Mesi a Carico / 12)
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

> L'indennità è **esente** da IRPEF e contributi. La fascia percentuale si individua sul reddito di lavoro dipendente rapportato all'intero anno (`Reddito × 365 / Giorni Lavorati`, art. 1, c. 4, L. 207/2024), mentre la percentuale si applica al reddito effettivo.

##### Per Redditi €20.001 − €40.000: Detrazione Fiscale

| Fascia di Reddito | Detrazione                         |
| ----------------- | ---------------------------------- |
| €20.001 − €32.000 | €1.000                             |
| €32.001 − €40.000 | €1.000 × [(€40.000 − RC) / €8.000] |

> La detrazione opera **fino a concorrenza** dell'imposta lorda ed è rapportata al periodo di lavoro: `Detrazione Effettiva = Detrazione × (Giorni Lavorati / 365)` (art. 1, c. 6, L. 207/2024).

---

#### 5. Trattamento Integrativo

Ex "Bonus Renzi" - Importo massimo: **€1.200/anno** (€100/mese)

##### Condizioni di Spettanza

| Fascia di Reddito | Condizione                              | Importo                |
| ----------------- | --------------------------------------- | ---------------------- |
| ≤ €15.000         | IRPEF Lorda > (Detrazione art.13 − €75) | €1.200                 |
| €15.001 − €28.000 | Detrazioni > IRPEF Lorda                | MIN(€1.200, Eccedenza) |
| > €28.000         | —                                       | Non spetta             |

Nella fascia ≤ €15.000 l'IRPEF lorda è calcolata sui soli redditi di lavoro dipendente e assimilati (artt. 49 e 50 TUIR), e sia l'importo di €1.200 sia i €75 sono rapportati al periodo di lavoro (art. 1, c. 1, D.L. 3/2020): `Importo = €1.200 × (Giorni Lavorati / 365)`. Nella fascia €15.001 − €28.000 si usa l'IRPEF lorda ordinaria (art. 1, c. 1-bis).

---

#### 6. Addizionali Regionali e Comunali

Le addizionali regionale e comunale sono dovute solo se l'IRPEF annuale, al netto delle detrazioni, risulta dovuta (art. 50, comma 2, D.Lgs. 446/1997; art. 1, comma 4, D.Lgs. 360/1998). Nel calcolo si considera l'IRPEF finale, dopo anche la detrazione aggiuntiva del cuneo fiscale: se è pari a zero, entrambe le addizionali sono pari a zero.

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

Agevolazioni regionali applicate:

- **Valle d'Aosta:** esenzione fino a €15.000 di imponibile
- **Friuli Venezia Giulia:** 0,70% sull'intero imponibile fino a €15.000, oltre 1,23% sull'intero imponibile
- **Lazio:** 1,73% sull'intero imponibile fino a €28.000, detrazione di €60 tra €28.001 e €30.000
- **Umbria:** 1,23% sull'intero imponibile fino a €28.000; oltre tale limite, aliquote progressive 1,73%, 3,02%, 3,12% e 3,33%, con detrazione di €150 tra €28.001 e €50.000
- **Trento:** deduzione di €30.000 fino a €30.000 di imponibile, detrazione di €246 per figlio a carico fino a €50.000
- **Bolzano:** detrazione base di €430,50 e di €340 per figlio a carico fino a €90.000, detrazione supplementare fino a €125 oltre €50.000. Il limite di €90.000 include cedolare secca, mance con imposta sostitutiva e regime forfettario

Le detrazioni per figli sono proporzionate alla percentuale e ai mesi di carico.

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

- Vitto O alloggio rimborsati o forniti gratuitamente: −1/3 (€30,99 Italia, €51,65 estero)
- Vitto E alloggio rimborsati o forniti gratuitamente: −2/3 (€15,49 Italia, €25,82 estero)

I limiti ridotti sono arrotondati al centesimo, come i valori ufficiali.

**Indennità diversa dal limite:**

```
Esente = MIN(Indennità × Giorni, Limite × Giorni)
Tassata = Indennità × Giorni − Esente
```

La parte eccedente concorre all'imponibile IRPEF e previdenziale. Il calcolo si fa per gruppi di giorni con lo stesso trattamento, perché destinazione, importo e riduzione possono cambiare da una trasferta all'altra. Se l'indennità non è indicata, si assume pari al limite.

Nel sistema forfettario i rimborsi di vitto e alloggio sono tassati, anche se documentati e tracciabili (Circ. AE 15/E/2025): se sono previsti, il sistema da indicare è il misto.

**Rimborso Analitico:**
Totalmente esente se documentato e con pagamento tracciabile (dal 2025).

##### Rimborso Chilometrico

L'indennità chilometrica per l'uso dell'auto propria è esente solo per le trasferte **fuori** dal comune sede di lavoro ed entro i limiti delle tariffe ACI (art. 51, c. 5, TUIR). Concorrono invece al reddito, e all'imponibile previdenziale, i rimborsi chilometrici per gli spostamenti nel comune e la quota eccedente le tariffe ACI: nel calcolo vanno indicati come "rimborso chilometrico imponibile".

##### Trasferte nel Comune

Dal 2025: spese di viaggio e trasporto (trasporto pubblico, taxi, NCC) esenti se documentate. Il rimborso chilometrico nel comune resta imponibile.

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
| Previdenza complementare (da welfare)       | €5.300 (\*)   |
| Assistenza sanitaria integrativa            | €3.615,20 (†) |
| Buoni pasto cartacei                        | €4,00/giorno  |
| Buoni pasto elettronici (2025)              | €8,00/giorno  |
| Buoni pasto elettronici (dal 2026)          | €10,00/giorno |
| Abbonamento trasporto pubblico              | 100% esente   |
| Servizi welfare (asili, borse studio, ecc.) | 100% esenti   |

> Per i buoni pasto il limite annuo è la soglia giornaliera moltiplicata per i giorni di erogazione (default 220, modificabile nella form), assumendo buoni di pari importo giornaliero.
>
> (\*) I contributi al fondo pensione versati dall'azienda tramite welfare sono gestiti nella [previdenza complementare](#11-previdenza-complementare-fondo-pensione-integrativo): concorrono al plafond di €5.300 insieme ai contributi di lavoratore e datore e non sono una trattenuta dal netto.
>
> (†) Il limite di €3.615,20 è unico per tutti i contributi a casse e fondi sanitari (art. 51, c. 2, lett. a, TUIR): l'assistenza sanitaria welfare lo condivide con i [fondi contrattuali sanitari](#limite-di-esenzione-dei-contributi-sanitari) (quota azienda e quota lavoratore). L'eccedenza è reddito imponibile IRPEF ma non entra in busta né nell'imponibile previdenziale (art. 12, c. 4, lett. f, L. 153/1969), e il datore versa su di essa il contributo di solidarietà del 10%.

---

#### 10. Fondi Contrattuali (CCNL)

I CCNL prevedono fondi di previdenza, assistenza sanitaria e formazione finanziati con contributi fissi a carico del lavoratore e dell'azienda. Il calcolatore li raccoglie in una tabella per CCNL, con il trattamento fiscale di ciascuno, e permette di aggiungere **fondi personalizzati** per i contratti non coperti. I fondi pensione negoziali con contributi in percentuale (Cometa, Fon.Te., Previndai) sono invece preset della [previdenza complementare](#11-previdenza-complementare-fondo-pensione-integrativo).

##### Trattamento fiscale

| Trattamento              | Quota lavoratore                                                                            | Quota azienda                                                                     | Solidarietà 10% |
| ------------------------ | ------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | --------------- |
| Assistenza sanitaria     | Esclusa dall'imponibile IRPEF entro €3.615,20 complessivi (art. 51, c. 2, lett. a)          | Esente entro lo stesso limite; l'eccedenza è reddito imponibile IRPEF, non INPS   | Sì              |
| Previdenza complementare | Dedotta entro il plafond di €5.300 condiviso con il fondo pensione (art. 10, e-bis)         | Reddito del lavoratore, dedotto entro lo stesso plafond; l'eccedenza è imponibile | Sì              |
| Deducibile senza limite  | Dedotta per intero (fondo in squilibrio, art. 20, c. 7, D.Lgs. 252/2005), riduce il plafond | Non è reddito; non riduce il plafond (semplificazione, vedi Fondo Negri)          | Sì              |
| Non deducibile           | Trattenuta diretta dal netto, senza beneficio fiscale                                       | Solo un costo aziendale                                                           | No              |

In tutti i casi la quota lavoratore **non riduce l'imponibile previdenziale** (INPS) e la quota azienda è esclusa dall'imponibile previdenziale ma concorre al [costo aziendale](#13-costo-aziendale).

##### Limite di esenzione dei contributi sanitari

Contributi versati dal datore e dal lavoratore a casse e fondi sanitari non concorrono al reddito "per un importo non superiore complessivamente a euro 3.615,20" (art. 51, c. 2, lett. a, TUIR). Il limite è unico: lo condividono tutti i fondi sanitari selezionati (quota azienda e quota lavoratore) e l'assistenza sanitaria della sezione welfare.

```
Contributi sanitari = Σ quota azienda fondi sanitari (al netto delle quote solidali)
                    + Assistenza sanitaria welfare
                    + Σ quota lavoratore fondi sanitari
Esente              = MIN(Contributi sanitari, €3.615,20)
Eccedenza           = Contributi sanitari − Esente   → reddito imponibile IRPEF
```

Il limite è attribuito nell'ordine: quote azienda dei fondi, welfare, quote lavoratore. L'ordine non cambia l'imponibile (ogni euro oltre il limite è tassato una volta sola), ma decide quale voce compare come eccedente nel dettaglio. I contributi che l'azienda versa per prestazioni ad altri (gestione dirigenti pensionati, premio LTC, dirigenti disoccupati) non concorrono al limite del lavoratore in servizio (Ris. AE 78/E/2004, accordo CCNL Dirigenti Terziario 2022), ma restano un costo soggetto al contributo di solidarietà.

##### Tabella 2026

| Fondo                        | CCNL                | Lavoratore / anno            | Azienda / anno                                                              | Trattamento                           |
| ---------------------------- | ------------------- | ---------------------------- | --------------------------------------------------------------------------- | ------------------------------------- |
| Fondo EST                    | Commercio           | €24 (€2/mese)                | €156 (€13/mese, dal 1° aprile 2025)                                         | Assistenza sanitaria                  |
| Sanimpresa (Lazio)           | Terziario, Lazio    | —                            | €168 (€14/mese, dal 1° gennaio 2025)                                        | Assistenza sanitaria                  |
| Fondo Fast                   | Turismo             | €24 (€2/mese)                | €120 (€10/mese)                                                             | Assistenza sanitaria                  |
| Quas (quadri)                | Terziario, art. 105 | €56                          | €390 (€370 nel 2025) + €340 una tantum alla prima iscrizione, non calcolati | Assistenza sanitaria                  |
| Quadrifor (quadri)           | Terziario, art. 109 | €25                          | €50                                                                         | Non deducibile                        |
| Fondo Mario Negri            | Dirigenti Terziario | €1.184,49 (2% di €59.224,54) | €9.108,73 (12,86% + 2,52% di €59.224,54)                                    | Deducibile senza limite               |
| Fondo Antonio Pastore        | Dirigenti Terziario | €464,81                      | €4.856,45                                                                   | Non deducibile                        |
| CFMT                         | Dirigenti Terziario | €166                         | €276                                                                        | Non deducibile                        |
| FASDAC (Fondo Mario Besusso) | Dirigenti Terziario | €859,08 (1,87% di €45.940)   | €3.707,36 (5,29% + 2,78% di €45.940)                                        | Assistenza sanitaria                  |
| mètaSalute                   | Metalmeccanici      | —                            | €156 (€13/mese)                                                             | Assistenza sanitaria                  |
| FASI                         | Dirigenti Industria | €1.120 (€280/trim.)          | €3.780 (€545/trim. + €400/trim. per i dirigenti pensionati)                 | Assistenza sanitaria                  |
| GS-FASI                      | Dirigenti Industria | —                            | €100                                                                        | Assistenza sanitaria (quota solidale) |

Note sui singoli fondi:

- **Fondo Mario Negri**: fondo preesistente in squilibrio finanziario, con deducibilità integrale della quota dirigente (art. 20, c. 7, D.Lgs. 252/2005). Il rinnovo del CCNL Dirigenti Terziario del 5 novembre 2025 porta dal 2026 la quota dirigente al 2% e l'integrativo azienda al 2,52% (2,57% nel 2027, 2,62% nel 2028). La quota aziendale è inclusa nel costo aziendale ma, per semplificazione, non riduce il plafond della previdenza complementare.
- **FASDAC**: della quota azienda (8,07%) concorrono al limite di €3.615,20 solo il 5,29% per i dirigenti in servizio al netto del premio LTC di €206,60; il 2,78% per la gestione pensionati e il premio LTC non rilevano (Ris. AE 78/E/2004, accordo di rinnovo 2022). Con il solo FASDAC la quota del dirigente (€859,08) resta quindi interamente esente.
- **Fondo EST, Quas, Fondo Fast**: la quota del lavoratore è esclusa dall'imponibile IRPEF, trattandosi di contributi a casse sanitarie entro il limite; non riduce l'imponibile INPS.
- **mètaSalute, Sanimpresa, GS-FASI**: nessuna trattenuta al lavoratore, solo costo aziendale. I piani integrativi facoltativi di mètaSalute a carico del lavoratore si inseriscono come fondo personalizzato.
- **FASI**: quote del dirigente in servizio dalla circolare FASI 2026, invariate rispetto al 2025. L'azienda versa anche €1.600 l'anno per ogni dirigente in forza per l'assistenza ai dirigenti pensionati (art. G del Regolamento FASI, importo della circolare 2023): è un costo aziendale soggetto alla solidarietà del 10%, ma non è reddito del dirigente e non concorre al suo limite (Ris. AE 78/E/2004). **GS-FASI** (Gestione Separata FASI) copre i dirigenti involontariamente disoccupati: €100 l'anno per ogni dirigente in servizio, a carico azienda, fuori dal limite del dirigente.
- **Quadrifor, CFMT**: enti bilaterali per la formazione, senza beneficio fiscale e senza contributo di solidarietà.

Un fondo per dirigenti (Negri, Pastore, CFMT, FASDAC, FASI, GS-FASI, o un fondo personalizzato con l'opzione "Fondo per dirigenti") porta alle aliquote INPS datore dei dirigenti nel [costo aziendale](#13-costo-aziendale).

##### Fondi personalizzati

Per i CCNL non in tabella si possono aggiungere fondi con nome, contributo annuo lavoratore, contributo annuo azienda, trattamento fiscale (uno dei quattro sopra) e flag dirigenti. Un fondo con trattamento "previdenza complementare" entra nel plafond di €5.300 insieme al fondo pensione, in proporzione ai contributi; uno con trattamento "assistenza sanitaria" entra nel limite di €3.615,20.

##### Risparmio fiscale

Per le quote dedotte o esenti il calcolatore mostra il risparmio fiscale: la differenza di carico fiscale (IRPEF, addizionali, bonus) tra il calcolo senza e con le deduzioni, ripartita tra i fondi in proporzione alla quota dedotta da ciascuno. Il netto si riduce del contributo meno il risparmio.

---

#### 11. Previdenza Complementare (Fondo Pensione Integrativo)

La previdenza complementare consente al lavoratore dipendente di versare contributi a un fondo pensione integrativo, ottenendo un beneficio fiscale sotto forma di deduzione dall'imponibile IRPEF.

##### Struttura dei Contributi

| Fonte                 | Descrizione                                                                       |
| --------------------- | --------------------------------------------------------------------------------- |
| Contributo lavoratore | Percentuale della RAL trattenuta dalla busta paga                                 |
| Contributo datore     | Percentuale della RAL versata dall'azienda (costo aggiuntivo)                     |
| Contributo EBITEMP    | Percentuale della RAL versata dall'ente bilaterale (lavoratori somministrati)     |
| Contributo welfare    | Importo versato dal datore tramite il piano welfare (sezione Benefit non tassati) |

Le percentuali dipendono dal CCNL applicato e dalla scelta individuale del lavoratore. Valori tipici: 0,55% - 2% per il lavoratore, 1% - 2% per il datore.

Per i **lavoratori somministrati** iscritti a Fon.Te., l'ente bilaterale EBITEMP (Ente Bilaterale Nazionale per il Lavoro Temporaneo) versa un contributo aggiuntivo al fondo pensione. Il contributo EBITEMP non è una trattenuta dalla busta paga del lavoratore, ma concorre al limite annuo di deducibilità. Valore tipico: 2%.

##### Deducibilità Fiscale (Art. 10, c.1, lett. e-bis, TUIR - aggiornato da L. 199/2025)

| Parametro                    | Valore                                             |
| ---------------------------- | -------------------------------------------------- |
| Limite annuo di deducibilità | €5.300 (dal 2026)                                  |
| Cosa concorre al limite      | Contributo lavoratore + datore + EBITEMP + welfare |
| TFR destinato al fondo       | Escluso dal limite                                 |

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
- **Contributo welfare:** Come il contributo datore, è pagato dall'azienda (incluso nel costo aziendale), non è una trattenuta dal netto e concorre al limite di deducibilità

##### Esempio

Con RAL €40.000, contributo lavoratore 1%, contributo datore 1,5%:

```
Contributo lavoratore: €40.000 × 1% = €400/anno
Contributo datore: €40.000 × 1,5% = €600/anno
Totale: €1.000 (sotto il limite di €5.300)
Deduzione effettiva: €1.000
Risparmio IRPEF nominale (aliquota marginale 33%): €330/anno
Costo netto per il lavoratore: circa €400 − €330 = €70/anno
```

Il calcolatore non si ferma all'aliquota marginale: il **risparmio fiscale** mostrato è la differenza di carico fiscale (IRPEF finale, addizionali regionale e comunale, indennità cuneo e trattamento integrativo) tra il calcolo senza e con le deduzioni. Nella fascia €28.000 − €50.000, ad esempio, ogni euro dedotto recupera anche parte della detrazione lavoro dipendente (1.910/22.000) e, tra €32.000 e €40.000, della detrazione cuneo (1.000/8.000), oltre alle addizionali: l'aliquota marginale effettiva supera il 50%. Quando concorrono più deduzioni (es. Fondo Negri e fondo pensione) il risparmio è ripartito in proporzione alla quota dedotta da ciascuna.

> **Nota:** L'eventuale eccedenza non deducibile non genera risparmio fiscale nell'anno di versamento, ma sarà esente da tassazione al momento dell'erogazione della prestazione pensionistica.

##### Interazione con fondi in squilibrio finanziario (Fondo Mario Negri)

Il Fondo Mario Negri è un fondo preesistente ammesso al regime transitorio di deroga (art. 20, c.7, D.Lgs. 252/2005), che riconosce la **completa deducibilità** dei contributi senza alcun limite annuo. Tuttavia, i contributi versati al Fondo Negri **riducono il plafond di €5.300** disponibile per la deducibilità di eventuali contributi a fondi pensione integrativi ordinari.

```
Plafond residuo = MAX(0, €5.300 − Contributo dirigente Fondo Negri)
Esempio: €5.300 − €1.184,49 = €4.115,51 disponibili per altri fondi
```

> **Nota:** nel calcolo, il plafond è ridotto dalla quota del contributo Fondo Negri a carico del dirigente, essendo l'unica componente modellata. La quota aziendale, non inclusa nel calcolo, in realtà concorre anch'essa alla riduzione del plafond.

##### Preset dei fondi pensione negoziali

La sezione previdenza complementare ha un preset per i fondi negoziali più diffusi, che imposta le percentuali del CCNL e usa la RAL come base di riferimento (da correggere se il contratto usa una base diversa):

| Fondo     | CCNL                     | Lavoratore                               | Azienda                                                          | Base                                                                      |
| --------- | ------------------------ | ---------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Cometa    | Metalmeccanici industria | ≥ 1,2%                                   | 2% (2,2% per chi si iscrive entro i 35 anni, dal 1° giugno 2022) | Minimi tabellari del livello                                              |
| Fon.Te.   | Terziario Confcommercio  | ≥ 0,55% (di cui 0,05% quota associativa) | 1,55%, se si conferisce il TFR                                   | Retribuzione utile al TFR (art. 107 CCNL)                                 |
| Previndai | Dirigenti industria      | ≥ 2% (dal 2025)                          | 6% (4%, con minimo €4.800 l'anno, più 2%)                        | Retribuzione globale lorda fino a €200.000 (massimale applicato alla RAL) |

Il contributo azienda spetta solo se il lavoratore versa la propria quota minima. Il TFR conferito al fondo non concorre al plafond. I fondi contrattuali personalizzati con trattamento "previdenza complementare" condividono lo stesso plafond: contributi di lavoratore e azienda si sommano a quelli del fondo pensione e la deduzione è ripartita in proporzione.

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
- **Detrazioni lavoro dipendente e familiari:** Calcolate sul reddito complessivo ridotto
- **Cuneo fiscale:** Per le soglie di reddito complessivo e per la fascia del reddito di lavoro dipendente rileva la quota esente impatriati (L. 207/2024, art. 1, c. 9), mentre la percentuale dell'indennità si applica alla sola quota imponibile (Circ. AdE 4/E/2025, par. 1.2, esempio 3)
- **Trattamento integrativo:** Ai fini della verifica delle soglie di reddito complessivo rileva la quota esente impatriati (art. 3, c. 2, D.L. 3/2020; Circ. AdE 29/E/2020; [Agenzia delle Entrate, Quadro C](https://infoprecompilata.agenziaentrate.gov.it/portale/web/guest/quadro-c-lavoro-dipendente)). IRPEF e detrazioni utilizzate nel calcolo restano determinate sul reddito imponibile ridotto.

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

Il costo aziendale rappresenta la spesa complessiva che l'azienda sostiene per un dipendente, ed è sempre significativamente superiore alla RAL. Viene calcolato a partire dai dati già inseriti: contributo addizionale NASpI, contributo di solidarietà e recupero dello 0,50% sul TFR non richiedono input aggiuntivi. La sezione opzionale **Costo aziendale** del form aggiunge premio INAIL, rinnovi del tempo determinato, esoneri contributivi e aliquote agevolate dell'apprendistato. Nessuna di queste voci cambia lo stipendio netto.

##### Formula

```
COSTO AZIENDALE = RAL + Contributi INPS Datore − Esonero Contributivo
                + Addizionale NASpI (tempo determinato)
                + Contributo di Solidarietà + Premio INAIL
                + TFR (al netto dello 0,50% IVS)
                + Fondi Contrattuali (datore)
                + Fondo Pensione (datore)
                + Fringe Benefit + Rimborsi Trasferta + Benefit Non Tassati (Welfare)
```

##### Contributi INPS a Carico del Datore di Lavoro

I contributi INPS a carico del datore sono calcolati sull'imponibile previdenziale (lo stesso utilizzato per la quota lavoratore) e includono IVS, NASpI, malattia, maternità, CUAF, CIG e Fondo Garanzia TFR.

Per gli iscritti dal 1996 il massimale contributivo (€122.295 nel 2026) limita la sola quota IVS, pari al 23,81%; le contribuzioni minori restano dovute sull'intero imponibile:

```
INPS Datore = MIN(Imponibile, Massimale) × 23,81% + Imponibile × (Aliquota − 23,81%)
```

| Tipologia                                    | Aliquota Datore |
| -------------------------------------------- | --------------- |
| Operai/impiegati (senza CIGS)                | 28,98%          |
| Operai/impiegati (con CIGS)                  | 29,68%          |
| Apprendisti                                  | 11,61%          |
| Apprendisti, aziende fino a 9 dip. (1° anno) | 3,11%           |
| Apprendisti, aziende fino a 9 dip. (2° anno) | 4,61%           |
| Dirigenti (senza CIGS)                       | 26,54%          |
| Dirigenti (con CIGS)                         | 27,24%          |

> Le aliquote si riferiscono al settore Commercio/Terziario 2026 (fonte: tabelle INPS/Kitech). La qualifica di dirigente viene rilevata automaticamente dall'attivazione di un fondo per dirigenti (Fondo Negri, Pastore, CFMT, FASDAC, FASI, GS-FASI o un fondo personalizzato con l'opzione dirigenti); le stesse aliquote sono usate anche per i dirigenti industriali.

L'aliquota degli apprendisti è forfettaria: 10% più NASpI 1,31% e formazione 0,30%, e comprende anche il premio INAIL. Nelle aziende fino a 9 dipendenti il 10% scende all'1,5% il primo anno e al 3% il secondo (art. 1, c. 773, L. 296/2006); dal terzo anno si torna all'11,61%.

##### Contributo Addizionale NASpI (Tempo Determinato)

I contratti a tempo determinato pagano un contributo addizionale dell'1,4% (art. 2, c. 28, L. 92/2012), aumentato di 0,5 punti per ogni rinnovo del contratto (art. 3, c. 2, D.L. 87/2018). Le proroghe non contano.

```
Addizionale NASpI = Imponibile × (1,4% + 0,5% × Rinnovi)
```

È una contribuzione minore: è dovuta sull'intero imponibile, senza massimale. Non si applica agli apprendisti. Il calcolatore non gestisce le altre esclusioni previste dalla norma, come le assunzioni in sostituzione di lavoratori assenti e i lavoratori stagionali.

##### Premio INAIL

Il premio INAIL varia per settore e rischio professionale (da 0,3% a oltre 12%, cioè da 3‰ a oltre 120‰). Il tasso, in per mille, si indica nella sezione Costo aziendale e si applica alla stessa retribuzione imponibile dei contributi INPS, senza massimale:

```
Premio INAIL = Imponibile × Tasso INAIL (‰) / 1.000
```

Il calcolatore considera il premio interamente a carico del datore. Per gli apprendisti il premio è compreso nell'aliquota INPS forfettaria (art. 1, c. 773, L. 296/2006) e non viene aggiunto.

##### Contributo di Solidarietà 10%

I contributi del datore destinati a previdenza complementare e assistenza sanitaria integrativa sono esclusi dall'imponibile previdenziale, ma il datore versa all'INPS un contributo di solidarietà del 10% (art. 16 D.Lgs. 252/2005, art. 9-bis D.L. 103/1991):

```
Contributo di Solidarietà = 10% × (Fondo Pensione datore + Fondo Pensione welfare
                                 + Fondi contrattuali datore (previdenza e sanità)
                                 + Assistenza sanitaria welfare)
```

Non si applica ai contributi del lavoratore, al TFR conferito al fondo pensione né ai fondi non deducibili (Fondo Pastore, CFMT, Quadrifor). I contributi datore alle casse sanitarie sono esclusi dall'imponibile previdenziale senza limite (art. 12, c. 4, lett. f, L. 153/1969): il 10% grava sull'intero importo, anche sulla parte oltre i €3.615,20 che è imponibile solo ai fini IRPEF.

##### TFR (Trattamento di Fine Rapporto)

```
TFR Annuo = RAL / 13,5 − 0,50% × MIN(Imponibile, Massimale)
```

Il TFR è un accantonamento obbligatorio a carico del datore (Art. 2120 c.c.), indipendentemente da dove viene destinato (azienda, INPS o fondo pensione). La quota annua si riduce del contributo aggiuntivo IVS dello 0,50% (art. 3, c. 15-16, L. 297/1982): il datore lo versa all'INPS insieme agli altri contributi, già compreso nel 23,81% IVS, e lo recupera sul TFR. Contare il TFR pieno conterebbe due volte lo 0,50%.

La riduzione non si applica agli apprendisti. Con un esonero contributivo lo 0,50% non versato non si recupera (Messaggio INPS 1817/2019): il calcolatore riduce il recupero in proporzione alla quota di contributi esonerata.

##### Esoneri Contributivi

Alcune assunzioni danno diritto a un esonero dai contributi INPS a carico del datore, per un massimo di 24 mesi. L'esonero non riduce il premio INAIL, il contributo addizionale NASpI e il contributo di solidarietà.

| Esonero                              | Destinatari                                                                  | Quota  | Tetto mensile              |
| ------------------------------------ | ---------------------------------------------------------------------------- | ------ | -------------------------- |
| Bonus Giovani (art. 22 D.L. 60/2024) | Under 35 mai assunti a tempo indeterminato                                   | 100%   | €500                       |
| Bonus Giovani, ZES unica             | Come sopra, per sedi nella ZES unica del Mezzogiorno                         | 100%   | €650                       |
| Bonus Donne (art. 23 D.L. 60/2024)   | Donne svantaggiate                                                           | 100%   | €650                       |
| Bonus ZES (art. 24 D.L. 60/2024)     | Over 35 disoccupati da 24 mesi, aziende fino a 10 dipendenti nella ZES unica | 100%   | €650                       |
| Personalizzato                       | Altri esoneri, proroghe o quote ridotte                                      | Libera | Libero (anche senza tetto) |

```
Esonero = MIN(INPS Datore × Quota × Mesi / 12, Tetto Mensile × Mesi)
```

Il calcolo è annuo: quota e tetto mensile si applicano ai mesi di esonero indicati. L'esonero si applica ai contributi INPS datore nel loro insieme, senza separare le contribuzioni minori che alcuni esoneri escludono. Requisiti e finestre di assunzione cambiano con le proroghe: vanno verificati con le circolari INPS.

##### Fondi Contrattuali (Quota Datore 2026)

Per ogni fondo selezionato il datore sostiene la quota aziendale della [tabella fondi](#tabella-2026), più il contributo di solidarietà del 10% su previdenza e sanità:

| Fondo                 | Base di Calcolo    | Aliquota/Importo | Costo Annuo Datore | Solidarietà 10% |
| --------------------- | ------------------ | ---------------- | ------------------ | --------------- |
| Fondo Mario Negri     | €59.224,54 (conv.) | 15,38%           | ~€9.109            | Sì              |
| Fondo Antonio Pastore | Importo fisso      | —                | €4.856,45          | No              |
| CFMT                  | Importo fisso      | —                | €276               | No              |
| FASDAC                | €45.940 (conv.)    | 8,07%            | ~€3.707            | Sì              |
| Fondo EST             | €13/mese           | —                | €156               | Sì              |
| Sanimpresa (Lazio)    | €14/mese           | —                | €168               | Sì              |
| Fondo Fast            | €10/mese           | —                | €120               | Sì              |
| Quas                  | Importo fisso      | —                | €390               | Sì              |
| Quadrifor             | Importo fisso      | —                | €50                | No              |
| mètaSalute            | €13/mese           | —                | €156               | Sì              |
| FASI                  | €945/trimestre     | —                | €3.780             | Sì              |
| GS-FASI               | Importo fisso      | —                | €100               | Sì              |

Dettaglio aliquote:

- **Fondo Mario Negri**: contributo ordinario azienda 12,86% + integrativo 2,52% = 15,38% della retribuzione convenzionale
- **FASDAC**: 5,29% per dirigenti in servizio (compreso il premio LTC di €206,60) + 2,78% per gestione pensionati = 8,07% della retribuzione convenzionale
- **FASI**: €545 a trimestre per il dirigente in servizio + €400 a trimestre per l'assistenza ai dirigenti pensionati (art. G del Regolamento FASI)

La quota azienda dei fondi sanitari oltre il limite di €3.615,20 (insieme al welfare e alle quote lavoratore) diventa reddito imponibile IRPEF del lavoratore, ma non cambia il costo aziendale.

##### Fondo Pensione Integrativo (Quota Datore)

Se attiva la previdenza complementare con contributo a carico del datore, tale importo è incluso nel costo aziendale, insieme al contributo di solidarietà del 10%.

##### Fringe Benefit, Rimborsi Trasferta e Benefit Non Tassati

Il costo aziendale include anche le componenti variabili erogate dall'azienda, se presenti:

- **Fringe Benefit:** il valore totale dei fringe benefit erogati (buoni acquisto, buoni carburante, rimborsi utenze/affitto/mutuo, auto aziendale, altri). Per l'auto aziendale, viene utilizzato il valore convenzionale ai fini fiscali.
- **Rimborsi Trasferta:** il totale dei rimborsi spese per trasferte (forfettari ed analitici, sia esenti che tassati).
- **Benefit Non Tassati (Welfare):** il totale dei benefit di welfare aziendale erogati (buoni pasto, assistenza sanitaria, abbonamento trasporti, servizi welfare). La previdenza complementare da welfare è inclusa nella voce Fondo Pensione (datore/welfare).

> Queste voci contribuiscono anche all'imponibile previdenziale per le eventuali parti tassabili, e il relativo costo INPS datore è già incluso nella voce "Contributi INPS Datore".

##### Esempio

Per un impiegato con RAL €35.000, senza CIGS:

```
RAL:                         €35.000,00
INPS Datore (28,98%):        €10.143,00
TFR (35.000/13,5):           € 2.592,59
Recupero 0,50% IVS sul TFR:  −€  175,00
──────────────────────────────────────────
Costo Aziendale:             €47.560,59
```

Per un dirigente con RAL €80.000, con tutti i fondi CCNL Terziario:

```
RAL:                         €80.000,00
INPS Datore (26,54%):        €21.232,00
TFR (80.000/13,5):           € 5.925,93
Recupero 0,50% IVS sul TFR:  −€  400,00
Fondo Negri (datore):        € 9.108,73
Fondo Pastore (datore):      € 4.856,45
CFMT (datore):               €   276,00
FASDAC (datore):             € 3.707,36
Solidarietà 10%:             € 1.281,61   (su Negri e FASDAC)
──────────────────────────────────────────
Costo Aziendale:             €125.988,08
```

Per un impiegato a tempo determinato con RAL €30.000, al primo rinnovo, con tasso INAIL 4‰:

```
RAL:                         €30.000,00
INPS Datore (28,98%):        € 8.694,00
Addizionale NASpI (1,9%):    €   570,00
Premio INAIL (4‰):           €   120,00
TFR (30.000/13,5):           € 2.222,22
Recupero 0,50% IVS sul TFR:  −€  150,00
──────────────────────────────────────────
Costo Aziendale:             €41.456,22
```

Lo stesso impiegato assunto a tempo indeterminato con il Bonus Giovani per tutto l'anno:

```
RAL:                         €30.000,00
INPS Datore (28,98%):        € 8.694,00
Esonero Bonus Giovani:       −€ 6.000,00   (€500 × 12 mesi)
Premio INAIL (4‰):           €   120,00
TFR (30.000/13,5):           € 2.222,22
Recupero 0,50% IVS sul TFR:  −€   46,48   (solo sul 31% di contributi non esonerati)
──────────────────────────────────────────
Costo Aziendale:             €34.989,74
```

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

#### 16. Mensilità Ordinaria, Tredicesima e Quattordicesima

Il netto annuo non si distribuisce in parti uguali tra le mensilità. In busta paga:

- le **detrazioni** (lavoro dipendente, carichi familiari, cuneo fiscale, altre detrazioni) sono riconosciute per dodicesimi sulle sole mensilità ordinarie;
- i **bonus** (indennità cuneo fiscale e trattamento integrativo) sono erogati mese per mese sulle mensilità ordinarie;
- le **addizionali** regionale e comunale sono trattenute a rate sulle mensilità ordinarie (dell'anno successivo, per il saldo);
- **tredicesima e quattordicesima** subiscono contributi e IRPEF, ma senza detrazioni, addizionali né bonus. L'IRPEF è calcolata applicando gli scaglioni mensili (scaglioni annui / 12) all'imponibile della sola mensilità aggiuntiva.

Il mese ordinario reale è quindi più alto della media `Netto Annuo / Mensilità` e la tredicesima più bassa. Il calcolatore mostra entrambi i valori: il **Netto mensile** è quello della mensilità ordinaria, accanto compare il netto della tredicesima (o di tredicesima e quattordicesima).

##### Mensilità aggiuntiva

```
Lordo             = RAL / Mensilità
Contributi INPS   = Lordo × (Contributi INPS annui / Imponibile previdenziale annuo)
Fondo pensione    = Contributo lavoratore annuo / Mensilità   (solo se ripartito per mensilità)
Imponibile IRPEF  = (Lordo − Contributi − Quota dedotta fondo) × (1 − Quota esente impatriati)
IRPEF lorda       = IRPEF(Imponibile × 12) / 12                (scaglioni mensili)
IRPEF trattenuta  = MIN(IRPEF lorda, IRPEF Finale annua / Mensilità aggiuntive)
Netto             = Lordo − Contributi − Fondo pensione − IRPEF trattenuta
```

Il minimo sull'IRPEF riproduce il conguaglio di fine anno: quando le detrazioni azzerano l'imposta dovuta nell'anno, la ritenuta della tredicesima viene restituita e anche la tredicesima risulta senza IRPEF.

##### Mensilità ordinaria

Ogni voce annua è ripartita per differenza, così che `12 × ordinaria + aggiuntive = importo annuo` per ogni voce e per il netto:

```
Voce ordinaria = (Voce annua − Mensilità aggiuntive × Voce aggiuntiva) / 12
```

Addizionali, bonus, fringe benefit e rimborsi tassati, welfare oltre soglia, borsa di studio, trattenuta auto e Gestione Separata del borsista gravano per intero sulle dodici mensilità ordinarie. I contributi ai fondi contrattuali sono mensili su dodici mesi; il contributo al fondo pensione segue l'opzione "ripartisci per mensilità".

##### Esempio: RAL €30.000, 13 mensilità, Lombardia, Milano

```
                        Ordinaria    Tredicesima
Lordo                   € 2.307,69   € 2.307,69
Contributi INPS 9,19%   € -212,08    € -212,08
Imponibile IRPEF        € 2.095,62   € 2.095,62
IRPEF lorda (23%)       €  481,99    €  481,99
Detrazioni              € -253,69    €      —
IRPEF trattenuta        € -228,30    € -481,99
Addizionali             €  -49,66    €      —
─────────────────────────────────────────────────
Netto                   € 1.817,66   € 1.613,62

Controllo: 12 × 1.817,66 + 1.613,62 = 23.425,52 = Netto Annuo
Media semplice (23.425,52 / 13) = 1.801,96
```

Il conguaglio di fine anno e le rate delle addizionali spostano gli importi tra i mesi, non il totale: il cedolino di dicembre e quelli dell'anno successivo possono discostarsi dalla mensilità ordinaria qui stimata.

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
│  6b. FONDI CONTRATTUALI (CCNL selezionati e personalizzati)     │
│      Contributi annui fissi lavoratore e azienda, per fondo:    │
│      → Sanitari: esenti entro €3.615,20 con il welfare sanità   │
│      → Previdenziali: nel plafond €5.300 con il fondo pensione  │
│      → Negri: dedotto per intero, riduce il plafond             │
│      → Non deducibili: trattenuta diretta dal netto             │
│      La quota lavoratore è sempre una trattenuta reale          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  6e. PREVIDENZA COMPLEMENTARE (se attiva)                       │
│      Contributo lav. + datore + EBITEMP + welfare, ded. ≤ €5.300│
│      → Riduce l'imponibile IRPEF (con cap)                     │
│      → Solo contributo lavoratore è trattenuta dal netto        │
│      → Datore, EBITEMP e welfare non sono trattenute            │
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
│  13b. MENSILITÀ                                                 │
│      Tredicesima/quattordicesima: lordo, contributi, IRPEF      │
│      sugli scaglioni mensili senza detrazioni, né addizionali   │
│      né bonus. Ordinaria = (annuo − aggiuntive) / 12            │
│      Netto Mensile = netto della mensilità ordinaria            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  14. COSTO AZIENDALE                                            │
│      = RAL + INPS Datore − Esonero + Addizionale NASpI          │
│        + Solidarietà 10% + INAIL + TFR (− 0,50% IVS)            │
│        + Fondi Contrattuali (datore) + Fondo Pensione (datore)  │
│        + Fringe Benefit + Rimborsi Trasferta + Benefit Non Tass.│
└─────────────────────────────────────────────────────────────────┘
```

### Riferimenti Normativi

| Normativa                | Contenuto                                |
| ------------------------ | ---------------------------------------- |
| **TUIR (DPR 917/1986)**  | Testo Unico Imposte sui Redditi          |
| **Art. 51 TUIR**         | Determinazione reddito lavoro dipendente |
| **Art. 13 TUIR**         | Detrazioni lavoro dipendente             |
| **Art. 12 TUIR**         | Detrazioni carichi familiari             |
| **L. 207/2024**          | Legge di Bilancio 2025                   |
| **L. 199/2025**          | Legge di Bilancio 2026                   |
| **D.Lgs. 192/2024**      | Riforma IRPEF-IRES                       |
| **L. 438/1992**          | Contributo aggiuntivo 1%                 |
| **Circ. AE 5/E/2024**    | Chiarimenti fringe benefit               |
| **Circ. AE 10/E/2025**   | Auto aziendali uso promiscuo             |
| **Circ. AE 15/E/2025**   | Rimborsi trasferta e tracciabilità       |
| **D.Lgs. 252/2005**      | Previdenza complementare                 |
| **Art. 10 TUIR**         | Deduzioni dal reddito complessivo        |
| **D.Lgs. 209/2023**      | Regime impatriati (rientro cervelli)     |
| **Art. 2120 c.c.**       | Trattamento di Fine Rapporto (TFR)       |
| **L. 297/1982**          | Contributo 0,50% IVS recuperato sul TFR  |
| **L. 92/2012**           | Contributo addizionale NASpI             |
| **D.L. 87/2018**         | Aumento addizionale NASpI per rinnovo    |
| **D.L. 103/1991**        | Contributo di solidarietà 10%            |
| **L. 153/1969, art. 12** | Imponibile previdenziale, esclusioni     |
| **Ris. AE 78/E/2004**    | Contributi FASI per pensionati e limite  |
| **L. 296/2006**          | Contribuzione apprendisti                |
| **D.L. 60/2024**         | Esoneri Bonus Giovani, Donne e ZES       |

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
