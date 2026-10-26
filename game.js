// Gra: losuje nazwy, a Ty klikasz na mapie, gdzie leży dany obiekt.
// Korzysta z danych i zmiennych z script.js (map, items, groups, CATS, baseLayer).
(() => {
  const TOTAL = 20;
  const SINGULAR = { pw: 'półwysep', wy: 'wyspa', go: 'góry', ni: 'nizina', wz: 'wyżyna', pu: 'pustynia' };
  // Tolerancja (km) – zaznaczone obszary są przybliżone, więc trafienie tuż obok też się liczy
  const TOL = { area: 60, line: 250, peak: 150 };
  const $ = id => document.getElementById(id);
  const mapEl = $('map');
  const noLabels = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Shaded_Relief/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 13, attribution: 'Tiles &copy; Esri &mdash; Source: Esri'
  });

  // checkboxy kategorii
  const catBox = $('g-cats');
  Object.keys(CATS).forEach(k => {
    const l = document.createElement('label');
    l.innerHTML = '<input type="checkbox" value="' + k + '" checked><span class="dot" style="background:' +
      CATS[k][1] + '"></span>' + CATS[k][0];
    catBox.appendChild(l);
  });

  let mode = 'learn', saved = {}, st = null;

  function applyTiles() {
    if (mode === 'game' && $('g-nolabels').checked) { map.removeLayer(baseLayer); noLabels.addTo(map); }
    else { map.removeLayer(noLabels); baseLayer.addTo(map); }
  }

  function setMode(m) {
    if (m === mode) return;
    mode = m;
    document.querySelectorAll('#tabs button').forEach(b => b.classList.toggle('active', b.dataset.mode === m));
    $('learn').hidden = m !== 'learn';
    $('game').hidden = m !== 'game';
    map.closePopup();
    if (m === 'game') {
      Object.keys(groups).forEach(k => { saved[k] = map.hasLayer(groups[k]); map.removeLayer(groups[k]); });
      showScreen('start');
    } else {
      resetGame();
      Object.keys(groups).forEach(k => { if (saved[k] !== false) groups[k].addTo(map); });
    }
    applyTiles();
  }
  document.querySelectorAll('#tabs button').forEach(b => b.onclick = () => setMode(b.dataset.mode));
  $('g-nolabels').onchange = applyTiles;

  function showScreen(n) {
    ['start', 'play', 'end'].forEach(s => $('g-' + s).hidden = s !== n);
    mapEl.classList.toggle('playing', n === 'play');
  }
  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
  function clearReveal() {
    if (!st) return;
    st.layers.forEach(l => { if (l.closeTooltip) l.closeTooltip(); map.removeLayer(l); });
    st.layers = [];
    map.closePopup();
  }
  function resetGame() { clearReveal(); st = null; showScreen('start'); }

  function startWith(pool) {
    st = { queue: pool, i: -1, score: 0, answered: 0, missed: [], waiting: false, layers: [] };
    next();
  }
  function begin() {
    const cats = [...catBox.querySelectorAll('input:checked')].map(i => i.value);
    if (!cats.length) { alert('Wybierz przynajmniej jedną kategorię.'); return; }
    startWith(shuffle(items.filter(i => cats.includes(i.cat))).slice(0, TOTAL));
  }

  function next() {
    clearReveal();
    st.i++;
    if (st.i >= st.queue.length) return finish();
    const it = st.queue[st.i];
    st.waiting = true;
    showScreen('play');
    map.setView([25, 10], 2);
    $('g-stats').textContent = 'Pytanie ' + (st.i + 1) + '/' + st.queue.length + ' · Wynik: ' + st.score;
    $('g-question').innerHTML = 'Gdzie leży: <b>' + it.name + '</b> <span class="tag" style="background:' +
      CATS[it.cat][1] + '">' + SINGULAR[it.cat] + '</span>';
    $('g-feedback').className = '';
    $('g-feedback').textContent = 'Kliknij na mapie.';
    $('g-next').hidden = true;
  }

  function finish() {
    if (!st.answered) { resetGame(); return; }
    clearReveal();
    showScreen('end');
    $('g-score').textContent = 'Wynik: ' + st.score + '/' + st.answered;
    $('g-missed-title').textContent = st.missed.length ? 'Do powtórki:' : '';
    $('g-missed').innerHTML = st.missed.length
      ? st.missed.map(m => '<li>' + m.it.name + ' <small>(' + SINGULAR[m.it.cat] + ', pudło o ' + m.km + ' km)</small></li>').join('')
      : '<li>Bez błędów! 🎉</li>';
    $('g-redo').hidden = !st.missed.length;
    map.setView([25, 10], 2);
  }

  // --- geometria ---
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
    if (!st || !st.waiting) return;
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
    $('g-stats').textContent = 'Pytanie ' + (st.i + 1) + '/' + st.queue.length + ' · Wynik: ' + st.score;
    $('g-next').textContent = st.i === st.queue.length - 1 ? 'Zobacz wynik' : 'Dalej';
    $('g-next').hidden = false;
  });

  $('g-begin').onclick = begin;
  $('g-next').onclick = next;
  $('g-quit').onclick = finish;
  $('g-again').onclick = resetGame;
  $('g-redo').onclick = () => startWith(shuffle(st.missed.map(m => m.it)));
  document.addEventListener('keydown', e => {
    if (e.key === 'Enter' && st && !$('g-next').hidden) next();
  });
})();