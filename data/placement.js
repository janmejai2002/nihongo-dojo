// data/placement.js — the session-1 diagnostic.
// Purpose: measure, not teach. Three phases, each testing one claim in learner/profile.md that is
// currently only self-reported. Nothing new is introduced here; every item uses hiragana he says
// he already knows.

// Phase 2: the things that quietly break for people who "know hiragana".
// Each row: [word in hiragana, romaji answer, what it is testing]
window.PLACEMENT_WORDS = [
  ["がっこう","gakkou","dakuten + small っ"],
  ["きゅう","kyuu","yōon + long vowel"],
  ["じゃあ","jaa","voiced yōon"],
  ["びょういん","byouin","yōon + ou"],
  ["ざっし","zasshi","small っ before し"],
  ["しゅくだい","shukudai","yōon in first mora"],
  ["きって","kitte","small っ before て"],
  ["でんわ","denwa","ん before a vowel-ish mora"],
  ["ちゅうごく","chuugoku","yōon + long vowel + dakuten"],
  ["にっぽん","nippon","small っ + handakuten"],
  ["おねえさん","oneesan","long ee written with え"],
  ["とおい","tooi","long oo written with お"],
  ["こうこう","koukou","long oo written with う"],
  ["ひゃく","hyaku","yōon"],
  ["さんぽ","sanpo","handakuten after ん"],
  ["ぎゅうにゅう","gyuunyuu","two yōon, both long"],
  ["しょうがっこう","shougakkou","yōon + small っ in one word"],
  ["りょこう","ryokou","r-row yōon"],
  ["ぜんぶ","zenbu","two dakuten"],
  ["あさって","asatte","small っ before て, medial"]
];

// Phase 3: particle reading. Tests whether Duolingo exposure produced real knowledge
// or pattern-matching. Answer is the ROMAJI PRONUNCIATION, which is the whole point:
// は is read "wa" as a particle, へ is read "e", を is read "o".
window.PLACEMENT_PARTICLES = [
  ["わたしは がくせい です。","wa","は as a particle is pronounced WA"],
  ["がっこうへ いきます。","e","へ as a particle is pronounced E"],
  ["みずを のみます。","o","を is always pronounced O"],
  ["こんにちは","wa","the greeting ends in は, read WA"],
  ["これは ほんです。","wa","は as a particle"]
];
