'use strict';

var NS = 'http://www.w3.org/2000/svg';
var XLINK = 'http://www.w3.org/1999/xlink';

var PLANET_IMAGE_COUNT = 3;

var SUN_IN_EARTH = 109.2;
var STAR_R       = 540;
var STAR_CY      = 540;
var AREA_LEFT    = 600;
var AREA_RIGHT   = 1900;

var scaleInput, scaleValue, planetScale = 1;

var planetImageCache = {};

var star, planetsG, logCheck, infoEl, tintDefs;
var json = [];
var currentIdx = 0;



function fatal(msg) {
  console.error('[app]', msg);
  if (infoEl) infoEl.textContent = 'Ошибка: ' + msg;
  else alert('Ошибка: ' + msg);
}

function starColor(teff) {
  if (teff == null) return '#ffd060';
  if (teff < 3700) return '#ff7040';
  if (teff < 5200) return '#ffb060';
  if (teff < 6000) return '#ffd060';
  if (teff < 7500) return '#eaeaf8';
  if (teff < 10000) return '#c8d8ff';
  return '#a0b8ff';
}

// Цвет окрашивания белых областей PNG по значению habitability:
// нет данных → голубой, 0 → красный, 0.5 → жёлтый, 1 → зелёный.
function colorForHabitability(hab) {
  if (typeof hab !== 'number' || !isFinite(hab)) return '#6cb0e0';
  var t = Math.max(0, Math.min(1, hab));
  var r, g, b;
  if (t < 0.5) {
    var k = t * 2;
    r = Math.round(200 + 30  * k);   // 200 → 230
    g = Math.round(80  + 120 * k);   // 80  → 200
    b = Math.round(60  + 0   * k);   // 60  → 60
  } else {
    var k2 = (t - 0.5) * 2;
    r = Math.round(230 - 150 * k2);  // 230 → 80
    g = Math.round(200 + 0   * k2);  // 200 → 200
    b = Math.round(60  + 40  * k2);  // 60  → 100
  }
  return 'rgb(' + r + ',' + g + ',' + b + ')';
}

// Назначаем картинку планете (стабильно в пределах сессии).
function getPlanetImageIndex(name) {
  if (!(name in planetImageCache)) {
    planetImageCache[name] = 1 + Math.floor(Math.random() * PLANET_IMAGE_COUNT);
  }
  return planetImageCache[name];
}

// Фильтр: SourceGraphic × flood (premultiplied multiply).
//   белые пиксели PNG → цвет
//   чёрные пиксели     → остаются чёрными (тени сохраняются)
//   прозрачные         → остаются прозрачными
function createTintFilter(id, color) {
  var filter = document.createElementNS(NS, 'filter');
  filter.setAttribute('id', id);
  filter.setAttribute('x', '0');
  filter.setAttribute('y', '0');
  filter.setAttribute('width', '100%');
  filter.setAttribute('height', '100%');

  var flood = document.createElementNS(NS, 'feFlood');
  flood.setAttribute('flood-color', color);
  flood.setAttribute('result', 'flood');
  filter.appendChild(flood);

  var comp = document.createElementNS(NS, 'feComposite');
  comp.setAttribute('in', 'SourceGraphic');
  comp.setAttribute('in2', 'flood');
  comp.setAttribute('operator', 'arithmetic');
  comp.setAttribute('k1', '1');
  comp.setAttribute('k2', '0');
  comp.setAttribute('k3', '0');
  comp.setAttribute('k4', '0');
  filter.appendChild(comp);

  return filter;
}

// ---------- Информация ----------

