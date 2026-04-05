/**
 * GridSense Energy Dashboard Card — 3D isometric house
 *
 * Entities (auto-discovered or override via config):
 *   solar_entity, home_entity, grid_entity, battery_entity, heat_pump_entity
 */
const CARD_VERSION = "0.3.0";

function _val(h, id) {
  if (!id || !h) return null;
  const s = h.states[id];
  if (!s) return null;
  const n = parseFloat(s.state);
  return isNaN(n) ? null : n;
}
function _fmt(w) {
  if (w == null) return "\u2014";
  return Math.abs(w) >= 1000 ? (w / 1000).toFixed(1) + " kW" : Math.round(w) + " W";
}
function _pct(v) { return v == null ? "\u2014" : Math.round(v) + "%"; }

/* ────────────────────────────────────────────────────────── */

const CSS = `
:host { display: block; }

ha-card {
  position: relative;
  overflow: hidden;
  background: #181d2a;
  border: none;
  aspect-ratio: 1.6;
}

svg.house { position: absolute; inset: 0; width: 100%; height: 100%; }

/* ── labels ── */
.labels { position: absolute; inset: 0; pointer-events: none; }

.lbl {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0px;
}
.lbl-val {
  font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: clamp(16px, 4vw, 28px);
  font-weight: 800;
  line-height: 1.15;
  text-shadow: 0 2px 12px rgba(0,0,0,.6);
}
.lbl-name {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: clamp(7px, 1.5vw, 11px);
  font-weight: 700;
  letter-spacing: .12em;
  text-transform: uppercase;
  color: #8892a4;
  text-shadow: 0 1px 4px rgba(0,0,0,.6);
}
.lbl-sub {
  font-family: -apple-system, sans-serif;
  font-size: clamp(7px, 1.3vw, 10px);
  font-weight: 700;
  letter-spacing: .06em;
}

/* positions */
.lbl-solar   { left: 30%; top: 2%; }
.lbl-home    { left: 56%; top: 2%; }
.lbl-heat    { right: 1%; top: 44%; align-items: flex-end; }
.lbl-grid    { right: 8%; bottom: 3%; align-items: flex-end; }
.lbl-battery { left: 12%; bottom: 3%; align-items: flex-start; }

/* colours */
.c-solar { color: #f0c040; }
.c-home  { color: #58a6ff; }
.c-heat  { color: #ff9500; }
.c-batt  { color: #3fb950; }
.c-idle  { color: #4a5060; }
`;

/* ── 3D isometric house SVG ─────────────────────────────── */
/* Uses isometric projection with proper depth & perspective */

