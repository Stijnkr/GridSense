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
- **Options flow** — reassign entities at any time via Settings → Integrations

---

## Installation via HACS

1. In Home Assistant open **HACS → Integrations**
2. Click **⋮ → Custom repositories**
3. Add: `https://github.com/Stijnkr/GridSense` — category **Integration**
4. Search for **GridSense** and click **Download**
5. Restart Home Assistant

---

## Setup

1. Go to **Settings → Integrations → + Add Integration → GridSense**
2. Link your existing sensor entities:

| Field | Unit | Required |
|---|---|---|
| Solar power entity | W | ✅ |
| Home consumption entity | W | ✅ |
| Grid power entity | W (negative = exporting) | ✅ |
| Heat pump power entity | W | ➖ optional |
| Battery state of charge entity | % | ➖ optional |

3. GridSense creates the sensors and registers the Lovelace card automatically.

---

## Lovelace card

After setup the card is immediately available in the card picker as **GridSense Energy Dashboard**.

Minimal configuration:
```yaml
type: custom:gridsense-card
```

Override entities (if you want to use the card without the integration):
```yaml
type: custom:gridsense-card
solar_entity: sensor.my_solar
home_entity: sensor.my_home
grid_entity: sensor.my_grid
battery_entity: sensor.my_battery
heat_pump_entity: sensor.my_heat_pump
title: "My Energy"
```

---

## Testing without hardware

Add temporary template sensors to `configuration.yaml`:

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

Then link `sensor.test_solar` etc. in the GridSense config flow.

---

## Project structure

```
custom_components/gridsense/
├── __init__.py          # Setup + automatic Lovelace resource registration
├── config_flow.py       # Config flow + options flow with entity selectors
├── const.py             # Constants
├── manifest.json
├── sensor.py            # Virtual sensors (local_push)
├── translations/
│   ├── en.json
│   └── nl.json
└── www/
    └── gridsense-card.js   # Bundled Lovelace card
```

---

## Development

Open the repo in VS Code and use the built-in devcontainer:

```
Dev Containers: Reopen in Container
```

Then start Home Assistant:

```bash
scripts/develop
```

HA runs at `http://localhost:8123`.

---

## License

MIT — see [LICENSE](LICENSE).