function renderInfo(sys) {
  var lines = [sys[0].hostname || '—', '────────────────────'];
  if (sys[0].st_rade       != null) lines.push('R       = ' + sys[0].st_rade + ' R☉');
  if (sys[0].st_mass         != null) lines.push('M       = ' + sys[0].st_mass + ' M☉');
  if (sys[0].st_teff         != null) lines.push('T_eff   = ' + sys[0].st_teff + ' K');
  if (sys[0].st_lum   != null) lines.push('L       = ' + sys[0].st_lum + ' L☉');
  if (sys[0].st_spectype)         lines.push('Спектр  = ' + sys[0].st_spectype);
  if (sys[0].st_met  != null) lines.push('[Fe/H]  = ' + sys[0].st_met);
  if (sys[0].st_age          != null) lines.push('Возраст = ' + sys[0].st_age + ' Gyr');
  if (sys[0].sy_dist     != null) lines.push('До нас  = ' + sys[0].sy_dist + ' пк');
  lines.push('Планет  = ' + sys.length);
  var hab = sys.map(function (x) { return sys.esi; })
             .filter(function (v) { return typeof v === 'number' && isFinite(v); });
  if (hab.length) lines.push('Макс. обит. = ' + Math.max.apply(null, hab).toFixed(2));
  lines.push('');
  lines.push('Размеры планет — реальные');
  lines.push('пропорции относительно звезды.');
  infoEl.textContent = lines.join('\n');
}

// ---------- Планеты ----------

function drawPlanets(planets, pxPerRearth) {
  planetsG.innerHTML = '';
  tintDefs.innerHTML = '';
  console.log(planets)
  var valid = planets.filter(function (p) { return Number(p.pl_orbsmax) > 0; });
  if (!valid.length) return;

  var isLog = logCheck.checked;
  var orbs = valid.map(function (p) { return Number(p.pl_orbsmax); });
  var min = Math.min.apply(null, orbs);
  var max = Math.max.apply(null, orbs);
  var mapX;
  if (isLog) {
    var lmin = Math.log10(Math.max(min, 1e-6));
    var lmax = Math.log10(Math.max(max, 1e-6));
    var range = (lmax - lmin) || 1;
    mapX = function (d) {
      return AREA_LEFT + ((Math.log10(Math.max(d, 1e-6)) - lmin) / range) * (AREA_RIGHT - AREA_LEFT);
    };
  } else {
    var range2 = (max - min) || 1;
    mapX = function (d) {
      return AREA_LEFT + ((d - min) / range2) * (AREA_RIGHT - AREA_LEFT);
    };
  }

  var single = valid.length === 1;

  valid.forEach(function (p, idx) {
    var cx = single ? (AREA_LEFT + AREA_RIGHT) / 2 : mapX(Number(p.pl_orbsmax));

    var r;
    if (p.pl_rade != null && Number(p.pl_rade) > 0) {
        r = pxPerRearth * Number(p.pl_rade);
        if (r < 8) r = 8;
    } else {
      r = 10;
    }
    r = r * planetScale;  

    var color = colorForHabitability(p.esi);
    var filterId = 'tint_' + idx;

    var oldFilter = document.getElementById(filterId);
    if (oldFilter) oldFilter.remove();
    var filter = createTintFilter(filterId, color);
    if (filter) tintDefs.appendChild(filter);

    var imgIdx = getPlanetImageIndex(p.pl_name);
    var href   = '/static/planet_' + imgIdx + '.png';

    var image = document.createElementNS(NS, 'image');
    image.setAttribute('x', cx - r);
    image.setAttribute('y', STAR_CY - r);
    image.setAttribute('width',  r * 2);
    image.setAttribute('height', r * 2);
    image.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    if (filter) image.setAttribute('filter', 'url(#' + filterId + ')');
    image.setAttribute('href', href);
    image.setAttributeNS(XLINK, 'xlink:href', href);

    // если картинка не загрузилась — подставляем цветной кружок
    image.addEventListener('error', function () {
      console.warn('[app] не загрузилось:', href);
      image.remove();
      var fb = document.createElementNS(NS, 'circle');
      fb.setAttribute('cx', cx);
      fb.setAttribute('cy', STAR_CY);
      fb.setAttribute('r', r);
      fb.setAttribute('fill', color);
      planetsG.appendChild(fb);
    });

    planetsG.appendChild(image);

      var originalIdx = p.pl_name;
      image.style.cursor = 'pointer';
      image.addEventListener('click', function () {
	  location.href = 'planet?sys=' + currentIdx +
              '&planet=' + originalIdx +
              '&img=' + imgIdx;
      });
      
    // подписи — без изменений
    var label = document.createElementNS(NS, 'text');
    label.setAttribute('x', cx);
    label.setAttribute('y', STAR_CY - r - 8);
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('font-size', '13');
    label.setAttribute('fill', '#ddd');
    label.setAttribute('font-family', 'system-ui, sans-serif');
    label.textContent = p.pl_name || '?';
    planetsG.appendChild(label);

    var dist = document.createElementNS(NS, 'text');
    dist.setAttribute('x', cx);
    dist.setAttribute('y', STAR_CY + r + 18);
    dist.setAttribute('text-anchor', 'middle');
    dist.setAttribute('font-size', '11');
    dist.setAttribute('fill', '#888');
    dist.setAttribute('font-family', 'system-ui, sans-serif');
    dist.textContent = p.pl_orbsmax + ' а.е.';
    planetsG.appendChild(dist);

    if (typeof p.esi === 'number' && isFinite(p.esi)) {
      var hb = document.createElementNS(NS, 'text');
      hb.setAttribute('x', cx);
      hb.setAttribute('y', STAR_CY + r + 32);
      hb.setAttribute('text-anchor', 'middle');
      hb.setAttribute('font-size', '10');
      hb.setAttribute('fill', color);
      hb.setAttribute('font-family', 'ui-monospace, monospace');
      hb.textContent = 'обит. ' + Number(p.esi).toFixed(2);
      planetsG.appendChild(hb);
    }
  });
}

