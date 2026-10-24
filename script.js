// Kategorie: nazwa, kolor
const CATS = {
  pw: ['Półwyspy', '#e67e22'],
  wy: ['Wyspy', '#2980b9'],
  go: ['Góry', '#7b4a2b'],
  ni: ['Niziny', '#27ae60'],
  wz: ['Wyżyny', '#c9a400'],
  pu: ['Pustynie', '#d35454']
};

// Elipsy: [nazwa, szer., dł., półoś a (km), półoś b (km), kąt obrotu w stopniach od wschodu]
// Wartości są przybliżone – to orientacyjne zaznaczenie obszarów.
const ELLIPSES = {
  pw: [
    ['Skandynawski',63,15,900,300,65],['Jutlandzki',56,9.3,250,70,88],['Kolski',67.5,38,250,120,0],
    ['Iberyjski',40,-4,450,350,0],['Bałkański',42,21,600,450,45],['Arabski',23,46,1200,700,35],
    ['Indyjski (Dekan)',16,77,700,500,0],['Indochiński',15,102,800,450,85],['Malajski',4.5,102,500,120,70],
    ['Kamczatka',56,160,700,180,80],['Koreański',37,127.5,450,130,80],['Alaska',62,-152,700,500,0],
    ['Labrador',54,-70,800,600,0],['Kalifornijski',27,-113,650,80,-50],['Floryda',28,-81.5,400,100,90],
    ['Jukatan',19.5,-89,350,250,0],['Somalijski',8,48,700,250,35],['Jork',-14,142.5,450,150,90]
  ],
  wy: [
    ['Grenlandia',73,-42,1300,550,80],['Islandia',64.9,-18.6,250,150,0],['Irlandia',53.3,-8,150,100,70],
    ['Wielka Brytania',54.5,-2.5,500,170,90],['Sycylia',37.6,14,120,70,-15],['Sardynia',40,9,140,60,90],
    ['Korsyka',42.15,9.1,90,40,90],['Kreta',35.2,25,130,25,0],['Cypr',35,33,120,35,-15],
    ['Madagaskar',-19,46.7,800,230,75],['Cejlon',7.8,80.7,150,80,90],['Sumatra',-0.5,101.5,1000,200,-45],
    ['Jawa',-7.5,110,500,70,-5],['Borneo',0.5,114,500,450,0],['Celebes',-1.5,121,450,250,0],
    ['Filipiny',12.5,122.5,900,200,-75],['Nowa Gwinea',-5.5,141,1300,350,-20],['Kiusiu',32.8,131,110,80,0],
    ['Sikoku',33.7,133.5,120,45,5],['Honsiu',36,137.5,700,100,35],['Hokkaido',43.4,142.8,190,150,0],
    ['Tajwan',23.7,121,200,70,70],['Galapagos',-0.5,-90.5,200,150,0],['Nowa Zelandia',-40.5,172,750,180,60],
    ['Tasmania',-42,146.5,150,150,0],['Kuba',21.7,-79.5,600,70,-15],['Haiti',19,-71,250,100,5],
    ['Ziemia Ognista',-54,-68.5,250,200,0],['Hawaje',20.5,-157,300,120,-30]
  ],
  ni: [
    ['Chińska',35,115,500,300,60],['Mandżuria',44,124,400,250,70],['Zachodniosyberyjska',61,74,800,550,0],
    ['Kotlina Kongo',-1,22,700,600,0],['Amazonki',-3.5,-62,1100,550,5],['La Platy',-33,-60,650,450,0]
  ],
  wz: [
    ['Abisyńska',8.5,38.5,350,300,0],['Środkowosyberyjska',64,100,900,550,0],['Tybetańska',32,87,1300,500,0],
    ['Gujańska',5,-62,550,350,10],['Brazylijska',-15,-46,1000,800,0],['Patagonia',-45.5,-69.5,800,350,90]
  ],
  pu: [
    ['Sahara',24,13,2400,1000,0],['Kalahari',-23,22,650,500,0],['Namib',-23.5,15,750,60,80],
    ['Gobi',42.5,106,1000,350,20],['Atakama',-24,-69.5,700,70,90],
    ['Wielka Pustynia Piaszczysta',-20.5,125.5,500,250,0],['Gibsona',-24.5,126,400,220,0],
    ['Wielka Pustynia Wiktorii',-29.5,128.5,550,200,0]
  ]
};

