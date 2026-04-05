/**
 * GridSense Energy Dashboard Card — Isometric house visualisation
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
 */

const CARD_VERSION = "0.2.0";

/* ── helpers ─────────────────────────────────────────────── */

function _val(hass, eid) {
  if (!eid || !hass) return null;
  const s = hass.states[eid];
  if (!s) return null;
  const n = parseFloat(s.state);
  return isNaN(n) ? null : n;
}
function _fmt(w) {
  if (w == null) return "—";
  const a = Math.abs(w);
  return a >= 1000 ? (w / 1000).toFixed(1) + " kW" : Math.round(w) + " W";
}
function _pct(v) {
  return v == null ? "—" : Math.round(v) + "%";
}

/* ── styles ──────────────────────────────────────────────── */

const CSS = `
:host { display:block }

.gs-card {
  position: relative;
  background: #1b2130;
  border-radius: 16px;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  user-select: none;
  aspect-ratio: 1.55;
}

/* ── SVG house fills the card ── */
.gs-house { position:absolute; inset:0; width:100%; height:100% }

/* ── overlay labels ── */
.gs-labels {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.gs-label {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  pointer-events: auto;
}
.gs-val {
  font-size: clamp(14px, 3.5vw, 22px);
  font-weight: 800;
  line-height: 1.1;
  text-shadow: 0 1px 6px rgba(0,0,0,.7);
}
.gs-lbl {
  font-size: clamp(7px, 1.6vw, 10px);
  font-weight: 600;
  letter-spacing: .1em;
  text-transform: uppercase;
  color: #9ca3af;
  text-shadow: 0 1px 4px rgba(0,0,0,.8);
}
.gs-sub {
  font-size: clamp(7px, 1.4vw, 9px);
  font-weight: 700;
  letter-spacing: .05em;
}

/* label positions — match the reference image */
.gs-solar   { left: 28%; top: 3%  }
.gs-home    { left: 52%; top: 3%  }
.gs-heat    { right: 2%; top: 42% }
.gs-grid    { right: 6%; bottom: 6% }
.gs-battery { left: 8%;  bottom: 6% }

/* colours */
.gs-solar .gs-val   { color: #f0c040 }
.gs-home  .gs-val   { color: #58a6ff }
.gs-heat  .gs-val   { color: #ff9500 }
.gs-battery .gs-val { color: #3fb950 }

/* ── flow indicator bars on house ── */
.gs-bar {
  position: absolute;
  width: 4px;
  height: 28px;
  border-radius: 2px;
  left: 42%;
  opacity: 0;
  transition: opacity .4s;
}
.gs-bar.visible { opacity: 1 }
.gs-bar-solar {
  top: 36%;
  background: #f0c040;
}
.gs-bar-grid {
  top: 44%;
  background: #58a6ff;
}

/* ── animated flow dot on grid indicator ── */
@keyframes pulse {
  0%, 100% { opacity: .4 }
  50% { opacity: 1 }
}
.gs-bar.visible {
  animation: pulse 1.5s ease-in-out infinite;
}
`;

/* ── isometric house SVG ─────────────────────────────────── */