// ---------- Рендер и загрузка ----------

function render(sys) {
  if (!sys) return;

  star.setAttribute('fill', starColor(sys[0].st_teff));
  console.log('[app] рендер системы:', sys[0].hostname, '· цвет звезды:', starColor(sys[0].st_teff));

  var starRadeEarth = (Number(sys[0].st_rade) || 1) * SUN_IN_EARTH;
  var pxPerRearth   = STAR_R / starRadeEarth;

  drawPlanets(sys || [], pxPerRearth);
  renderInfo(sys);
  document.title = (sys[0].hostname || 'Система') + ' — экзопланеты';
}

async function load(system) {
  console.log('[app] загружаю systems.json…');
  try {
    json = await $.getJSON("/systems/"+system);

    if (!json.length)      return fatal('systems.json пуст');

    render(json);
  } catch (e) {
    fatal('не удалось загрузить systems.json: ' + e.message +
          '. Откройте через http://localhost:8000, а не file://');
  }
}

function initApp() {
  star      = document.getElementById('star');
  planetsG  = document.getElementById('planets');
  logCheck  = document.getElementById('logScale');
  infoEl    = document.getElementById('info');
  tintDefs  = document.getElementById('tintDefs');

    scaleInput  = document.getElementById('planetScale');
    scaleValue  = document.getElementById('scaleValue');
    
    if (!scaleInput) return fatal('не найден #planetScale в system.html');
    
    scaleInput.addEventListener('input', function () {
	planetScale = parseFloat(scaleInput.value) || 1;
	if (scaleValue) scaleValue.textContent = planetScale.toFixed(1);
	if (json) render(json);
    });
    
  if (!star)     return fatal('не найден #star в system.html');
  if (!planetsG) return fatal('не найден #planets в system.html');
  if (!logCheck) return fatal('не найден #logScale в system.html');
  if (!infoEl)   return fatal('не найден #info в system.html');
  if (!tintDefs) return fatal('не найден #tintDefs в system.html');

  var params = new URLSearchParams(location.search);
  var idxParam = params.get('i');
  currentIdx = idxParam;
  console.log('[app] индекс системы из URL:', currentIdx);

  logCheck.addEventListener('change', function () {
    if (json) render(json);
  });

  load(idxParam);
}

initApp();
