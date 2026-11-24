# Data contracts

All content files live in `data/` as plain JS that assigns a global. This is deliberate: the
dashboard runs from `file://` with no build step and no server, and `fetch()` of local JSON is
blocked by the browser. `<script src>` is not.

```js
window.KANA = [ ... ];
```

## Furigana

Any field named `jp` may contain `漢字[かんじ]` — a kanji run followed by its reading in square
brackets. `ruby()` in `app.js` renders it as `<ruby>漢字<rt>かんじ</rt></ruby>`. Bracket only the
run the reading belongs to: `食[た]べる`, not `食べる[たべる]`.

## `data/kana.js` → `window.KANA`

```js
{ id: "ka-a",        // unique, stable. "ka-" = katakana, "hi-" = hiragana
  kana: "ア",
  romaji: "a",
  row: "vowels",      // vowels|k|s|t|n|h|m|y|r|w|n-final|dakuten|handakuten|yoon
  type: "katakana",
  hira: "あ",          // the hiragana twin, for bridge drills
  mnemonic: "...",     // required for katakana
  confuse: ["ソ","ン"] // characters it is genuinely confused with. drives the trap drills
}
```

## `data/kanji.js` → `window.KANJI`

```js
{ id: "k-ichi",
  char: "一",
  keyword: "one",        // the single English keyword. unique across the whole deck.
  strokes: 1,
  level: "N5",
  sprint: 2,             // which sprint introduces it
  components: ["一"],     // radicals/parts, as characters
  mnemonic: "...",        // concrete, visual, uses the component keywords
  on: ["イチ","イツ"],      // on'yomi, katakana
  kun: ["ひと(つ)"],        // kun'yomi, hiragana, okurigana in parens
  words: [               // 2-4 real words. this is where readings are actually learned.
    { jp: "一[ひと]つ", en: "one thing", reading: "hitotsu" },
    { jp: "一月[いちがつ]", en: "January", reading: "ichigatsu" }
  ]
}
```

## `data/vocab.js` → `window.VOCAB`

```js
{ id: "v-mizu",
  jp: "水[みず]",
  kana: "みず",
  en: "water",
  pos: "n",              // n|v1|v5|virr|adj-i|adj-na|adv|part|exp|num|pron
  level: "N5",
  sprint: 2,
  sentence: { jp: "水[みず]を 飲[の]みます。", en: "I drink water." },
  note: ""               // optional nuance / usage warning
}
```

## `data/grammar.js` → `window.GRAMMAR`

```js
{ id: "g-desu",
  title: "AはBです",
  gloss: "A is B",
  level: "N5",
  sprint: 1,
  form: "Noun + は + Noun + です",
  explain: "...",         // 2-5 sentences. mechanism, not translation.
  examples: [ { jp: "...", en: "..." } ],
  contrast: "",           // what learners confuse it with, and the discriminating test
  drill: [                // cloze. ___ marks the blank, answer is the exact string.
    { prompt: "わたし ___ 学生[がくせい]です。", answer: "は" }
  ]
}
```

## Content files and load order

`dashboard/index.html` loads these in order; later files concatenate onto the globals the earlier
ones create, so order matters.

| File | Global | Holds |
|---|---|---|
| `data/kana.js` | `KANA`, `HIRAGANA`, `LOANWORDS` | katakana + derived forms, with `strokes` |
| `data/placement.js` | `PLACEMENT_WORDS`, `PLACEMENT_PARTICLES` | the session-1 diagnostic |
| `data/kanji.js` | `KANJI` | 1–80 (sprint 2) |
| `data/kanji-b.js` | appends | 81–130 (sprint 3) |
| `data/kanji-c.js` | appends | 131–180 (sprint 3) |
| `data/vocab.js` | `VOCAB` | N5 core |
| `data/vocab-n4.js` | appends | N4, sprints 3–8 |
| `data/grammar.js` | `GRAMMAR` | N5, sprints 1–4 |
| `data/grammar-n4.js` | appends | N4, sprints 5–8 |
| `data/reading.js` | `READING`, `POETRY` | graded passages, annotated haiku |

A file that appends must use `window.X = window.X.concat([...])`, never reassign.

## `data/reading.js` → `window.READING`

```js
{ id: "r-1", sprint: 1, level: "kana only", title: "はじめまして",
  blurb: "...",                              // why this passage, and how to read it
  lines: [ { jp: "...", en: "..." } ],       // one sentence per line, furigana in jp
  newWords: [ ["単語[たんご]", "word"] ],      // what is new here; keep it to a handful (i+1)
  questions: [ { q: "...", a: "..." } ] }    // about mechanism, not comprehension trivia
```

## Card fields added for the handwriting pad

A card may carry `glyph` (the character to ghost under the canvas) and `expect` (its true stroke
count). When `glyph` is present the review screen shows the pad, and on reveal it prints the
stroke-count verdict. `KANA` entries and `KANJI` entries both carry `strokes`; for derived kana it
is computed (dakuten +2, handakuten +1, yōon = base + small kana).

## `learner/progress.json`

```js
{ "updated": "ISO-8601",
  "sprint": 1,
  "srs": { "<cardId>": { "ease": 2.5, "interval": 1, "due": "ISO date", "reps": 3, "lapses": 0 } },
  "stats": { "<ISO date>": { "reviewed": 40, "correct": 34, "minutes": 22 } },
  "flags": { "katakanaDone": false, "romajiWeaned": false }
}
```

`cardId` is `<itemId>:<mode>` — e.g. `k-ichi:recognise`, `k-ichi:produce`, `v-mizu:listen`.
One item spawns several cards; they schedule independently. This is intentional.

## Scheduler

SM-2 derivative in `app.js`:

- grades: 0 = again, 1 = hard, 2 = good, 3 = easy
- new card → 10 min → 1d → 3d, then `interval = round(interval * ease)`
- `ease` starts 2.5, moves −0.20 / −0.15 / 0 / +0.15, clamped [1.3, 3.0]
- grade 0 → interval resets to 10 min, `lapses++`, ease −0.20
- daily new-card intake is capped (default 15) so the backlog cannot explode
