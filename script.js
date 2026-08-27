/* ---------- Mobile nav toggle ---------- */
const menuToggle = document.getElementById('menuToggle');
const navlinks = document.getElementById('navlinks');
if (menuToggle && navlinks) {
  menuToggle.addEventListener('click', () => navlinks.classList.toggle('open'));
}

/* ---------- Active nav link ---------- */
(function highlightActiveNav() {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.navlinks a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === path || (path === '' && href === 'index.html')) a.classList.add('active');
  });
})();

/* ---------- Scroll reveal ---------- */
const revealEls = document.querySelectorAll('.reveal');
if (revealEls.length) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in'); });
  }, { threshold: 0.12 });
  revealEls.forEach(el => io.observe(el));
}

/* ---------- Accordion (Projects page + doc accordions) ---------- */
document.querySelectorAll('.acc-head').forEach(head => {
  head.addEventListener('click', () => {
    const item = head.closest('.acc-item');
    const body = item.querySelector('.acc-body');
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.acc-item').forEach(other => {
      other.classList.remove('open');
      other.querySelector('.acc-body').style.maxHeight = null;
    });
    if (!isOpen) {
      item.classList.add('open');
      body.style.maxHeight = body.scrollHeight + 'px';
    }
  });
});

document.querySelectorAll('.doc-acc-head').forEach(head => {
  head.addEventListener('click', () => {
    const item = head.closest('.doc-acc-item');
    const body = item.querySelector('.doc-acc-body');
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.doc-acc-item').forEach(other => {
      other.classList.remove('open');
      other.querySelector('.doc-acc-body').style.maxHeight = null;
    });
    if (!isOpen) {
      item.classList.add('open');
      body.style.maxHeight = body.scrollHeight + 'px';
    }
  });
});

/* Recalculate open accordion heights on resize/orientation change */
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    document.querySelectorAll('.acc-item.open .acc-body, .doc-acc-item.open .doc-acc-body').forEach(body => {
      body.style.maxHeight = body.scrollHeight + 'px';
    });
  }, 150);
});

