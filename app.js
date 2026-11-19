/* Charts and diagrams for tasnimxpress.github.io: plain SVG, no libraries. */
(() => {
  const NS = 'http://www.w3.org/2000/svg';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const el = (tag, attrs = {}, parent, text) => {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (text != null) n.textContent = text;
    if (parent) parent.appendChild(n);
    return n;
  };
  const $ = s => document.querySelector(s);
  // rendered width of a label, using the same CSS class it will be drawn with
  const measure = (parent, text, cls) => {
    const t = el('text', cls ? { class: cls } : {}, parent, text);
    const w = t.getComputedTextLength();
    t.remove();
    return w;
  };

  /* ---------- tooltip ---------- */
  const tip = $('#tip');
  const showTip = (e, html) => {
    tip.innerHTML = html; tip.hidden = false;
    const r = tip.getBoundingClientRect();
    let x = e.clientX + 14, y = e.clientY + 14;
    if (x + r.width > innerWidth - 8) x = e.clientX - r.width - 14;
    if (y + r.height > innerHeight - 8) y = e.clientY - r.height - 14;
    tip.style.left = x + 'px'; tip.style.top = y + 'px';
  };
  const hideTip = () => { tip.hidden = true; };
  addEventListener('scroll', hideTip, { passive: true });

  /* ---------- 1. how-I-work stages ---------- */
  // Calm by default: six stages in one row. Detail opens underneath on demand.
  const STAGES = [
    { k: 'question', name: 'Question', tools: 'what to decide', c: 'var(--c4)',
      lead: 'Every piece of work starts with what the business needs to decide. That sets which data I need, at what grain, and which metric answers it.',
      items: [
        ['Growth & revenue', 'target vs achievement, KPIs, GTV, revenue trends'],
        ['Retention & churn', 'cohorts, inactive segments, repeat behaviour'],
        ['Conversion & funnel', 'onboarding and KYC drop-off, lost value'],
        ['Pricing & performance', 'fares, markup, route and booking trends'],
      ] },
    { k: 'ingest', name: 'Ingest', tools: 'python · n8n', c: 'var(--c1)',
      lead: 'I pick the loading method per task: scheduled queries, Python scripts or n8n connectors. Pipelines run near real-time, in batches, or daily.',
      items: [
        ['Application databases', 'postgresql (oltp)'],
        ['APIs', 'google cloud · custom apis · fastapi'],
        ['Files & forms', 'csv · sheets · forms'],
        ['Scheduled queries', 'in-database loads'],
        ['Python scripts', 'api pulls · extracts'],
        ['n8n connectors', 'apis · forms · sheets'],
      ] },
    { k: 'model', name: 'Model', tools: 'raw → modelled', c: 'var(--c2)',
      lead: 'Data lands in an analytics warehouse (PostgreSQL or BigQuery) and moves through three layers. Quality checks run along the way.',
      items: [
        ['Raw', 'as landed, kept for traceability'],
        ['Staging', 'cleaned · typed · validated'],
        ['Modelled', 'facts & dimensions: customer · transaction · booking'],
        ['Quality checks', 'duplicates · nulls · data types · row counts · reconciliation'],
      ] },
    { k: 'metrics', name: 'Metrics', tools: 'cac · ltv', c: 'var(--hi)',
      lead: 'Metrics are defined once and standardised before use, so every team counts customers, transactions and revenue the same way.',
      items: [
        ['Acquisition & value', 'CAC · LTV'],
        ['Retention', '90-day & monthly retention · churn'],
        ['Engagement', 'conversion · transaction frequency'],
        ['Revenue', 'GTV · revenue per ticket · markup'],
      ] },
    { k: 'deliver', name: 'Deliver', tools: 'bi · reports', c: 'var(--c3)',
      lead: 'The output goes wherever people already look, and anything recurring runs on a schedule with failed-job email alerts.',
      items: [
        ['Dashboards', 'metabase · power bi · looker'],
        ['Ad-hoc analysis', 'sql · python · excel'],
        ['Scheduled reports', 'python · metabase api'],
        ['Data extracts', 'partners · internal teams'],
      ] },
    { k: 'decision', name: 'Decision', tools: 'insight → act', c: 'var(--c4)',
      lead: 'The work ends with insights and recommendations that someone acts on, not just with a dashboard.',
      items: [
        ['Management', 'performance against target'],
        ['Finance', 'reconciled revenue and GMV'],
        ['Marketing & product', 'acquisition, retention, funnel fixes'],
        ['Operations & partners', 'reliable, on-time data'],
      ] },
  ];
  function buildStages() {
    const row = $('#stages'), panel = $('#stageDetail');
    const btns = [];
    STAGES.forEach((s, i) => {
      if (i) {
        const conn = document.createElement('span');
        conn.className = 'conn'; conn.setAttribute('aria-hidden', 'true');
        conn.innerHTML = `<i style="animation-delay:${i * 0.35}s"></i>`;
        row.appendChild(conn);
      }
      const b = document.createElement('button');
      b.className = 'stage'; b.type = 'button';
      b.setAttribute('role', 'tab'); b.id = `st-${s.k}`;
      b.style.setProperty('--sc', s.c);
      b.innerHTML = `<span class="st-name">${s.name}</span><span class="st-tools">${s.tools}</span>`;
      b.addEventListener('click', () => pick(i));
      b.addEventListener('keydown', e => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); pick((i + 1) % STAGES.length, true); }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); pick((i - 1 + STAGES.length) % STAGES.length, true); }
      });
      row.appendChild(b); btns.push(b);
    });
    function pick(i, focus) {
      const s = STAGES[i];
      btns.forEach((b, j) => {
        b.setAttribute('aria-selected', j === i);
        b.tabIndex = j === i ? 0 : -1;
        b.classList.toggle('done', j < i);
      });
      if (focus) btns[i].focus();
      panel.setAttribute('aria-labelledby', `st-${s.k}`);
      panel.style.setProperty('--sc', s.c);
      panel.innerHTML = `
        <div class="sd-lead"><h3>${s.name}</h3><p>${s.lead}</p></div>
        <ul class="sd-items">${s.items.map(([t, d]) => `<li><b>${t}</b><span>${d}</span></li>`).join('')}</ul>`;
    }
    pick(0);
  }

  /* ---------- off the clock: a real sankey ---------- */
  // Three stages: what I do off the clock -> the trait it builds -> where it shows up in my work.
  // Every link has a real endpoint pair, so hovering traces actual relationships.
  function drawLife() {
    const svg = $('#life');
    if (!svg) return;
    svg.innerHTML = '';
    // what I do off the clock: three areas, each split into the activities in it.
    // equal weight per activity (1 unit each); the chart shows structure, not hours.
    const groups = {
      building: ['small tools', 'explainers'],
      learning: ['AI & data engineering', 'reading books'],
      exploring: ['treks & travel', 'new cuisines'],
    };
    const sub = {
      'small tools': 'built for myself',
      explainers: 'on data & thinking',
      'AI & data engineering': 'new tools, old basics',
      'reading books': 'non-fiction, always one open',
      'treks & travel': 'hills, trails and new places',
      'new cuisines': "whatever I haven't tried",
    };
    const cols = [Object.keys(groups), Object.values(groups).flat()];
    const links = [];
    for (const g in groups) groups[g].forEach(leaf => links.push({ s: g, t: leaf, v: 1 }));

    const U = 24, BW = 8, W = 440, X = [86, 240], TOP = 6, GAP = [22, 9];
    const nodes = {};
    cols.forEach((names, ci) => names.forEach(n => { nodes[n] = { n, ci, in: [], out: [] }; }));
    links.forEach(l => { nodes[l.s].out.push(l); nodes[l.t].in.push(l); });
    for (const k in nodes) {
      const n = nodes[k];
      n.v = Math.max(n.in.reduce((a, l) => a + l.v, 0), n.out.reduce((a, l) => a + l.v, 0));
    }
    const colH = cols.map((names, ci) => names.reduce((a, n) => a + nodes[n].v * U, 0) + GAP[ci] * (names.length - 1));
    const maxH = Math.max(...colH);
    const H = TOP + maxH + 4;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    cols.forEach((names, ci) => {
      let y = TOP + (maxH - colH[ci]) / 2;
      names.forEach(n => { const o = nodes[n]; o.x = X[ci]; o.y = y; o.h = o.v * U; y += o.h + GAP[ci]; });
    });
    // stack links at each end, ordered by the position of the other end so bands don't cross needlessly
    for (const k in nodes) {
      const n = nodes[k];
      let oy = n.y;
      [...n.out].sort((p, q) => nodes[p.t].y - nodes[q.t].y).forEach(l => { l.sy = oy; oy += l.v * U; });
      let iy = n.y;
      [...n.in].sort((p, q) => nodes[p.s].y - nodes[q.s].y).forEach(l => { l.ty = iy; iy += l.v * U; });
    }

    const gL = el('g', {}, svg), gN = el('g', {}, svg);
    links.forEach(l => {
      const x0 = nodes[l.s].x + BW, x1 = nodes[l.t].x, h = l.v * U, m = (x0 + x1) / 2;
      l.el = el('path', {
        d: `M${x0} ${l.sy} C${m} ${l.sy}, ${m} ${l.ty}, ${x1} ${l.ty} L${x1} ${l.ty + h} C${m} ${l.ty + h}, ${m} ${l.sy + h}, ${x0} ${l.sy + h} Z`,
        class: `lf-band ${nodes[l.s].ci === 0 ? 'lf-in' : 'lf-out'}`,
      }, gL);
    });
    for (const k in nodes) {
      const n = nodes[k];
      const peers = [...n.in.map(l => l.s), ...n.out.map(l => l.t)].join(', ');
      n.g = el('g', { class: 'lf-g', tabindex: 0, role: 'img', 'aria-label': `${n.n}: connects to ${peers}` }, gN);
      el('rect', { x: n.x, y: n.y, width: BW, height: n.h, rx: 2, class: n.ci === 0 ? 'lf-mid' : 'lf-node' }, n.g);
      if (n.ci === 0) el('text', { x: n.x - 12, y: n.y + n.h / 2 + 4, 'text-anchor': 'end', class: 'lf-t lf-group' }, n.g, n.n);
      if (n.ci === 1) {
        el('text', { x: n.x + BW + 10, y: n.y + n.h / 2 - 2, class: 'lf-t' }, n.g, n.n);
        el('text', { x: n.x + BW + 10, y: n.y + n.h / 2 + 11, class: 'lf-s' }, n.g, sub[n.n]);
      }
    }

    // trace: from a node, follow links upstream and downstream (never sideways)
    const trace = start => {
      const on = new Set(), seen = new Set([start]);
      const walk = (k, dir) => {
        (dir === 'down' ? nodes[k].out : nodes[k].in).forEach(l => {
          on.add(l);
          const nx = dir === 'down' ? l.t : l.s;
          seen.add(nx);
          walk(nx, dir);
        });
      };
      walk(start, 'down');
      walk(start, 'up');
      return { on, seen };
    };
    const light = (linkSet, nodeSet) => {
      svg.classList.add('dim');
      links.forEach(l => l.el.classList.toggle('on', linkSet.has(l)));
      for (const k in nodes) nodes[k].g.classList.toggle('on', nodeSet.has(k));
    };
    const reset = () => {
      svg.classList.remove('dim');
      links.forEach(l => l.el.classList.remove('on'));
      for (const k in nodes) nodes[k].g.classList.remove('on');
      hideTip();
    };
    for (const k in nodes) {
      const go = () => { const r = trace(k); light(r.on, r.seen); };
      nodes[k].g.addEventListener('mouseenter', go);
      nodes[k].g.addEventListener('focus', go);
      nodes[k].g.addEventListener('mouseleave', reset);
      nodes[k].g.addEventListener('blur', reset);
    }
    links.forEach(l => {
      l.el.addEventListener('mousemove', e => {
        light(new Set([l]), new Set([l.s, l.t]));
        showTip(e, `<b>${l.s}</b> → <b>${l.t}</b>`);
      });
      l.el.addEventListener('mouseleave', reset);
    });
  }

  /* ---------- learning roadmap ---------- */
  // Add a credential to this list and the roadmap re-flows: 3 stops per row,
  // rows snake left-to-right then right-to-left, cards always sit below the line.
  const CREDENTIALS = [
    { date: 'Aug 2021', title: 'BSc, Computer Science & Engineering', org: 'Gono Bishwabidyalay · CGPA 3.50', kind: 'start' },
    { date: 'Oct 2022', title: 'Data Analysis with Python', org: 'IBM', url: 'https://courses.cognitiveclass.ai/certificates/eab8129fe9674c0f97c6eaea3901d4b4' },
    { date: 'Jan 2023', title: 'Process Data from Dirty to Clean', org: 'Google', url: 'https://coursera.org/verify/ZY3V33N9TB2Z' },
    { date: 'May 2023', title: 'SQL for Querying Databases', org: 'IBM', url: 'https://coursera.org/verify/PMTHBP4D3BSE' },
    { date: 'Feb 2024', title: 'The Power of Statistics', org: 'Google', url: 'https://coursera.org/verify/NG3ADA6XXPPU' },
    { date: 'Jul 2024', title: 'SQL (Intermediate)', org: 'HackerRank · 5★ SQL badge', url: 'https://www.hackerrank.com/certificates/5758c313b3ae' },
  ];
  function buildRoadmap() {
    const host = $('#roadmap');
    if (!host) return;
    const PER_ROW = 3, COLS = [180, 500, 820], TOP = 20, ROW = 150, W = 1000;
    const rows = Math.ceil(CREDENTIALS.length / PER_ROW);
    const H = TOP + (rows - 1) * ROW + 20;   // the lines only; card space is measured below
    const pts = CREDENTIALS.map((c, i) => {
      const r = Math.floor(i / PER_ROW), k = i % PER_ROW;
      const x = r % 2 === 0 ? COLS[k] : COLS[PER_ROW - 1 - k];
      return { ...c, x, y: TOP + r * ROW, r };
    });
    // one continuous path through every stop, with a U-turn at the end of each row
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i];
      if (a.r === b.r) { d += ` H ${b.x}`; continue; }
      const right = a.r % 2 === 0, edge = right ? 860 : 140, bend = right ? 960 : 40;
      d += ` H ${edge} C ${bend} ${a.y}, ${bend} ${b.y}, ${edge} ${b.y} H ${b.x}`;
    }
    host.style.aspectRatio = `${W} / ${H}`;
    const last = pts.length - 1;
    host.innerHTML = `
      <svg class="road-svg" viewBox="0 0 ${W} ${H}" aria-hidden="true">
        <defs><linearGradient id="roadGrad" gradientUnits="userSpaceOnUse" x1="0" y1="${TOP}" x2="0" y2="${pts[last].y}">
          <stop offset="0" stop-color="#2a3140"/><stop offset="1" stop-color="#5b9dff"/></linearGradient></defs>
        <path class="road-line" d="${d}"/>
      </svg>
      <ol class="stops">${pts.map((p, i) => {
        const inner = `<p class="stop-date mono">${p.date}</p><p class="stop-title">${p.title.replace(/&/g, '&amp;')}</p>`
          + `<p class="stop-org mono">${p.org}${p.url ? ' <i>↗</i>' : ''}</p>`;
        const card = p.url
          ? `<a class="stop-card" href="${p.url}" target="_blank" rel="noopener">${inner}</a>`
          : `<div class="stop-card">${inner}</div>`;
        const kind = p.kind || (i === last ? 'latest' : '');
        return `<li class="stop ${kind}" style="--x:${p.x / 10}%; --y:${(p.y / H * 100).toFixed(2)}%"><span class="stop-dot" aria-hidden="true"></span>${card}</li>`;
      }).join('')}</ol>`;
    fitRoadmap();
  }
  // cards hang below the last line; reserve exactly their height so section spacing stays even
  function fitRoadmap() {
    const host = $('#roadmap');
    if (!host) return;
    // if something follows the roadmap in its section (the off-the-clock panel), push that down;
    // otherwise pad the section (padding, not margin: margins would collapse into the next section's gap)
    const next = host.nextElementSibling, sec = host.parentElement;
    if (next) next.style.marginTop = ''; else sec.style.paddingBottom = '0px';
    const bottom = host.getBoundingClientRect().bottom;
    const cards = [...host.querySelectorAll('.stop-card')].map(c => c.getBoundingClientRect().bottom);
    const hang = Math.max(0, Math.ceil(Math.max(...cards) - bottom));
    if (next) next.style.marginTop = (hang + parseFloat(getComputedStyle(next).marginTop)) + 'px';
    else sec.style.paddingBottom = hang + 'px';
  }

  /* ---------- 3. experience gantt ---------- */
  const JOBS = [
    { k: 'goz', co: 'Gozayaan', title: 'Data Analyst', from: [2026, 7], to: null, when: 'Jul 2026 – present',
      sum: 'Analytics and data modelling for remittance (Singapore and UK to Bangladesh) and flights (Singapore and Malaysia).',
      pts: [
        'Write production SQL and data-quality rules for the remittance warehouse on BigQuery and PostgreSQL, and standardise how customers, transactions and KYC status are defined.',
        'Automated recurring reporting and data extracts as Python jobs scheduled on GitHub Actions, replacing work that used to be done by hand.',
        'Built markup and revenue-per-ticket models plus self-serve Metabase dashboards used by 4 commercial teams.',
        'Rebuilt month-end performance reporting, which used to take 5 days and now takes 1.',
        'Cohort retention (90-day and monthly), CAC and LTV, funnel drop-off from KYC to first transaction, and cross-product adoption across remittance, flights and loans.',
        'Reconcile revenue and GMV between BI and finance, and reconstruct flown revenue from booking-level data to track airline incentive tiers.',
      ],
      tools: ['SQL', 'Python', 'BigQuery', 'PostgreSQL', 'Metabase', 'GitHub Actions'] },
    { k: 'rul', co: 'Riseup Labs', title: 'Data Analyst', from: [2025, 2], to: [2026, 6], when: 'Feb 2025 – Jun 2026',
      sum: 'Built the data function from the ground up: warehouse, pipelines, automation and BI across recruitment, BPO and KPO operations.',
      pts: [
        'Built ingestion pipelines from KoboToolbox, Google Cloud APIs and custom REST APIs into PostgreSQL, with FastAPI services for structured submissions, eliminating 8–10 hours a week of manual data collection.',
        'Designed a star-schema warehouse integrating 3–4 sources for recruitment, BPO, KPO and operations reporting.',
        'Delivered 15+ dashboards across 6 business functions, tracking performance for 200+ employees. Decision cycles became 30% faster and conversion improved by 5–8%.',
        'Automated recruitment requisition tracking with Google Sheets, Apps Script and n8n: form entry, status transitions and validation rules.',
        'Power BI (DAX) dashboards for time-to-fill and candidate pipeline, and Looker dashboards for agent productivity and attendance.',
      ],
      tools: ['PostgreSQL', 'Python', 'FastAPI', 'REST APIs', 'n8n', 'Apps Script', 'Power BI', 'Looker'] },
    { k: 'v2', co: 'V2 Technologies', title: 'Database Engineer', from: [2024, 9], to: [2025, 1], when: 'Sep 2024 – Jan 2025',
      sum: 'Database and BI work for enterprise e-CRM clients.',
      pts: [
        'Prepared, cleansed and validated large e-CRM datasets with millions of daily records for Unilever and British American Tobacco.',
        'Optimised SQL queries to speed up reports and dashboards.',
        'Supported cloud data operations on AWS (EC2, S3) and BigQuery with the DevOps team.',
        'Built client dashboards in Looker and Power BI.',
      ],
      tools: ['SQL', 'BigQuery', 'AWS', 'Looker', 'Power BI'] },
    { k: 'tib', co: 'Transparency International Bangladesh', title: 'Data Assistant', from: [2023, 11], to: [2024, 6], when: 'Nov 2023 – Jun 2024',
      sum: 'Data behind Transparency International Bangladesh\'s public "Know Your Candidate" dashboard: about 5,700 candidate affidavits from the 9th to 12th national elections, plus the Upazila election.',
      pts: [
        'Scraped affidavit links with Python and automated data gathering, cutting manual work by about 30%.',
        "Compared candidates' declared asset growth across election cycles.",
        'Built KoboToolbox surveys and Power BI reports so voters could compare candidates.',
      ],
      tools: ['Python', 'Excel', 'Power Query', 'KoboToolbox', 'Power BI'] },
    { k: 'biz', co: 'Bizdata Insights', title: 'Intern Data Analyst', from: [2022, 12], to: [2023, 6], when: 'Dec 2022 – Jun 2023',
      sum: 'First role in data.',
      pts: ['Data collection, validation and cleaning in Excel.', 'Early analysis and Power BI reporting.'],
      tools: ['Excel', 'Power BI'] },
  ];
  const NOW = [2026, 11];
  const mIdx = ([y, m]) => y * 12 + (m - 1);
  function renderRole(j) {
    $('#role').innerHTML = `
      <div class="role-meta">
        <h3>${j.co}</h3><p>${j.title}</p><p class="mono">${j.when}</p>
      </div>
      <div class="role-body">
        <p class="sum">${j.sum}</p>
        <ul>${j.pts.map(p => `<li>${p}</li>`).join('')}</ul>
        <div class="chips">${j.tools.map(t => `<span>${t}</span>`).join('')}</div>
      </div>`;
  }
  function drawGantt() {
    // newest on the left: people read left first, so the current role is seen first
    const host = $('#gantt');
    const W = 1000, rowH = 34, top = 28, PAD = 12, H = top + JOBS.length * rowH + 10;
    const left = mIdx([2026, 12]), right = mIdx([2022, 11]);
    const x = i => PAD + ((left - i) / (left - right)) * (W - 2 * PAD);
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, role: 'group', 'aria-label': 'Career timeline, most recent on the left' }, host);
    for (let y = 2023; y <= 2026; y++) {
      const xx = x(mIdx([y, 1]));
      el('line', { x1: xx, x2: xx, y1: 18, y2: H, class: 'g-grid' }, svg);
      el('text', { x: xx - 6, y: 12, class: 'g-yr', 'text-anchor': 'end' }, svg, y);   // year Y sits left of its January line
    }
    const nx = x(mIdx(NOW));
    el('line', { x1: nx, x2: nx, y1: 18, y2: H, class: 'g-now' }, svg);
    el('text', { x: nx + 5, y: 12, class: 'g-nowt' }, svg, 'now');
    const bars = [];
    JOBS.forEach((j, i) => { // newest at top
      const y = top + i * rowH;
      const xa = x(j.to ? mIdx(j.to) + 1 : mIdx(NOW)), xb = x(mIdx(j.from));
      const g = el('g', { class: 'g-bar', tabindex: 0, role: 'button', 'aria-label': `${j.co}, ${j.title}, ${j.when}` }, svg);
      el('rect', { x: xa, y: y + 6, width: Math.max(6, xb - xa), height: 18, rx: 4 }, g);
      const short = j.co.replace('Transparency International Bangladesh', 'TI Bangladesh');
      const lbl = el('text', { x: xb + 10, y: y + 20, class: 'g-lbl' }, svg, `${short} · ${j.title}`);
      if (xb + 10 + 270 > W) { lbl.setAttribute('x', xa - 10); lbl.setAttribute('text-anchor', 'end'); }
      const pick = () => {
        bars.forEach(b => { b.g.classList.remove('on'); b.lbl.classList.remove('on'); b.g.setAttribute('aria-pressed', 'false'); });
        g.classList.add('on'); lbl.classList.add('on'); g.setAttribute('aria-pressed', 'true');
        renderRole(j);
      };
      g.addEventListener('click', pick);
      g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } });
      bars.push({ g, lbl, pick, k: j.k });
    });
    bars.find(b => b.k === 'goz').pick();
  }

  /* ---------- 4. product sales chart (real notebook output) ---------- */
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const BY_MONTH = [1822256.73, 2202022.42, 2807100.38, 3390670.24, 3152606.75, 2577802.26, 2647775.76, 2244467.88, 2097560.13, 3736726.88, 3199603.20, 4613443.34];
  const BY_CITY = [['San Francisco, CA', 8262203.91], ['Los Angeles, CA', 5452570.80], ['New York City, NY', 4664317.43], ['Boston, MA', 3661642.01], ['Atlanta, GA', 2795498.58], ['Dallas, TX', 2767975.40], ['Seattle, WA', 2747755.48], ['Portland, OR', 1870732.34], ['Austin, TX', 1819581.75], ['Portland, ME', 449758.27]];
  const PAIRS = [['iPhone + Lightning cable', 1005], ['Google Phone + USB-C cable', 987], ['iPhone + Wired headphones', 447], ['Google Phone + Wired headphones', 414], ['Vareebadd Phone + USB-C cable', 361], ['iPhone + AirPods', 360], ['Google Phone + Bose headphones', 220], ['USB-C cable + Wired headphones', 160]];
  const fmtM = v => '$' + (v / 1e6).toFixed(2) + 'M';
  const total = BY_MONTH.reduce((a, b) => a + b, 0);

  function drawSales(view) {
    const host = $('#salesChart'), note = $('#salesNote');
    host.innerHTML = '';
    const W = Math.max(320, host.clientWidth), narrow = W < 560;
    if (view === 'month') {
      const H = narrow ? 260 : 320, L = 44, R = 8, T = 34, B = 26;
      const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': 'Bar chart of monthly sales in 2019; December is highest at $4.61M' }, host);
      const max = 5e6, y = v => T + (1 - v / max) * (H - T - B), bw = (W - L - R) / 12;
      for (let t = 0; t <= 5; t++) {
        el('line', { x1: L, x2: W - R, y1: y(t * 1e6), y2: y(t * 1e6), class: 'c-grid' }, svg);
        el('text', { x: L - 8, y: y(t * 1e6) + 4, 'text-anchor': 'end', class: 'c-axis' }, svg, t ? `$${t}M` : '0');
      }
      const best = BY_MONTH.indexOf(Math.max(...BY_MONTH));
      BY_MONTH.forEach((v, i) => {
        const bx = L + i * bw + bw * 0.18, w = bw * 0.64, hi = i === best;
        const hit = el('rect', { x: L + i * bw, y: T, width: bw, height: H - T - B, fill: 'transparent', class: 'c-hit' }, svg);
        el('rect', { x: bx, y: y(v), width: w, height: y(0) - y(v), rx: 3, class: 'c-bar' + (hi ? ' hi' : '') }, svg);
        el('text', { x: bx + w / 2, y: H - 8, 'text-anchor': 'middle', class: 'c-axis' }, svg, narrow ? MONTHS[i][0] : MONTHS[i]);
        hit.addEventListener('mousemove', e => showTip(e, `<b>${MONTHS[i]} 2019</b><br>${fmtM(v)} · ${(v / total * 100).toFixed(1)}% of year`));
        hit.addEventListener('mouseleave', hideTip);
        if (hi) {
          const cx = bx + w / 2;
          el('line', { x1: cx, x2: cx, y1: y(v) - 4, y2: T - 14, class: 'c-annline' }, svg);
          el('text', { x: cx - 6, y: T - 18, 'text-anchor': 'end', class: 'c-ann' }, svg, `${fmtM(v)}, best month`);
        }
      });
      const q4 = BY_MONTH.slice(9).reduce((a, b) => a + b, 0);
      note.innerHTML = `December peaks at <b>${fmtM(BY_MONTH[best])}</b>, ${(BY_MONTH[best] / BY_MONTH[0]).toFixed(1)}× January. Q4 brings in ${(q4 / total * 100).toFixed(0)}% of the year's ${fmtM(total)}.`;
    } else {
      const data = view === 'city' ? BY_CITY : PAIRS;
      const isCity = view === 'city';
      const rowH = 28, T = 4, labW = narrow ? 150 : 230, R = 70, H = T + data.length * rowH;
      const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': isCity ? 'Sales by city; San Francisco leads with $8.26M' : 'Products most often bought together; iPhone and Lightning cable lead with 1,005 orders' }, host);
      const max = data[0][1], x = v => labW + (v / max) * (W - labW - R);
      data.forEach(([k, v], i) => {
        const yy = T + i * rowH, hi = i === 0;
        const lbl = narrow ? k.replace(', ', ' ').replace('Wired headphones', 'Wired h/p').replace('Bose headphones', 'Bose h/p') : k;
        el('text', { x: labW - 10, y: yy + 17, 'text-anchor': 'end', class: 'c-lbl' }, svg, lbl);
        const hit = el('rect', { x: 0, y: yy, width: W, height: rowH, fill: 'transparent', class: 'c-hit' }, svg);
        el('rect', { x: labW, y: yy + 6, width: Math.max(2, x(v) - labW), height: rowH - 12, rx: 3, class: 'c-bar' + (hi ? ' hi' : '') }, svg);
        el('text', { x: x(v) + 8, y: yy + 18, class: 'c-val' + (hi ? ' hi' : '') }, svg, isCity ? fmtM(v) : v.toLocaleString());
        hit.addEventListener('mousemove', e => showTip(e, isCity
          ? `<b>${k}</b><br>${fmtM(v)} · ${(v / total * 100).toFixed(1)}% of sales`
          : `<b>${k}</b><br>${v.toLocaleString()} orders contained both`));
        hit.addEventListener('mouseleave', hideTip);
      });
      note.innerHTML = isCity
        ? `San Francisco alone is <b>${(BY_CITY[0][1] / total * 100).toFixed(0)}%</b> of sales, more than New York and Boston combined.`
        : `Phones pull accessories: the top two pairs are a phone plus its own charging cable, <b>1,005</b> and 987 orders.`;
    }
  }
  let view = 'month';
  document.querySelectorAll('.seg button').forEach(b => b.addEventListener('click', () => {
    document.querySelectorAll('.seg button').forEach(o => o.setAttribute('aria-selected', o === b));
    view = b.dataset.view; drawSales(view);
  }));

  /* ---------- 5. automation flow ---------- */
  function drawFlow() {
    const svg = $('#flow');
    svg.innerHTML = '';
    svg.removeAttribute('viewBox');
    const W = Math.max(280, Math.round(svg.getBoundingClientRect().width) || 600);
    const steps = [
      ['Trigger', 'cron · n8n', 'var(--c3)'],
      ['Extract', 'sql · apis', 'var(--c1)'],
      ['Transform', 'python', 'var(--c2)'],
      ['Deliver', 'dashboards · reports', 'var(--c4)'],
    ];
    // box width comes from the widest label; stack vertically if four don't fit in a row
    const need = Math.ceil(Math.max(...steps.flatMap(st => [measure(svg, st[0], 'f-t'), measure(svg, st[1], 'f-s')]))) + 26 + 16;
    const gap = 26, vertical = need * 4 + gap * 3 > W;
    let pos, H;
    if (vertical) {
      pos = steps.map((_, i) => ({ x: 0, y: i * 66, w: W, h: 46 })); H = 4 * 66 - 20;
    } else {
      const bw = (W - gap * 3) / 4;
      pos = steps.map((_, i) => ({ x: i * (bw + gap), y: 0, w: bw, h: 64 })); H = 64;
    }
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    pos.forEach((p, i) => {
      if (!i) return;
      const q = pos[i - 1];
      const d = vertical ? `M${q.x + 24} ${q.y + q.h} L${p.x + 24} ${p.y}` : `M${q.x + q.w} ${q.y + q.h / 2} L${p.x} ${p.y + p.h / 2}`;
      el('path', { d, class: 'f-e', id: `fe${i}` }, svg);
      if (!reduce) {
        const c = el('circle', { r: 2.6, class: 'f-pkt' }, svg);
        const am = el('animateMotion', { dur: '1.4s', repeatCount: 'indefinite', begin: `${i * 0.45}s` }, c);
        el('mpath', { href: `#fe${i}` }, am);
      }
    });
    pos.forEach((p, i) => {
      el('rect', { x: p.x + 0.5, y: p.y + 0.5, width: p.w - 1, height: p.h - 1, rx: 9, class: 'f-box' }, svg);
      el('rect', { x: p.x + 14, y: p.y + (vertical ? 12 : 14), width: 3, height: vertical ? 22 : 36, rx: 1.5, fill: steps[i][2] }, svg);
      el('text', { x: p.x + 26, y: p.y + (vertical ? 21 : 29), class: 'f-t' }, svg, steps[i][0]);
      el('text', { x: p.x + 26, y: p.y + (vertical ? 35 : 46), class: 'f-s' }, svg, steps[i][1]);
    });
  }

  drawGantt();
  drawSales(view);
  // diagrams measure their labels, so draw them once the web fonts are in
  buildStages();
  buildRoadmap();
  drawLife();
  const drawDiagrams = () => { drawFlow(); fitRoadmap(); };
  drawDiagrams();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(drawDiagrams);
  let rt;
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { drawSales(view); drawFlow(); fitRoadmap(); }, 120); });
  $('#yr').textContent = new Date().getFullYear();
})();
