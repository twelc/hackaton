'use strict';

var NS = 'http://www.w3.org/2000/svg';

var params = new URLSearchParams(location.search);
var sysIdx    = params.get('sys');
var planetIdx = params.get('planet');
var imgNum    = parseInt(params.get('img'), 10);
if (!isFinite(imgNum) || imgNum <= 0) imgNum = 1;

var content  = document.getElementById('content');
var backLink = document.getElementById('backLink');

// ---------- Утилиты ----------

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function colorForHabitability(hab) {
  if (typeof hab !== 'number' || !isFinite(hab)) return 'rgb(108,176,224)';
  var t = Math.max(0, Math.min(1, hab));
  var r, g, b;
  if (t < 0.5) {
    var k = t * 2;
    r = Math.round(200 + 30 * k); g = Math.round(80 + 120 * k); b = 60;
  } else {
    var k2 = (t - 0.5) * 2;
    r = Math.round(230 - 150 * k2); g = 200; b = Math.round(60 + 40 * k2);
  }
  return 'rgb(' + r + ',' + g + ',' + b + ')';
}

function tintMatrix(color) {
  var m = color.match(/(\d+)\D+(\d+)\D+(\d+)/);
  if (!m) return '1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0';
  var r = (+m[1] / 255).toFixed(4);
  var g = (+m[2] / 255).toFixed(4);
  var b = (+m[3] / 255).toFixed(4);
  return r + ' 0 0 0 0  0 ' + g + ' 0 0 0  0 0 ' + b + ' 0 0  0 0 0 1 0';
}

function fmt(val, unit, digits) {
  if (val == null || !isFinite(val)) return '—';
  var num = Number(val);
  var str = Number.isInteger(num) ? String(num) : num.toFixed(digits == null ? 2 : digits);
  return str + (unit ? ' <span style="color:#666;font-weight:400">' + unit + '</span>' : '');
}

function fmtRA(deg) {
  if (deg == null || !isFinite(deg)) return '—';
  var h = deg / 15, hh = Math.floor(h);
  var mm = Math.floor((h - hh) * 60);
  var ss = ((h - hh) * 60 - mm) * 60;
  return hh + '<span style="color:#666">h</span> ' +
         String(mm).padStart(2, '0') + '<span style="color:#666">m</span> ' +
         ss.toFixed(1) + '<span style="color:#666">s</span>';
}

function fmtDec(deg) {
  if (deg == null || !isFinite(deg)) return '—';
  var sign = deg < 0 ? '−' : '+';
  var abs = Math.abs(deg);
  var d = Math.floor(abs);
  var mm = Math.floor((abs - d) * 60);
  var ss = ((abs - d) * 60 - mm) * 60;
  return sign + d + '<span style="color:#666">°</span> ' +
         String(mm).padStart(2, '0') + '<span style="color:#666">′</span> ' +
         ss.toFixed(1) + '<span style="color:#666">″</span>';
}

function row(label, value) {
  return '<dt style="color:#777;margin:0">' + label + '</dt>' +
         '<dd style="margin:0;color:#ddd;font-variant-numeric:tabular-nums">' + value + '</dd>';
}

// ---------- Рендер планеты ----------

