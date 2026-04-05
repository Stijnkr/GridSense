"""Config flow for GridSense."""

from __future__ import annotations

from typing import Any

import voluptuous as vol
from homeassistant.config_entries import ConfigEntry, ConfigFlow, ConfigFlowResult, OptionsFlow
from homeassistant.core import callback
from homeassistant.helpers import selector

from .const import (
    CONF_BATTERY_ENTITY,
    CONF_GRID_ENTITY,
    CONF_HEAT_PUMP_ENTITY,
    CONF_HOME_ENTITY,
    CONF_SOLAR_ENTITY,
    DOMAIN,
)


def _build_schema(defaults: dict[str, Any] | None = None) -> vol.Schema:
    defaults = defaults or {}

    def _entity_selector(domain: str | None = None) -> selector.EntitySelector:
        config = selector.EntitySelectorConfig(domain=domain) if domain else selector.EntitySelectorConfig()
        return selector.EntitySelector(config)

    return vol.Schema(
        {
            vol.Required(
                CONF_SOLAR_ENTITY,
                default=defaults.get(CONF_SOLAR_ENTITY, vol.UNDEFINED),
            ): _entity_selector("sensor"),
            vol.Required(
                CONF_HOME_ENTITY,
                default=defaults.get(CONF_HOME_ENTITY, vol.UNDEFINED),
            ): _entity_selector("sensor"),
            vol.Optional(
                CONF_HEAT_PUMP_ENTITY,
                default=defaults.get(CONF_HEAT_PUMP_ENTITY, vol.UNDEFINED),
            ): _entity_selector("sensor"),
            vol.Required(
                CONF_GRID_ENTITY,
                default=defaults.get(CONF_GRID_ENTITY, vol.UNDEFINED),
            ): _entity_selector("sensor"),
            vol.Optional(
                CONF_BATTERY_ENTITY,
                default=defaults.get(CONF_BATTERY_ENTITY, vol.UNDEFINED),
            ): _entity_selector("sensor"),
        }
    )


class GridSenseConfigFlow(ConfigFlow, domain=DOMAIN):
    """Handle the initial setup of GridSense."""

    VERSION = 1

    async def async_step_user(
        self,
        user_input: dict[str, Any] | None = None,
    ) -> ConfigFlowResult:
        """Handle a flow initiated by the user."""
        if user_input is not None:
            # Strip UNDEFINED optional fields
            data = {k: v for k, v in user_input.items() if v is not vol.UNDEFINED}
            return self.async_create_entry(title="GridSense", data=data)

        return self.async_show_form(
            step_id="user",
            data_schema=_build_schema(),
        )

    @staticmethod
    @callback
    def async_get_options_flow(config_entry: ConfigEntry) -> GridSenseOptionsFlow:
        """Return an options flow so users can update entity assignments."""
        return GridSenseOptionsFlow(config_entry)


class GridSenseOptionsFlow(OptionsFlow):
    """Allow updating entity assignments after initial setup."""

    def __init__(self, config_entry: ConfigEntry) -> None:
        """Initialise options flow."""
        self._current = dict(config_entry.data)

    async def async_step_init(
        self,
        user_input: dict[str, Any] | None = None,
    ) -> ConfigFlowResult:
        """Handle options flow."""
        if user_input is not None:
            data = {k: v for k, v in user_input.items() if v is not vol.UNDEFINED}
            return self.async_create_entry(title="GridSense", data=data)

        return self.async_show_form(
            step_id="init",
            data_schema=_build_schema(self._current),
        )
