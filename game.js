// Gry: "Wskaż" (klikasz na mapie) i "Nazwa" (wpisujesz nazwę pokazanego obszaru).
// Korzysta z danych i zmiennych z script.js (map, items, groups, CATS, baseLayer).
(() => {
  const TOTAL = 20;
  const SINGULAR = { pw: 'półwysep', wy: 'wyspa', go: 'góry', ni: 'nizina', wz: 'wyżyna', pu: 'pustynia' };
  // Tolerancja (km) w trybie "Wskaż" – obszary są przybliżone, więc trafienie tuż obok też się liczy
  const TOL = { area: 60, line: 250, peak: 150 };
  const $ = id => document.getElementById(id);
  const mapEl = $('map');
  const noLabels = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Shaded_Relief/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 13, attribution: 'Tiles &copy; Esri &mdash; Source: Esri'
  });

  const catBox = $('g-cats');
  Object.keys(CATS).forEach(k => {
    const l = document.createElement('label');
    l.innerHTML = '<input type="checkbox" value="' + k + '" checked><span class="dot" style="background:' +
      CATS[k][1] + '"></span>' + CATS[k][0];
    catBox.appendChild(l);
  });

  let mode = 'learn', saved = {}, st = null;
  const inGame = () => mode !== 'learn';
  const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function applyTiles() {
    if (inGame() && $('g-nolabels').checked) { map.removeLayer(baseLayer); noLabels.addTo(map); }
    else { map.removeLayer(noLabels); baseLayer.addTo(map); }
  }

  function setMode(m) {
    if (m === mode) return;
    const wasGame = inGame();
    mode = m;
    document.querySelectorAll('#tabs button').forEach(b => b.classList.toggle('active', b.dataset.mode === m));
    $('learn').hidden = inGame();
    $('game').hidden = !inGame();
    map.closePopup();
    if (inGame() && !wasGame) {
      Object.keys(groups).forEach(k => { saved[k] = map.hasLayer(groups[k]); map.removeLayer(groups[k]); });
    }
    resetGame();
    if (!inGame()) Object.keys(groups).forEach(k => { if (saved[k] !== false) groups[k].addTo(map); });
    if (inGame()) {
      $('g-intro').textContent = m === 'name'
        ? 'Pokażę obszar na mapie bez koloru i podpisu – wpisz jego nazwę (polskie znaki nie są wymagane, drobne literówki są tolerowane).'
        : 'Dla każdej nazwy kliknij na mapie miejsce, w którym leży dany obiekt.';
      $('g-hintswrap').hidden = m !== 'name';
    }
    applyTiles();
  }
  document.querySelectorAll('#tabs button').forEach(b => b.onclick = () => setMode(b.dataset.mode));
  $('g-nolabels').onchange = applyTiles;
  $('g-hints').onchange = () => {
    if ($('g-hints').checked) $('g-answer').setAttribute('list', 'g-names');
    else $('g-answer').removeAttribute('list');
  };

  function showScreen(n) {
    ['start', 'play', 'end'].forEach(s => $('g-' + s).hidden = s !== n);
    mapEl.classList.toggle('playing', n === 'play' && mode === 'locate');
  }
  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }

  // Przywraca kolory i podpisy obszaru ukrytego w trybie "Nazwa"
  function restoreInfo(it) {
    if (!it || !it._orig) return;
    const s = it.shape;
    s.setStyle(it._orig);
    s.bindTooltip(it.name, { sticky: true });
    s.bindPopup('<b>' + it.name + '</b><br>' + CATS[it.cat][0]);
    it._orig = null;
  }
  function clearReveal() {
    if (!st) return;
    if (st.shapeIt) { restoreInfo(st.shapeIt); st.shapeIt = null; }
    st.layers.forEach(l => { if (l.closeTooltip) l.closeTooltip(); map.removeLayer(l); });
    st.layers = [];
    map.closePopup();
  }
  function resetGame() { clearReveal(); st = null; showScreen('start'); }

  function startWith(pool) {
    st = { queue: pool, i: -1, score: 0, answered: 0, missed: [], waiting: false, layers: [], shapeIt: null };
    next();
  }
  function begin() {
    const cats = [...catBox.querySelectorAll('input:checked')].map(i => i.value);
    if (!cats.length) { alert('Wybierz przynajmniej jedną kategorię.'); return; }
    const pool = shuffle(items.filter(i => cats.includes(i.cat)));
    const sel = $('g-count').value;
    // Auto: przy jednej kategorii grają wszystkie jej obiekty, przy kilku losuje się 20
    const n = sel === 'all' ? pool.length : sel === 'auto' ? (cats.length === 1 ? pool.length : TOTAL) : +sel;
    $('g-names').innerHTML = [...new Set(pool.map(i => i.name))]
      .sort((a, b) => a.localeCompare(b, 'pl')).map(x => '<option value="' + x + '">').join('');
    startWith(pool.slice(0, n));
  }

  function showHidden(it) {
    const s = it.shape, o = s.options;
    it._orig = { color: o.color, weight: o.weight, opacity: o.opacity, fillColor: o.fillColor, fillOpacity: o.fillOpacity };
    s.closeTooltip(); s.unbindTooltip(); s.closePopup(); s.unbindPopup();
    s.setStyle({ color: '#111827', fillColor: '#ffffff', fillOpacity: s instanceof L.Circle ? 0.9 : 0.2 });
    s.addTo(map);
    st.layers.push(s);
    st.shapeIt = it;
    map.fitBounds(s.getBounds(), { maxZoom: 5, padding: [60, 60] });
  }

  function next() {
    clearReveal();
    st.i++;
    if (st.i >= st.queue.length) return finish();
    const it = st.queue[st.i];
    st.waiting = true;
    showScreen('play');
    $('g-stats').textContent = 'Pytanie ' + (st.i + 1) + '/' + st.queue.length + ' · Wynik: ' + st.score;
    const tag = '<span class="tag" style="background:' + CATS[it.cat][1] + '">' + SINGULAR[it.cat] + '</span>';
    $('g-feedback').className = '';
    $('g-next').hidden = true;
    if (mode === 'name') {
      $('g-question').innerHTML = 'Jak nazywa się ten obszar? ' + tag;
      $('g-feedback').textContent = 'Wpisz nazwę i naciśnij Enter.';
      $('g-answerbox').hidden = false;
      $('g-answer').value = '';
      $('g-answer').disabled = false;
      $('g-check').disabled = $('g-giveup').disabled = false;
      showHidden(it);
      $('g-answer').focus();
    } else {
      $('g-question').innerHTML = 'Gdzie leży: <b>' + it.name + '</b> ' + tag;
      $('g-feedback').textContent = 'Kliknij na mapie.';
      $('g-answerbox').hidden = true;
      map.setView([25, 10], 2);
    }
  }

  function finish() {
    if (!st.answered) { resetGame(); return; }
    clearReveal();
    showScreen('end');
    $('g-score').textContent = 'Wynik: ' + st.score + '/' + st.answered;
    $('g-missed-title').textContent = st.missed.length ? 'Do powtórki:' : '';
    $('g-missed').innerHTML = st.missed.length
      ? st.missed.map(m => '<li>' + m.it.name + ' <small>(' + SINGULAR[m.it.cat] +
          (m.km != null ? ', pudło o ' + m.km + ' km' : (m.typed ? ', wpisano: „' + esc(m.typed) + '”' : '')) +
          ')</small></li>').join('')
      : '<li>Bez błędów! 🎉</li>';
    $('g-redo').hidden = !st.missed.length;
    map.setView([25, 10], 2);
  }

  // --- tryb "Wskaż": geometria ---
  function dens(pts, steps, close) {
    const out = [], n = pts.length;
    for (let i = 0; i < (close ? n : n - 1); i++) {
      const a = pts[i], b = pts[(i + 1) % n];
      for (let k = 0; k < steps; k++) {
        const t = k / steps;
        out.push(L.latLng(a.lat + (b.lat - a.lat) * t, a.lng + (b.lng - a.lng) * t));
      }
    }
    if (!close) out.push(pts[n - 1]);
    return out;
  }
  function inside(ll, ring) {
    let c = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const a = ring[i], b = ring[j];
      if ((a.lat > ll.lat) !== (b.lat > ll.lat) &&
          ll.lng < (b.lng - a.lng) * (ll.lat - a.lat) / (b.lat - a.lat) + a.lng) c = !c;
    }
    return c;
  }
  function evaluate(s, ll) {
    let pts, tol, inPoly = false, isCircle = false;
    if (s instanceof L.Circle) { pts = [s.getLatLng()]; tol = TOL.peak; isCircle = true; }
    else if (s instanceof L.Polygon) {
      const ring = s.getLatLngs()[0];
      pts = dens(ring, 10, true); tol = TOL.area; inPoly = inside(ll, ring);
    } else { pts = dens(s.getLatLngs(), 40, false); tol = TOL.line; }
    let near = pts[0], min = Infinity;
    pts.forEach(p => { const d = map.distance(ll, p); if (d < min) { min = d; near = p; } });
    if (isCircle) min = Math.max(0, min - s.getRadius());
    const km = inPoly ? 0 : Math.round(min / 10000) * 10;
    return { ok: inPoly || min / 1000 <= tol, km, near };
  }

  map.on('click', e => {
    if (mode !== 'locate' || !st || !st.waiting) return;
    st.waiting = false;
    st.answered++;
    const it = st.queue[st.i], ll = e.latlng.wrap(), r = evaluate(it.shape, ll);
    if (r.ok) st.score++; else st.missed.push({ it, km: r.km });
    const col = r.ok ? '#16a34a' : '#dc2626';
    st.layers.push(L.circleMarker(ll, { radius: 8, color: '#fff', weight: 2, fillColor: col, fillOpacity: 1 }).addTo(map));
    it.shape.addTo(map);
    st.layers.push(it.shape);
    if (!r.ok) st.layers.push(L.polyline([ll, r.near], { color: col, weight: 2, dashArray: '6 6' }).addTo(map));
    const b = it.shape.getBounds();
    it.shape.openTooltip(b.getCenter());
    map.fitBounds(L.latLngBounds([ll]).extend(b), { maxZoom: 5, padding: [40, 40] });
    $('g-feedback').className = r.ok ? 'ok' : 'bad';
    $('g-feedback').textContent = r.ok ? '✅ Dobrze!' : '❌ Pudło – ' + r.km + ' km od obszaru.';
    afterAnswer();
  });

  function afterAnswer() {
    $('g-stats').textContent = 'Pytanie ' + (st.i + 1) + '/' + st.queue.length + ' · Wynik: ' + st.score;
    $('g-next').textContent = st.i === st.queue.length - 1 ? 'Zobacz wynik' : 'Dalej';
    $('g-next').hidden = false;
  }

  // --- tryb "Nazwa": sprawdzanie wpisanej odpowiedzi ---
  const norm = s => s.toLowerCase().replace(/ł/g, 'l').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
  const strip = s => s.replace(/^(polwysep|wyspa|wyspy|gory|nizina|wyzyna|pustynia)\s+/, '').replace(/\s+gory$/, '');
  function forms(it) {
    const set = new Set([norm(it.name)]);
    const m = it.name.match(/^(.*?)\s*\((.*)\)$/);   // np. "Indyjski (Dekan)"
    if (m) { set.add(norm(m[1])); set.add(norm(m[2])); set.add(norm(m[1] + ' ' + m[2])); }
    return set;
  }
  function lev(a, b) {
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
    for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++)
      for (let j = 1; j <= b.length; j++)
        d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[a.length][b.length];
  }
  function matches(it, val) {
    const raw = norm(val), a = strip(raw), mine = forms(it);
    if (mine.has(raw) || mine.has(a)) return true;
    // dokładna nazwa innego obiektu = zła odpowiedź (np. Skandynawskie vs Skandynawski)
    for (const o of items) if (o !== it) { const f = forms(o); if (f.has(raw) || f.has(a)) return false; }
    const tol = n => n < 5 ? 0 : n < 10 ? 1 : 2;
    for (const f of mine) if (lev(a, f) <= tol(f.length)) return true;
    return false;
  }

  function submitName(giveUp) {
    if (mode !== 'name' || !st || !st.waiting) return;
    const it = st.queue[st.i], val = $('g-answer').value;
    if (!giveUp && !norm(val)) return;
    const ok = !giveUp && matches(it, val);
    st.waiting = false;
    st.answered++;
    if (ok) st.score++; else st.missed.push({ it, typed: giveUp ? '' : val.trim() });
    restoreInfo(it);
    it.shape.openTooltip(it.shape.getBounds().getCenter());
    $('g-answer').disabled = true;
    $('g-check').disabled = $('g-giveup').disabled = true;
    $('g-feedback').className = ok ? 'ok' : 'bad';
    $('g-feedback').innerHTML = (ok ? '✅ Dobrze! ' : giveUp ? '' : '❌ Źle. ') + 'To: <b>' + it.name + '</b>';
    afterAnswer();
  }

  $('g-begin').onclick = begin;
  $('g-next').onclick = next;
  $('g-quit').onclick = finish;
  $('g-again').onclick = resetGame;
  $('g-redo').onclick = () => startWith(shuffle(st.missed.map(m => m.it)));
  $('g-check').onclick = () => submitName(false);
  $('g-giveup').onclick = () => submitName(true);
  document.addEventListener('keydown', e => {
    if (e.key !== 'Enter' || !st) return;
    if (st.waiting && mode === 'name' && document.activeElement === $('g-answer')) submitName(false);
    else if (!$('g-next').hidden) next();
  });
})();