const HOUSE_SVG = `
<svg viewBox="0 0 800 520" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
  <defs>
    <!-- warm window glow -->
    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ffeebb" stop-opacity=".25"/>
      <stop offset="100%" stop-color="#ffeebb" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="roofG" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#3a3f4a"/>
      <stop offset="100%" stop-color="#2a2e38"/>
    </linearGradient>
    <linearGradient id="wallDark" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#22262f"/>
      <stop offset="100%" stop-color="#1e222b"/>
    </linearGradient>
  </defs>

  <!-- ══════ HEAT PUMP / AC UNIT (left extension) ══════ -->
  <rect x="60" y="240" width="180" height="200" rx="4" fill="#1e222b" stroke="#2a2e36" stroke-width="1.5"/>
  <!-- horizontal slats -->
  <g stroke="#2a2e36" stroke-width="1.2" opacity=".7">
    <line x1="70" y1="260" x2="230" y2="260"/>
    <line x1="70" y1="278" x2="230" y2="278"/>
    <line x1="70" y1="296" x2="230" y2="296"/>
    <line x1="70" y1="314" x2="230" y2="314"/>
    <line x1="70" y1="332" x2="230" y2="332"/>
    <line x1="70" y1="350" x2="230" y2="350"/>
    <line x1="70" y1="368" x2="230" y2="368"/>
    <line x1="70" y1="386" x2="230" y2="386"/>
    <line x1="70" y1="404" x2="230" y2="404"/>
    <line x1="70" y1="422" x2="230" y2="422"/>
  </g>
  <!-- AC unit top roof -->
  <polygon points="50,240 150,190 250,240" fill="#2a2e38" stroke="#333" stroke-width="1"/>

  <!-- ══════ MAIN HOUSE BODY ══════ -->
  <!-- front wall -->
  <rect x="230" y="195" width="350" height="265" fill="#22262f" stroke="#2a2e36" stroke-width="1.5"/>

  <!-- ══════ ROOF ══════ -->
  <!-- main roof -->
  <polygon points="220,195 405,75 590,195" fill="url(#roofG)" stroke="#3a3f4a" stroke-width="1.5"/>

  <!-- ══════ SOLAR PANELS (on roof) ══════ -->
  <g opacity=".85">
    <!-- row 1 -->
    <rect x="300" y="118" width="42" height="28" rx="2" fill="#2a3040" stroke="#3a4050" stroke-width="1"/>
    <rect x="348" y="118" width="42" height="28" rx="2" fill="#2a3040" stroke="#3a4050" stroke-width="1"/>
    <rect x="396" y="118" width="42" height="28" rx="2" fill="#2a3040" stroke="#3a4050" stroke-width="1"/>
    <rect x="444" y="118" width="42" height="28" rx="2" fill="#2a3040" stroke="#3a4050" stroke-width="1"/>
    <!-- row 2 -->
    <rect x="280" y="152" width="42" height="28" rx="2" fill="#2a3040" stroke="#3a4050" stroke-width="1"/>
    <rect x="328" y="152" width="42" height="28" rx="2" fill="#2a3040" stroke="#3a4050" stroke-width="1"/>
    <rect x="376" y="152" width="42" height="28" rx="2" fill="#2a3040" stroke="#3a4050" stroke-width="1"/>
    <rect x="424" y="152" width="42" height="28" rx="2" fill="#2a3040" stroke="#3a4050" stroke-width="1"/>
    <rect x="472" y="152" width="42" height="28" rx="2" fill="#2a3040" stroke="#3a4050" stroke-width="1"/>
  </g>

  <!-- ══════ RIGHT EXTENSION (glass facade) ══════ -->
  <rect x="580" y="160" width="160" height="300" fill="#1a1e27" stroke="#2a2e36" stroke-width="1.5"/>
  <!-- glass panels -->
  <rect x="590" y="170" width="140" height="120" rx="2" fill="#1e2530" stroke="#2a3040" stroke-width="1" opacity=".6"/>
  <!-- warm glow through glass -->
  <rect x="590" y="170" width="140" height="120" rx="2" fill="url(#glow)"/>

  <!-- right extension roof -->
  <polygon points="570,160 660,100 750,160" fill="url(#roofG)" stroke="#3a3f4a" stroke-width="1.5"/>
  <!-- more solar panels on right roof -->
  <g opacity=".8">
    <rect x="610" y="118" width="36" height="24" rx="2" fill="#2a3040" stroke="#3a4050" stroke-width="1"/>
    <rect x="652" y="118" width="36" height="24" rx="2" fill="#2a3040" stroke="#3a4050" stroke-width="1"/>
  </g>

  <!-- ══════ MAIN WINDOW (large, dark glass) ══════ -->
  <rect x="260" y="210" width="300" height="130" rx="3" fill="#181c24" stroke="#2a3040" stroke-width="1.5"/>
  <!-- subtle reflection -->
  <line x1="280" y1="215" x2="280" y2="335" stroke="#2a3040" stroke-width=".5" opacity=".3"/>

  <!-- ══════ FLOW INDICATOR BARS on window ══════ -->
  <rect id="gs-bar-solar" x="400" y="245" width="5" height="30" rx="2" fill="#f0c040" opacity="0">
    <animate attributeName="opacity" values="0.3;1;0.3" dur="1.5s" repeatCount="indefinite"/>
  </rect>
  <rect id="gs-bar-grid" x="400" y="285" width="5" height="30" rx="2" fill="#58a6ff" opacity="0">
    <animate attributeName="opacity" values="0.3;1;0.3" dur="1.5s" repeatCount="indefinite"/>
  </rect>

  <!-- ══════ BATTERY (wall-mounted, left of door) ══════ -->
  <g id="gs-battery-unit">
    <!-- body -->
    <rect x="340" y="370" width="70" height="100" rx="8" fill="#d0d0d0" stroke="#aaa" stroke-width="1.5"/>
    <!-- ridges -->
    <g stroke="#bbb" stroke-width=".8" opacity=".5">
      <line x1="352" y1="375" x2="352" y2="465"/>
      <line x1="360" y1="375" x2="360" y2="465"/>
      <line x1="368" y1="375" x2="368" y2="465"/>
    </g>
    <!-- status ring -->
    <circle cx="370" cy="395" r="10" fill="none" stroke="#555" stroke-width="2.5"/>
    <circle cx="370" cy="395" r="10" fill="none" stroke="#f85149" stroke-width="2.5"
            stroke-dasharray="15 48" stroke-dashoffset="-12" id="gs-bat-ring"/>
  </g>

  <!-- ══════ INVERTER / GRID METER ══════ -->
  <g>
    <rect x="440" y="390" width="60" height="75" rx="5" fill="#b8b8b8" stroke="#999" stroke-width="1.5"/>
    <!-- LED bar -->
    <rect x="455" y="420" width="30" height="4" rx="2" fill="#3fb950" id="gs-grid-led"/>
  </g>

  <!-- ══════ LOWER ROOM WINDOW (right) ══════ -->
  <rect x="610" y="340" width="100" height="100" rx="3" fill="#2a2e38" stroke="#3a3f4a" stroke-width="1"/>
  <!-- warm interior light -->
  <rect x="615" y="345" width="90" height="90" rx="2" fill="#ffeebb" opacity=".08"/>

  <!-- ══════ APPLIANCE in lower room ══════ -->
  <rect x="660" y="380" width="40" height="50" rx="4" fill="#e8e8e8" stroke="#ccc" stroke-width="1"/>
  <circle cx="680" cy="400" r="3" fill="#aaa"/>
</svg>
`;

