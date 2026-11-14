(function () {
  const NS = 'http://www.w3.org/2000/svg';
  const SUN_IN_EARTH = 109.2;
  const STAR_R       = 540;
  const STAR_CY      = 540;
  const AREA_LEFT    = 600;
  const AREA_RIGHT   = 1900;

  const star      = document.getElementById('star');
  const planetsG  = document.getElementById('planets');
  const logCheck  = document.getElementById('logScale');
  const infoEl    = document.getElementById('info');

  let systems = [];
  let currentIdx = 0;

  // номер системы из URL: ?i=0
  const params = new URLSearchParams(location.search);
  const idxParam = parseInt(params.get('i'), 10);
  currentIdx = isFinite(idxParam) && idxParam >= 0 ? idxParam : 0;

  function starColor(teff) {
    if (teff == null) return '#ffd060';
    if (teff < 3700) return '#ff7040';
    if (teff < 5200) return '#ffb060';
    if (teff < 6000) return '#ffd060';
    if (teff < 7500) return '#eaeaf8';
    if (teff < 10000) return '#c8d8ff';
    return '#a0b8ff';
  }

  async function load() {
    try {
      const r = await fetch('./systems.json', { cache: 'no-store' });
      const json = await r.json();
      systems = json.systems || [];
      if (!systems[currentIdx]) {
        infoEl.textContent = 'Система с индексом ' + currentIdx + ' не найдена';
        return;
      }
      render(currentIdx);
    } catch (e) {
      infoEl.textContent = 'Ошибка: ' + e.message;
    }
  }

  function render(idx) {
    const sys = systems[idx];
    if (!sys) return;
    currentIdx = idx;

    const st = sys.star || {};
    star.setAttribute('fill', starColor(st.teff));

    const starRadeEarth = (Number(st.radius) || 1) * SUN_IN_EARTH;
    const pxPerRearth   = STAR_R / starRadeEarth;

    drawPlanets(sys.planets || [], pxPerRearth);
    renderInfo(sys);
    document.title = (sys.name || 'Система') + ' — экзопланеты';
  }

  function renderInfo(sys) {
    const st = sys.star || {};
    const p  = sys.planets || [];
    const lines = [sys.name || '—', '─'.repeat(20)];
    if (st.radius       != null) lines.push('R       = ' + st.radius + ' R☉');
    if (st.mass         != null) lines.push('M       = ' + st.mass + ' M☉');
    if (st.teff         != null) lines.push('T_eff   = ' + st.teff + ' K');
    if (st.luminosity   != null) lines.push('L       = ' + st.luminosity + ' L☉');
    if (st.spectralType)         lines.push('Спектр  = ' + st.spectralType);
    if (st.metallicity  != null) lines.push('[Fe/H]  = ' + st.metallicity);
    if (st.age          != null) lines.push('Возраст = ' + st.age + ' Gyr');
    if (st.distance     != null) lines.push('До нас  = ' + st.distance + ' пк');
    lines.push('Планет  = ' + p.length);

    // макс. обитаемость
    const hab = p.map(x => x.habitability).filter(v => typeof v === 'number' && isFinite(v));
    if (hab.length) lines.push('Макс. обит. = ' + Math.max(...hab).toFixed(2));

    lines.push('');
    lines.push('Размеры планет — реальные');
    lines.push('пропорции относительно звезды.');
    infoEl.textContent = lines.join('\n');
  }

  function drawPlanets(planets, pxPerRearth) {
    planetsG.innerHTML = '';
    const valid = planets.filter(p => Number(p.orbsmax) > 0);
    if (!valid.length) return;

    const isLog = logCheck.checked;
    const orbs = valid.map(p => Number(p.orbsmax));
    const min = Math.min(...orbs);
    const max = Math.max(...orbs);

    let mapX;
    if (isLog) {
      const lmin = Math.log10(Math.max(min, 1e-6));
      const lmax = Math.log10(Math.max(max, 1e-6));
      const range = (lmax - lmin) || 1;
      mapX = d => AREA_LEFT + ((Math.log10(Math.max(d, 1e-6)) - lmin) / range) * (AREA_RIGHT - AREA_LEFT);
    } else {
      const range = (max - min) || 1;
      mapX = d => AREA_LEFT + ((d - min) / range) * (AREA_RIGHT - AREA_LEFT);
    }

    const single = valid.length === 1;

    valid.forEach(p => {
      const cx = single ? (AREA_LEFT + AREA_RIGHT) / 2 : mapX(Number(p.orbsmax));

      let r;
      if (p.rade != null && Number(p.rade) > 0) {
        r = pxPerRearth * Number(p.rade);
        if (r < 2) r = 2;
      } else {
        r = 5;
      }

      // планета: цвет чуть зеленее, если есть индекс обитаемости
      const habitable = typeof p.habitability === 'number';
      const c = document.createElementNS(NS, 'circle');
      c.setAttribute('cx', cx);
      c.setAttribute('cy', STAR_CY);
      c.setAttribute('r', r);
      c.setAttribute('fill', habitable ? '#7cd0a0' : '#6cb0e0');
      planetsG.appendChild(c);

      const label = document.createElementNS(NS, 'text');
      label.setAttribute('x', cx);
      label.setAttribute('y', STAR_CY - r - 8);
      label.setAttribute('text-anchor', 'middle');
      label.setAttribute('font-size', '13');
      label.setAttribute('fill', '#ddd');
      label.setAttribute('font-family', 'system-ui, sans-serif');
      label.textContent = p.name || '?';
      planetsG.appendChild(label);

      const dist = document.createElementNS(NS, 'text');
      dist.setAttribute('x', cx);
      dist.setAttribute('y', STAR_CY + r + 18);
      dist.setAttribute('text-anchor', 'middle');
      dist.setAttribute('font-size', '11');
      dist.setAttribute('fill', '#888');
      dist.setAttribute('font-family', 'system-ui, sans-serif');
      dist.textContent = p.orbsmax + ' а.е.';
      planetsG.appendChild(dist);

      // если есть habitability — подпись под расстоянием
      if (habitable) {
        const hb = document.createElementNS(NS, 'text');
        hb.setAttribute('x', cx);
        hb.setAttribute('y', STAR_CY + r + 32);
        hb.setAttribute('text-anchor', 'middle');
        hb.setAttribute('font-size', '10');
        hb.setAttribute('fill', '#7cd0a0');
        hb.setAttribute('font-family', 'ui-monospace, monospace');
        hb.textContent = 'обит. ' + Number(p.habitability).toFixed(2);
        planetsG.appendChild(hb);
      }
    });
  }

  logCheck.addEventListener('change', () => {
    if (systems[currentIdx]) render(currentIdx);
  });

  load();
})();