const HOUSE = `<svg class="house" viewBox="0 0 1000 620" xmlns="http://www.w3.org/2000/svg">
<defs>
  <linearGradient id="g-roof" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#3d424f"/>
    <stop offset="100%" stop-color="#2d323c"/>
  </linearGradient>
  <linearGradient id="g-roof-side" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#33384a"/>
    <stop offset="100%" stop-color="#252a36"/>
  </linearGradient>
  <linearGradient id="g-wall-front" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#252a36"/>
    <stop offset="100%" stop-color="#1f2430"/>
  </linearGradient>
  <linearGradient id="g-wall-side" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0%" stop-color="#1a1f2a"/>
    <stop offset="100%" stop-color="#161b25"/>
  </linearGradient>
  <linearGradient id="g-glass" x1="0" y1="0" x2=".3" y2="1">
    <stop offset="0%" stop-color="#1e2535"/>
    <stop offset="100%" stop-color="#151a26"/>
  </linearGradient>
  <radialGradient id="g-glow" cx=".4" cy=".4" r=".7">
    <stop offset="0%" stop-color="#ffe8a0" stop-opacity=".18"/>
    <stop offset="100%" stop-color="#ffe8a0" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="g-glow2" cx=".5" cy=".5" r=".6">
    <stop offset="0%" stop-color="#ffe8a0" stop-opacity=".12"/>
    <stop offset="100%" stop-color="#ffe8a0" stop-opacity="0"/>
  </radialGradient>
  <filter id="shadow" x="-10%" y="-10%" width="120%" height="140%">
    <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#000" flood-opacity=".35"/>
  </filter>
</defs>

<!-- ══════ GROUND SHADOW ══════ -->
<ellipse cx="480" cy="580" rx="420" ry="30" fill="#0e1118" opacity=".5"/>

<!-- ══════ LEFT WING — HEAT PUMP HOUSING ══════ -->
<g filter="url(#shadow)">
  <!-- front face -->
  <rect x="58" y="270" width="200" height="280" fill="url(#g-wall-front)"/>
  <!-- side face (left, darker) -->
  <polygon points="58,270 28,250 28,530 58,550" fill="url(#g-wall-side)"/>
  <!-- top -->
  <polygon points="58,270 28,250 228,250 258,270" fill="#2a2f3a"/>
  <!-- slats -->
  <g stroke="#1a1f2a" stroke-width="1.8" opacity=".6">
    ${Array.from({length:12}, (_,i) => `<line x1="68" y1="${285+i*22}" x2="248" y2="${285+i*22}"/>`).join("")}
  </g>
  <!-- side slats -->
  <g stroke="#13161e" stroke-width="1.2" opacity=".4">
    ${Array.from({length:12}, (_,i) => `<line x1="32" y1="${265+i*22}" x2="54" y2="${278+i*22}"/>`).join("")}
  </g>
</g>

<!-- ══════ MAIN HOUSE ══════ -->
<g filter="url(#shadow)">
  <!-- front wall -->
  <rect x="250" y="210" width="390" height="350" fill="url(#g-wall-front)"/>

  <!-- ── ROOF (front slope) ── -->
  <polygon points="240,210 445,90 650,210" fill="url(#g-roof)"/>
  <!-- roof ridge/edge highlight -->
  <line x1="240" y1="210" x2="445" y2="90" stroke="#4a5060" stroke-width="1.5"/>
  <line x1="445" y1="90" x2="650" y2="210" stroke="#4a5060" stroke-width="1.5"/>

  <!-- ── SOLAR PANELS on roof ── -->
  <g>
    <!-- row 1 (upper) -->
    <rect x="340" y="125" width="48" height="30" rx="2" fill="#262e40" stroke="#354060" stroke-width=".8"/>
    <rect x="394" y="125" width="48" height="30" rx="2" fill="#262e40" stroke="#354060" stroke-width=".8"/>
    <rect x="448" y="125" width="48" height="30" rx="2" fill="#262e40" stroke="#354060" stroke-width=".8"/>
    <rect x="502" y="125" width="48" height="30" rx="2" fill="#262e40" stroke="#354060" stroke-width=".8"/>
    <!-- row 2 (lower) -->
    <rect x="310" y="162" width="48" height="30" rx="2" fill="#262e40" stroke="#354060" stroke-width=".8"/>
    <rect x="364" y="162" width="48" height="30" rx="2" fill="#262e40" stroke="#354060" stroke-width=".8"/>
    <rect x="418" y="162" width="48" height="30" rx="2" fill="#262e40" stroke="#354060" stroke-width=".8"/>
    <rect x="472" y="162" width="48" height="30" rx="2" fill="#262e40" stroke="#354060" stroke-width=".8"/>
    <rect x="526" y="162" width="48" height="30" rx="2" fill="#262e40" stroke="#354060" stroke-width=".8"/>
    <!-- panel grid lines (subtle) -->
    <g stroke="#2a3448" stroke-width=".4" opacity=".5">
      <line x1="364" y1="125" x2="364" y2="155"/><line x1="418" y1="125" x2="418" y2="155"/>
      <line x1="472" y1="125" x2="472" y2="155"/><line x1="526" y1="125" x2="526" y2="155"/>
      <line x1="334" y1="162" x2="334" y2="192"/><line x1="388" y1="162" x2="388" y2="192"/>
      <line x1="442" y1="162" x2="442" y2="192"/><line x1="496" y1="162" x2="496" y2="192"/>
      <line x1="550" y1="162" x2="550" y2="192"/>
    </g>
  </g>

  <!-- ── MAIN WINDOW (large dark glass) ── -->
  <rect x="275" y="235" width="340" height="150" rx="3" fill="url(#g-glass)" stroke="#2a3244" stroke-width="1.5"/>
  <!-- window frame dividers -->
  <line x1="445" y1="235" x2="445" y2="385" stroke="#2a3244" stroke-width="1" opacity=".4"/>

  <!-- ── FLOW INDICATOR BARS in window ── -->
  <rect id="gs-bar-solar" x="430" y="270" width="6" height="34" rx="3" fill="#f0c040" opacity="0">
    <animate attributeName="opacity" values=".3;1;.3" dur="2s" repeatCount="indefinite"/>
  </rect>
  <rect id="gs-bar-grid" x="430" y="314" width="6" height="34" rx="3" fill="#58a6ff" opacity="0">
    <animate attributeName="opacity" values=".3;1;.3" dur="2s" repeatCount="indefinite" begin=".5s"/>
  </rect>
</g>

<!-- ══════ RIGHT WING — GLASS FACADE ══════ -->
<g filter="url(#shadow)">
  <!-- side wall (perspective) -->
  <polygon points="640,180 850,220 850,560 640,560" fill="url(#g-wall-side)"/>
  <!-- roof -->
  <polygon points="630,180 745,115 860,180 850,220 640,180" fill="url(#g-roof-side)"/>
  <line x1="630" y1="180" x2="745" y2="115" stroke="#4a5060" stroke-width="1.2"/>
  <line x1="745" y1="115" x2="860" y2="180" stroke="#4a5060" stroke-width="1.2"/>

  <!-- solar panels on right roof -->
  <g opacity=".75">
    <rect x="680" y="140" width="42" height="26" rx="2" fill="#262e40" stroke="#354060" stroke-width=".8"/>
    <rect x="728" y="140" width="42" height="26" rx="2" fill="#262e40" stroke="#354060" stroke-width=".8"/>
    <rect x="776" y="140" width="42" height="26" rx="2" fill="#262e40" stroke="#354060" stroke-width=".8"/>
  </g>

  <!-- upper glass window -->
  <rect x="660" y="200" width="170" height="140" rx="3" fill="url(#g-glass)" stroke="#2a3244" stroke-width="1"/>
  <!-- warm interior glow -->
  <rect x="660" y="200" width="170" height="140" rx="3" fill="url(#g-glow)"/>
  <!-- window frame -->
  <line x1="745" y1="200" x2="745" y2="340" stroke="#2a3244" stroke-width=".8" opacity=".5"/>
  <line x1="660" y1="270" x2="830" y2="270" stroke="#2a3244" stroke-width=".8" opacity=".5"/>

  <!-- lower room window -->
  <rect x="670" y="385" width="150" height="130" rx="3" fill="#1a1f2a" stroke="#2a3244" stroke-width="1"/>
  <rect x="670" y="385" width="150" height="130" rx="3" fill="url(#g-glow2)"/>
  <!-- something in the room (e.g. washer/dryer) -->
  <rect x="740" y="430" width="55" height="65" rx="6" fill="#d8d8dc" stroke="#b0b0b4" stroke-width="1"/>
  <circle cx="768" cy="456" r="4" fill="#a0a0a4"/>
</g>

<!-- ══════ BATTERY (wall mount) ══════ -->
<g>
  <rect x="350" y="415" width="80" height="120" rx="10" fill="#d8d8dc" stroke="#b0b0b4" stroke-width="1.5"/>
  <!-- texture lines -->
  <g stroke="#c0c0c4" stroke-width=".6" opacity=".4">
    <line x1="362" y1="420" x2="362" y2="530"/>
    <line x1="372" y1="420" x2="372" y2="530"/>
    <line x1="382" y1="420" x2="382" y2="530"/>
  </g>
  <!-- status ring -->
  <circle cx="390" cy="445" r="12" fill="none" stroke="#666" stroke-width="2.5"/>
  <circle cx="390" cy="445" r="12" fill="none" id="gs-bat-ring"
          stroke="#f85149" stroke-width="2.5" stroke-dasharray="0 76" stroke-dashoffset="-19"
          stroke-linecap="round"/>
</g>

<!-- ══════ INVERTER / GRID METER ══════ -->
<g>
  <rect x="465" y="435" width="75" height="100" rx="6" fill="#b8b8bc" stroke="#9a9a9e" stroke-width="1.5"/>
  <!-- display area -->
  <rect x="478" y="450" width="50" height="30" rx="3" fill="#3a3e44"/>
  <!-- LED bar -->
  <rect x="488" y="490" width="35" height="5" rx="2.5" id="gs-grid-led" fill="#555"/>
</g>

<!-- ══════ GROUND LINE ══════ -->
<line x1="28" y1="555" x2="860" y2="555" stroke="#252a36" stroke-width="1.5" opacity=".5"/>

</svg>`;