function renderPlanet(planet) {
  var planetRade = Number(planet.pl_rade) > 0 ? Number(planet.pl_rade) : 1;
  var maxRade    = Math.max(planetRade, 1);
  var VIEW = 400, PAD = 20;
  var maxD = VIEW - PAD * 2;
  var planetD = (planetRade / maxRade) * maxD;
  var earthD  = (1 / maxRade) * maxD;

  var color      = colorForHabitability(planet.esi);
  var planetHref = '/static/planet_' + imgNum + '.png';
  var earthHref  = '/static/earth.png';

  var h2Style = 'font-weight:500;font-size:14px;color:#9bc;margin:32px 0 12px 0;' +
                'border-bottom:1px solid #1a1a1a;padding-bottom:6px;' +
                'text-transform:uppercase;letter-spacing:0.06em';
  var dlStyle = 'display:grid;grid-template-columns:220px 1fr;gap:8px 16px;' +
                'font-size:13px;margin:0';

  var html = '';
  html += '<h1 style="font-weight:400;font-size:22px;margin:0 0 24px 0;color:#fff">' +
          escapeHtml(planet.pl_name || '—') + '</h1>';

  html += '<div style="display:flex;justify-content:center;align-items:flex-end;gap:80px;margin-bottom:32px;flex-wrap:wrap">';

  html += '<div style="text-align:center">';
  html += '<svg id="planetSvg" viewBox="0 0 ' + VIEW + ' ' + VIEW + '" style="width:280px;height:280px;display:block">';
  html += '<defs><filter id="tint"><feColorMatrix type="matrix" values="' + tintMatrix(color) + '"/></filter></defs>';
  html += '<image id="planetImg" href="' + planetHref + '" xlink:href="' + planetHref + '"' +
          ' x="' + ((VIEW - planetD) / 2) + '" y="' + ((VIEW - planetD) / 2) + '"' +
          ' width="' + planetD + '" height="' + planetD + '"' +
          ' preserveAspectRatio="xMidYMid meet" filter="url(#tint)"/>';
  html += '</svg>';
  html += '<div style="margin-top:12px;color:#888;font-size:13px">' +
          escapeHtml(planet.pl_name || 'Планета') + '</div>';
  html += '<div style="color:#555;font-size:11px">' +
          (planet.pl_rade != null ? planetRade + ' R⊕' : '—') + '</div>';
  html += '</div>';

  html += '<div style="text-align:center">';
  html += '<svg id="earthSvg" viewBox="0 0 ' + VIEW + ' ' + VIEW + '" style="width:280px;height:280px;display:block">';
  html += '<image id="earthImg" href="' + earthHref + '" xlink:href="' + earthHref + '"' +
          ' x="' + ((VIEW - earthD) / 2) + '" y="' + ((VIEW - earthD) / 2) + '"' +
          ' width="' + earthD + '" height="' + earthD + '"' +
          ' preserveAspectRatio="xMidYMid meet"/>';
  html += '</svg>';
  html += '<div style="margin-top:12px;color:#888;font-size:13px">Земля</div>';
  html += '<div style="color:#555;font-size:11px">1 R⊕</div>';
  html += '</div>';

  html += '</div>';

  html += '<h2 style="' + h2Style + '">Данные планеты</h2>';
  html += '<dl style="' + dlStyle + '">';
  html += row('Радиус', fmt(planet.pl_rade, 'R⊕'));
  html += row('Масса', fmt(planet.pl_bmasse, 'M⊕'));
  html += row('Большая полуось', fmt(planet.pl_orbsmax, 'а.е.'));
  if (planet.esi != null && isFinite(planet.esi)) {
    html += row('Индекс обитаемости',
                '<span style="color:' + color + ';font-family:ui-monospace,monospace">' +
                Number(planet.esi).toFixed(2) + '</span>');
  }
  html += '</dl>';

  html += '<h2 style="' + h2Style + '">Система «' + escapeHtml(planet.hostname || '') + '» · космические координаты</h2>';
  html += '<dl style="' + dlStyle + '">';
  html += row('Прямое восхождение (RA)', fmtRA(planet.ra));
  html += row('Склонение (Dec)', fmtDec(planet.dec));
  if (planet.sy_dist != null && planet.sy_dist > 0) html += row('Расстояние от нас', fmt(planet.sy_dist, 'пк'));
  if (planet.st_spectype) html += row('Спектральный класс', escapeHtml(planet.st_spectype));
  if (planet.st_teff != null) html += row('Температура звезды', fmt(planet.st_teff, 'K', 0));
  html += '</dl>';
  html += '<div style="margin-top:12px;color:#888;font-size:13px">'
  html += escapeHtml(planet.message);
  html += '</div>'



  content.innerHTML = html;

  var planetImg = document.getElementById('planetImg');
  var planetSvg = document.getElementById('planetSvg');
  if (planetImg) {
    planetImg.addEventListener('error', function () {
      planetImg.remove();
      var c = document.createElementNS(NS, 'circle');
      c.setAttribute('cx', VIEW / 2); c.setAttribute('cy', VIEW / 2);
      c.setAttribute('r', planetD / 2); c.setAttribute('fill', color);
      planetSvg.appendChild(c);
    });
  }
  var earthImg = document.getElementById('earthImg');
  var earthSvg = document.getElementById('earthSvg');
  if (earthImg) {
    earthImg.addEventListener('error', function () {
      earthImg.remove();
      var c = document.createElementNS(NS, 'circle');
      c.setAttribute('cx', VIEW / 2); c.setAttribute('cy', VIEW / 2);
      c.setAttribute('r', earthD / 2); c.setAttribute('fill', '#2d5a8a');
      earthSvg.appendChild(c);
    });
  }
}

