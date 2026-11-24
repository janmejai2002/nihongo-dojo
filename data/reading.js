// data/reading.js — graded passages.
// Rule: a passage may contain at most a handful of items the reader has not met. Comprehensible
// input works at i+1; at i+5 it stops being input and becomes decoding, which teaches nothing.
// Every passage declares the sprint it unlocks at and lists what is new in it.

window.READING = [
{ id: "r-1", sprint: 1, level: "kana only", title: "はじめまして",
  blurb: "Your first passage. No kanji at all — this is readable with hiragana and katakana alone, " +
         "which is exactly why katakana comes first. Find every katakana word before you translate.",
  lines: [
    { jp: "はじめまして。", en: "How do you do." },
    { jp: "わたしは ジャンメジャイです。", en: "I am Janmejai." },
    { jp: "インドから きました。", en: "I came from India." },
    { jp: "がくせいです。", en: "I am a student." },
    { jp: "コーヒーが すきです。", en: "I like coffee." },
    { jp: "にほんごを べんきょうして います。", en: "I am studying Japanese." },
    { jp: "どうぞ よろしく おねがいします。", en: "Pleased to meet you." }
  ],
  newWords: [["はじめまして","how do you do"],["きました","came"],["すき","liked"],["どうぞよろしく","pleased to meet you"]],
  questions: [
    { q: "Which three words in this passage are written in katakana, and why those three?",
      a: "ジャンメジャイ, インド, コーヒー — a foreign name, a foreign country, a loanword. That is the whole rule for katakana in one sentence." },
    { q: "Why is there no word for 'I' in lines 4, 5, 6 and 7?",
      a: "Japanese drops anything recoverable from context. The topic was set in line 2 and stays set until something changes it. English repeats the subject; Japanese considers that noise." }
  ]},

{ id: "r-2", sprint: 2, level: "N5 · 80 kanji", title: "わたしの一日",
  blurb: "Every kanji here is in your deck. If one stops you, that is useful information — go and " +
         "look at it in the kanji lab rather than guessing from context.",
  lines: [
    { jp: "毎日[まいにち] 六時[ろくじ]に 起[お]きます。", en: "I get up at six every day." },
    { jp: "朝[あさ]ごはんを 食[た]べて、コーヒーを 飲[の]みます。", en: "I eat breakfast and drink coffee." },
    { jp: "八時[はちじ]に 電車[でんしゃ]で 大学[だいがく]へ 行[い]きます。", en: "At eight I go to university by train." },
    { jp: "大学[だいがく]で 友[とも]だちに 会[あ]います。", en: "I meet friends at the university." },
    { jp: "昼[ひる]は 学校[がっこう]の 食堂[しょくどう]で ごはんを 食[た]べます。", en: "At noon I eat a meal at the school canteen." },
    { jp: "午後[ごご]は 本[ほん]を 読[よ]みます。", en: "In the afternoon I read books." },
    { jp: "六時[ろくじ]に 家[いえ]へ 帰[かえ]ります。", en: "At six I return home." },
    { jp: "夜[よる]は 日本語[にほんご]を 勉強[べんきょう]します。", en: "At night I study Japanese." },
    { jp: "十一時[じゅういちじ]に 寝[ね]ます。", en: "I go to sleep at eleven." }
  ],
  newWords: [["食堂[しょくどう]","canteen"],["午後[ごご]","afternoon"]],
  questions: [
    { q: "Three different particles mark place in this passage: に, で and へ. Find one of each and say why each is the one used.",
      a: "大学へ行きます — へ is direction of travel. 大学で会います — で is the arena an action happens in. 六時に起きます — に is a point (here in time, but the same logic covers destinations). Point vs arena vs heading: that contrast is the spine of N5." },
    { q: "Line 2 chains two actions. What form does that, and what tense is the first verb in?",
      a: "食べて is the て-form. It has no tense of its own — the whole chain takes its tense from 飲みます at the end. This is why Japanese sentences cannot be understood until they finish." }
  ]},

{ id: "r-3", sprint: 3, level: "N5 · adjectives + て-form", title: "日本の天気",
  blurb: "Adjective conjugation in the wild. Every い-adjective here carries its own tense — " +
         "watch how です never changes while the adjective does all the work.",
  lines: [
    { jp: "日本[にほん]には 四[よっ]つの 季節[きせつ]が あります。", en: "Japan has four seasons." },
    { jp: "春[はる]は あたたかくて、花[はな]が きれいです。", en: "Spring is warm and the flowers are beautiful." },
    { jp: "夏[なつ]は とても 暑[あつ]いです。", en: "Summer is very hot." },
    { jp: "でも、インドの 夏[なつ]ほど 暑[あつ]くないです。", en: "But it isn't as hot as an Indian summer." },
    { jp: "秋[あき]は すずしくて、気持[きも]ちが いいです。", en: "Autumn is cool and feels good." },
    { jp: "冬[ふゆ]は 寒[さむ]いです。雪[ゆき]が 降[ふ]ります。", en: "Winter is cold. It snows." },
    { jp: "昨日[きのう]は 寒[さむ]かったですが、今日[きょう]は あたたかいです。", en: "Yesterday was cold, but today is warm." }
  ],
  newWords: [["季節[きせつ]","season"],["あたたかい","warm"],["すずしい","cool"],["〜ほど〜ない","not as ... as"],["降[ふ]る","to fall (rain/snow)"]],
  questions: [
    { q: "Line 2 and line 5 both join two adjectives. How, and what is the rule?",
      a: "あたたかくて and すずしくて — the て-form of an い-adjective: drop い, add くて. The same て that chains verbs chains adjectives. One form, two jobs." },
    { q: "Line 7 says 寒かったですが, not 寒いでしたが. Why is 寒いでした wrong?",
      a: "An い-adjective carries its own tense. です is only politeness and never conjugates for an adjective. Putting the past on です instead of on 寒い is the single commonest beginner error in writing." }
  ]},

{ id: "r-4", sprint: 4, level: "N5 complete", title: "漢字の勉強",
  blurb: "A passage about the thing you are doing. Meta, but the vocabulary is the vocabulary you " +
         "will actually use when you talk about studying — which you will, constantly.",
  lines: [
    { jp: "漢字[かんじ]を 勉強[べんきょう]するのは 難[むずか]しいです。", en: "Studying kanji is difficult." },
    { jp: "でも、毎日[まいにち] 少[すこ]し ずつ 覚[おぼ]えることが できます。", en: "But you can memorise a little each day." },
    { jp: "漢字[かんじ]には 部品[ぶひん]が あります。", en: "Kanji have components." },
    { jp: "たとえば、「明[あかる]い」は 日[ひ]と 月[つき]です。", en: "For example, 明 is 'sun' and 'moon'." },
    { jp: "日[ひ]と 月[つき]が あるから、「明[あか]るい」です。", en: "Because there is a sun and a moon, it means 'bright'." },
    { jp: "部品[ぶひん]を 覚[おぼ]えると、新[あたら]しい 漢字[かんじ]も 分[わ]かります。", en: "Once you learn the components, you understand new kanji too." },
    { jp: "毎日[まいにち] 書[か]かなければなりません。", en: "You have to write every day." },
    { jp: "そうすれば、一年[いちねん]で たくさん 覚[おぼ]えられます。", en: "If you do that, you can memorise a lot in a year." }
  ],
  newWords: [["部品[ぶひん]","component, part"],["覚[おぼ]える","to memorise"],["たとえば","for example"],["〜ずつ","at a time, each"],["明[あか]るい","bright"]],
  questions: [
    { q: "Line 1 turns a verb into a noun. Which word does it, and what is the sentence literally saying?",
      a: "の nominalises 勉強する. Literally: 'the studying-of-kanji thing is difficult.' Japanese has no infinitive — to make a verb behave like a noun you wrap it in の or こと. This is the mechanism behind half of N3 grammar." },
    { q: "明 appears here as a worked example. Decompose it and say why the mnemonic works.",
      a: "日 (sun) + 月 (moon). The two brightest things in the sky, side by side: bright. It also shows the general principle — most kanji are not pictures of their meaning, they are combinations of parts, and the parts are a small set you already know." }
  ]}
];