/* ---------- Deep-link to a specific project/doc via URL hash ---------- */
function openAccordionTarget() {
  const hash = window.location.hash;
  if (!hash) return;
  let item;
  try { item = document.querySelector(hash); } catch (e) { return; }
  if (!item) return;
  if (!item.classList.contains('acc-item') && !item.classList.contains('doc-acc-item')) {
    item = item.closest('.acc-item, .doc-acc-item');
  }
  if (!item) return;
  const isDocItem = item.classList.contains('doc-acc-item');
  const groupSelector = isDocItem ? '.doc-acc-item' : '.acc-item';
  const bodySelector = isDocItem ? '.doc-acc-body' : '.acc-body';
  document.querySelectorAll(groupSelector).forEach(other => {
    other.classList.remove('open');
    const b = other.querySelector(bodySelector);
    if (b) b.style.maxHeight = null;
  });
  item.classList.add('open');
  const body = item.querySelector(bodySelector);
  if (body) body.style.maxHeight = body.scrollHeight + 'px';
  setTimeout(() => { item.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 60);
}
window.addEventListener('DOMContentLoaded', openAccordionTarget);
window.addEventListener('hashchange', openAccordionTarget);

/* =========================================================
   Interactive Dijkstra tool: genuinely computes shortest path.
   Click a node -> sets start (green). Click another -> sets end (red)
   and immediately runs real Dijkstra using the CURRENT edge weights.
   Click any edge -> prompts for a new weight, updates the graph live.
   ========================================================= */
const nodePos = {
  A: [60, 40], B: [270, 60], S: [160, 90],
  C: [120, 190], D: [250, 200], E: [60, 250], G: [280, 270]
};
const edgeList = [
  { id: 'e-A-S', a: 'A', b: 'S', w: 4 },
  { id: 'e-S-B', a: 'S', b: 'B', w: 3 },
  { id: 'e-S-C', a: 'S', b: 'C', w: 2 },
  { id: 'e-S-D', a: 'S', b: 'D', w: 6 },
  { id: 'e-C-E', a: 'C', b: 'E', w: 3 },
  { id: 'e-C-D', a: 'C', b: 'D', w: 2 },
  { id: 'e-D-G', a: 'D', b: 'G', w: 3 },
];

const svg = document.getElementById('schematicSvg');
const statusLabel = document.getElementById('statusLabel');
let startNode = null, endNode = null;

function edgesTouching(id) { return edgeList.filter(e => e.id === id); }

function buildAdjacency() {
  const adj = {};
  Object.keys(nodePos).forEach(n => adj[n] = []);
  edgeList.forEach(e => {
    adj[e.a].push({ to: e.b, w: e.w, id: e.id });
    adj[e.b].push({ to: e.a, w: e.w, id: e.id });
  });
  return adj;
}

function dijkstra(start, end) {
  const adj = buildAdjacency();
  const dist = {}, prev = {}, prevEdge = {}, visited = new Set();
  Object.keys(nodePos).forEach(n => dist[n] = Infinity);
  dist[start] = 0;
  const pq = new Set(Object.keys(nodePos));
  while (pq.size) {
    let u = null, best = Infinity;
    pq.forEach(n => { if (dist[n] < best) { best = dist[n]; u = n; } });
    if (u === null) break;
    pq.delete(u);
    visited.add(u);
    if (u === end) break;
    adj[u].forEach(({ to, w, id }) => {
      if (pq.has(to) && dist[u] + w < dist[to]) {
        dist[to] = dist[u] + w;
        prev[to] = u;
        prevEdge[to] = id;
      }
    });
  }
  if (dist[end] === Infinity) return null;
  const path = [end];
  const pathEdges = [];
  let cur = end;
  while (cur !== start) {
    pathEdges.unshift(prevEdge[cur]);
    cur = prev[cur];
    path.unshift(cur);
  }
  return { path, pathEdges, total: dist[end], visitedOrder: [...visited] };
}

function clearSelection() {
  Object.keys(nodePos).forEach(id => {
    const el = document.getElementById('n-' + id);
    if (el) el.classList.remove('start-sel', 'end-sel', 'visited', 'current');
  });
  edgeList.forEach(e => {
    const el = document.getElementById(e.id);
    if (el) el.classList.remove('lit');
    const lbl = document.getElementById('lbl-' + e.id);
    if (lbl) lbl.classList.remove('on-path');
  });
  startNode = null; endNode = null;
  if (statusLabel) statusLabel.textContent = 'click a start node';
}

function sleep(ms) { return new Promise(res => setTimeout(res, ms)); }

async function runDijkstraUI(start, end) {
  const result = dijkstra(start, end);
  if (!result) {
    if (statusLabel) statusLabel.textContent = 'no path exists';
    return;
  }
  if (statusLabel) statusLabel.textContent = 'computing…';
  for (const n of result.visitedOrder) {
    const el = document.getElementById('n-' + n);
    if (el && n !== start && n !== end) el.classList.add('visited');
    await sleep(120);
  }
  for (const eid of result.pathEdges) {
    const el = document.getElementById(eid);
    if (el) el.classList.add('lit');
    const lbl = document.getElementById('lbl-' + eid);
    if (lbl) lbl.classList.add('on-path');
    await sleep(200);
  }
  if (statusLabel) statusLabel.textContent = `path: ${result.path.join(' -> ')}, total weight: ${result.total}`;
}

function redrawWeightLabels() {
  edgeList.forEach(e => {
    const lbl = document.getElementById('lbl-' + e.id);
    if (lbl) lbl.textContent = e.w;
  });
}

if (svg) {
  Object.keys(nodePos).forEach(id => {
    const el = document.getElementById('n-' + id);
    if (!el) return;
    el.addEventListener('click', async () => {
      if (!startNode) {
        clearSelection();
        startNode = id;
        el.classList.add('start-sel');
        if (statusLabel) statusLabel.textContent = `start: ${id}, click an end node`;
      } else if (!endNode && id !== startNode) {
        endNode = id;
        el.classList.add('end-sel');
        await runDijkstraUI(startNode, endNode);
      } else {
        clearSelection();
        startNode = id;
        el.classList.add('start-sel');
        if (statusLabel) statusLabel.textContent = `start: ${id}, click an end node`;
      }
    });
  });

  edgeList.forEach(e => {
    const el = document.getElementById(e.id);
    if (!el) return;
    el.addEventListener('click', (evt) => {
      evt.stopPropagation();
      const input = prompt(`Set weight for edge ${e.a}–${e.b} (current: ${e.w})`, e.w);
      if (input === null) return;
      const val = parseFloat(input);
      if (!isNaN(val) && val > 0) {
        e.w = val;
        redrawWeightLabels();
        if (startNode && endNode) runDijkstraUI(startNode, endNode);
      }
    });
  });

  const resetBtn = document.getElementById('runBtn');
  if (resetBtn) resetBtn.addEventListener('click', clearSelection);
  redrawWeightLabels();
  if (statusLabel) statusLabel.textContent = 'click a start node';
}

/* ---------- Course category carousels (Education page) ---------- */
(function initCourseCarousels() {
  const carousels = document.querySelectorAll('[data-crsl]');
  if (!carousels.length) return;

  function setup(root) {
    const track = root.querySelector('.crsl-track');
    const viewport = root.querySelector('.crsl-viewport');
    const prevBtn = root.querySelector('.crsl-prev');
    const nextBtn = root.querySelector('.crsl-next');
    const dotsWrap = root.querySelector('.crsl-dots');
    const cards = Array.from(track.children);
    if (!track || !viewport || !cards.length) return;

    let perView = 3;
    let maxIndex = 0;
    let index = 0;
    let cardWidth = 0;
    let gap = 14;

    function getPerView() {
      const v = parseInt(getComputedStyle(root).getPropertyValue('--crsl-per-view'), 10);
      return (!isNaN(v) && v > 0) ? Math.min(v, cards.length) : 1;
    }

    function measure() {
      gap = parseFloat(getComputedStyle(track).gap) || 14;
      perView = getPerView();
      maxIndex = Math.max(0, cards.length - perView);
      if (index > maxIndex) index = maxIndex;
      // clientWidth includes the viewport's own left/right padding, but cards
      // only have the *content* box to lay out in — subtract that padding first,
      // or the last card overflows past the visible area and gets clipped.
      const vpStyles = getComputedStyle(viewport);
      const padLeft = parseFloat(vpStyles.paddingLeft) || 0;
      const padRight = parseFloat(vpStyles.paddingRight) || 0;
      const vw = viewport.clientWidth - padLeft - padRight;
      cardWidth = (vw - gap * (perView - 1)) / perView;
      track.style.setProperty('--crsl-card-w', cardWidth + 'px');
    }

    function buildDots() {
      dotsWrap.innerHTML = '';
      const total = maxIndex + 1;
      if (total <= 1) { dotsWrap.style.display = 'none'; return; }
      dotsWrap.style.display = '';
      for (let i = 0; i < total; i++) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'crsl-dot' + (i === index ? ' active' : '');
        b.setAttribute('aria-label', 'Go to card ' + (i + 1));
        b.addEventListener('click', () => goTo(i));
        dotsWrap.appendChild(b);
      }
    }

    function updateDots() {
      const dots = dotsWrap.querySelectorAll('.crsl-dot');
      dots.forEach((d, i) => d.classList.toggle('active', i === index));
    }

    function updateArrows() {
      if (prevBtn) prevBtn.disabled = index <= 0;
      if (nextBtn) nextBtn.disabled = index >= maxIndex;
    }

    function render(animate) {
      track.style.transition = animate ? '' : 'none';
      const offset = index * (cardWidth + gap);
      track.style.transform = `translateX(${-offset}px)`;
      if (!animate) {
        // force reflow then restore transition for future moves
        void track.offsetHeight;
        track.style.transition = '';
      }
      updateArrows();
      updateDots();
    }

    function goTo(i, animate = true) {
      index = Math.max(0, Math.min(maxIndex, i));
      render(animate);
    }

    if (prevBtn) prevBtn.addEventListener('click', () => goTo(index - 1));
    if (nextBtn) nextBtn.addEventListener('click', () => goTo(index + 1));

    /* --- drag / swipe (mouse + touch, via Pointer Events) --- */
    let dragging = false;
    let startX = 0;
    let baseOffset = 0;
    let dragDx = 0;

    function onPointerDown(e) {
      dragging = true;
      startX = e.clientX;
      dragDx = 0;
      baseOffset = index * (cardWidth + gap);
      track.classList.add('dragging');
      try { track.setPointerCapture(e.pointerId); } catch (err) {}
    }
    function onPointerMove(e) {
      if (!dragging) return;
      dragDx = e.clientX - startX;
      track.style.transform = `translateX(${-baseOffset + dragDx}px)`;
    }
    function onPointerUp() {
      if (!dragging) return;
      dragging = false;
      track.classList.remove('dragging');
      const threshold = Math.max(40, cardWidth * 0.15);
      if (Math.abs(dragDx) > threshold) {
        if (dragDx < 0 && index < maxIndex) index += 1;
        else if (dragDx > 0 && index > 0) index -= 1;
      }
      dragDx = 0;
      render(true);
    }

    track.addEventListener('pointerdown', onPointerDown);
    track.addEventListener('pointermove', onPointerMove);
    track.addEventListener('pointerup', onPointerUp);
    track.addEventListener('pointercancel', onPointerUp);
    track.addEventListener('pointerleave', () => { if (dragging) onPointerUp(); });

    function refresh() {
      measure();
      buildDots();
      render(false);
    }

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(refresh, 120);
    });

    refresh();
  }

  carousels.forEach(setup);
})();