// ---------- Карта звёздного неба ----------

var STAR_CATALOG_URLS = [
  '/static/stars.json',
  'https://cdn.jsdelivr.net/npm/d3-celestial@0.7.35/data/stars.6.json'
];

var PROPER_NAMES = {
  'Alp CMa': 'Сириус', 'Alp Car': 'Канопус', 'Alp Cen': 'Толиман',
  'Alp Boo': 'Арктур', 'Alp Lyr': 'Вега', 'Alp Aur': 'Капелла',
  'Bet Ori': 'Ригель', 'Alp CMi': 'Процион', 'Alp Eri': 'Ахернар',
  'Alp Ori': 'Бетельгейзе', 'Bet Cen': 'Хадар', 'Alp Aql': 'Альтаир',
  'Alp Cru': 'Акрукс', 'Alp Tau': 'Альдебаран', 'Alp Sco': 'Антарес',
  'Alp Vir': 'Спика', 'Bet Gem': 'Поллукс', 'Alp PsA': 'Фомальгаут',
  'Alp Cyg': 'Денеб', 'Bet Cru': 'Мимоза', 'Alp Leo': 'Регул',
  'Alp UMi': 'Полярная', 'Alp Gem': 'Кастор', 'Gam Ori': 'Беллатрикс',
  'Bet Tau': 'Эльнат', 'Alp Pav': 'Пикок', 'Alp And': 'Альферац',
  'Alp Ari': 'Хамаль', 'Bet Per': 'Алголь', 'Alp Peg': 'Маркаб',
  'Gam Cru': 'Гакрукс', 'Eps CMa': 'Адара', 'Alp Lup': 'Менкент',
  'Alp Hya': 'Альфард', 'Alp Oph': 'Рас Альхаге', 'Alp Ser': 'Унукалхай',
  'Alp Cet': 'Менкар', 'Alp Per': 'Мирфак', 'Alp CrB': 'Альфекка',
  'Alp TrA': 'Атрия', 'Gam Cyg': 'Садр', 'Alp Gru': 'Альнаир',
  'Alp Phe': 'Анкаа', 'Alp Del': 'Ротанев', 'Alp Hyi': 'Голова Гидры',
  'Alp Sge': 'Шам', 'Zet Ori': 'Альнитак', 'Alp Mon': 'Один',
  'Alp Crv': 'Альхиба', 'Del Vel': 'Альзефина'
};

// Нормализованный словарь (без лишних пробелов/регистра)
var PROPER_NAMES_NORM = (function () {
  var out = {};
  for (var k in PROPER_NAMES) {
    if (Object.prototype.hasOwnProperty.call(PROPER_NAMES, k)) {
      out[String(k).replace(/\s+/g, ' ').trim()] = PROPER_NAMES[k];
    }
  }
  return out;
})();

// ---------- Загрузка каталога звёзд (кеш) ----------

var starsPromise = null;
function loadStars() {
  if (!starsPromise) {
    starsPromise = (async function () {
      for (var i = 0; i < STAR_CATALOG_URLS.length; i++) {
        try {
          var r = await fetch(STAR_CATALOG_URLS[i], { cache: 'force-cache' });
          if (!r.ok) continue;
          var json = await r.json();
          if (json && json.features && json.features.length) {
            console.log('[sky] каталог звёзд из', STAR_CATALOG_URLS[i],
                        '· звёзд:', json.features.length);
            if (!window.__loggedSkySample) {
              window.__loggedSkySample = true;
              for (var s = 0; s < Math.min(5, json.features.length); s++) {
                var fs = json.features[s];
                console.log('[sky] sample #' + s,
                            'props =', JSON.stringify(fs.properties),
                            'coords =', fs.geometry && fs.geometry.coordinates);
              }
            }
            return json.features;
          }
        } catch (e) {
          console.warn('[sky] не удалось загрузить', STAR_CATALOG_URLS[i], e.message);
        }
      }
      console.warn('[sky] каталог звёзд недоступен');
      return [];
    })();
  }
  return starsPromise;
}

