'use strict';

var list        = document.getElementById('list');
var sortSelect  = document.getElementById('sortSelect');
var countEl     = document.getElementById('count');

var json = [];
var currentSort = { field: null, dir: 'desc' };

function starColor(teff) {
  if (teff == null) return '#ffd060';
  if (teff < 3700) return '#ff7040';
  if (teff < 5200) return '#ffb060';
  if (teff < 6000) return '#ffd060';
  if (teff < 7500) return '#eaeaf8';
  if (teff < 10000) return '#c8d8ff';
  return '#a0b8ff';
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// максимум habitability среди планет системы
function getMaxHabitability(sys) {
  var planets = sys.planets || [];
  var vals = [];
  for (var i = 0; i < planets.length; i++) {
    var v = planets[i].habitability;
    if (typeof v === 'number' && isFinite(v)) vals.push(v);
  }
  return vals.length ? Math.max.apply(null, vals) : null;
}

// расстояние от Солнца (sy_dist), в системах с distance
function getDistance(sys) {
  var d = sys.star && sys.star.distance;
  if (typeof d === 'number' && isFinite(d)) return d;
  return null;
}

// эффективная температура звезды
function getTemperature(sys) {
  var t = sys.star && sys.star.teff;
  if (typeof t === 'number' && isFinite(t)) return t;
  return null;
}

function getSortValue(sys, field) {
  if (field === 'habitability') return sys.esi;
  if (field === 'distance')     return sys.sy_dist;
  if (field === 'temperature')  return sys.st_teff;
  return null;
}

function sortedSystems() {
  var arr = json.slice();
  if (!currentSort.field) return arr;

  var sign = currentSort.dir === 'asc' ? 1 : -1;
  var field = currentSort.field;

  arr.sort(function (a, b) {
    var va = getSortValue(a, field);
    var vb = getSortValue(b, field);
    // системы без значения — всегда в конце
    if (va == null && vb == null) return 0;
    if (va == null) return 1;
    if (vb == null) return -1;
    return (va - vb) * sign;
  });
  return arr;
}

function render() {
  var systems = sortedSystems();
  list.innerHTML = '';

  if (!systems.length) {
    list.innerHTML = '<div class="empty">Список систем пуст</div>';
    countEl.textContent = '';
    return;
  }

  countEl.textContent = 'систем: ' + systems.length;

  systems.forEach(function (sys) {
    var st       = sys.hostname || "";
    var planets  = sys.planets || "";
    var maxHab   = sys.esi;
    var distance = sys.sy_dist;
    var color    = starColor(sys.st_teff);

    var starParts = [];
    if (sys.st_spectype) starParts.push(sys.st_spectype);
    if (sys.teff != null) starParts.push(sys.teff + ' K');
    if (distance != null && distance > 0) starParts.push(distance + ' пк');
    var starDesc = starParts.join(' · ') || '—';

    var planetNames = sys.planet_names || '—';

    var habHtml = maxHab != null
      ? '<span class="max-hab">обит. ≤ ' + maxHab.toFixed(2) + '</span>'
      : '<span class="max-hab none">обит. —</span>';

    var a = document.createElement('a');
    a.className = 'system-row';
    a.href = 'system?i=' + sys.hostname;
    a.innerHTML =
      '<div class="head">' +
        '<span class="star-dot" style="background:' + color + ';color:' + color + '"></span>' +
        '<span class="sys-name">' + escapeHtml(sys.hostname || 'Безымянная система') + '</span>' +
        habHtml +
      '</div>' +
      '<div class="meta">Звезда: ' + escapeHtml(starDesc) + '</div>' +
      '<div class="planets">' + planets + ' план. · ' + escapeHtml(planetNames) + '</div>';

    list.appendChild(a);
  });
}

function onSortChange() {
  var val = sortSelect.value;
  if (!val) {
    currentSort = { field: null, dir: 'desc' };
  } else {
    var parts = val.split(':');
    currentSort = { field: parts[0], dir: parts[1] || 'desc' };
  }
  render();
}

async function init() {
  try {
    json = await $.getJSON("/get_systems");
    
    sortSelect.addEventListener('change', onSortChange);
    render();
  } catch (e) {
    list.innerHTML = '<div class="empty">Ошибка загрузки: ' + escapeHtml(e.message) + '</div>';
  }
}

init();
