// data/kana.js — the writing system.
// Base 46 katakana are listed explicitly (each needs its own mnemonic + confusion set).
// Dakuten / handakuten / yoon are DERIVED at the bottom: they are a mechanical transform,
// and teaching them as a transform rather than as 60 new characters is the whole point.

const KATAKANA_BASE = [
  // --- vowels: the five columns everything else is built from ---
  ["ア","a","vowels","あ","A capital A that has fallen over backwards.", ["マ","ヤ"]],
  ["イ","i","vowels","い","Two strokes leaning left — the two 'ee' of a bird's beak.", ["リ","ノ"]],
  ["ウ","u","vowels","う","A roof with a chimney tick. 'Under' a roof.", ["ワ","ク","フ"]],
  ["エ","e","vowels","え","A capital E with the middle bar missing — an Elevator shaft.", ["ユ","コ"]],
  ["オ","o","vowels","お","A cross with a hook — a key in a lOck.", ["ホ","ネ"]],
  // --- k ---
  ["カ","ka","k","か","力 'power' — a KArate chop.", ["ガ","タ","ヌ"]],
  ["キ","ki","k","き","A KEY, teeth pointing right.", ["サ","チ"]],
  ["ク","ku","k","く","A crow's open beak: 'KUH!'", ["ワ","ケ","タ"]],
  ["ケ","ke","k","け","A slice of KEy-lime cake with a cut through it.", ["ク","タ"]],
  ["コ","ko","k","こ","Two horizontal strokes — a COrner bracket.", ["ユ","ロ","エ"]],
  // --- s ---
  ["サ","sa","s","さ","A plant sprouting with a stem through it — SAlad.", ["キ","セ"]],
  ["シ","shi","s","し","A smiling cup on its side: dots on the LEFT, stroke sweeps UP.", ["ツ","ミ"]],
  ["ス","su","s","す","A hook with a leg kicked out — SUper-hero landing.", ["ヌ","メ"]],
  ["セ","se","s","せ","A SEven with a bar driven through it.", ["サ","ヤ"]],
  ["ソ","so","s","そ","A single tick sloping down-RIGHT. One stroke going away.", ["ン","ノ"]],
  // --- t ---
  ["タ","ta","t","た","夕 'evening' — a TAll shadow at dusk.", ["ク","ケ","ナ","カ"]],
  ["チ","chi","t","ち","A CHair seen from the side, back-rest on top.", ["テ","キ"]],
  ["ツ","tsu","t","つ","A cup upright: dots on TOP, stroke sweeps DOWN. Water about to spill.", ["シ","ミ"]],
  ["テ","te","t","て","A TElephone pole with two wires.", ["チ","ラ"]],
  ["ト","to","t","と","A TOtem pole with one nail hammered in.", ["上"]],
  // --- n ---
  ["ナ","na","n","な","A KNife, blade crossing the handle.", ["メ","タ","オ"]],
  ["ニ","ni","n","に","二 — literally the number 2. NI = two.", ["エ","コ"]],
  ["ヌ","nu","n","ぬ","ス with NOOdles slung across it.", ["ス","メ","ヲ"]],
  ["ネ","ne","n","ね","A NEst balanced on a pole, twigs sticking out.", ["ホ","オ"]],
  ["ノ","no","n","の","A single slash — NO, crossed out.", ["イ","ソ","ン"]],
  // --- h ---
  ["ハ","ha","h","は","八 'eight' — two legs apart, HA-HA laughing.", ["ヘ","入"]],
  ["ヒ","hi","h","ひ","A HEEL of a boot, kicking right.", ["上","と"]],
  ["フ","fu","h","ふ","One stroke, the slope of Mt FUji.", ["ワ","ウ","ス"]],
  ["ヘ","he","h","へ","Identical to hiragana へ. A free one.", ["ハ"]],
  ["ホ","ho","h","ほ","木 'tree' — a HOly cross with sparks at the base.", ["ネ","オ","木"]],
  // --- m ---
  ["マ","ma","m","ま","A MArk — a tick inside a corner.", ["ア","ヤ"]],
  ["ミ","mi","m","み","Three strokes = 三 = three. MI as in み(three).", ["シ","ツ"]],
  ["ム","mu","m","む","A cow's MOOing mouth, open at the top.", ["メ","ヌ"]],
  ["メ","me","m","め","An X — crossed out, like a MEssed-up answer.", ["ナ","ヌ","ム"]],
  ["モ","mo","m","も","A fishhook with two crossbars — MOre fish.", ["ヨ","毛"]],
  // --- y ---
  ["ヤ","ya","y","や","An arrow (矢) flying — YA!", ["セ","マ","ア"]],
  ["ユ","yu","y","ゆ","A U lying down with a bar. U → YU.", ["コ","エ","ロ"]],
  ["ヨ","yo","y","よ","A comb with three teeth — E mirrored.", ["モ","ヲ","ロ"]],
  // --- r ---
  ["ラ","ra","r","ら","A banner on a flagpole — RAlly.", ["テ","ワ","フ"]],
  ["リ","ri","r","り","Two vertical strokes — same shape as hiragana り.", ["イ","川"]],
  ["ル","ru","r","る","Two legs, the right one curling into a loop.", ["レ","ハ"]],
  ["レ","re","r","れ","One bent stroke — a REd check mark.", ["ル","ノ"]],
  ["ロ","ro","r","ろ","口 'mouth' — a perfect square. ROom.", ["コ","ユ","日"]],
  // --- w / n ---
  ["ワ","wa","w","わ","ウ with its chimney knocked off — WAsted roof.", ["ウ","ク","フ","ラ"]],
  ["ヲ","wo","w","を","Archaic. ラ with a bar — you will almost never write it.", ["ラ","ヨ"]],
  ["ン","n","n-final","ん","A single tick sloping down-LEFT. The mirror of ソ.", ["ソ","ノ"]]
];

