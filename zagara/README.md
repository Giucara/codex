# Zàgarà · prototipo homepage

Prototipo HTML interattivo della homepage di **Zàgarà**, ristorante gastronomico a Catania (chef Massimiliano Romano). Desktop e mobile, con effetti di scroll e di cursore funzionanti.

## Aprire il prototipo

Non servono build né dipendenze: basta aprire `index.html` nel browser. Per servirlo in locale (consigliato, così i font Google si caricano senza avvisi):

```bash
npx serve zagara
```

## Struttura

```
zagara/
├── index.html     markup (testi in italiano, chiavi data-i18n per l'inglese)
├── css/style.css  stile: token colore/tipografia in :root, poi sezione per sezione
└── js/main.js     fiore SVG, scroll, cursore, rivelazioni, tab, lingua, badge
```

## Concept

La zagara è il fiore degli agrumi. Nell'hero un fiore di zagara (illustrazione SVG generata in `buildFlower`) si schiude mentre si scorre: il progresso segue la rotellina avanti e indietro, con una leggera inerzia, come un timelapse. Un contatore di fotogrammi (000/120) segnala che la sequenza è un segnaposto.

### Sostituire il fiore con il timelapse fotografico

Quando sarà pronta la sequenza reale, non serve toccare il markup:

```js
// in console o in uno script dopo main.js
ZAGARA.useFrames([
  'frames/zagara-0001.jpg',
  'frames/zagara-0002.jpg',
  // ...
]);
```

I fotogrammi vengono precaricati e disegnati su `<canvas>` in base allo scroll (`fit: 'cover'` di default, `{ fit: 'contain' }` per non tagliare). Consigli: 100–150 fotogrammi, formato quadrato o 4:5, lato lungo 1200–1600 px, JPEG/WebP ben compressi. Aggiornare la costante `FRAMES` in `main.js` per il contatore.

## Effetti e dove trovarli

| Effetto | File | Note |
| --- | --- | --- |
| Cursore personalizzato (24 px, `mix-blend-mode: difference`) | `main.js` → sezione "Cursore", `style.css` → `.cursor` | Attivo solo con mouse (`hover: hover` e `pointer: fine`). Stati: `invert` su logo e titoli, `label` su foto e CTA (etichetta con sfondo sfocato), `link` sugli altri link. |
| Titoli lettera per lettera (rotazione X, perno in basso, prospettiva) | `main.js` → `split()`, `style.css` → `.split-chars` | Classe `split split-chars`. I titoli secondari usano `split split-words` (parola per parola). |
| Zoom lento delle foto 1.15 → 1 | `main.js` → `updatePhotos()` | Su mobile diventa una singola transizione CSS (`.ph.in`). |
| Marquee | `style.css` → `.marquee` | Solo CSS, due gruppi identici per il loop continuo. |
| Badge rotante "Prenota un tavolo" | `index.html` → `.badge` | `textPath` su cerchio, rotazione CSS, link TheFork. |
| Header traslucido con blur | `main.js` → `updateHeader()` | Cambia tema chiaro/scuro in base alla sezione sotto l'header. |
| Fiore nell'hero | `main.js` → `buildFlower()`, `renderHero()` | Espone `--p` (progresso) e `--pe` (progresso con easing) come variabili CSS sull'hero. |

`prefers-reduced-motion`: cursore, marquee, rotazione del badge e rivelazioni disattivati; il fiore è mostrato aperto e l'hero diventa alto una schermata. Su mobile (≤ 860 px) le rivelazioni perdono la rotazione 3D e il fiore resta, ma con hero più corto.

## Lingua

Il pulsante IT/EN nell'header cambia tutti i testi marcati con `data-i18n`. L'italiano è letto dal markup, l'inglese sta nel dizionario `EN` in `main.js`. La scelta è ricordata in `localStorage`.

## Segnaposto da sostituire

- **Foto**: tutti i blocchi `.ph` sono segnaposto con didascalia che descrive lo scatto previsto.
- **Valutazioni e prezzo medio** nei badge di fiducia (contrassegnati con bordo tratteggiato).
- **Link TheFork**: costante `THEFORK_URL` in `main.js` (oggi punta alla home di TheFork).
- **Prezzi del menù, orari, P. IVA**, pagine "La nostra storia", "Menù completo", Privacy e Cookie policy (i link `#` mostrano un avviso).
- **Testi**: copy di prova in italiano e inglese, da validare con il ristorante.

## Tipografia e colori

Google Fonts con licenza OFL: **Cormorant Garamond** (display serif) e **Jost** (sans geometrico). Palette in `:root`: avorio `#F4EEE2`, verde foglia `#1B3A2A` / `#10261B`, accento oro `#C2913B`. Grana cartacea tramite `feTurbulence` in un overlay fisso (`.grain`).
