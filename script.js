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