/* ── card ────────────────────────────────────────────────── */

class GridSenseCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = {};
    this._hass = null;
    this._built = false;
  }

  setConfig(c) { this._config = c || {}; this._built = false; this._build(); }
  static getStubConfig() { return {}; }
  getCardSize() { return 5; }

  set hass(h) {
    this._hass = h;
    if (!this._built) this._build(); else this._update();
  }

  _eid(k) { return this._config[k + "_entity"] || "sensor.gridsense_" + k; }

  _data() {
    const h = this._hass;
    return {
      solar:   _val(h, this._eid("solar")),
      home:    _val(h, this._eid("home")),
      heat:    _val(h, this._eid("heat_pump")),
      grid:    _val(h, this._eid("grid")),
      battery: _val(h, this._eid("battery")),
    };
  }

  _build() {
    if (!this._hass && !Object.keys(this._config).length) return;
    this._built = true;
    const s = this.shadowRoot;
    s.innerHTML = "";

    const style = document.createElement("style");
    style.textContent = CSS;
    s.appendChild(style);

    const card = document.createElement("ha-card");
    card.innerHTML = `
      ${HOUSE}
      <div class="labels">
        <div class="lbl lbl-solar">
          <span class="lbl-val c-solar" id="v-solar">\u2014</span>
          <span class="lbl-name">Solar</span>
        </div>
        <div class="lbl lbl-home">
          <span class="lbl-val c-home" id="v-home">\u2014</span>
          <span class="lbl-name">Home</span>
        </div>
        <div class="lbl lbl-heat">
          <span class="lbl-val c-heat" id="v-heat">\u2014</span>
          <span class="lbl-name">Heat Pump</span>
        </div>
        <div class="lbl lbl-grid">
          <span class="lbl-val" id="v-grid">\u2014</span>
          <span class="lbl-name">Grid</span>
          <span class="lbl-sub" id="v-grid-sub"></span>
        </div>
        <div class="lbl lbl-battery">
          <span class="lbl-val c-batt" id="v-bat">\u2014</span>
          <span class="lbl-name">Battery</span>
        </div>
      </div>`;
    s.appendChild(card);
    this._update();
  }

  _update() {
    const s = this.shadowRoot;
    if (!s) return;
    const d = this._data();

    const $ = (id) => s.getElementById(id);

    const vS = $("v-solar"), vH = $("v-home"), vP = $("v-heat");
    const vG = $("v-grid"), vGS = $("v-grid-sub"), vB = $("v-bat");
    if (!vS) return;

    vS.textContent = _fmt(d.solar);
    vH.textContent = _fmt(d.home);
    vP.textContent = _fmt(d.heat);
    vB.textContent = _pct(d.battery);

    // grid
    if (d.grid != null) {
      vG.textContent = _fmt(Math.abs(d.grid));
      if (d.grid < -5)      { vG.style.color = "#3fb950"; vGS.textContent = "Exporting"; vGS.style.color = "#3fb950"; }
      else if (d.grid > 5)  { vG.style.color = "#f85149"; vGS.textContent = "Importing"; vGS.style.color = "#f85149"; }
      else                  { vG.style.color = "#4a5060"; vGS.textContent = "Idle";      vGS.style.color = "#4a5060"; }
    } else { vG.textContent = "\u2014"; vGS.textContent = ""; }

    // flow bars
    const bS = $("gs-bar-solar"), bG = $("gs-bar-grid");
    if (bS) bS.setAttribute("opacity", d.solar > 5 ? "1" : "0");
    if (bG) {
      if (d.grid != null && Math.abs(d.grid) > 5) {
        bG.setAttribute("opacity", "1");
        bG.setAttribute("fill", d.grid > 0 ? "#f85149" : "#3fb950");
      } else { bG.setAttribute("opacity", "0"); }
    }

    // grid LED
    const led = $("gs-grid-led");
    if (led) {
      if (d.grid > 5)       led.setAttribute("fill", "#f85149");
      else if (d.grid < -5) led.setAttribute("fill", "#3fb950");
      else                  led.setAttribute("fill", "#555");
    }

    // battery ring
    const ring = $("gs-bat-ring");
    if (ring && d.battery != null) {
      const pct = Math.max(0, Math.min(100, d.battery));
      const c = 2 * Math.PI * 12;
      ring.setAttribute("stroke-dasharray", `${(pct/100)*c} ${c}`);
      ring.setAttribute("stroke", pct > 20 ? "#3fb950" : pct > 5 ? "#f0c040" : "#f85149");
    }
  }
}

customElements.define("gridsense-card", GridSenseCard);

window.customCards = window.customCards || [];
if (!window.customCards.find(c => c.type === "gridsense-card")) {
  window.customCards.push({
    type: "gridsense-card",
    name: "GridSense Energy Dashboard",
    description: "3D isometric house energy flow visualisation.",
    preview: true,
  });
}

console.info(
  `%c GRIDSENSE %c v${CARD_VERSION} `,
  "background:#181d2a;color:#f0c040;font-weight:bold;padding:2px 6px;border-radius:3px 0 0 3px",
  "background:#f0c040;color:#181d2a;font-weight:bold;padding:2px 6px;border-radius:0 3px 3px 0",
);