// Pasma górskie: [nazwa, [[szer., dł.], ...]] – jeden punkt = szczyt (okrąg)
const MOUNTAINS = [
  ['Kordyliery',[[66,-150],[61,-143],[56,-130],[50,-122],[44,-114],[38,-109],[32,-107],[26,-103]]],
  ['Appalachy',[[34,-85],[37,-81],[40,-77.5],[43,-73],[46,-70]]],
  ['Andy',[[10,-72],[5,-76],[0,-78],[-8,-78],[-15,-72],[-23,-68],[-33,-70],[-42,-72],[-52,-73]]],
  ['Atlas',[[30.5,-9],[32,-5],[34,-2],[35,3],[36,8],[36.8,10]]],
  ['Kilimandżaro',[[-3.07,37.35]]],
  ['Smocze',[[-25,30.9],[-27.5,30],[-29.3,29.3],[-31,28]]],
  ['Ural',[[68,66],[62,59],[56,59.5],[51,58]]],
  ['Himalaje',[[35,74.5],[32,79],[28.2,85],[27.5,89],[28,95]]],
  ['Karakorum',[[36.5,73],[36,76],[35.5,78]]],
  ['Tienszan',[[41,70],[42,76],[42,80],[43.5,84],[43.5,90]]],
  ['Kaukaz',[[45,37],[43.5,41],[42.5,45],[41.5,48]]],
  ['Skandynawskie',[[59,6],[62,8],[65,13],[68.5,18],[70,22]]],
  ['Pireneje',[[43.3,-1.8],[42.7,0],[42.4,2],[42.4,3.2]]],
  ['Apeniny',[[44.4,8.8],[43.5,12],[42,13.5],[40.5,15.5],[38.2,16]]],
  ['Alpy',[[43.8,7.3],[45.8,7],[46.5,10],[47.3,12.5],[47.5,15.5]]],
  ['Karpaty',[[49,17.5],[49.4,20],[48.2,24],[47.5,25.5],[45.5,25],[45,22.5]]],
  ['Sudety',[[50.9,15.2],[50.5,16.5],[50.2,17.2]]],
  ['Wielkie Góry Wododziałowe',[[-12,143],[-20,146.5],[-28,152],[-34,150.5],[-37,148.5]]]
];

// Zamiana elipsy (w km) na wielokąt we współrzędnych geograficznych
function ellipse(lat, lon, a, b, deg) {
  const r = deg * Math.PI / 180, pts = [];
  for (let i = 0; i < 64; i++) {
    const t = i / 64 * 2 * Math.PI, x = a * Math.cos(t), y = b * Math.sin(t);
    const dx = x * Math.cos(r) - y * Math.sin(r);
    const dy = x * Math.sin(r) + y * Math.cos(r);
    pts.push([lat + dy / 111, lon + dx / (111 * Math.cos(lat * Math.PI / 180))]);
  }
  return pts;
}

const map = L.map('map', { worldCopyJump: true }).setView([25, 10], 2);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 18,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

const groups = {}, items = [];
Object.keys(CATS).forEach(k => groups[k] = L.layerGroup().addTo(map));

function register(cat, name, shape) {
  shape.bindTooltip(name, { sticky: true });
  shape.bindPopup('<b>' + name + '</b><br>' + CATS[cat][0]);
  shape.addTo(groups[cat]);
  items.push({ cat, name, shape });
}

for (const cat in ELLIPSES) {
  const col = CATS[cat][1];
  ELLIPSES[cat].forEach(([n, la, lo, a, b, ang]) =>
    register(cat, n, L.polygon(ellipse(la, lo, a, b, ang), { color: col, weight: 2, fillColor: col, fillOpacity: 0.35 })));
}
MOUNTAINS.forEach(([n, pts]) => {
  const col = CATS.go[1];
  register('go', n, pts.length === 1
    ? L.circle(pts[0], { radius: 60000, color: col, fillColor: col, fillOpacity: 0.7 })
    : L.polyline(pts, { color: col, weight: 8, opacity: 0.7, lineCap: 'round' }));
});

// Panel boczny z listami i przełącznikami warstw
const lists = document.getElementById('lists');
Object.keys(CATS).forEach(cat => {
  const its = items.filter(i => i.cat === cat).sort((x, y) => x.name.localeCompare(y.name, 'pl'));
  const d = document.createElement('details');
  d.open = true;
  d.innerHTML = '<summary><span class="dot" style="background:' + CATS[cat][1] + '"></span>' +
    CATS[cat][0] + ' (' + its.length + ')<label><input type="checkbox" checked> pokaż</label></summary><div class="items"></div>';
  d.querySelector('input').onchange = e => e.target.checked ? groups[cat].addTo(map) : map.removeLayer(groups[cat]);
  d.querySelector('label').onclick = e => e.stopPropagation();
  const box = d.querySelector('.items');
  its.forEach(it => {
    const b = document.createElement('button');
    b.textContent = it.name;
    b.onclick = () => {
      if (!map.hasLayer(groups[cat])) groups[cat].addTo(map), d.querySelector('input').checked = true;
      map.fitBounds(it.shape.getBounds(), { maxZoom: 6, padding: [30, 30] });
      it.shape.openPopup(it.shape.getBounds().getCenter());
    };
    it.btn = b;
    box.appendChild(b);
  });
  lists.appendChild(d);
});

document.getElementById('search').oninput = e => {
  const q = e.target.value.trim().toLowerCase();
  items.forEach(i => i.btn.classList.toggle('hide', q && !i.name.toLowerCase().includes(q)));
};
