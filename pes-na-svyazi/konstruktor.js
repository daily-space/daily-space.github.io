/* Конструктор адресника «Пёс на связи» — общий движок для обоих концептов.
   Разметку управления пишет сам концепт: data-k="поле" data-v="значение",
   кнопки data-k-act="flip|shuffle|order|bot", клавиши data-k-key="1".
   Сцена: элемент [data-k-stage], итог: [data-k-out="поле"]. */
(function () {
  const IMG = (window.K_IMG || 'img/');
  const BOT = 'https://t.me/pes_na_svyazi_bot';
  const MANAGER = 'https://t.me/pesnasvyaziorder';

  const DESIGNS = {
    '120_0': { name: 'Ромашка', note: 'перламутровые лепестки переливаются на солнце' },
    '180_2': { name: 'Мухомор', note: 'из осенней коллекции' },
    '105_1': { name: 'Круассан', note: 'по середине можно нанести кличку', label: true },
    '180_4': { name: 'Маковая булочка', note: 'для ценителей маковых булочек' },
    '188_0': { name: 'Призрак', note: 'ушки висячие или стоячие' },
    '158_3': { name: 'Манэки-неко', note: 'символ удачи из Японии' },
    '175_0': { name: 'Ракушка с жемчугом', note: 'вдохновились морем' },
    '246_0': { name: 'Козочка', note: 'кому не нравятся козочки, тот ни бе, ни ме' },
    'bone':  { name: 'Косточка с кличкой', note: 'кличка на лицевой стороне', label: true, svg: true },
    'portrait': { name: 'Портрет по фото', note: 'разработаем макет по фото вашего хвостика', custom: true }
  };
  const SIZES = {
    micro: { name: 'микро', mm: '20–25 мм', who: 'котики и очень маленькие собаки', neck: '20–28 см', k: .62 },
    mini:  { name: 'мини', mm: '25–30 мм', who: 'йорки, той-пудели, шпицы, мопсы', neck: '25–35 см', k: .74 },
    sred:  { name: 'средний', mm: '30–35 мм', who: 'бигли, фр. бульдоги, сиба-ину, басенджи, корги', neck: '30–45 см', k: .86 },
    krup:  { name: 'крупный', mm: '35–40 мм', who: 'лабрадоры, бордер-колли, доберманы, питбули, хаски', neck: '40–55 см', k: 1 },
    xl:    { name: 'очень крупный', mm: '40–45 мм', who: 'очень крупные и гигантские породы', neck: '50–70 см', k: 1.12 }
  };
  // 24 цвета шнурков по их таблице (оттенки примерные)
  const CORDS = {
    1: '#D9326F', 2: '#F2639A', 3: '#E8336A', 4: '#D42A2A', 5: '#F06A25', 6: '#222222', 7: '#4A3226', 8: '#8B8B88',
    9: '#7A6347', 10: '#C9A77E', 11: '#2C3E8F', 12: '#2A73C9', 13: '#1E9A8A', 14: '#7FC7DD', 15: '#A9B9C9',
    16: '#F2A22B', 17: '#F7D23A', 18: '#8E5CC9', 19: '#6A3AA8', 21: '#A8642C', 22: '#D99AA6', 23: '#7E9C6E',
    24: '#7D8FC6', 25: '#BFA77B'
  };
  // наборы бусин по мотивам их работ
  const B = (t, c, r) => ({ t, c, r: r || 1 });
  const PRESETS = {
    klubnika: { name: 'клубничный', seq: [B('round', '#D7262E'), B('round', '#F7F1E6', .8), B('heart', '#E3222B', 1.15), B('round', '#F7F1E6', .8), B('cube', '#D7262E', 1.1), B('round', '#F7F1E6', .8), B('flower', '#FFFFFF', 1.1)] },
    osen:     { name: 'осенний', seq: [B('round', '#F07D1E'), B('crystal', '#E6A04A', .85), B('round', '#F6E7CF', .8), B('round', '#F59A2E'), B('heart', '#FFF4E2', 1.05), B('crystal', '#C9762B', .85), B('round', '#E85D1A')] },
    shokolad: { name: 'шоколадный', seq: [B('round', '#5A3324'), B('round', '#F3E6D2', .85), B('flower', '#E2B79A', 1.15), B('round', '#8A5A44', .85), B('heart', '#F3E6D2', 1.05), B('cube', '#6B3F2C', 1.05), B('round', '#B98A70', .85)] },
    lavanda:  { name: 'лавандовый', seq: [B('round', '#9C7FD9'), B('pearl', '#DADDE3', .9), B('crystal', '#B9A2EC', .85), B('flower', '#B79BF0', 1.15), B('pearl', '#DADDE3', .9), B('round', '#7F64C4')] },
    more:     { name: 'морской', seq: [B('round', '#2E6FD0'), B('round', '#FFFFFF', .8), B('cube', '#2E6FD0', 1.05), B('crystal', '#7FC6EE', .85), B('star', '#5BA8F0', 1.15), B('round', '#9ED4F2', .85)] },
    zefir:    { name: 'зефирный', seq: [B('round', '#F7A8C4'), B('round', '#FFFFFF', .8), B('heart', '#F06A9C', 1.1), B('pearl', '#F4E9EC', .9), B('flower', '#FBC8DA', 1.15), B('round', '#E8457A', .85)] }
  };
  const PRICE = { cord: 2000, beads: 2499 };

  function el(tag, attrs, html) {
    const e = document.createElement(tag);
    for (const k in attrs || {}) e.setAttribute(k, attrs[k]);
    if (html != null) e.innerHTML = html;
    return e;
  }
  const NS = 'http://www.w3.org/2000/svg';
  function sv(tag, attrs) { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); return e; }
  const rub = n => n.toLocaleString('ru-RU').replace(/\s/g, ' ') + ' ₽';
  function fmtPhone(d) {
    if (!d) return '';
    let s = d.startsWith('7') || d.startsWith('8') ? d.slice(1) : d;
    const p = [s.slice(0, 3), s.slice(3, 6), s.slice(6, 8), s.slice(8, 10)];
    let out = '+7';
    if (p[0]) out += ' ' + p[0];
    if (p[1]) out += ' ' + p[1];
    if (p[2]) out += '-' + p[2];
    if (p[3]) out += '-' + p[3];
    return out;
  }
  function shade(hex, f) {
    const n = parseInt(hex.slice(1), 16);
    let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    const t = f < 0 ? 0 : 255, p = Math.abs(f);
    r = Math.round((t - r) * p + r); g = Math.round((t - g) * p + g); b = Math.round((t - b) * p + b);
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  window.Konstruktor = function (root, opt) {
    opt = opt || {};
    const st = Object.assign({ design: '120_0', mode: 'beads', cord: 2, beads: 'klubnika', size: 'sred', name: '', phone: '', note: '', girth: '', side: 'front', photo: null, seed: 0 }, opt.start || {});
    const stage = root.querySelector('[data-k-stage]');

    // ---- сцена
    stage.innerHTML = '';
    stage.classList.add('k-stage');
    const svg = sv('svg', { viewBox: '0 0 400 460', class: 'k-svg', 'aria-hidden': 'true' });
    const defs = sv('defs', {});
    defs.innerHTML = '<radialGradient id="kHi" cx="35%" cy="30%" r="65%"><stop offset="0" stop-color="#fff" stop-opacity=".75"/><stop offset=".35" stop-color="#fff" stop-opacity=".12"/><stop offset="1" stop-color="#000" stop-opacity=".18"/></radialGradient>' +
      '<pattern id="kCheck" width="8" height="8" patternUnits="userSpaceOnUse"><rect width="8" height="8" fill="#fff"/><rect width="4" height="4" fill="currentColor"/><rect x="4" y="4" width="4" height="4" fill="currentColor"/></pattern>';
    svg.appendChild(defs);
    const gCord = sv('g', {}); const gBeads = sv('g', {});
    svg.appendChild(gCord); svg.appendChild(gBeads);
    const PATH_D = 'M 70 -20 C 70 170, 130 300, 200 300 C 270 300, 330 170, 330 -20';
    const guide = sv('path', { d: PATH_D, fill: 'none', stroke: 'none' });
    svg.appendChild(guide);
    stage.appendChild(svg);

    const pend = el('div', { class: 'k-pend' });
    pend.innerHTML = '<div class="k-ring"></div><div class="k-card"><div class="k-face k-front"></div><div class="k-face k-back"></div></div>';
    stage.appendChild(pend);
    const front = pend.querySelector('.k-front'), back = pend.querySelector('.k-back'), card = pend.querySelector('.k-card');
    const sizeTag = el('div', { class: 'k-sizetag' }); stage.appendChild(sizeTag);

    function drawString() {
      gCord.innerHTML = ''; gBeads.innerHTML = '';
      const L = guide.getTotalLength();
      if (st.mode === 'cord') {
        const c = CORDS[st.cord] || '#D9326F';
        gCord.appendChild(sv('path', { d: PATH_D, fill: 'none', stroke: shade(c, -.25), 'stroke-width': 11, 'stroke-linecap': 'round' }));
        gCord.appendChild(sv('path', { d: PATH_D, fill: 'none', stroke: c, 'stroke-width': 8.5, 'stroke-linecap': 'round' }));
        gCord.appendChild(sv('path', { d: PATH_D, fill: 'none', stroke: shade(c, .25), 'stroke-width': 2.2, 'stroke-dasharray': '3 4', opacity: .8 }));
        return;
      }
      gCord.appendChild(sv('path', { d: PATH_D, fill: 'none', stroke: '#cfc6b8', 'stroke-width': 2 }));
      const seq = PRESETS[st.beads].seq.slice();
      // перемешивание по зерну
      let s = st.seed;
      if (s) for (let i = seq.length - 1; i > 0; i--) { s = (s * 9301 + 49297) % 233280; const j = Math.floor(s / 233280 * (i + 1)); [seq[i], seq[j]] = [seq[j], seq[i]]; }
      const mid = L / 2, gap = 15; // место для кольца
      const place = (from, dir) => {
        let pos = from, i = 0;
        while (pos > 0 && pos < L) {
          const b = seq[i % seq.length]; const r = 10.5 * b.r;
          pos += dir * r;
          if (pos <= 0 || pos >= L) break;
          bead(b, guide.getPointAtLength(pos), guide.getPointAtLength(Math.min(L, pos + 1)), r);
          pos += dir * (r + 1.2); i++;
        }
      };
      place(mid - gap, -1); place(mid + gap, 1);
    }
    function bead(b, p, q, r) {
      const ang = Math.atan2(q.y - p.y, q.x - p.x) * 180 / Math.PI;
      const g = sv('g', { transform: `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${ang.toFixed(1)})` });
      const dark = shade(b.c, -.22);
      let shape;
      if (b.t === 'heart') {
        shape = sv('path', { d: `M0 ${r * .85} C ${-r * 1.4} ${-r * .1}, ${-r * .7} ${-r * 1.1}, 0 ${-r * .45} C ${r * .7} ${-r * 1.1}, ${r * 1.4} ${-r * .1}, 0 ${r * .85} Z`, fill: b.c, stroke: dark, 'stroke-width': .8, transform: 'rotate(90)' });
      } else if (b.t === 'flower') {
        shape = sv('g', {});
        for (let k = 0; k < 5; k++) { const a = k * 72 * Math.PI / 180; shape.appendChild(sv('circle', { cx: Math.cos(a) * r * .55, cy: Math.sin(a) * r * .55, r: r * .5, fill: b.c, stroke: dark, 'stroke-width': .6 })); }
        shape.appendChild(sv('circle', { r: r * .3, fill: '#F6C94A' }));
      } else if (b.t === 'star') {
        let d = ''; for (let k = 0; k < 10; k++) { const a = (k * 36 - 90) * Math.PI / 180, rr = k % 2 ? r * .5 : r; d += (k ? 'L' : 'M') + (Math.cos(a) * rr).toFixed(1) + ' ' + (Math.sin(a) * rr).toFixed(1); }
        shape = sv('path', { d: d + 'Z', fill: b.c, stroke: dark, 'stroke-width': .8, 'stroke-linejoin': 'round' });
      } else if (b.t === 'cube') {
        const pid = 'kCk' + b.c.slice(1);
        if (!defs.querySelector('#' + pid)) {
          const pt = sv('pattern', { id: pid, width: 8, height: 8, patternUnits: 'userSpaceOnUse' });
          pt.innerHTML = `<rect width="8" height="8" fill="#fff"/><rect width="4" height="4" fill="${b.c}"/><rect x="4" y="4" width="4" height="4" fill="${b.c}"/>`;
          defs.appendChild(pt);
        }
        shape = sv('rect', { x: -r * .85, y: -r * .85, width: r * 1.7, height: r * 1.7, rx: r * .3, fill: `url(#${pid})`, stroke: dark, 'stroke-width': .8 });
      } else if (b.t === 'crystal') {
        let d = ''; for (let k = 0; k < 6; k++) { const a = (k * 60) * Math.PI / 180; d += (k ? 'L' : 'M') + (Math.cos(a) * r).toFixed(1) + ' ' + (Math.sin(a) * r * .8).toFixed(1); }
        shape = sv('path', { d: d + 'Z', fill: b.c, 'fill-opacity': .78, stroke: shade(b.c, .3), 'stroke-width': 1 });
      } else {
        shape = sv('circle', { r: r * (b.t === 'pearl' ? .9 : 1), fill: b.c, stroke: dark, 'stroke-width': .7 });
      }
      g.appendChild(shape);
      if (b.t !== 'cube' && b.t !== 'star' && b.t !== 'heart') g.appendChild(sv('circle', { r: r * .95, fill: 'url(#kHi)', 'pointer-events': 'none' }));
      gBeads.appendChild(g);
    }

    function boneSVG(name, backSide) {
      const n = (name || 'Кличка').slice(0, 10);
      const hearts = backSide ? '' : [[-58, -14], [-40, 16], [52, -16], [60, 14], [-66, 6], [40, 20], [-30, -20], [30, -22]].map(([x, y]) => `<path d="M${x} ${y + 3}c-4-3-5-6-3-7.5 1.5-1 3 0 3 1 0-1 1.5-2 3-1 2 1.5 1 4.5-3 7.5z" fill="#E0302F"/>`).join('');
      return `<svg viewBox="-100 -45 200 90" class="k-bone"><path d="M-62 -22a22 22 0 1 0-20 34a22 22 0 1 0 20 22h124a22 22 0 1 0 20-22a22 22 0 1 0-20-34z" fill="#FBF6EE" stroke="#d9cfc2" stroke-width="2"/>${hearts}<text x="0" y="9" text-anchor="middle" font-family="Marck Script, cursive" font-size="${n.length > 6 ? 26 : 32}" fill="${backSide ? '#7a6a5c' : '#1b1b1b'}">${backSide ? '' : esc(n)}</text></svg>`;
    }
    function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

    function drawPendant() {
      const d = DESIGNS[st.design], sz = SIZES[st.size];
      pend.style.setProperty('--k', sz.k);
      pend.dataset.design = st.design;
      let face;
      if (d.svg) face = boneSVG(st.name, false);
      else if (d.custom) face = st.photo ? `<div class="k-photo" style="background-image:url(${st.photo})"></div>` : `<label class="k-upload"><input type="file" accept="image/*" data-k-photo hidden><span>＋</span><b>загрузить фото хвостика</b></label>`;
      else face = `<img src="${IMG}p-${st.design}.webp" alt="${d.name}" draggable="false">` + (d.label && st.name ? `<span class="k-label">${esc(st.name.slice(0, 10))}</span>` : '');
      front.innerHTML = face;
      const backBase = d.svg ? boneSVG('', true) : d.custom ? '<div class="k-photo k-blank"></div>' : `<img src="${IMG}p-${st.design}.webp" alt="" draggable="false">`;
      const lines = [st.name ? `<b>${esc(st.name.slice(0, 14))}</b>` : '<b class="k-ph">кличка</b>', st.phone ? fmtPhone(st.phone) : '<span class="k-ph">+7 ··· ··· ·· ··</span>'];
      if (st.note) lines.push(`<i>${esc(st.note.slice(0, 26))}</i>`);
      back.innerHTML = backBase + `<div class="k-engrave">${lines.join('')}</div>`;
      card.classList.toggle('is-back', st.side === 'back');
      sizeTag.innerHTML = `<b>${sz.name}</b> ${sz.mm}`;
    }

    function price() {
      const d = DESIGNS[st.design];
      if (d.custom) return { text: '2 500–3 000 ₽', note: 'индивидуальный дизайн, точную сумму назовёт мастер' };
      return { text: rub(PRICE[st.mode]), note: st.mode === 'beads' ? 'с бусинками' : 'на шнурке, шнурок входит в стоимость' };
    }
    function summary() {
      const d = DESIGNS[st.design], sz = SIZES[st.size], p = price();
      const L = ['Здравствуйте! Хочу адресник:', `• дизайн: ${d.name}`,
        st.mode === 'beads' ? `• с бусинками, набор «${PRESETS[st.beads].name}»` : `• на шнурке, цвет №${st.cord}`,
        `• размер: ${sz.name} (${sz.mm})`];
      if (st.girth) L.push(`• обхват шеи: ${st.girth} см`);
      if (st.name) L.push(`• кличка: ${st.name}`);
      if (st.phone) L.push(`• телефон на обороте: ${fmtPhone(st.phone)}`);
      if (st.note) L.push(`• фраза: ${st.note}`);
      if (d.custom) L.push('• фото хвостика пришлю в чат');
      L.push(`Ориентир по цене с сайта: ${p.text.replace(/ /g, ' ')}`);
      return L.join('\n');
    }

    function sync() {
      root.querySelectorAll('[data-k][data-v]').forEach(b => {
        const on = String(st[b.dataset.k]) === b.dataset.v;
        b.classList.toggle('on', on); b.setAttribute('aria-pressed', on);
      });
      root.querySelectorAll('[data-k-show]').forEach(x => {
        const [k, v] = x.dataset.kShow.split('='); x.hidden = String(st[k]) !== v;
      });
      const d = DESIGNS[st.design], sz = SIZES[st.size], p = price();
      const outs = {
        design: d.name, designNote: d.note, neck: sz.neck, price: p.text, priceNote: p.note, size: `${sz.name} · ${sz.mm}`, who: sz.who,
        mode: st.mode === 'beads' ? `бусины «${PRESETS[st.beads].name}»` : `шнурок №${st.cord}`,
        phone: st.phone ? fmtPhone(st.phone) : '+7 ··· ··· ·· ··'
      };
      root.querySelectorAll('[data-k-out]').forEach(o => { o.innerHTML = outs[o.dataset.kOut] ?? ''; });
      drawString(); drawPendant();
      stage.classList.remove('k-swing'); void stage.offsetWidth; stage.classList.add('k-swing');
      if (opt.onChange) opt.onChange(st);
    }

    // ---- события
    root.addEventListener('click', e => {
      const b = e.target.closest('[data-k][data-v]');
      if (b) {
        const k = b.dataset.k; let v = b.dataset.v;
        st[k] = /^\d+$/.test(v) && k === 'cord' ? +v : v;
        if (k === 'design' && DESIGNS[v].custom && st.mode === 'cord') {}
        if (k !== 'side') st.side = k === 'name' ? st.side : st.side;
        sync(); return;
      }
      const key = e.target.closest('[data-k-key]');
      if (key) {
        const v = key.dataset.kKey;
        if (v === 'del') st.phone = st.phone.slice(0, -1);
        else if (v === 'clr') st.phone = '';
        else if (st.phone.length < 11) st.phone += v;
        st.side = 'back'; sync(); return;
      }
      const a = e.target.closest('[data-k-act]');
      if (!a) return;
      const act = a.dataset.kAct;
      if (act === 'flip') { st.side = st.side === 'front' ? 'back' : 'front'; card.classList.toggle('is-back', st.side === 'back'); }
      if (act === 'shuffle') { st.seed = Math.floor(Math.random() * 99999) + 1; sync(); }
      if (act === 'order') openOrder();
      if (act === 'bot') window.open(BOT, '_blank');
    });
    pend.addEventListener('click', e => { if (e.target.closest('.k-upload')) return; st.side = st.side === 'front' ? 'back' : 'front'; card.classList.toggle('is-back', st.side === 'back'); });
    root.addEventListener('input', e => {
      const i = e.target.closest('[data-k-in]'); if (!i) return;
      const k = i.dataset.kIn;
      if (k === 'phone') { st.phone = i.value.replace(/\D/g, '').slice(0, 11); }
      else st[k] = i.value;
      if (k === 'girth') { st.girth = i.value.replace(/[^\d,.]/g, '').slice(0, 5); const f = i; sync(); f.focus(); return; }
      if (k === 'phone' || k === 'note') st.side = 'back';
      if (k === 'name') st.side = DESIGNS[st.design].label ? 'front' : 'back';
      const keepFocus = i; sync(); keepFocus.focus();
    });
    root.addEventListener('change', e => {
      if (!e.target.matches('[data-k-photo]')) return;
      const f = e.target.files[0]; if (!f) return;
      const r = new FileReader(); r.onload = () => { st.photo = r.result; sync(); }; r.readAsDataURL(f);
    });

    // ---- модалка заказа
    function openOrder() {
      let m = document.querySelector('.k-modal');
      if (!m) {
        m = el('div', { class: 'k-modal', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Заказ адресника' });
        m.innerHTML = `<div class="k-modal-box"><button class="k-x" aria-label="Закрыть">×</button>
          <h3>Ваш адресник почти готов</h3>
          <p class="k-m-hint">Скопируем этот текст, откроем чат с менеджером — останется вставить и отправить. А можно пройти шаги в боте.</p>
          <textarea class="k-m-text" rows="8"></textarea>
          <div class="k-m-btns"><button class="k-m-go">Скопировать и написать</button><a class="k-m-bot" href="${BOT}" target="_blank" rel="noopener">Оформить в боте</a></div>
          <p class="k-m-ok" hidden>Текст скопирован ✓ Вставьте его в чат</p></div>`;
        document.body.appendChild(m);
        m.addEventListener('click', e => { if (e.target === m || e.target.closest('.k-x')) m.classList.remove('open'); });
        m.querySelector('.k-m-go').addEventListener('click', async () => {
          const t = m.querySelector('.k-m-text').value;
          try { await navigator.clipboard.writeText(t); } catch (_) { const ta = m.querySelector('.k-m-text'); ta.select(); document.execCommand && document.execCommand('copy'); }
          m.querySelector('.k-m-ok').hidden = false;
          window.open(MANAGER, '_blank');
        });
        document.addEventListener('keydown', e => { if (e.key === 'Escape') m.classList.remove('open'); });
      }
      m.querySelector('.k-m-text').value = summary();
      m.querySelector('.k-m-ok').hidden = true;
      m.classList.add('open');
    }
    window.kOrder = window.kOrder || function (designName) {
      // заказ готового дизайна из каталога без конструктора
      const save = st.design;
      const id = Object.keys(DESIGNS).find(k => DESIGNS[k].name === designName);
      if (id) st.design = id;
      openOrder(); if (!id) { const t = document.querySelector('.k-m-text'); t.value = `Здравствуйте! Хочу адресник «${designName}».`; }
      st.design = save;
    };

    sync();
    return { state: st, set(k, v) { st[k] = v; sync(); }, DESIGNS, SIZES, CORDS, PRESETS };
  };
})();
