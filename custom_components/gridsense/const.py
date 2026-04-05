"""Constants for GridSense."""

from logging import Logger, getLogger

LOGGER: Logger = getLogger(__package__)

DOMAIN = "gridsense"

# Config entry keys for source entity IDs
CONF_SOLAR_ENTITY = "solar_entity"
CONF_HOME_ENTITY = "home_entity"
CONF_HEAT_PUMP_ENTITY = "heat_pump_entity"
CONF_GRID_ENTITY = "grid_entity"
CONF_BATTERY_ENTITY = "battery_entity"