const DAKUTEN_MAP = { "カ":"ガ","キ":"ギ","ク":"グ","ケ":"ゲ","コ":"ゴ",
  "サ":"ザ","シ":"ジ","ス":"ズ","セ":"ゼ","ソ":"ゾ",
  "タ":"ダ","チ":"ヂ","ツ":"ヅ","テ":"デ","ト":"ド",
  "ハ":"バ","ヒ":"ビ","フ":"ブ","ヘ":"ベ","ホ":"ボ" };
const DAKUTEN_ROMAJI = { "ガ":"ga","ギ":"gi","グ":"gu","ゲ":"ge","ゴ":"go",
  "ザ":"za","ジ":"ji","ズ":"zu","ゼ":"ze","ゾ":"zo",
  "ダ":"da","ヂ":"dji","ヅ":"dzu","デ":"de","ド":"do",
  "バ":"ba","ビ":"bi","ブ":"bu","ベ":"be","ボ":"bo",
  "パ":"pa","ピ":"pi","プ":"pu","ペ":"pe","ポ":"po" };
const HANDAKUTEN_MAP = { "ハ":"パ","ヒ":"ピ","フ":"プ","ヘ":"ペ","ホ":"ポ" };
const HIRA_DAKUTEN = { "ガ":"が","ギ":"ぎ","グ":"ぐ","ゲ":"げ","ゴ":"ご","ザ":"ざ","ジ":"じ","ズ":"ず","ゼ":"ぜ","ゾ":"ぞ",
  "ダ":"だ","ヂ":"ぢ","ヅ":"づ","デ":"で","ド":"ど","バ":"ば","ビ":"び","ブ":"ぶ","ベ":"べ","ボ":"ぼ",
  "パ":"ぱ","ピ":"ぴ","プ":"ぷ","ペ":"ぺ","ポ":"ぽ" };

const YOON_BASE = { "キ":"ky","シ":"sh","チ":"ch","ニ":"ny","ヒ":"hy","ミ":"my","リ":"ry",
  "ギ":"gy","ジ":"j","ビ":"by","ピ":"py" };
const YOON_HIRA = { "キ":"き","シ":"し","チ":"ち","ニ":"に","ヒ":"ひ","ミ":"み","リ":"り",
  "ギ":"ぎ","ジ":"じ","ビ":"び","ピ":"ぴ" };

// Stroke counts. These drive the handwriting canvas's one objective check: if you drew the
// wrong number of strokes you have a stroke-order fault, and that is a fact rather than an
// opinion. Dakuten adds 2 (the two ticks), handakuten adds 1 (the circle).
const STROKES = {
  "ア":2,"イ":2,"ウ":3,"エ":3,"オ":3, "カ":2,"キ":3,"ク":2,"ケ":3,"コ":2,
  "サ":3,"シ":3,"ス":2,"セ":2,"ソ":2, "タ":3,"チ":3,"ツ":3,"テ":3,"ト":2,
  "ナ":2,"ニ":2,"ヌ":2,"ネ":4,"ノ":1, "ハ":2,"ヒ":2,"フ":1,"ヘ":1,"ホ":4,
  "マ":2,"ミ":3,"ム":2,"メ":2,"モ":3, "ヤ":2,"ユ":2,"ヨ":3,
  "ラ":2,"リ":2,"ル":2,"レ":1,"ロ":3, "ワ":2,"ヲ":3,"ン":2
};
const SMALL_STROKES = { "ャ":2, "ュ":2, "ョ":3 };

