/* =========================================================================
   YACHASKA – lógica: render, scrollytelling, lenguas, tema y narración
   ========================================================================= */
(function () {
  "use strict";

  const { VOICES, LANGS, UI, CHAPTERS, OBJECTS, TIMELINE } = window.YACHASKA;
  const SCENES = window.YACHASKA_SCENES;
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));

  /* ---------- almacenamiento seguro ---------- */
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* sin almacenamiento */ } }
  };

  /* ---------- estado ---------- */
  const state = {
    lang: initialLang(),
    autoplay: store.get("yachaska-autoplay") !== "0", // narración activada por defecto
    current: { ch: -1, step: 0 },
    speaking: null
  };

  function initialLang() {
    const saved = store.get("yachaska-lang");
    if (saved && LANGS.some((l) => l.code === saved)) return saved;
    return "en"; // por defecto: inglés (jueces internacionales)
  }

  /* lengua del contenido: inglés, o castellano como respaldo */
  const contentLang = () => (state.lang === "en" ? "en" : "es");
  const tx = (o) => (o ? (o[state.lang] != null ? o[state.lang] : o[contentLang()]) : "");
  const ui = (k) => (UI[state.lang] && UI[state.lang][k] != null ? UI[state.lang][k] : UI[contentLang()][k]);
  const L = (es, en, qu) => (state.lang === "qu" ? (qu || es) : contentLang() === "en" ? en : es);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));


  function specsHTML(ch) {
    if (!ch.specs.length) return "";
    return `<dl class="specs" aria-label="${esc(ui("specs"))}"><div class="specs__t">${esc(ui("specs"))}</div>${ch.specs.map((p) => `<div><dt>${esc(tx(p.k))}</dt><dd>${esc(tx(p.v))}</dd></div>`).join("")}</dl>`;
  }
  function mediaHTML(ch) {
    if (!ch.media.length) return "";
    return `<div class="ch-media">${ch.media.map((m, i) => `<figure class="photo${i ? " photo--2" : ""}">
        <img src="${m.src}" alt="${esc(tx(m.cap))}" loading="lazy" decoding="async">
        <figcaption><span class="photo__tag">${esc(ui(m.kind === "artist" ? "artist" : "photo"))} · ${esc(m.id)}</span>${esc(tx(m.cap))}</figcaption>
      </figure>`).join("")}</div>`;
  }

  function renderHero() {
    $("#heroArt").innerHTML = SCENES.hero(L);
    $("#heroArt").setAttribute("aria-label", ui("heroAlt"));
    const seen = new Set();
    const items = [];
    CHAPTERS.forEach((ch) => ch.media.forEach((m) => { if (!seen.has(m.id)) { seen.add(m.id); items.push({ m, ch }); } }));
    $("#cast").innerHTML = items.map(({ m, ch }) => `<button class="cast__item" type="button" data-goto="${ch.id}" data-body="${ch.body}">
        <img src="${m.src}" alt="" loading="lazy" decoding="async">
        <span><b>${esc(tx(ch.no))}</b> ${esc(tx(m.cap))}</span>
      </button>`).join("");
  }

  /* ---------- render del cuento ---------- */
  function renderStory() {
    const root = $("#story");
    root.innerHTML = CHAPTERS.map((ch, ci) => {
      const v = VOICES[ch.voice];
      const steps = ch.steps.map((st, si) => {
        const who = VOICES[st.who || ch.voice];
        const open = window.matchMedia("(min-width: 900px)").matches ? " open" : "";
        const fact = st.fact ? `<details class="box box--fact"${open}><summary>${esc(ui("fact"))}</summary><div><p>${esc(tx(st.fact))}</p><a class="src" href="${st.fact.src}" target="_blank" rel="noopener">${esc(ui("source"))}: ${esc(st.fact.label)} ↗</a></div></details>` : "";
        const bridge = st.bridge ? `<details class="box box--bridge"${open}><summary>${esc(ui("bridge"))}</summary><div><p>${esc(tx(st.bridge))}</p></div></details>` : "";
        const moon = (st.who || ch.voice) === "killa" ? " is-moon" : "";
        return `<article class="step" data-ch="${ci}" data-step="${si + 1}" style="--vc:${who.color}">
          <div class="card">
            <span class="voice">${esc(tx(who))}</span>
            <p class="verse${moon}">${esc(tx(st.t))}</p>
            ${fact}${bridge}
            <div class="card__foot">
              <span class="step-count">${si + 1} / ${ch.steps.length}</span>
              <button class="btn btn--ghost btn--sm play" type="button" aria-pressed="false" data-ch="${ci}" data-step="${si}"><span aria-hidden="true">▶</span> <span class="lbl">${esc(ui("listen"))}</span></button>
            </div>
          </div>
        </article>`;
      }).join("");
      return `<section class="chapter" id="${ch.id}" data-body="${ch.body}" aria-labelledby="t-${ch.id}">
        <header class="ch-cover${ch.media.length ? " has-media" : ""}">
          <div class="ch-cover__in">
            <div class="awayu awayu--thin" aria-hidden="true"></div>
            <span class="ch-no">${esc(tx(ch.no))} · ${esc(ui("body_" + ch.body))}</span>
            <h2 class="ch-title" id="t-${ch.id}">${esc(tx(ch.title))}</h2>
            <p class="ch-teaser">${esc(tx(ch.teaser))}</p>
            <span class="voice" style="--vc:${v.color}">${esc(tx(v))}</span>
            ${specsHTML(ch)}
          </div>
          ${mediaHTML(ch)}
          <span class="scroll-hint">${esc(ui("scroll"))}</span>
        </header>
        <div class="scrolly">
          <figure class="scene-wrap" style="margin:0">
            <svg class="scene" id="scene-${ch.id}" viewBox="0 0 800 600" role="img" aria-label="${esc(tx(ch.title))}" xmlns="http://www.w3.org/2000/svg">${SCENES[ch.scene](L)}${SCENES.finish("f-" + ch.id)}</svg>
          </figure>
          <div class="steps">${steps}</div>
        </div>
      </section>`;
    }).join("");
    observeSteps();
  }

  function renderChrome() {
    document.documentElement.lang = state.lang;
    $$("[data-ui]").forEach((el) => { el.textContent = ui(el.dataset.ui); });
    $$("[data-ui-label]").forEach((el) => { const t = ui(el.dataset.uiLabel); el.setAttribute("aria-label", t); el.title = t; });
    document.title = `YACHASKA – ${ui("title")}`;
    const cur = LANGS.find((l) => l.code === state.lang);
    $("#langName").textContent = cur.native;
    $("#langBtn").dataset.code = cur.code.toUpperCase();
    $("#langBtn").setAttribute("aria-label", `${ui("menuLang")}: ${cur.native}`);
    $("#theme").setAttribute("aria-label", ui("menuTheme"));

    // menú de lenguas
    $("#langMenu").innerHTML = `<h3>${esc(ui("chooseLang"))}</h3>` + LANGS.map((l) =>
      `<button class="lang-opt${l.status === "next" ? " is-next" : ""}" role="menuitemradio" aria-checked="${l.code === state.lang}" data-lang="${l.code}" lang="${l.code}">
        <span>${esc(l.native)}<br><small>${esc(l.name)}</small></span>
        <span class="badge badge--${l.status}">${esc(ui("st_" + l.status))}</span>
      </button>`).join("");
    // chips de portada
    $("#heroChips").innerHTML = LANGS.map((l) =>
      `<button class="chip${l.status === "next" ? " is-next" : ""}" type="button" aria-pressed="${l.code === state.lang}" data-lang="${l.code}" lang="${l.code}">${esc(l.native)}</button>`).join("");

    // progreso
    $("#progress").innerHTML = CHAPTERS.map((ch, i) =>
      `<button type="button" data-goto="${ch.id}" data-body="${ch.body}" aria-label="${esc(tx(ch.no))}: ${esc(tx(ch.title))}" title="${esc(tx(ch.title))}"><i></i></button>`).join("");
    // índice
    $("#toc").innerHTML = CHAPTERS.map((ch) =>
      `<li><a href="#${ch.id}" data-body="${ch.body}"><span class="no">${esc(tx(ch.no))} · ${esc(ui("body_" + ch.body))}</span><span class="tt">${esc(tx(ch.title))}</span><span class="ts">${esc(tx(ch.teaser))}</span></a></li>`).join("");

    renderHero();
    renderExtras();
    if ($("#muteLbl")) renderMute();
    updateProgress();
  }

  function renderExtras() {
    const last = CHAPTERS[CHAPTERS.length - 1].steps;
    const finalLine = tx(last[last.length - 1].t);
    const quote = finalLine.split(":").pop().trim();
    const q = quote.replace(/^[«“"]|[.»”"]+$/g, "");
    $("#finaleQuote").textContent = `«${q.charAt(0).toUpperCase() + q.slice(1)}»`;

    $("#objects").innerHTML = OBJECTS.map((o) => {
      const ch = CHAPTERS.find((c) => c.id === o.chapter);
      return `<button class="obj" type="button" data-goto="${o.chapter}" data-body="${o.body}">
        <span class="tag">${esc(ui("body_" + o.body))} · ${o.year}</span>
        <strong>${esc(tx(o.name))}</strong>
        <small>${esc(ui("status"))}: ${esc(tx(ch.status))}</small>
      </button>`;
    }).join("");

    const fmt = new Intl.NumberFormat(contentLang() === "en" ? "en-US" : "es-PE");
    const rows = LANGS.filter((l) => l.speakers).map((l) =>
      `<tr><td><strong lang="${l.code}">${esc(l.native)}</strong><br><small>${esc(l.name)}</small></td><td>${esc(l.family)}</td><td class="num">${fmt.format(l.speakers)}</td><td>${esc(tx(l.region))}</td><td><span class="badge badge--${l.status}">${esc(ui("st_" + l.status))}</span></td></tr>`).join("");
    $("#langsTable").innerHTML = `<caption class="sr-only">${esc(ui("langsTitle"))}</caption><thead><tr><th>${esc(ui("thLang"))}</th><th>${esc(ui("thFamily"))}</th><th>${esc(ui("thSpeakers"))}</th><th>${esc(ui("thRegion"))}</th><th>${esc(ui("thStatus"))}</th></tr></thead><tbody>${rows}</tbody>`;

    $("#timeline").innerHTML = TIMELINE.map((e) => `<li data-body="${e.body}"><span class="tl__y">${e.y}</span><span class="tl__t">${esc(tx(e.t))}</span></li>`).join("");

    const seen = new Map();
    CHAPTERS.forEach((ch) => ch.steps.forEach((st) => { if (st.fact && !seen.has(st.fact.src)) seen.set(st.fact.src, { label: st.fact.label, chs: new Set() }); if (st.fact) seen.get(st.fact.src).chs.add(tx(ch.no)); }));
    $("#sources").innerHTML = Array.from(seen.entries()).map(([url, v]) =>
      `<li><a href="${url}" target="_blank" rel="noopener">${esc(v.label)}</a> <small>— ${esc(Array.from(v.chs).join(", "))}</small></li>`).join("") +
      `<li>${esc(L("Fotos: NASA Image and Video Library (dominio público) — ", "Photos: NASA Image and Video Library (public domain) — ", "Fotokuna: NASA Image and Video Library — "))}${Array.from(new Set(CHAPTERS.flatMap((c) => c.media.map((m) => m.id)))).map((id) => `<a href="https://images.nasa.gov/details/${id.toLowerCase().startsWith("as") ? id.toLowerCase() : id}" target="_blank" rel="noopener">${id}</a>`).join(", ")}</li>` +
      `<li>INEI – Censo Nacional 2017 (${esc(L("lenguas maternas; cifras recopiladas por L. Andrade, PUCP", "mother tongues; figures compiled by L. Andrade, PUCP"))})</li>`;
  }

  /* ---------- scrollytelling ---------- */
  let observer = null;
  function observeSteps() {
    if (observer) observer.disconnect();
    const mobile = window.matchMedia("(max-width: 899px)").matches;
    observer = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        activate(+e.target.dataset.ch, +e.target.dataset.step);
      });
    }, { rootMargin: mobile ? "-62% 0px -30% 0px" : "-48% 0px -48% 0px", threshold: 0 });
    $$(".step").forEach((s) => observer.observe(s));
  }

  function applyScene(ci, step) {
    const svg = $("#scene-" + CHAPTERS[ci].id);
    if (!svg) return;
    $$(".ly", svg).forEach((g) => {
      const show = +g.dataset.show, hide = g.dataset.hide ? +g.dataset.hide : Infinity;
      g.classList.toggle("on", step >= show && step < hide);
    });
  }

  function activate(ci, step, silent) {
    const prev = state.current;
    if (prev.ch === ci && prev.step === step) return;
    state.current = { ch: ci, step };
    $$(".step.is-active").forEach((s) => s.classList.remove("is-active"));
    const el = $(`.step[data-ch="${ci}"][data-step="${step}"]`);
    if (el) el.classList.add("is-active");
    applyScene(ci, step);
    updateProgress();
    if (state.autoplay && !silent) speakStep(ci, step - 1);
  }

  function updateProgress() {
    const btns = $$("#progress button");
    btns.forEach((b, i) => {
      const bar = b.querySelector("i");
      let w = 0;
      if (i < state.current.ch) w = 100;
      else if (i === state.current.ch) w = Math.round((state.current.step / CHAPTERS[i].steps.length) * 100);
      bar.style.width = w + "%";
      b.classList.toggle("is-current", i === state.current.ch);
      if (i === state.current.ch) b.setAttribute("aria-current", "step"); else b.removeAttribute("aria-current");
    });
  }

  function gotoStep(delta) {
    const all = $$(".step");
    let idx = all.findIndex((s) => s.classList.contains("is-active"));
    idx = Math.max(0, Math.min(all.length - 1, idx + delta));
    all[idx].scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: window.matchMedia("(max-width: 899px)").matches ? "start" : "center" });
  }

  /* ---------- narración ---------- */
  const synth = window.speechSynthesis;
  let voices = [];
  function loadVoices() { voices = synth ? synth.getVoices() : []; }
  if (synth) { loadVoices(); synth.onvoiceschanged = loadVoices; }

  function pickVoice(lang) {
    const prefs = lang === "en" ? ["en-US", "en-GB", "en"] : ["es-PE", "es-419", "es-MX", "es-US", "es-ES", "es"];
    for (const p of prefs) {
      const v = voices.find((x) => x.lang && x.lang.replace("_", "-").toLowerCase().startsWith(p.toLowerCase()));
      if (v) return v;
    }
    return null;
  }

  let audioEl = null;
  function stopSpeaking() {
    if (synth) synth.cancel();
    if (audioEl) { audioEl.pause(); audioEl = null; }
    $$(".play[aria-pressed='true']").forEach((b) => setPlayBtn(b, false));
    state.speaking = null;
    stopBar(false);
  }
  function stopBar(on) {
    const b = $("#stopBar");
    if (!b) return;
    b.hidden = !on;
    $("#stopBarLbl").textContent = ui("stopAudio");
  }
  function renderMute() {
    const on = state.autoplay;
    const btn = $("#autoplay");
    btn.setAttribute("aria-pressed", String(on));
    btn.setAttribute("aria-label", on ? ui("soundOn") : ui("muted"));
    btn.title = on ? ui("soundOn") : ui("muted");
    btn.classList.toggle("is-muted", !on);
    $("#muteLbl").textContent = on ? ui("soundOn") : ui("muted");
    $("#muteIcon").innerHTML = on
      ? `<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/><path d="M19 6a8.5 8.5 0 0 1 0 12"/>`
      : `<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M17 9l5 6M22 9l-5 6"/>`;
  }
  let hintShown = false;
  function setPlayBtn(b, on) {
    b.setAttribute("aria-pressed", on ? "true" : "false");
    b.querySelector(".lbl").textContent = on ? ui("stop") : ui("listen");
    b.querySelector("[aria-hidden]").textContent = on ? "■" : "▶";
  }

  function speakTTS(text, lang, btn) {
    if (!synth) { toast(ui("noVoice")); return; }
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang === "en" ? "en-US" : "es-PE";
    const v = pickVoice(lang);
    if (v) u.voice = v;
    u.rate = 0.92;
    u.onend = u.onerror = () => { if (btn) setPlayBtn(btn, false); state.speaking = null; stopBar(false); };
    synth.speak(u);
  }

  function speakStep(ci, si, btn) {
    stopSpeaking();
    const ch = CHAPTERS[ci], st = ch.steps[si];
    btn = btn || $(`.play[data-ch="${ci}"][data-step="${si}"]`);
    if (btn) setPlayBtn(btn, true);
    state.speaking = `${ci}-${si}`;
    stopBar(true);
    // audios grabados: audio/<es|en|qu>/<capitulo>-<paso>.mp3
    // aimara, asháninka, awajún y shipibo aún no tienen audio: suena el castellano
    const audioLang = AUDIO_LANGS.includes(state.lang) ? state.lang : "es";
    if (audioLang !== state.lang) toast(ui("noAudioQu"));
    const done = () => { if (btn) setPlayBtn(btn, false); state.speaking = null; stopBar(false); };
    const play = (lang, onFail) => {
      const a = new Audio(`audio/${lang}/${ch.id}-${si + 1}.mp3`);
      audioEl = a;
      a.onended = done;
      a.onerror = () => { if (audioEl === a) { audioEl = null; onFail(); } };
      a.play().catch((e) => {
        if (e && e.name === "NotAllowedError") {
          done();
          // el navegador bloquea el sonido hasta que la persona toque la página
          if (!hintShown) { hintShown = true; toast(ui("tapToListen")); }
        }
      });
    };
    const viaTTS = () => speakTTS(audioLang === "en" ? st.t.en : st.t.es, audioLang === "en" ? "en" : "es", btn);
    if (audioLang === "qu") play("qu", () => play("es", viaTTS));
    else play(audioLang, viaTTS);
  }
  const AUDIO_LANGS = ["es", "en", "qu"];

  /* ---------- avisos ---------- */
  let toastTimer = null;
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 5000);
  }
  function updateNotice() {
    const l = LANGS.find((x) => x.code === state.lang);
    const n = $("#notice");
    if (l.status === "ok" || store.get("yachaska-notice-" + l.code) === "x") { n.classList.remove("show"); return; }
    $("#noticeText").textContent = l.status === "rev" ? ui("qNotice") : `${l.native}: ${ui("nextNotice")}`;
    n.classList.add("show");
  }

  /* ---------- lengua y tema ---------- */
  function setLang(code) {
    if (code === state.lang) { closeMenu(); return; }
    stopSpeaking();
    state.lang = code;
    store.set("yachaska-lang", code);
    const keep = state.current;
    renderChrome();
    renderStory();
    state.current = { ch: -1, step: 0 };
    if (keep.ch >= 0) activate(keep.ch, keep.step, true);
    updateNotice();
    closeMenu();
  }

  function setTheme(t) {
    document.documentElement.setAttribute("data-theme", t);
    store.set("yachaska-theme", t);
    $('meta[name="theme-color"]').setAttribute("content", t === "day" ? "#F1ECE2" : "#0b1838");
    $("#theme").innerHTML = t === "day"
      ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.5" fill="currentColor"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/></svg>`
      : `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/></svg>`;
    $("#theme").title = t === "day" ? ui("day") : ui("night");
  }

  function openMenu() { $("#langMenu").classList.add("open"); $("#langBtn").setAttribute("aria-expanded", "true"); const c = $('#langMenu [aria-checked="true"]'); if (c) c.focus(); }
  function closeMenu() { $("#langMenu").classList.remove("open"); $("#langBtn").setAttribute("aria-expanded", "false"); }

  /* ---------- CSV para traductores ---------- */
  function downloadCSV() {
    const q = (s) => `"${String(s == null ? "" : s).replace(/"/g, '""')}"`;
    const rows = [["capitulo", "paso", "voz", "es", "en", "qu (hablante nativo)", "dato_es", "fuente", "puente_es", "audio_qu"]];
    CHAPTERS.forEach((ch) => ch.steps.forEach((st, i) => rows.push([
      ch.id, i + 1, st.who || ch.voice, st.t.es, st.t.en, st.t.qu || "",
      st.fact ? st.fact.es : "", st.fact ? st.fact.src : "", st.bridge ? st.bridge.es : "", `audio/qu/${ch.id}-${i + 1}.mp3`
    ])));
    const blob = new Blob(["﻿" + rows.map((r) => r.map(q).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "yachaska-guion.csv";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  /* ---------- eventos ---------- */
  function bind() {
    document.addEventListener("click", (e) => {
      const langEl = e.target.closest("[data-lang]");
      if (langEl) { setLang(langEl.dataset.lang); return; }
      const go = e.target.closest("[data-goto]");
      if (go) { const t = document.getElementById(go.dataset.goto); if (t) t.scrollIntoView({ behavior: "smooth" }); return; }
      const play = e.target.closest(".play");
      if (play) {
        const key = `${play.dataset.ch}-${play.dataset.step}`;
        if (state.speaking === key) stopSpeaking(); else speakStep(+play.dataset.ch, +play.dataset.step, play);
        return;
      }
      if (!e.target.closest(".tools")) closeMenu();
    });
    $("#langBtn").addEventListener("click", (e) => { e.stopPropagation(); $("#langMenu").classList.contains("open") ? closeMenu() : openMenu(); });
    $("#theme").addEventListener("click", () => setTheme(document.documentElement.getAttribute("data-theme") === "day" ? "night" : "day"));
    $("#autoplay").addEventListener("click", () => {
      state.autoplay = !state.autoplay;
      store.set("yachaska-autoplay", state.autoplay ? "1" : "0");
      renderMute();
      if (state.autoplay && state.current.ch >= 0) speakStep(state.current.ch, state.current.step - 1); else stopSpeaking();
      toast(state.autoplay ? ui("soundOnToast") : ui("mutedToast"));
    });
    $("#noticeClose").addEventListener("click", () => { $("#notice").classList.remove("show"); store.set("yachaska-notice-" + state.lang, "x"); });
    $("#csvBtn").addEventListener("click", downloadCSV);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") { closeMenu(); stopSpeaking(); return; }
      if (e.target.closest("input, textarea, select, [role=menu]")) return;
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.key === "ArrowRight") { e.preventDefault(); gotoStep(1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); gotoStep(-1); }
    });
    $("#langMenu").addEventListener("keydown", (e) => {
      const opts = $$(".lang-opt");
      const i = opts.indexOf(document.activeElement);
      if (e.key === "ArrowDown") { e.preventDefault(); opts[(i + 1) % opts.length].focus(); }
      if (e.key === "ArrowUp") { e.preventDefault(); opts[(i - 1 + opts.length) % opts.length].focus(); }
    });
    let mq = window.matchMedia("(max-width: 899px)");
    const onMq = () => observeSteps();
    if (mq.addEventListener) mq.addEventListener("change", onMq); else mq.addListener(onMq);
  }

  /* ---------- inicio ---------- */
  setTheme(document.documentElement.getAttribute("data-theme") || "night");
  renderMute();
  $("#stopBar").addEventListener("click", stopSpeaking);
  renderChrome();
  renderStory();
  updateNotice();
  bind();
  window.YACHASKA_APP = { activate, gotoStep, setLang, setTheme };
})();
