<div align="center">

# 日本語道場 · Nihongo Dojo

**A fully offline Japanese trainer that takes you from kana to JLPT N3.**

No account. No server. No network. No dependencies. One folder and a browser.

</div>

---

## What this is

A complete, self-contained Japanese course: a spaced-repetition dashboard, a 16-sprint curriculum
to N3, mnemonic-based kanji instruction, printable handwriting worksheets, and a diagnostic that
measures what you actually know before it teaches you anything.

It is built to be driven by an AI instructor (it ships with a `CLAUDE.md` operating manual and a
`/nihon` slash command for [Claude Code](https://claude.com/claude-code)), but **the app itself is
plain HTML, CSS and JavaScript and runs perfectly well on its own.** Open `dashboard/index.html` in
any browser and it works — on a plane, in a tunnel, forever.

### Why it exists

Most Japanese apps optimise for engagement. This one optimises for the things the research actually
supports: retrieval practice over re-reading, spaced repetition on every atomic item, radical
decomposition with mnemonics instead of rote kanji copying, readings learned through words rather
than from reading tables, interleaved review, desirable difficulty targeted at ~80–85% accuracy,
and handwriting treated as a memory channel rather than as calligraphy homework.

It also tells you the truth. The progress tab reports real retention, and if you are behind the
curriculum it says so instead of congratulating you.

## Install (Windows)

```powershell
git clone https://github.com/<you>/nihongo.git
cd nihongo
.\install.ps1
```

Then press the Windows key and type **nihongo**. It installs as a proper app — its own window, its
own taskbar entry, pinnable to Start, with an icon. No admin rights, no services, no registry keys;
the installer just creates Start Menu shortcuts that open the dashboard in a chrome-less browser
window.

`.\install.ps1 -Desktop` also adds a desktop shortcut. `.\install.ps1 -Uninstall` removes both and
leaves everything else alone.

### Any other OS

Open `dashboard/index.html` in a browser. That is the whole installation. Everything below works
identically; only the Start Menu shortcut is Windows-specific.

## What's inside

**The dashboard** — Today's session plan, SRS review, a katakana lab with mnemonics and
confusion-pair trap drills, a kanji lab with component decomposition, vocabulary, grammar with
mechanism explanations, honest progress instrumentation, and the full sprint plan.

**The SRS** — an SM-2 derivative. Each item spawns several independently scheduled cards
(recognise / produce / reading), so knowing 水 means *water* and being able to write it are tracked
as the separate skills they are. Daily new-card intake is capped so the backlog cannot explode.

**The placement diagnostic** — three timed phases measuring hiragana recognition *speed* (not just
accuracy), control of dakuten / yōon / small っ / long vowels, and particle pronunciation. It
branches into a real verdict and changes the plan if you fail a phase.

**The worksheets** — print-first A4 tracing sheets for katakana and kanji, plus blank genkōyōshi.
They request *UD Digi Kyokasho*, the Japanese school-textbook font bundled with Windows 11, so you
trace handwritten letterforms rather than print ones.

**The curriculum** — 16 sprints from kana to N3, each with an explicit exit test, plus parallel
reading, listening, film and poetry ladders. The hour budget is stated honestly in
[`curriculum/ROADMAP.md`](curriculum/ROADMAP.md), including why 2 h/day is the threshold below
which N3 in a year does not happen.

## Layout

```
CLAUDE.md               instructor operating manual — pedagogical standards and session protocol
curriculum/ROADMAP.md   16 sprints, hour budget, exit tests, reading & film ladders
curriculum/STANDARDS.md data schemas and the SRS algorithm — read before editing data/
data/*.js               content: kana, kanji, vocabulary, grammar, placement
dashboard/              the app
worksheets/             printable sheets
learner/                your profile, log and progress — gitignored, see learner/README.md
install.ps1             Start Menu installation
START.ps1               launch without installing
```

Content lives in `data/*.js` as plain globals assigned to `window`, loaded with `<script src>`.
That is deliberate: `fetch()` of a local JSON file is blocked by browsers over `file://`, and this
app has to run from the filesystem. The schemas are documented in
[`curriculum/STANDARDS.md`](curriculum/STANDARDS.md) and are stable.

## Your progress is yours

Everything persists in your browser's `localStorage`, keyed to this folder. Nothing is transmitted
anywhere, because there is nowhere for it to go. The **Sync** button in the Progress tab exports a
JSON file you can back up, move to another machine, or hand to an AI instructor to re-plan against.

## Contributing

Content additions are welcome and must follow the schemas in `curriculum/STANDARDS.md` exactly.
The bar, taken from `CLAUDE.md`:

- Every kanji ships with components, a concrete mnemonic built from those components, and 2–4 real
  words. Readings are taught through words, never as a table.
- Every vocabulary item ships inside a natural sentence. If no Japanese person would say it,
  rewrite it.
- Every grammar point explains the *mechanism*, and names the thing learners confuse it with plus
  the test that discriminates them.
- No romaji in any material past Sprint 1.

## Licence

MIT — see [LICENSE](LICENSE). The curriculum, mnemonics and worksheets are covered by the same
licence; use them however you like.