/* ── card element ────────────────────────────────────────── */

class GridSenseCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = {};
    this._hass = null;
    this._built = false;
  }

  setConfig(config) {
    this._config = config || {};
    this._built = false;
    this._build();
  }

  static getStubConfig() { return {} }
  getCardSize() { return 5 }

  set hass(hass) {
    this._hass = hass;
    if (!this._built) this._build();
    else this._update();
  }

  /* entity ID resolution */
  _eid(key) {
    return this._config[key + "_entity"] || "sensor.gridsense_" + key;
  }

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

  /* ── build ─────────────────────────────────────────────── */

  _build() {
    if (!this._hass && !Object.keys(this._config).length) return;
    this._built = true;

    const s = this.shadowRoot;
    s.innerHTML = "";

    const style = document.createElement("style");
    style.textContent = CSS;
    s.appendChild(style);

    const card = document.createElement("ha-card");
    card.className = "gs-card";
    card.innerHTML = `
      <div class="gs-house">${HOUSE_SVG}</div>
      <div class="gs-labels">
        <div class="gs-label gs-solar">
          <span class="gs-val" id="gs-v-solar">—</span>
          <span class="gs-lbl">Solar</span>
        </div>
        <div class="gs-label gs-home">
          <span class="gs-val" id="gs-v-home">—</span>
          <span class="gs-lbl">Home</span>
        </div>
        <div class="gs-label gs-heat">
          <span class="gs-val" id="gs-v-heat">—</span>
          <span class="gs-lbl">Heat Pump</span>
        </div>
        <div class="gs-label gs-grid">
          <span class="gs-val" id="gs-v-grid">—</span>
          <span class="gs-lbl">Grid</span>
          <span class="gs-sub" id="gs-v-grid-sub"></span>
        </div>
        <div class="gs-label gs-battery">
          <span class="gs-val" id="gs-v-bat">—</span>
          <span class="gs-lbl">Battery</span>
        </div>
      </div>
    `;
    s.appendChild(card);
    this._update();
  }

  /* ── update ────────────────────────────────────────────── */

  _update() {
    const s = this.shadowRoot;
    if (!s) return;
    const d = this._data();

    /* values */
    const el = (id) => s.getElementById(id);

    const vSolar = el("gs-v-solar");
    const vHome  = el("gs-v-home");
    const vHeat  = el("gs-v-heat");
    const vGrid  = el("gs-v-grid");
    const vGridS = el("gs-v-grid-sub");
    const vBat   = el("gs-v-bat");
    if (!vSolar) return;

    vSolar.textContent = _fmt(d.solar);
    vHome.textContent  = _fmt(d.home);
    vHeat.textContent  = _fmt(d.heat);
    vBat.textContent   = _pct(d.battery);

    /* grid — show absolute value + import/export label */
    if (d.grid !== null) {
      vGrid.textContent = _fmt(Math.abs(d.grid));
      if (d.grid < -5) {
        vGrid.style.color = "#3fb950";
        vGridS.textContent = "Exporting";
        vGridS.style.color = "#3fb950";
      } else if (d.grid > 5) {
        vGrid.style.color = "#f85149";
        vGridS.textContent = "Importing";
        vGridS.style.color = "#f85149";
      } else {
        vGrid.style.color = "#6e7681";
        vGridS.textContent = "Idle";
        vGridS.style.color = "#6e7681";
      }
    } else {
      vGrid.textContent = "—";
      vGridS.textContent = "";
    }

    /* flow indicator bars inside the SVG */
    const barSolar = s.getElementById("gs-bar-solar");
    const barGrid  = s.getElementById("gs-bar-grid");
    if (barSolar) {
      // Show solar bar when solar produces
      if (d.solar !== null && d.solar > 5) {
        barSolar.setAttribute("opacity", "1");
        // Re-enable the animate child
        const anim = barSolar.querySelector("animate");
        if (anim) anim.setAttribute("begin", "0s");
      } else {
        barSolar.setAttribute("opacity", "0");
      }
    }
    if (barGrid) {
      // Show grid bar when importing
      if (d.grid !== null && d.grid > 5) {
        barGrid.setAttribute("opacity", "1");
        barGrid.setAttribute("fill", "#f85149");
      } else if (d.grid !== null && d.grid < -5) {
        barGrid.setAttribute("opacity", "1");
        barGrid.setAttribute("fill", "#3fb950");
      } else {
        barGrid.setAttribute("opacity", "0");
      }
    }

    /* grid LED colour */
    const gridLed = s.getElementById("gs-grid-led");
    if (gridLed) {
      if (d.grid !== null && d.grid > 5) gridLed.setAttribute("fill", "#f85149");
      else if (d.grid !== null && d.grid < -5) gridLed.setAttribute("fill", "#3fb950");
      else gridLed.setAttribute("fill", "#555");
    }

    /* battery ring */
    const batRing = s.getElementById("gs-bat-ring");
    if (batRing && d.battery !== null) {
      const pct = Math.max(0, Math.min(100, d.battery));
      const circ = 2 * Math.PI * 10; // r=10
      const filled = (pct / 100) * circ;
      batRing.setAttribute("stroke-dasharray", `${filled} ${circ}`);
      batRing.setAttribute("stroke", pct > 20 ? "#3fb950" : pct > 5 ? "#f0c040" : "#f85149");
    }
  }
}

customElements.define("gridsense-card", GridSenseCard);

/* register in HA card picker */
window.customCards = window.customCards || [];
if (!window.customCards.find(c => c.type === "gridsense-card")) {
  window.customCards.push({
    type: "gridsense-card",
    name: "GridSense Energy Dashboard",
    description: "Isometric house energy flow visualisation.",
    preview: true,
  });
}

console.info(
  `%c GRIDSENSE %c v${CARD_VERSION} `,
  "background:#1b2130;color:#f0c040;font-weight:bold;padding:2px 6px;border-radius:3px 0 0 3px",
  "background:#f0c040;color:#1b2130;font-weight:bold;padding:2px 6px;border-radius:0 3px 3px 0",
);
