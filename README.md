# GridSense

A [HACS](https://hacs.xyz) integration for Home Assistant that gives you a real-time energy flow dashboard — without requiring any extra integrations.

Link your existing Home Assistant sensors (solar, home consumption, grid, battery, heat pump) and GridSense creates a unified set of virtual sensors plus a built-in Lovelace card that visualises the energy flow in your home.

---

## Features

- **Virtual sensors** — mirrors your existing HA entities under a single `gridsense` device
- **Real-time updates** — uses state-change events, no polling
- **Bundled Lovelace card** (`custom:gridsense-card`) — auto-registered on install, no manual resource setup needed
- **Animated energy flow** — directional flow lines show where energy is going
- **Derived stats** — self-consumption %, solar surplus, grid import/export status
- **Options flow** — reassign entities at any time via Instellingen → Integraties

---

## Installation via HACS

1. In Home Assistant open **HACS → Integraties**
2. Klik **⋮ → Custom repositories**
3. Voeg toe: `https://github.com/Stijnkr/GridSense` — categorie **Integration**
4. Zoek **GridSense** en klik **Installeren**
5. Herstart Home Assistant

---

## Setup

1. Ga naar **Instellingen → Integraties → + Toevoegen → GridSense**
2. Koppel je bestaande sensor-entiteiten:

| Veld | Eenheid | Verplicht |
|---|---|---|
| Solar power entity | W | ✅ |
| Home consumption entity | W | ✅ |
| Grid power entity | W (negatief = terugleveren) | ✅ |
| Heat pump power entity | W | ➖ optioneel |
| Battery state of charge entity | % | ➖ optioneel |

3. GridSense maakt de sensoren aan en registreert de Lovelace card automatisch.

---

## Lovelace card

Na de setup is de card direct beschikbaar in de kaartenkiezer als **GridSense Energy Dashboard**.

Minimale configuratie:
```yaml
type: custom:gridsense-card
```

Eigen entiteiten overschrijven (als je de integratie niet gebruikt):
```yaml
type: custom:gridsense-card
solar_entity: sensor.mijn_zonnepanelen
home_entity: sensor.mijn_verbruik
grid_entity: sensor.mijn_net
battery_entity: sensor.mijn_batterij
heat_pump_entity: sensor.mijn_warmtepomp
title: "Mijn Energie"
```

---

## Testen zonder hardware

Voeg tijdelijke template-sensoren toe aan `configuration.yaml`:

```yaml
template:
  - sensor:
      - name: "Test Solar"
        unit_of_measurement: "W"
        state: "604"
      - name: "Test Home"
        unit_of_measurement: "W"
        state: "93"
      - name: "Test Grid"
        unit_of_measurement: "W"
        state: "-511"
      - name: "Test Battery"
        unit_of_measurement: "%"
        state: "42"
      - name: "Test Heat Pump"
        unit_of_measurement: "W"
        state: "0"
```

Koppel vervolgens `sensor.test_solar` etc. in de GridSense config flow.

---

## Projectstructuur

```
custom_components/gridsense/
├── __init__.py          # Setup + automatische Lovelace resource registratie
├── config_flow.py       # Config flow + options flow met entity selectors
├── const.py             # Constanten
├── manifest.json
├── sensor.py            # Virtuele sensoren (local_push)
├── translations/
│   ├── en.json
│   └── nl.json
└── www/
    └── gridsense-card.js   # Lovelace card (gebundeld)
```

---

## Development

Open de repo in VS Code en gebruik de ingebouwde devcontainer:

```
Dev Containers: Reopen in Container
```

Start daarna Home Assistant:

```bash
scripts/develop
```

HA draait op `http://localhost:8123`.

---

## Licentie

MIT — zie [LICENSE](LICENSE).
