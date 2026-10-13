/*
 * SBO döntéstámogató – közös felület-motor.
 * Az eljárásrend-specifikus tartalom (lépések, döntési logika, widgetek, dokumentáció, referencia)
 * a protocols/<id>/protocol.js modulokban van; ez a fájl csak megjeleníti és kezeli őket.
 */
(function () {
  'use strict';

  var YN = [{ v: 'yes', l: 'Igen' }, { v: 'no', l: 'Nem' }];

  var P = null;          // aktuális eljárásrend
  var states = {};       // eljárásrendenként külön betegállapot (memóriában, nem tárolódik)
  var state = {};
  var current = null;    // aktuális lépés
  var view = 'home';     // home | exam | reference
  var openIllus = {};
  var epiEdits = {};
  var refOpen = null;
  var lastSig = '';      // a látható lépések és mezők „ujjlenyomata” (feltételes mezők megjelenésének észleléséhez)

  function esc(t) {
    return String(t === undefined || t === null ? '' : t)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function $(id) { return document.getElementById(id); }
  function stepById(id) { return P.steps.filter(function (x) { return x.id === id; })[0]; }
  function evaluate() { return P.evaluate(state); }
  function isExpired(p) { return p.sop.validUntil && new Date() > new Date(p.sop.validUntil + 'T23:59:59'); }

  /* ---------------------------------------------------------------- */
  /* Mezők                                                             */
  /* ---------------------------------------------------------------- */
  function radios(key, options, label) {
    var v = state[key];
    return '<fieldset class="field"><legend>' + esc(label) + '</legend><div class="seg">' +
      options.map(function (o) {
        var id = 'f_' + key.replace(/\W/g, '_') + '_' + o.v.replace(/\W/g, '_');
        return '<input type="radio" id="' + id + '" name="' + esc(key) + '" value="' + esc(o.v) + '" data-key="' + esc(key) + '"' + (v === o.v ? ' checked' : '') + '>' +
          '<label for="' + id + '">' + esc(o.l) + '</label>';
      }).join('') +
      (v ? '<button type="button" class="clear" data-clear="' + esc(key) + '" title="Válasz törlése">×</button>' : '') +
      '</div></fieldset>';
  }

  function ctx(r) { return { state: state, r: r, esc: esc, radios: radios }; }

  function renderField(f, r) {
    if (f.when && !f.when(state, r)) return '';
    switch (f.type) {
      case 'yn': return radios(f.key, YN, f.label);
      case 'choice': return radios(f.key, f.options, f.label);
      case 'check':
        return '<label class="check"><input type="checkbox" data-key="' + esc(f.key) + '"' + (state[f.key] ? ' checked' : '') + '> ' + esc(f.label) + '</label>';
      case 'text':
        return '<label class="field"><span>' + esc(f.label) + '</span><input type="text" data-key="' + esc(f.key) + '" value="' + esc(state[f.key]) + '"></label>';
      case 'textarea':
        return '<label class="field"><span>' + esc(f.label) + '</span><textarea data-key="' + esc(f.key) + '" rows="' + (f.rows || 3) + '">' + esc(state[f.key]) + '</textarea></label>';
      case 'num':
        return '<label class="field"><span>' + esc(f.label) + '</span><input type="number" inputmode="decimal" data-key="' + esc(f.key) + '" value="' + esc(state[f.key]) + '"></label>';
      case 'num2':
        return '<div class="field"><span>' + esc(f.label) + '</span><div class="row">' + f.keys.map(function (k, i) {
          return '<input type="number" inputmode="decimal" placeholder="' + esc(f.ph[i]) + '" data-key="' + esc(k) + '" value="' + esc(state[k]) + '">';
        }).join('<span class="sep">/</span>') + '</div></div>';
      case 'heading': return '<h3>' + esc(f.label) + '</h3>';
      case 'note': return '<div class="note ' + f.level + '">' + f.html + '</div>';
      case 'illus': return renderIllus(f.name);
      case 'widget': {
        var w = P.widgets && P.widgets[f.name];
        if (!w) return '<div class="note danger">Hiányzó widget: ' + esc(f.name) + '</div>';
        return w.render(ctx(r)) + (w.live ? '<div data-live="' + esc(f.name) + '">' + w.live(ctx(r)) + '</div>' : '');
      }
      case 'summary': return renderSummary(r);
      default: return '';
    }
  }

  function renderIllus(name) {
    if (!P.illustrations) return '';
    var open = !!openIllus[name];
    return '<details class="illus" data-illus="' + name + '"' + (open ? ' open' : '') + '><summary>Hogyan néz ki? (animált ábra)</summary>' +
      (open ? P.illustrations.get(name) : '') + '</details>';
  }

  /* ---------------------------------------------------------------- */
  /* Összegzés és dokumentáció                                         */
  /* ---------------------------------------------------------------- */
  function reportText(r) {
    var lines = [];
    lines.push(P.short.toUpperCase() + ' – SBO VIZSGÁLAT ÖSSZEFOGLALÓ (' + new Date().toLocaleString('hu-HU') + ')');
    lines.push('Az ' + P.sop.issuer + ' „' + P.sop.title + '” SOP (' + P.sop.version + ') alapján, döntéstámogató alkalmazással.');
    lines.push('');
    if (P.reportFindings) { lines = lines.concat(P.reportFindings(state, r)); lines.push(''); }
    lines.push('DÖNTÉSI ÚT:');
    r.path.forEach(function (p) { lines.push('- ' + p); });
    lines.push('');
    lines.push('CSOPORTDIAGNÓZIS: ' + (r.category ? P.categories[r.category] : 'még nem meghatározott'));
    var list = function (title, arr, withRef) {
      if (!arr || !arr.length) return;
      lines.push(title + ':');
      arr.forEach(function (a) { lines.push('- ' + a.text + (withRef && a.ref ? ' [' + a.ref + ']' : '')); });
    };
    list('MUNKADIAGNÓZIS', r.workingDx, false);
    list('TEENDŐK', r.actions, true);
    list('DISZPOZÍCIÓ', r.disposition, true);
    if (state.note) { lines.push(''); lines.push('MEGJEGYZÉS: ' + state.note); }
    return lines.join('\n');
  }

  function renderSummary(r) {
    var html = '<label class="field"><span>Saját megjegyzés (a strukturált összegzésbe kerül)</span><textarea data-key="note" rows="2">' + esc(state.note) + '</textarea></label>';
    if (P.docSections) {
      html += '<h3>Szöveg az SBO ambuláns lapba – részenként másolható</h3>' +
        '<div class="note info">A „___” helyeket töltse ki. A szöveg itt szerkeszthető; a szerkesztett részt a további adatváltozás nem írja felül (az „Újragenerálás” igen). ' +
        'Állítás csak a megadott adatokból kerül bele; „negál” csak kifejezett nemleges válasznál.</div>' +
        '<div class="row gap"><button type="button" class="btn primary" data-copy-all="1">Minden rész másolása</button>' +
        '<button type="button" class="btn" id="regenEpi">Újragenerálás az adatokból</button></div>';
      html += P.docSections(state, r).map(function (x) {
        var v = epiEdits[x.id] !== undefined ? epiEdits[x.id] : x.text;
        var rows = Math.min(14, Math.max(3, Math.ceil(v.length / 95) + (v.match(/\n/g) || []).length));
        return '<div class="epi-sec"><div class="epi-head"><b>' + esc(x.title) + '</b>' +
          (epiEdits[x.id] !== undefined ? ' <span class="ref">szerkesztve</span>' : '') +
          '<button type="button" class="btn small" data-copy="epi-' + x.id + '">Másolás</button></div>' +
          '<textarea id="epi-' + x.id + '" data-epi="' + x.id + '" class="report epi" rows="' + rows + '" spellcheck="false">' + esc(v) + '</textarea></div>';
      }).join('');
    }
    html += '<h3>Strukturált összegzés (döntési út, SOP-hivatkozásokkal)</h3>' +
      '<div class="row gap"><button type="button" class="btn" data-copy="report">Összegzés másolása</button>' +
      '<button type="button" class="btn" onclick="window.print()">Nyomtatás</button></div>' +
      '<pre id="report" class="report">' + esc(reportText(r)) + '</pre>';
    return html;
  }

  /* ---------------------------------------------------------------- */
  /* Döntéstámogató panel                                              */
  /* ---------------------------------------------------------------- */
  function renderPanel(r) {
    var danger = (P.dangerCategories || []).indexOf(r.category) >= 0;
    var html = '<div class="cat ' + (r.category ? (danger ? 'danger' : '') : 'none') + '">' + (r.category ? esc(P.categories[r.category]) : 'Besorolás folyamatban…') + '</div>';
    if (r.path.length) html += '<h4>Döntési út</h4><ol class="path">' + r.path.map(function (p) { return '<li>' + esc(p) + '</li>'; }).join('') + '</ol>';
    if (r.alerts.length) html += r.alerts.map(function (a) { return '<div class="note ' + a.level + '">' + esc(a.text) + ' <span class="ref">' + esc(a.ref) + '</span></div>'; }).join('');
    var list = function (title, arr) {
      return arr && arr.length ? '<h4>' + title + '</h4><ul>' + arr.map(function (a) { return '<li>' + esc(a.text) + ' <span class="ref">' + esc(a.ref) + '</span></li>'; }).join('') + '</ul>' : '';
    };
    html += list('Munkadiagnózis', r.workingDx);
    html += list('Teendők', r.actions);
    html += list('Diszpozíció', r.disposition);
    if (r.differentials && r.differentials.length) {
      html += '<details><summary>' + esc(P.differentialsTitle || 'Differenciáldiagnózis') + '</summary>' + r.differentials.map(function (d) {
        return '<div><b>' + esc(d.group) + ':</b> ' + d.items.map(esc).join(', ') + '</div>';
      }).join('') + '</details>';
    }
    var next = P.stageToStep[r.stage];
    if (next && next !== current && stepById(next)) {
      html += '<button type="button" class="btn primary block" data-goto="' + next + '">Következő teendő: ' + esc(stepById(next).title) + ' →</button>';
    }
    return html;
  }

  /* ---------------------------------------------------------------- */
  /* Nézetek                                                           */
  /* ---------------------------------------------------------------- */
  function renderHome() {
    var cards = SBO.protocols.map(function (p) {
      var exp = isExpired(p);
      var style = p.color ? ' style="--p-base:' + p.color.base + ';--p-ink:' + p.color.ink + ';--p-ink-dark:' + p.color.inkDark + '"' : '';
      return '<button type="button" class="pcard" data-open="' + esc(p.id) + '"' + style + '>' +
        '<span class="pnum">' + esc(p.sop.number || '') + '</span>' +
        '<span class="pbody"><b>' + esc(p.title) + '</b><span>' + esc(p.description || '') + '</span>' +
        '<small>' + esc(p.sop.issuer) + ' · ' + esc(p.sop.version) +
        (p.sop.validUntil ? ' · <span class="' + (exp ? 'expired' : 'valid') + '">' + (exp ? 'lejárt: ' : 'érvényes: ') + esc(p.sop.validUntil.replace(/-/g, '.')) + '</span>' : '') +
        '</small></span></button>';
    }).join('');
    $('home').innerHTML = '<h2>Eljárásrendek</h2><p class="muted">Válassza ki, melyik SOP szerint vizsgálja a beteget.</p>' +
      '<div class="pgrid">' + cards + '</div>' +
      '<p class="muted small">Új eljárásrend hozzáadása: a repó <code>docs/UJ_ELJARASREND.md</code> leírása szerint.</p>';
  }

  function renderReference() {
    var secs = P.reference ? P.reference(esc) : [];
    $('reference').innerHTML = secs.length ? secs.map(function (sec) {
      return '<details class="refsec" id="ref-' + sec.id + '"' + (refOpen === sec.id ? ' open' : '') + '><summary>' + esc(sec.title) + '</summary><div>' + sec.html + '</div></details>';
    }).join('') : '<p class="muted">Ehhez az eljárásrendhez nincs referencia-tartalom.</p>';
    if (refOpen) {
      var el = $('ref-' + refOpen);
      if (el) el.scrollIntoView();
      refOpen = null;
    }
  }

  function visibility(r) {
    var steps = P.steps.filter(function (st) { return !P.stepVisible || P.stepVisible(st.id, state, r); });
    var step = stepById(current);
    var fields = step ? step.fields.map(function (f) { return f.when && !f.when(state, r) ? 0 : 1; }).join('') : '';
    return { steps: steps, sig: steps.map(function (x) { return x.id; }).join(',') + '|' + current + '|' + fields };
  }

  function renderExam() {
    var r = evaluate();
    var steps = P.steps.filter(function (st) { return !P.stepVisible || P.stepVisible(st.id, state, r); });
    if (!steps.some(function (s) { return s.id === current; })) current = steps[0].id;
    var nextStage = P.stageToStep[r.stage];
    $('steps').innerHTML = steps.map(function (st, i) {
      var cls = st.id === current ? 'current' : '';
      if (st.id === nextStage && st.id !== current) cls += ' todo';
      return '<li><button type="button" class="' + cls + '" data-goto="' + st.id + '"><span class="n">' + (i + 1) + '</span>' + esc(st.title) + '</button></li>';
    }).join('');
    var step = stepById(current);
    var idx = steps.indexOf(step);
    var html = '<h2>' + esc(step.title) + (step.ref ? ' <span class="ref">' + esc(step.ref) + '</span>' : '') + '</h2>';
    html += step.fields.map(function (f) { return renderField(f, r); }).join('');
    html += '<div class="nav">' +
      (idx > 0 ? '<button type="button" class="btn" data-goto="' + steps[idx - 1].id + '">← Vissza</button>' : '<span></span>') +
      (idx < steps.length - 1 ? '<button type="button" class="btn primary" data-goto="' + steps[idx + 1].id + '">Tovább →</button>' : '') +
      '</div>';
    $('form').innerHTML = html;
    $('panel').innerHTML = renderPanel(r);
    lastSig = visibility(r).sig;
    var cur = document.querySelector('#steps .current');
    if (cur && cur.scrollIntoView && window.innerWidth <= 1100) cur.scrollIntoView({ block: 'nearest', inline: 'center' });
  }

  function render() {
    if (view !== 'home' && !P) view = 'home';
    $('home').hidden = view !== 'home';
    $('exam').hidden = view !== 'exam';
    $('reference').hidden = view !== 'reference';
    $('viewHome').classList.toggle('active', view === 'home');
    $('viewExam').classList.toggle('active', view === 'exam');
    $('viewRef').classList.toggle('active', view === 'reference');
    ['viewExam', 'viewRef', 'reset'].forEach(function (id) { $(id).hidden = !P; });
    $('ptitle').textContent = P ? P.title : 'Válasszon eljárásrendet';
    $('psub').textContent = P ? (P.sop.issuer + ' SOP ' + (P.sop.number ? P.sop.number + ', ' : '') + P.sop.version) : 'Döntéstámogató az SBO eljárásrendjei alapján';
    var b = $('validity');
    b.hidden = !(P && isExpired(P) && view !== 'home');
    if (!b.hidden) b.textContent = 'Figyelem: a forrás SOP (' + P.sop.version + ') érvényessége ' + P.sop.validUntil.replace(/-/g, '.') + '. lejárt – ellenőrizze, van-e frissebb változat.';
    document.title = P ? P.short + ' – SBO döntéstámogató' : 'SBO döntéstámogató';
    // Eljárásrend-szín (a nyomtatott SOP fejlécszíne) CSS-változókba
    var rs = document.documentElement.style;
    ['--p-base', '--p-ink', '--p-ink-dark'].forEach(function (v) { rs.removeProperty(v); });
    if (P && P.color) { rs.setProperty('--p-base', P.color.base); rs.setProperty('--p-ink', P.color.ink); rs.setProperty('--p-ink-dark', P.color.inkDark); }
    var badge = $('pbadge');
    badge.textContent = P ? (P.sop.number || P.short.charAt(0)) : 'SBO';
    badge.className = 'pbadge' + (P && P.color ? ' proto' : '');
    if (view === 'home') renderHome();
    else if (view === 'reference') renderReference();
    else renderExam();
  }

  function openProtocol(id, keepView) {
    var p = SBO.protocols.filter(function (x) { return x.id === id; })[0];
    if (!p) { P = null; view = 'home'; render(); return; }
    if (P) states[P.id] = { state: state, current: current, epiEdits: epiEdits };
    P = p;
    var saved = states[p.id] || { state: {}, current: p.steps[0].id, epiEdits: {} };
    state = saved.state; current = saved.current; epiEdits = saved.epiEdits;
    openIllus = {};
    if (!keepView) view = 'exam';
    render();
  }

  function route() {
    var m = location.hash.match(/^#\/([\w-]+)(?:\/(ref))?/);
    if (!m) { view = 'home'; render(); return; }
    view = m[2] ? 'reference' : 'exam';
    if (!P || P.id !== m[1]) openProtocol(m[1], true); else render();
  }

  function go(hash) { if (location.hash === hash) route(); else location.hash = hash; }

  /* ---------------------------------------------------------------- */
  /* Események                                                         */
  /* ---------------------------------------------------------------- */
  function updateLive() {
    if (!P || view !== 'exam') return;
    var r = evaluate();
    // Ha az adatváltozás miatt mező vagy lépés jelenik meg / tűnik el, teljes újrarajzolás a fókusz megtartásával
    if (visibility(r).sig !== lastSig) {
      var a = document.activeElement, key = a && a.getAttribute && a.getAttribute('data-key');
      var pos = a && typeof a.selectionStart === 'number' ? a.selectionStart : null;
      render();
      if (key) {
        var el = document.querySelector('[data-key="' + key + '"]:not([type=radio])');
        if (el) {
          el.focus();
          if (pos !== null) el.setSelectionRange(pos, pos);
          else { var v = el.value; el.value = ''; el.value = v; } // számmező: a kurzor a végére (gépelés közben ott van)
        }
      }
      return;
    }
    $('panel').innerHTML = renderPanel(r);
    var rep = $('report');
    if (rep) rep.textContent = reportText(r);
    if (P.docSections && document.querySelector('[data-epi]')) {
      P.docSections(state, r).forEach(function (x) {
        var ta = $('epi-' + x.id);
        if (ta && epiEdits[x.id] === undefined) ta.value = x.text;
      });
    }
    Array.prototype.forEach.call(document.querySelectorAll('[data-live]'), function (el) {
      var w = P.widgets[el.getAttribute('data-live')];
      if (w && w.live) el.innerHTML = w.live(ctx(r));
    });
  }

  window.addEventListener('hashchange', route);

  // Az ábrák csak lenyitva renderelődnek; a nyitott állapot megmarad az újrarajzolások között.
  document.addEventListener('toggle', function (e) {
    var d = e.target;
    if (!d.getAttribute || !d.getAttribute('data-illus') || !P || !P.illustrations) return;
    var name = d.getAttribute('data-illus');
    openIllus[name] = d.open;
    if (d.open && !d.querySelector('svg')) d.insertAdjacentHTML('beforeend', P.illustrations.get(name));
  }, true);

  document.addEventListener('change', function (e) {
    var t = e.target, key = t.getAttribute && t.getAttribute('data-key');
    if (!key) return;
    if (t.type === 'checkbox') state[key] = t.checked;
    else state[key] = t.value;
    if (t.type === 'radio' || t.type === 'checkbox') render();
    else updateLive();
  });

  document.addEventListener('input', function (e) {
    var t = e.target;
    if (t.getAttribute && t.getAttribute('data-epi')) { epiEdits[t.getAttribute('data-epi')] = t.value; return; }
    var key = t.getAttribute && t.getAttribute('data-key');
    if (!key || (t.type !== 'text' && t.tagName !== 'TEXTAREA' && t.type !== 'number')) return;
    state[key] = t.value;
    updateLive();
  });

  function copy(btn, txt) {
    var label = btn.textContent;
    var done = function () { btn.textContent = 'Másolva ✓'; setTimeout(function () { btn.textContent = label; }, 1500); };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(txt).then(done);
    else {
      var ta = document.createElement('textarea'); ta.value = txt; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); done(); } catch (err) { /* nincs vágólap-hozzáférés */ }
      document.body.removeChild(ta);
    }
  }

  document.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target.closest('[data-open],[data-goto],[data-clear],[data-goto-ref],[data-copy],[data-copy-all],#regenEpi,#viewHome,#viewExam,#viewRef,#reset') : null;
    if (!t) return;
    if (t.hasAttribute('data-open')) { go('#/' + t.getAttribute('data-open')); return; }
    if (t.hasAttribute('data-goto')) { current = t.getAttribute('data-goto'); if (view !== 'exam') go('#/' + P.id); else render(); window.scrollTo(0, 0); return; }
    if (t.hasAttribute('data-clear')) { delete state[t.getAttribute('data-clear')]; render(); return; }
    if (t.hasAttribute('data-goto-ref')) { refOpen = t.getAttribute('data-goto-ref'); go('#/' + P.id + '/ref'); return; }
    if (t.id === 'viewHome') { go('#/'); return; }
    if (t.id === 'viewExam') { go('#/' + P.id); return; }
    if (t.id === 'viewRef') { go('#/' + P.id + '/ref'); return; }
    if (t.id === 'reset') {
      if (confirm('Új beteg: a(z) „' + P.short + '” eljárásrendben megadott adatok törlődnek. Folytatja?')) {
        state = {}; epiEdits = {}; openIllus = {}; current = P.steps[0].id; delete states[P.id]; go('#/' + P.id);
      }
      return;
    }
    if (t.id === 'regenEpi') { epiEdits = {}; render(); return; }
    if (t.hasAttribute('data-copy-all')) {
      copy(t, Array.prototype.map.call(document.querySelectorAll('[data-epi]'), function (ta) {
        return ta.closest('.epi-sec').querySelector('b').textContent.toUpperCase() + ':\n' + ta.value;
      }).join('\n\n'));
      return;
    }
    if (t.hasAttribute('data-copy')) {
      var src = $(t.getAttribute('data-copy'));
      copy(t, src.tagName === 'TEXTAREA' ? src.value : src.textContent);
    }
  });

  // Egyetlen eljárásrend esetén is a kezdőlap jelenik meg, hogy a bővítés látható legyen.
  route();
})();
