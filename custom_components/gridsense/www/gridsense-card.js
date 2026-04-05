/**
 * GridSense Energy Dashboard Card
 * Lovelace custom card that visualises real-time energy flow.
 *
 * Auto-discovered entities (via GridSense integration):
 *   sensor.gridsense_solar, sensor.gridsense_home,
 *   sensor.gridsense_grid,  sensor.gridsense_battery,
 *   sensor.gridsense_heat_pump
 *
 * Optional card config overrides:
 *   type: custom:gridsense-card
 *   solar_entity:     sensor.my_solar
 *   home_entity:      sensor.my_home
 *   grid_entity:      sensor.my_grid
 *   battery_entity:   sensor.my_battery
 *   heat_pump_entity: sensor.my_heat_pump
 *   title: "My Energy"   (default: "GridSense")
 */

const CARD_VERSION = "0.1.0";

// ──────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────

function _val(hass, entityId) {
  if (!entityId || !hass) return null;
  const state = hass.states[entityId];
  if (!state) return null;
  const n = parseFloat(state.state);
  return isNaN(n) ? null : n;
}

function _fmt(w) {
  if (w === null || w === undefined) return "—";
  const abs = Math.abs(w);
  if (abs >= 1000) return (w / 1000).toFixed(2) + " kW";
  return Math.round(w) + " W";
}

function _fmtPct(v) {
  if (v === null || v === undefined) return "—";
  return Math.round(v) + "%";
}

// Flow direction: returns 1 (active forward), -1 (active reverse), 0 (idle)
function _flowDir(watts) {
  if (watts === null) return 0;
  if (watts > 5) return 1;
  if (watts < -5) return -1;
  return 0;
}

// ──────────────────────────────────────────────────────────
// Styles
// ──────────────────────────────────────────────────────────

const STYLES = `
  :host {
    display: block;
    --gs-bg:       #0d1117;
    --gs-surface:  #161b22;
    --gs-border:   #30363d;
    --gs-text:     #e6edf3;
    --gs-muted:    #8b949e;
    --gs-solar:    #f0c040;
    --gs-home:     #58a6ff;
    --gs-grid-exp: #3fb950;
    --gs-grid-imp: #f85149;
    --gs-battery:  #3fb950;
    --gs-heat:     #ff9500;
    --gs-idle:     #30363d;
    font-family: var(--paper-font-body1_-_font-family, sans-serif);
  }

  .card {
    background: var(--gs-bg);
    border: 1px solid var(--gs-border);
    border-radius: 16px;
    padding: 20px;
    color: var(--gs-text);
    user-select: none;
  }

  .card-title {
    font-size: 14px;
    font-weight: 600;
    letter-spacing: .08em;
    text-transform: uppercase;
    color: var(--gs-muted);
    margin-bottom: 20px;
  }

  /* ── Energy flow SVG canvas ── */
  .flow-canvas {
    position: relative;
    width: 100%;
    aspect-ratio: 1.6;
  }
  .flow-canvas svg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    overflow: visible;
  }

  /* ── Nodes ── */
  .nodes {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }
  .node {
    position: absolute;
    transform: translate(-50%, -50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
    min-width: 72px;
  }
  .node-icon {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    border: 2px solid transparent;
    transition: border-color .3s, box-shadow .3s;
  }
  .node-icon.active {
    box-shadow: 0 0 12px 2px currentColor;
  }
  .node-label {
    font-size: 10px;
    letter-spacing: .06em;
    text-transform: uppercase;
    color: var(--gs-muted);
  }
  .node-value {
    font-size: 15px;
    font-weight: 700;
    line-height: 1;
  }
  .node-sub {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: .04em;
  }

  /* Node colour themes */
  .solar   .node-icon { background: #1a1200; color: var(--gs-solar);    border-color: var(--gs-solar); }
  .home    .node-icon { background: #001a33; color: var(--gs-home);     border-color: var(--gs-home); }
  .heat    .node-icon { background: #1a0d00; color: var(--gs-heat);     border-color: var(--gs-heat); }
  .battery .node-icon { background: #001a0d; color: var(--gs-battery);  border-color: var(--gs-battery); }
  .grid-exp .node-icon { background: #001a0d; color: var(--gs-grid-exp); border-color: var(--gs-grid-exp); }
  .grid-imp .node-icon { background: #1a0000; color: var(--gs-grid-imp); border-color: var(--gs-grid-imp); }

  .solar   .node-value { color: var(--gs-solar); }
  .home    .node-value { color: var(--gs-home); }
  .heat    .node-value { color: var(--gs-heat); }
  .battery .node-value { color: var(--gs-battery); }
  .grid-exp .node-value { color: var(--gs-grid-exp); }
  .grid-imp .node-value { color: var(--gs-grid-imp); }
  .node-value.idle     { color: var(--gs-muted); }

  /* ── Flow line animations ── */
  @keyframes flow-fwd {
    to { stroke-dashoffset: -24; }
  }
  @keyframes flow-rev {
    to { stroke-dashoffset: 24; }
  }
  .flow-line {
    fill: none;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-dasharray: 8 8;
    opacity: 0;
    transition: opacity .4s;
  }
  .flow-line.active {
    opacity: 1;
    animation: flow-fwd .8s linear infinite;
  }
  .flow-line.active.reverse {
    animation: flow-rev .8s linear infinite;
  }
  .flow-track {
    fill: none;
    stroke-width: 2;
    stroke: var(--gs-border);
    stroke-linecap: round;
  }

  /* ── Bottom stats bar ── */
  .stats {
    display: flex;
    gap: 8px;
    margin-top: 16px;
    flex-wrap: wrap;
  }
  .stat {
    flex: 1;
    min-width: 80px;
    background: var(--gs-surface);
    border: 1px solid var(--gs-border);
    border-radius: 10px;
    padding: 8px 10px;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .stat-label {
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: .08em;
    color: var(--gs-muted);
  }
  .stat-value {
    font-size: 13px;
    font-weight: 700;
  }
`;