// Проекция Айтова. RA в любом диапазоне (0..360 или -180..180).
function aitoffProject(raDeg, decDeg, W, H) {
  var lonDeg = raDeg;
  if (lonDeg > 180) lonDeg -= 360;
  else if (lonDeg < -180) lonDeg += 360;

  var lambda = lonDeg * Math.PI / 180;
  var phi    = decDeg * Math.PI / 180;
  var cosPhi = Math.cos(phi);
  var cosA   = Math.max(-1, Math.min(1, cosPhi * Math.cos(lambda / 2)));
  var alpha  = Math.acos(cosA);
  var sincA  = alpha === 0 ? 1 : Math.sin(alpha) / alpha;
  var x = 2 * cosPhi * Math.sin(lambda / 2) / sincA;
  var y = Math.sin(phi) / sincA;
  return [W / 2 + x * (W / (2 * Math.PI)), H / 2 - y * (H / Math.PI)];
}

function normalizeStarName(s) {
  return String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
}

async function drawCustomSkyMap(raDeg, decDeg, sysName) {
  var canvas = document.getElementById('skyMap');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var W = canvas.width, H = canvas.height;

  ctx.fillStyle = '#05070f';
  ctx.fillRect(0, 0, W, H);

  // сетка RA
  ctx.strokeStyle = 'rgba(80, 110, 150, 0.12)';
  ctx.lineWidth = 0.5;
  for (var ra = 0; ra < 360; ra += 30) {
    ctx.beginPath();
    for (var d = -90; d <= 90; d += 5) {
      var p = aitoffProject(ra, d, W, H);
      if (d === -90) ctx.moveTo(p[0], p[1]); else ctx.lineTo(p[0], p[1]);
    }
    ctx.stroke();
  }
  // сетка Dec
  for (var dec = -60; dec <= 60; dec += 30) {
    ctx.beginPath();
    for (var r = 0; r <= 360; r += 5) {
      var p = aitoffProject(r, dec, W, H);
      if (r === 0) ctx.moveTo(p[0], p[1]); else ctx.lineTo(p[0], p[1]);
    }
    ctx.stroke();
  }
  // экватор
  ctx.strokeStyle = 'rgba(80, 110, 150, 0.25)';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  for (var r = 0; r <= 360; r += 5) {
    var p = aitoffProject(r, 0, W, H);
    if (r === 0) ctx.moveTo(p[0], p[1]); else ctx.lineTo(p[0], p[1]);
  }
  ctx.stroke();

  // 1. Фоновые звёзды + сбор имён
  var stars = await loadStars();
  var namedStars = [];

  for (var i = 0; i < stars.length; i++) {
    var f = stars[i];
    if (!f.geometry || !f.geometry.coordinates) continue;
    var c = f.geometry.coordinates;
    if (c.length < 2) continue;
    var sra = c[0], sdec = c[1];
    if (sra < 0) sra += 360;
    var props = f.properties || {};
    var mag = Number(props.mag);
    if (!isFinite(mag)) continue;

    var p = aitoffProject(sra, sdec, W, H);
    if (p[0] < 0 || p[0] > W || p[1] < 0 || p[1] > H) continue;

    var rr = Math.max(0.5, 2.5 * Math.exp(-0.4 * (mag + 1)));
    var aa = Math.min(1, Math.max(0.3, 1 - mag / 7));

    ctx.beginPath();
    ctx.arc(p[0], p[1], rr, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, ' + aa.toFixed(2) + ')';
    ctx.fill();

    // --- Подпись: перебираем возможные поля ---
    var candidates = [props.name, props.desig, props.bayer, props.proper];
    for (var ci = 0; ci < candidates.length; ci++) {
      var cand = candidates[ci];
      if (!cand) continue;
      var key = normalizeStarName(cand);
      if (PROPER_NAMES_NORM[key]) {
        namedStars.push({ name: PROPER_NAMES_NORM[key], x: p[0], y: p[1] });
        break;
      }
    }
  }

  console.log('[sky] named stars:', namedStars.length, 'из', stars.length, 'в каталоге');

  // 2. Подписи
  ctx.font = '600 13px system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';

  for (var k = 0; k < namedStars.length; k++) {
    var ns = namedStars[k];
    ctx.beginPath();
    ctx.arc(ns.x, ns.y, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.strokeText(ns.name, ns.x + 9, ns.y);

    ctx.fillStyle = 'rgba(220, 235, 255, 0.95)';
    ctx.fillText(ns.name, ns.x + 9, ns.y);
  }

  // 3. Маркер системы
  if (raDeg != null && decDeg != null && isFinite(raDeg) && isFinite(decDeg)) {
    var m = aitoffProject(raDeg, decDeg, W, H);
    ctx.beginPath();
    ctx.arc(m[0], m[1], 16, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 204, 68, 0.25)';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(m[0], m[1], 7, 0, Math.PI * 2);
    ctx.fillStyle = '#ffcc44';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();

    var label = sysName || 'Система';
    var fontSize = 14;
    ctx.font = '600 ' + fontSize + 'px system-ui, sans-serif';
    var textW = ctx.measureText(label).width;
    var padX = 8, padY = 5;
    var bw = textW + padX * 2, bh = fontSize + padY * 2;
    var lx = m[0] + 14, ly = m[1] - bh / 2;
    if (lx + bw > W - 4) lx = m[0] - bw - 14;
    if (lx < 4) lx = m[0] + 14;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(lx, ly, bw, bh);
    ctx.strokeStyle = 'rgba(255, 204, 68, 0.75)';
    ctx.lineWidth = 1;
    ctx.strokeRect(lx, ly, bw, bh);
    ctx.fillStyle = '#ffcc44';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillText(label, lx + padX, m[1]);
  }
}

// ---------- d3-celestial ----------

var celestialReady = false;
var celestialMarkerTimer = null;

function stopCelestialMarker() {
  if (celestialMarkerTimer) {
    clearInterval(celestialMarkerTimer);
    celestialMarkerTimer = null;
  }
}

function initCelestialMap(raDeg, decDeg, sysName) {
  if (typeof Celestial === 'undefined') {
    console.warn('[sky-celestial] Celestial не загрузился');
    return;
  }
  var mapDiv = document.getElementById('celestial-map');
  if (!mapDiv) return;

  if (!celestialReady) {
    try {
      Celestial.display({
        container: 'celestial-map',
        projection: 'aitoff',
        transform: 'equatorial',
        stars: { show: true, limit: 6, colors: true },
        constellations: { show: true, names: true, lines: true },
        interactive: true,
        datapath: 'https://cdn.jsdelivr.net/npm/d3-celestial@0.7.35/data/'
      });
      celestialReady = true;
      console.log('[sky-celestial] display() выполнен');
    } catch (e) {
      console.error('[sky-celestial] ошибка display:', e);
      return;
    }
  }

  if (raDeg != null && decDeg != null && isFinite(raDeg) && isFinite(decDeg)) {
    startCelestialMarker(raDeg, decDeg, sysName);
  }
}

function startCelestialMarker(raDeg, decDeg, sysName) {
  stopCelestialMarker();

  var mapDiv       = document.getElementById('celestial-map');
  var markerCanvas = document.getElementById('marker-canvas');
  if (!mapDiv || !markerCanvas) {
    console.warn('[marker] контейнеры не найдены');
    return;
  }

  var lon = raDeg > 180 ? raDeg - 360 : raDeg;
  var lat = decDeg;
  var tries = 0;

  function projectPoint() {
    if (typeof Celestial === 'undefined') return { pt: null, api: 'нет Celestial' };

    if (typeof Celestial.map === 'function') {
      try {
        var p1 = Celestial.map([lon, lat]);
        if (p1 && isFinite(p1[0]) && isFinite(p1[1])) return { pt: p1, api: 'Celestial.map' };
      } catch (e) { /* следующий */ }
    }
    if (Celestial.projection && typeof Celestial.projection === 'function') {
      try {
        var p2 = Celestial.projection([lon, lat]);
        if (p2 && isFinite(p2[0]) && isFinite(p2[1])) return { pt: p2, api: 'Celestial.projection' };
      } catch (e) { /* следующий */ }
    }
    if (typeof Celestial.mapProjection === 'function') {
      try {
        var p3 = Celestial.mapProjection([lon, lat]);
        if (p3 && isFinite(p3[0]) && isFinite(p3[1])) return { pt: p3, api: 'Celestial.mapProjection' };
      } catch (e) { /* следующий */ }
    }
    return { pt: null, api: 'ни один API не сработал' };
  }

  function draw() {
    tries++;
    if (document.hidden) return;

    var mapCanvas = mapDiv.querySelector('canvas');
    if (!mapCanvas) {
      if (tries <= 3) console.log('[marker] попытка', tries, ': canvas карты ещё не создан');
      return;
    }

    var rect = mapCanvas.getBoundingClientRect();
    var cssW = rect.width || 1;
    var cssH = rect.height || 1;
    var dpr  = window.devicePixelRatio || 1;

    // Внутренний размер = CSS * DPR (чтобы координаты Celestial.map ложились 1:1 в CSS-пиксели)
    var iw = Math.round(cssW * dpr);
    var ih = Math.round(cssH * dpr);
    if (markerCanvas.width  !== iw) markerCanvas.width  = iw;
    if (markerCanvas.height !== ih) markerCanvas.height = ih;

    var ctx = markerCanvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // работаем в CSS-координатах
    ctx.clearRect(0, 0, cssW, cssH);

    var res = projectPoint();
    var pt  = res.pt;

    if (tries <= 3) {
      console.log('[marker] попытка', tries,
                  '| API:', res.api,
                  '| pt =', pt,
                  '| CSS:', cssW, cssH,
                  '| internal:', mapCanvas.width, mapCanvas.height,
                  '| dpr:', dpr);
    }

    if (!pt) return;

    // Если точка явно за пределами CSS-диапазона — возможно, координаты внутренние.
    var x = pt[0], y = pt[1];
    if (x > cssW * 1.2 || y > cssH * 1.2 || x < -cssW * 0.2 || y < -cssH * 0.2) {
      x = pt[0] / dpr;
      y = pt[1] / dpr;
    }

    // --- Рисуем маркер ---
    ctx.beginPath();
    ctx.arc(x, y, 16, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 204, 68, 0.25)';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, y, 7, 0, Math.PI * 2);
    ctx.fillStyle = '#ffcc44';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();

    var label = sysName || 'Система';
    var fontSize = Math.max(14, Math.round(cssW / 65));
    ctx.font = '600 ' + fontSize + 'px system-ui, sans-serif';
    var textW = ctx.measureText(label).width;
    var padX = 8, padY = 5;
    var bw = textW + padX * 2, bh = fontSize + padY * 2;
    var lx = x + 14, ly = y - bh / 2;
    if (lx + bw > cssW - 4) lx = x - bw - 14;
    if (lx < 4) lx = x + 14;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(lx, ly, bw, bh);
    ctx.strokeStyle = 'rgba(255, 204, 68, 0.75)';
    ctx.lineWidth = 1;
    ctx.strokeRect(lx, ly, bw, bh);
    ctx.fillStyle = '#ffcc44';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillText(label, lx + padX, y);
  }

  draw();
  celestialMarkerTimer = setInterval(draw, 200);
}

// ---------- Переключатель ----------

function setupSkyModeSwitch(sys) {
  var ra = sys.ra, dec = sys.dec, name = sys.hostname;

  var divCustom    = document.getElementById('sky-custom');
  var divCelestial = document.getElementById('sky-celestial');
  if (!divCustom || !divCelestial) return;

  drawCustomSkyMap(ra, dec, name).catch(function (e) {
    console.warn('[sky] ошибка:', e);
  });

  var radios = document.querySelectorAll('input[name="skyMode"]');
  function apply(mode) {
    if (mode === 'custom') {
      divCustom.style.display = 'block';
      divCelestial.style.display = 'none';
      stopCelestialMarker();
    } else {
      divCustom.style.display = 'none';
      divCelestial.style.display = 'block';
      setTimeout(function () {
        try { initCelestialMap(ra, dec, name); }
        catch (e) { console.warn('[sky-celestial] ошибка:', e); }
      }, 50);
    }
  }
  for (var i = 0; i < radios.length; i++) {
    radios[i].addEventListener('change', function (e) { apply(e.target.value); });
  }
  apply('custom');
}

// ---------- Старт ----------

async function init() {
  try {
    var json = await $.getJSON("/planets/"+planetIdx);

    console.log(json)
    backLink.href = 'system?i=' + sysIdx;
    backLink.textContent = '← к системе «' + (json.hostname || '') + '»';

    var planet = json;
    if (!planet) { content.textContent = 'Планета ' + planetIdx + ' не найдена'; return; }

    document.title = (planet.pl_name || 'Планета') + ' — ' + (planet.hostname || '');
    renderPlanet(planet);

    setTimeout(function () {
      try { setupSkyModeSwitch(planet); }
      catch (e) { console.warn('[sky] ошибка:', e); }
    }, 100);
  } catch (e) {
    content.textContent = 'Ошибка загрузки: ' + e.mesage;
    console.error(e);
  }
}

init();