// A voiced yoon base such as ジ is a precomposed character, so it is not in STROKES directly:
// resolve it back through DAKUTEN_MAP (シ -> ジ) and add the two ticks.
function baseStrokes(ch) {
  if (STROKES[ch]) return STROKES[ch];
  for (const [plain, voiced] of Object.entries(DAKUTEN_MAP)) {
    if (voiced === ch) return (STROKES[plain] || 0) + 2;
  }
  for (const [plain, p] of Object.entries(HANDAKUTEN_MAP)) {
    if (p === ch) return (STROKES[plain] || 0) + 1;
  }
  return 0;
}

function buildKana() {
  const out = [];
  for (const [kana, romaji, row, hira, mnemonic, confuse] of KATAKANA_BASE) {
    out.push({ id: "ka-" + romaji, kana, romaji, row, type: "katakana", hira, mnemonic, confuse,
      strokes: STROKES[kana] || 0 });
  }
  for (const [base, d] of Object.entries(DAKUTEN_MAP)) {
    out.push({ id: "ka-" + DAKUTEN_ROMAJI[d] + "-d", kana: d, romaji: DAKUTEN_ROMAJI[d],
      row: "dakuten", type: "katakana", hira: HIRA_DAKUTEN[d],
      mnemonic: base + " + two ticks. Voiced: the same mouth shape with the throat switched on.",
      confuse: [base], strokes: (STROKES[base] || 0) + 2 });
  }
  for (const [base, h] of Object.entries(HANDAKUTEN_MAP)) {
    out.push({ id: "ka-" + DAKUTEN_ROMAJI[h] + "-h", kana: h, romaji: DAKUTEN_ROMAJI[h],
      row: "handakuten", type: "katakana", hira: HIRA_DAKUTEN[h],
      mnemonic: base + " + a small circle. Only the H-row takes the circle — that is the whole rule.",
      confuse: [base, DAKUTEN_MAP[base]], strokes: (STROKES[base] || 0) + 1 });
  }
  const smalls = [["ャ","a","ゃ"],["ュ","u","ゅ"],["ョ","o","ょ"]];
  for (const [base, pre] of Object.entries(YOON_BASE)) {
    for (const [sm, v, smh] of smalls) {
      out.push({ id: "ka-" + pre + v + "-y", kana: base + sm, romaji: pre + v,
        row: "yoon", type: "katakana", hira: YOON_HIRA[base] + smh,
        mnemonic: "i-column kana + small " + sm + ". The i-vowel drops and glides into " + v + ".",
        confuse: [], strokes: baseStrokes(base) + (SMALL_STROKES[sm] || 0) });
    }
  }
  return out;
}

window.KANA = buildKana();

// Hiragana, for the speed/placement drill only — he already knows these, so no mnemonics.
window.HIRAGANA = [
  "あ a","い i","う u","え e","お o","か ka","き ki","く ku","け ke","こ ko",
  "さ sa","し shi","す su","せ se","そ so","た ta","ち chi","つ tsu","て te","と to",
  "な na","に ni","ぬ nu","ね ne","の no","は ha","ひ hi","ふ fu","へ he","ほ ho",
  "ま ma","み mi","む mu","め me","も mo","や ya","ゆ yu","よ yo",
  "ら ra","り ri","る ru","れ re","ろ ro","わ wa","を wo","ん n"
].map(function (s) { const p = s.split(" ");
  return { id: "hi-" + p[1], kana: p[0], romaji: p[1], row: "base", type: "hiragana" }; });

// Loanword battery for the Sprint-1 exit test: read these cold, no romaji.
window.LOANWORDS = [
  ["コーヒー","coffee"],["テレビ","television"],["パソコン","PC"],["ビール","beer"],
  ["ホテル","hotel"],["タクシー","taxi"],["レストラン","restaurant"],["チョコレート","chocolate"],
  ["アイスクリーム","ice cream"],["インターネット","internet"],["スマートフォン","smartphone"],
  ["ジュース","juice"],["サッカー","soccer"],["ケーキ","cake"],["バス","bus"],
  ["カメラ","camera"],["ペン","pen"],["ノート","notebook"],["ドア","door"],["シャツ","shirt"],
  ["エレベーター","elevator"],["コンビニ","convenience store"],["アルバイト","part-time job"],
  ["クレジットカード","credit card"],["プレゼント","present"],["メール","email"],
  ["インド","India"],["デリー","Delhi"],["ムンバイ","Mumbai"],["アミット","Amit"]
].map(function (p, i) { return { id: "lw-" + i, kana: p[0], en: p[1] }; });
