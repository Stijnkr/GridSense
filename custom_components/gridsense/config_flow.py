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

    def _entity_selector() -> selector.EntitySelector:
        return selector.EntitySelector(selector.EntitySelectorConfig(domain="sensor"))

    def _optional(key: str) -> vol.Optional:
        """Optional field — show current value as suggestion if present."""
        val = defaults.get(key)
        if val:
            return vol.Optional(key, description={"suggested_value": val})
        return vol.Optional(key)

    return vol.Schema(
        {
            vol.Required(
                CONF_SOLAR_ENTITY,
                default=defaults.get(CONF_SOLAR_ENTITY, vol.UNDEFINED),
            ): _entity_selector(),
            vol.Required(
                CONF_HOME_ENTITY,
                default=defaults.get(CONF_HOME_ENTITY, vol.UNDEFINED),
            ): _entity_selector(),
            _optional(CONF_HEAT_PUMP_ENTITY): _entity_selector(),
            vol.Required(
                CONF_GRID_ENTITY,
                default=defaults.get(CONF_GRID_ENTITY, vol.UNDEFINED),
            ): _entity_selector(),
            _optional(CONF_BATTERY_ENTITY): _entity_selector(),
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
        await self.async_set_unique_id(DOMAIN)
        self._abort_if_unique_id_configured()

        if user_input is not None:
            data = {k: v for k, v in user_input.items() if v not in (None, "", vol.UNDEFINED)}
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
        self._current = {**config_entry.data, **config_entry.options}

    async def async_step_init(
        self,
        user_input: dict[str, Any] | None = None,
    ) -> ConfigFlowResult:
        """Handle options flow."""
        if user_input is not None:
            data = {k: v for k, v in user_input.items() if v not in (None, "", vol.UNDEFINED)}
            return self.async_create_entry(data=data)

        return self.async_show_form(
            step_id="init",
            data_schema=_build_schema(self._current),
        )