// Poetry. Enters formally in Sprint 6 but sits here from the start, because the single best
// argument for learning this language is on display in seventeen syllables.
window.POETRY = [
{ id: "p-basho-kawazu", sprint: 6, author: "松尾芭蕉 · Matsuo Bashō (1686)", form: "haiku",
  jp: ["古池[ふるいけ]や", "蛙[かわず]飛[と]びこむ", "水[みず]の音[おと]"],
  romaji: ["furu ike ya", "kawazu tobikomu", "mizu no oto"],
  en: "The old pond — / a frog jumps in / the sound of water",
  note: "The most famous poem in Japanese, and grammatically it is within your reach already: " +
        "a noun, a verb, and a の phrase. や is a cutting-word (切[き]れ字[じ]) — it marks a pause " +
        "and an implicit 'this:', setting the scene against which the next image lands. Note what " +
        "is absent: no adjective tells you the pond is still, no verb says the silence returns. " +
        "The poem is three nouns and one motion, and everything else is left for you to supply. " +
        "That omission — 省略[しょうりゃく] — is not Bashō being clever. It is how the language works."},
{ id: "p-basho-natsukusa", sprint: 6, author: "松尾芭蕉 · Matsuo Bashō (1689)", form: "haiku",
  jp: ["夏草[なつくさ]や", "兵[つわもの]どもが", "夢[ゆめ]の跡[あと]"],
  romaji: ["natsukusa ya", "tsuwamonodomo ga", "yume no ato"],
  en: "Summer grasses — / all that remains / of warriors' dreams",
  note: "Written on a battlefield where an army was annihilated five hundred years earlier. " +
        "跡[あと] is 'trace, remains'. The whole poem is a noun phrase: the summer grass IS the " +
        "trace of the dreams of soldiers. No verb, no 'is' — the juxtaposition does the work that " +
        "an English sentence would need a main clause for."},
{ id: "p-issa-snail", sprint: 6, author: "小林一茶 · Kobayashi Issa (1819)", form: "haiku",
  jp: ["蝸牛[かたつむり]", "そろそろ登[のぼ]れ", "富士[ふじ]の山[やま]"],
  romaji: ["katatsumuri", "sorosoro nobore", "fuji no yama"],
  en: "Snail, / climb Mount Fuji — / slowly, slowly",
  note: "登れ is the imperative. そろそろ is one of the mimetic words (擬態語[ぎたいご]) that " +
        "English has almost no equivalent for — it is the feeling of 'gradually, at one's own " +
        "unhurried pace, any moment now'. Japanese has hundreds of these and they are not " +
        "decorative; they do work that English does with whole clauses. Also: this is the best " +
        "possible epigraph for a one-year N3 attempt."}
];
