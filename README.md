# YACHASKA – What the Moon Saw / Lo que la Luna vio

**NASA Space Apps Challenge 2026 · Ayacucho, Peru · Challenge: _Abandoned but not Forgotten_**

**Live site:** https://yachaska-ayacucho.netlify.app

YACHASKA is a scroll-driven interactive web story for children (8–14) of the Andes and the Amazon. The objects NASA left on the Moon, on Mars and in deep space come alive and tell their own story in first person. They are introduced by **Killa, the Moon**, to **Killari**, a girl from Huanta (Ayacucho).

Each scene pairs a short poetic text with an original layered illustration, a verifiable **NASA fact** with its source, and an **Andean bridge** that connects the science to local knowledge (the dark-cloud llama Yacana, chasqui runners, chullpas, quipus, the q'inti hummingbird…).

## The story (8 chapters · 56 scenes)

| # | Chapter | Who speaks | NASA hardware |
|---|---|---|---|
| Prologue | A night in Huanta | Killa (the Moon) | – |
| I | I, Killa | Killa | The Moon, Apollo 11 |
| II | The cart that chose to stay | Apollo 17 Lunar Roving Vehicle | LRV (Apollo 15, 16, 17) |
| III | The mirror that still answers | Apollo 11 laser retroreflector | LRRR (still in use) |
| IV | A voice that went to the stars | Voyager Golden Record | Voyager 1 & 2 – Quechua greeting |
| V | My red brother | Spirit (MER-A) | Spirit, Opportunity |
| VI | The hummingbird of Mars | Ingenuity | Ingenuity, Perseverance |
| Epilogue | What is not forgotten | Killa | Catalogue of human-made material on the Moon, Artemis Accords (Peru, 2024) |

Final message: _what is told in your language is never forgotten._

## Languages

- **Spanish** and **English**: full text.
- **Quechua (Chanka)**: full story, facts, Andean bridges and interface (`js/story-qu.js`). It is an **AI-assisted draft** and must be reviewed and recorded by native Chanka Quechua speakers before the final submission. The Golden Record greeting is kept exactly as NASA publishes it.
- **Aymara** (`js/story-ay.js`): full AI-assisted draft, pending native-speaker review.
- **Asháninka** (`js/story-cni.js`) and **Shipibo-Konibo** (`js/story-shp.js`): full but short, **low-confidence** AI-assisted drafts with probable errors; technical words are Spanish loans. They must be corrected and recorded by native speakers before being presented as final.
- **Awajún** (`js/story-agr.js`): full but short, low-confidence AI-assisted draft.
- **Audio** (`audio/<es|en|qu>/<chapter>-<step>.mp3`, 168 files): Spanish (Microsoft es-PE Camila/Alex neural voices) and English (en-US Jenny/Guy) via `edge-tts`; Quechua via Meta MMS-TTS `facebook/mms-tts-quy` (Ayacucho Quechua, CC-BY-NC 4.0, non-commercial). The Quechua voice is synthetic and skips digits; replace it with a native speaker's recording using the same file names. Aymara, Asháninka, Awajún and Shipibo play the Spanish audio.

The page opens in **English** and **dark mode** by default; the reader's choice is remembered.

## Run it

No build step, no dependencies.

```bash
python -m http.server 5173
```

Open http://localhost:5173. Deploy by uploading the folder to Netlify or GitHub Pages.

## Structure

```
index.html          page shell
css/styles.css      design tokens (night / day), layout, scene animations
js/story.js         ALL story content (es/en), fact sheets, NASA photos, timeline
js/story-qu.js      Chanka Quechua draft, merged at load time
assets/nasa/        NASA public-domain photos (Image and Video Library IDs in the file names)
js/scenes.js        8 original SVG illustrations, built in code, with layers per step
js/app.js           scrollytelling (IntersectionObserver), language menu, theme, narration, CSV export
assets/             YACHASKA logos (night and day)
audio/qu/           Quechua recordings: <chapter-id>-<step>.mp3  (e.g. rover-3.mp3)
```

- **Add a translation:** add a `qu` (or `ay`, `cni`, `agr`, `shp`) key next to `es`/`en` in each `t`, `fact` and `bridge` of `js/story.js`, then set the language `status` to `"ok"`.
- **Translator sheet:** the "Download script for translators (CSV)" button at the end of the page exports every step (es, en, empty qu column, sources, audio file name).
- **Audio:** in Quechua the page plays `audio/qu/<chapter>-<step>.mp3`; if the file is missing it tells the reader and falls back to Spanish speech. Spanish and English use the browser's Web Speech API.

## Accessibility & privacy

Mobile-first, keyboard navigation (← → move between scenes, Esc stops audio), visible focus, `prefers-reduced-motion` respected, night/day switch remembered locally. No server, no cookies, no tracking, no personal data. Children appear only as illustrations, seen from behind.

## NASA data used

All facts link to their source inside the story and in the "Sources" section. Main sources: NASA Science (Moon, Voyager, Golden Record, Spirit, Opportunity, Perseverance, Ingenuity, LRO), NASA NSSDCA (Lunar Roving Vehicle), NASA JPL (Golden Record greetings and music), NASA History Office (Catalogue of Manmade Material on the Moon), NASA (Apollo 11, Apollo 17, Artemis Accords). Speaker figures: INEI 2017 Census.

**Before submitting, the data team must re-check every link and figure** (especially: the Peruvian pieces in the Golden Record music list, the Voyager 1 one-light-day milestone in late 2026, and the exact Quechua greeting text).

## Use of AI

AI was used to help write code and draft the Spanish and English text. All facts are checked against NASA sources. Indigenous-language text is never produced by AI. Illustrations are original SVG drawn in code; no NASA logos or insignia are used.