// ──────────────────────────────────────────────────────────
// Node positions (% of canvas width/height)
// Layout:
//         Solar (top-centre)
//  Battery             Home
//         Grid (bottom-centre)
//              HeatPump (bottom-right)
// ──────────────────────────────────────────────────────────
const NODE_POS = {
  solar:    { x: 50, y: 12 },
  home:     { x: 82, y: 45 },
  battery:  { x: 18, y: 45 },
  grid:     { x: 50, y: 80 },
  heat:     { x: 82, y: 78 },
};

// Edges: [from, to]
const EDGES = [
  ["solar",   "home"],
  ["solar",   "battery"],
  ["solar",   "grid"],
  ["grid",    "home"],
  ["battery", "home"],
  ["home",    "heat"],
];

// ──────────────────────────────────────────────────────────
// Custom Element
// ──────────────────────────────────────────────────────────
class GridSenseCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = {};
    this._hass = null;
    this._built = false;
  }

  // ── Config ──────────────────────────────────────────────
  setConfig(config) {
    this._config = config || {};
    this._built = false;
    this._build();
  }

  static getConfigElement() {
    // Visual editor hook (basic)
    return document.createElement("gridsense-card-editor");
  }

  static getStubConfig() {
    return { title: "GridSense" };
  }

  getCardSize() { return 4; }

  // ── hass state injection ─────────────────────────────────
  set hass(hass) {
    this._hass = hass;
    if (!this._built) this._build();
    else this._update();
  }

  // ── Entity resolution ────────────────────────────────────
  _eid(key) {
    return this._config[key + "_entity"] || "sensor.gridsense_" + key;
  }

  _data() {
    const h = this._hass;
    const solar   = _val(h, this._eid("solar"));
    const home    = _val(h, this._eid("home"));
    const heat    = _val(h, this._eid("heat_pump"));
    const grid    = _val(h, this._eid("grid"));
    const battery = _val(h, this._eid("battery"));
    return { solar, home, heat, grid, battery };
  }

  // ── Self-consumption derived stats ──────────────────────
  _stats(d) {
    const selfConsumption = (d.solar !== null && d.home !== null && d.solar > 0)
      ? Math.min(100, Math.round((Math.min(d.solar, d.home) / d.solar) * 100))
      : null;
    const surplus = (d.solar !== null && d.home !== null)
      ? Math.max(0, d.solar - d.home)
      : null;
    const gridStatus = d.grid === null ? null : (d.grid < -5 ? "Exporting" : d.grid > 5 ? "Importing" : "Idle");
    return { selfConsumption, surplus, gridStatus };
  }

  // ── Flow logic: which edges are active and in which dir ──
  _edgeState(d) {
    // Returns map: edgeKey → { active, reverse, color }
    const st = {};
    const key = (a, b) => a + ">" + b;

    // solar → home
    const solarToHome = (d.solar && d.home) ? Math.min(d.solar, d.home) : 0;
    st[key("solar","home")] = { active: solarToHome > 5, color: "var(--gs-solar)" };

    // solar → battery (assume charging when solar surplus and battery < 100)
    const solarSurplus = (d.solar || 0) - (d.home || 0);
    const solarToBat = solarSurplus > 5 && d.battery !== null && d.battery < 99;
    st[key("solar","battery")] = { active: solarToBat, color: "var(--gs-solar)" };

    // solar → grid (exporting)
    const exporting = d.grid !== null && d.grid < -5;
    st[key("solar","grid")] = { active: exporting, reverse: false, color: "var(--gs-grid-exp)" };

    // grid → home (importing)
    const importing = d.grid !== null && d.grid > 5;
    st[key("grid","home")] = { active: importing, color: "var(--gs-grid-imp)" };

    // battery → home (discharging)
    const batToHome = !solarToBat && d.battery !== null && d.battery > 1 && (d.home || 0) > 5;
    st[key("battery","home")] = { active: batToHome, color: "var(--gs-battery)" };

    // home → heat_pump
    const heatActive = d.heat !== null && d.heat > 5;
    st[key("home","heat")] = { active: heatActive, color: "var(--gs-heat)" };

    return st;
  }

  // ── Build (first render) ─────────────────────────────────
  _build() {
    if (!this._hass && Object.keys(this._config).length === 0) return;
    this._built = true;

    const shadow = this.shadowRoot;
    shadow.innerHTML = "";

    const style = document.createElement("style");
    style.textContent = STYLES;
    shadow.appendChild(style);

    const card = document.createElement("ha-card");
    card.className = "card";
    card.innerHTML = this._html();
    shadow.appendChild(card);

    this._update();
  }

  _html() {
    const title = this._config.title || "GridSense";
    return `
      <div class="card-title">${title}</div>
      <div class="flow-canvas">
        <svg id="gs-svg" viewBox="0 0 100 100" preserveAspectRatio="none"></svg>
        <div class="nodes" id="gs-nodes"></div>
      </div>
      <div class="stats" id="gs-stats"></div>
    `;
  }

  // ── Update (state changes) ───────────────────────────────
  _update() {
    const shadow = this.shadowRoot;
    if (!shadow) return;
    const svg   = shadow.getElementById("gs-svg");
    const nodes = shadow.getElementById("gs-nodes");
    const stats = shadow.getElementById("gs-stats");
    if (!svg || !nodes || !stats) return;

    const d = this._data();
    const edgeState = this._edgeState(d);
    const s = this._stats(d);

    this._renderSvg(svg, edgeState);
    this._renderNodes(nodes, d);
    this._renderStats(stats, d, s);
  }

  // ── SVG edges ────────────────────────────────────────────
  _renderSvg(svg, edgeState) {
    svg.innerHTML = "";

    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    svg.appendChild(defs);

    EDGES.forEach(([from, to]) => {
      const p1 = NODE_POS[from];
      const p2 = NODE_POS[to];
      const key = from + ">" + to;
      const es = edgeState[key] || {};

      // Track line (always visible, dim)
      const track = document.createElementNS("http://www.w3.org/2000/svg", "line");
      track.setAttribute("x1", p1.x); track.setAttribute("y1", p1.y);
      track.setAttribute("x2", p2.x); track.setAttribute("y2", p2.y);
      track.setAttribute("class", "flow-track");
      svg.appendChild(track);

      // Animated dashes
      const flow = document.createElementNS("http://www.w3.org/2000/svg", "line");
      flow.setAttribute("x1", p1.x); flow.setAttribute("y1", p1.y);
      flow.setAttribute("x2", p2.x); flow.setAttribute("y2", p2.y);
      let cls = "flow-line";
      if (es.active) cls += " active";
      if (es.reverse) cls += " reverse";
      flow.setAttribute("class", cls);
      flow.style.stroke = es.color || "var(--gs-muted)";
      svg.appendChild(flow);
    });
  }

  // ── Node HTML ────────────────────────────────────────────
  _renderNodes(container, d) {
    const gridDir = d.grid === null ? 0 : (d.grid < -5 ? -1 : d.grid > 5 ? 1 : 0);
    const gridTheme = gridDir < 0 ? "grid-exp" : gridDir > 0 ? "grid-imp" : "grid-exp";
    const gridSub  = gridDir < 0 ? "Exporting" : gridDir > 0 ? "Importing" : "Idle";

    const nodesDef = [
      {
        id: "solar", theme: "solar", icon: "☀️",
        label: "SOLAR",
        value: _fmt(d.solar),
        sub: null,
        active: d.solar !== null && d.solar > 5,
      },
      {
        id: "home", theme: "home", icon: "🏠",
        label: "HOME",
        value: _fmt(d.home),
        sub: null,
        active: d.home !== null && d.home > 5,
      },
      {
        id: "battery", theme: "battery", icon: "🔋",
        label: "BATTERY",
        value: _fmtPct(d.battery),
        sub: null,
        active: d.battery !== null && d.battery > 1,
      },
      {
        id: "grid", theme: gridTheme, icon: "⚡",
        label: "GRID",
        value: _fmt(d.grid !== null ? Math.abs(d.grid) : null),
        sub: gridSub,
        active: d.grid !== null && Math.abs(d.grid) > 5,
      },
      {
        id: "heat", theme: "heat", icon: "🌡",
        label: "HEAT PUMP",
        value: _fmt(d.heat),
        sub: null,
        active: d.heat !== null && d.heat > 5,
      },
    ];

    container.innerHTML = nodesDef.map(n => {
      const pos = NODE_POS[n.id];
      return `
        <div class="node ${n.theme}"
             style="left:${pos.x}%;top:${pos.y}%">
          <div class="node-icon${n.active ? " active" : ""}">${n.icon}</div>
          <div class="node-label">${n.label}</div>
          <div class="node-value${n.active ? "" : " idle"}">${n.value}</div>
          ${n.sub ? `<div class="node-sub">${n.sub}</div>` : ""}
        </div>`;
    }).join("");
  }

  // ── Stats bar ────────────────────────────────────────────
  _renderStats(container, d, s) {
    const items = [
      {
        label: "Self-consumption",
        value: s.selfConsumption !== null ? s.selfConsumption + "%" : "—",
        color: "var(--gs-solar)",
      },
      {
        label: "Solar surplus",
        value: s.surplus !== null ? _fmt(s.surplus) : "—",
        color: "var(--gs-grid-exp)",
      },
      {
        label: "Grid status",
        value: s.gridStatus || "—",
        color: s.gridStatus === "Exporting"
          ? "var(--gs-grid-exp)"
          : s.gridStatus === "Importing"
            ? "var(--gs-grid-imp)"
            : "var(--gs-muted)",
      },
    ];

    container.innerHTML = items.map(i => `
      <div class="stat">
        <div class="stat-label">${i.label}</div>
        <div class="stat-value" style="color:${i.color}">${i.value}</div>
      </div>`
    ).join("");
  }
}

customElements.define("gridsense-card", GridSenseCard);

// Register in the HA card picker
window.customCards = window.customCards || [];
if (!window.customCards.find(c => c.type === "gridsense-card")) {
  window.customCards.push({
    type: "gridsense-card",
    name: "GridSense Energy Dashboard",
    description: "Real-time energy flow visualisation — powered by the GridSense integration.",
    preview: true,
  });
}

console.info(
  `%c GRIDSENSE-CARD %c v${CARD_VERSION} `,
  "background:#0d1117;color:#f0c040;font-weight:bold;padding:2px 4px;border-radius:3px 0 0 3px;",
  "background:#f0c040;color:#0d1117;font-weight:bold;padding:2px 4px;border-radius:0 3px 3px 0;",
);
