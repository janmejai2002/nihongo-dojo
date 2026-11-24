/* audio.js — speech via the browser's own synthesiser.
   No network, no API key, no audio files to ship. The cost is that it depends on a Japanese
   voice being installed on the machine; if none is, we say so plainly rather than failing silent.

   Why synthesised speech is acceptable here: for shadowing and dictation at N5-N4, what matters
   is mora timing, pitch-accent shape and the ability to segment a stream. Modern system voices
   (Nanami on Windows, Kyoko on macOS) are good enough for all three. Native recordings beat them
   for prosody, and the roadmap moves to real audio — podcasts, drama — from Sprint 5. */
'use strict';

const Audio = (function () {
  let voices = [];
  let chosen = null;
  let ready = false;

  function pick() {
    voices = (window.speechSynthesis && window.speechSynthesis.getVoices()) || [];
    const ja = voices.filter(function (v) { return /^ja(-|_|$)/i.test(v.lang); });
    // prefer a local voice: it works offline, which is the entire point of this app
    chosen = ja.find(function (v) { return v.localService; }) || ja[0] || null;
    ready = true;
    return chosen;
  }

  if (window.speechSynthesis) {
    pick();
    window.speechSynthesis.onvoiceschanged = function () { pick(); if (typeof render === 'function') { /* voices arrive late in Chrome */ } };
  }

  function available() { if (!ready) pick(); return !!chosen; }
  function voiceName() { return chosen ? chosen.name : null; }
  function isLocal() { return chosen ? !!chosen.localService : false; }

  // strip furigana brackets and any romaji/English that crept into a field
  function clean(s) {
    return String(s || '').replace(/\[[^\]]*\]/g, '').replace(/\s*—.*$/, '').trim();
  }

  function speak(text, rate) {
    if (!window.speechSynthesis) return false;
    if (!available()) return false;
    const t = clean(text);
    if (!t) return false;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(t);
    u.voice = chosen;
    u.lang = chosen.lang || 'ja-JP';
    u.rate = rate || 1;
    u.pitch = 1;
    window.speechSynthesis.speak(u);
    return true;
  }

  function stop() { if (window.speechSynthesis) window.speechSynthesis.cancel(); }

  return { speak: speak, stop: stop, available: available, voiceName: voiceName,
    isLocal: isLocal, refresh: pick };
})();

window.Audio_ = Audio;
window.say = function (text, rate) { Audio.speak(text, rate); };

/* The banner shown wherever audio matters and no voice exists. Honest, and actionable. */
window.audioWarning = function () {
  if (Audio.available()) return '';
  return `<div class="card small" style="border-color:var(--kin);margin-bottom:16px">
    <strong>No Japanese voice is installed on this machine.</strong>
    <p style="margin:6px 0 0">Everything else works; only playback is unavailable. To fix it on
    Windows 11: <em>Settings → Time &amp; language → Language &amp; region → Add a language →
    日本語 (Japanese)</em>, and in the optional-features step make sure <strong>Speech</strong> is
    ticked. You do not need to change your display language — adding the language pack installs the
    Nanami and Keita voices and that is all this needs. Reload this page afterwards.</p>
    <p class="dim" style="margin:6px 0 0">You do not have to do this today. Listening formally
    enters the plan in Sprint 2 — but shadowing from the first week is what stops you becoming a
    learner who can read Japanese and not hear it.</p>
  </div>`;
};

window.audioStatus = function () {
  if (!Audio.available()) return '<span class="dim">no Japanese voice installed</span>';
  return '<span class="dim">voice: ' + esc(Audio.voiceName()) +
    (Audio.isLocal() ? ' · offline' : ' · <span style="color:var(--kin)">needs network</span>') + '</span>';
};
