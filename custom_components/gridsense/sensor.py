"""Sensor platform for GridSense.

Creates virtual sensor entities that mirror user-configured source entities and
update in real-time via HA state-change events (local_push).
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import TYPE_CHECKING

from homeassistant.components.sensor import (
    SensorDeviceClass,
    SensorEntity,
    SensorEntityDescription,
    SensorStateClass,
)
from homeassistant.const import PERCENTAGE, UnitOfPower
from homeassistant.core import Event, EventStateChangedData, callback
from homeassistant.helpers.device_registry import DeviceEntryType, DeviceInfo
from homeassistant.helpers.event import async_track_state_change_event

from .const import (
    CONF_BATTERY_ENTITY,
    CONF_GRID_ENTITY,
    CONF_HEAT_PUMP_ENTITY,
    CONF_HOME_ENTITY,
    CONF_SOLAR_ENTITY,
    DOMAIN,
    LOGGER,
)

if TYPE_CHECKING:
    from homeassistant.config_entries import ConfigEntry
    from homeassistant.core import HomeAssistant
    from homeassistant.helpers.entity_platform import AddEntitiesCallback


@dataclass(frozen=True, kw_only=True)
class GridSenseSensorDescription(SensorEntityDescription):
    """Describes a GridSense virtual sensor."""

    conf_key: str


SENSOR_DESCRIPTIONS: tuple[GridSenseSensorDescription, ...] = (
    GridSenseSensorDescription(
        key="solar",
        conf_key=CONF_SOLAR_ENTITY,
        name="Solar",
        icon="mdi:solar-power",
        device_class=SensorDeviceClass.POWER,
        state_class=SensorStateClass.MEASUREMENT,
        native_unit_of_measurement=UnitOfPower.WATT,
    ),
    GridSenseSensorDescription(
        key="home",
        conf_key=CONF_HOME_ENTITY,
        name="Home",
        icon="mdi:home-lightning-bolt",
        device_class=SensorDeviceClass.POWER,
        state_class=SensorStateClass.MEASUREMENT,
        native_unit_of_measurement=UnitOfPower.WATT,
    ),
    GridSenseSensorDescription(
        key="heat_pump",
        conf_key=CONF_HEAT_PUMP_ENTITY,
        name="Heat Pump",
        icon="mdi:heat-pump",
        device_class=SensorDeviceClass.POWER,
        state_class=SensorStateClass.MEASUREMENT,
        native_unit_of_measurement=UnitOfPower.WATT,
    ),
    GridSenseSensorDescription(
        key="grid",
        conf_key=CONF_GRID_ENTITY,
        name="Grid",
        icon="mdi:transmission-tower",
        device_class=SensorDeviceClass.POWER,
        state_class=SensorStateClass.MEASUREMENT,
        native_unit_of_measurement=UnitOfPower.WATT,
    ),
    GridSenseSensorDescription(
        key="battery",
        conf_key=CONF_BATTERY_ENTITY,
        name="Battery",
        icon="mdi:battery",
        device_class=SensorDeviceClass.BATTERY,
        state_class=SensorStateClass.MEASUREMENT,
        native_unit_of_measurement=PERCENTAGE,
    ),
)


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up GridSense sensors from a config entry."""
    # options override data so entity assignments can be changed after initial setup
    config = {**entry.data, **entry.options}
    async_add_entities(
        GridSenseVirtualSensor(
            entry=entry,
            description=desc,
            source_entity_id=config[desc.conf_key],
        )
        for desc in SENSOR_DESCRIPTIONS
        if config.get(desc.conf_key)
    )


class GridSenseVirtualSensor(SensorEntity):
    """A virtual sensor that mirrors a user-configured source entity.

    Uses async_track_state_change_event so updates are pushed immediately
    when the source entity changes — no polling required.
    """

    _attr_has_entity_name = True
    _attr_should_poll = False

    def __init__(
        self,
        entry: ConfigEntry,
        description: GridSenseSensorDescription,
        source_entity_id: str,
    ) -> None:
        """Initialise the virtual sensor."""
        self.entity_description = description
        self._source_entity_id = source_entity_id
        self._attr_unique_id = f"{entry.entry_id}_{description.key}"
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, entry.entry_id)},
            name="GridSense",
            manufacturer="GridSense",
            model="Energy Dashboard",
            entry_type=DeviceEntryType.SERVICE,
        )

    # ------------------------------------------------------------------
    # HA lifecycle
    # ------------------------------------------------------------------

    async def async_added_to_hass(self) -> None:
        """Subscribe to source entity state changes."""
        source_state = self.hass.states.get(self._source_entity_id)
        if source_state is not None:
            self._update_from_state_value(source_state.state)

        self.async_on_remove(
            async_track_state_change_event(
                self.hass,
                [self._source_entity_id],
                self._handle_state_change,
            )
        )

    # ------------------------------------------------------------------
    # State handling
    # ------------------------------------------------------------------

    @callback
    def _handle_state_change(self, event: Event[EventStateChangedData]) -> None:
        """Receive a state-change event from the source entity."""
        new_state = event.data.get("new_state")
        if new_state is None:
            return
        self._update_from_state_value(new_state.state)
        self.async_write_ha_state()

    def _update_from_state_value(self, state_value: str) -> None:
        """Parse and store the numeric value from the source state string."""
        try:
            self._attr_native_value = float(state_value)
        except (ValueError, TypeError):
            LOGGER.debug(
                "GridSense: could not parse state '%s' for source entity '%s'",
                state_value,
                self._source_entity_id,
            )
            self._attr_native_value = None

    @property
    def extra_state_attributes(self) -> dict:
        """Expose the source entity ID for transparency."""
        return {"source_entity": self._source_entity_id}
