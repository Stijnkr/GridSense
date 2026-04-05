"""GridSense — virtual energy dashboard integration for Home Assistant.

On load this integration:
  1. Registers a static HTTP path for the bundled Lovelace card JS.
  2. Auto-adds the card as a Lovelace resource (storage-mode only).
     YAML-mode users see a persistent notification with manual instructions.
  3. Forwards the config entry to the sensor platform.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import TYPE_CHECKING

from homeassistant.components.http import StaticPathConfig
from homeassistant.components.persistent_notification import (
    async_create as pn_create,
    async_dismiss as pn_dismiss,
)
from homeassistant.const import EVENT_HOMEASSISTANT_STARTED, Platform
from homeassistant.core import CoreState, Event

from .const import DOMAIN, LOGGER

if TYPE_CHECKING:
    from homeassistant.config_entries import ConfigEntry
    from homeassistant.core import HomeAssistant

PLATFORMS: list[Platform] = [Platform.SENSOR]

_URL_BASE = "/gridsense"
_CARD_FILE = "gridsense-card.js"
_MANIFEST = json.loads((Path(__file__).parent / "manifest.json").read_text())
_CARD_VERSION: str = _MANIFEST["version"]
_RESOURCE_URL = f"{_URL_BASE}/{_CARD_FILE}"
_NOTIFICATION_ID = f"{DOMAIN}_lovelace_resource"


# ──────────────────────────────────────────────────────────
# Integration setup
# ──────────────────────────────────────────────────────────

async def async_setup(hass: HomeAssistant, config: dict) -> bool:  # noqa: ARG001
    """Register the static HTTP path for the Lovelace card."""
    card_path = Path(__file__).parent / "www" / _CARD_FILE
    await hass.http.async_register_static_paths([
        StaticPathConfig(
            url_path=f"{_URL_BASE}/{_CARD_FILE}",
            path=str(card_path),
            cache_headers=False,
        )
    ])
    return True


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up GridSense from a config entry."""

    async def _register(_event: Event | None = None) -> None:
        await _async_register_lovelace_resource(hass)

    # Lovelace is not yet loaded during early startup — defer until HA is running
    if hass.state is CoreState.running:
        await _register()
    else:
        hass.bus.async_listen_once(EVENT_HOMEASSISTANT_STARTED, _register)

    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    entry.async_on_unload(entry.add_update_listener(async_reload_entry))
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a config entry."""
    return await hass.config_entries.async_unload_platforms(entry, PLATFORMS)


async def async_reload_entry(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """Reload config entry."""
    await hass.config_entries.async_reload(entry.entry_id)


# ──────────────────────────────────────────────────────────
# Lovelace resource registration
# ──────────────────────────────────────────────────────────

async def _async_register_lovelace_resource(hass: HomeAssistant) -> None:
    """Add the GridSense card JS as a Lovelace module resource.

    Works for storage-mode Lovelace (the default).
    For YAML-mode users a one-time persistent notification is shown instead.
    """
    resource_url = f"{_RESOURCE_URL}?v={_CARD_VERSION}"

    try:
        from homeassistant.components.lovelace.resources import (  # type: ignore[import]
            ResourceStorageCollection,
        )

        lovelace_data = hass.data.get("lovelace", {})
        resources: ResourceStorageCollection | None = lovelace_data.get("resources")

        if not isinstance(resources, ResourceStorageCollection):
            # YAML mode — notify the user once
            await _async_notify_yaml_mode(hass)
            return

        # Check if already registered (any version)
        for item in resources.async_items():
            if item.get("url", "").startswith(_RESOURCE_URL):
                # Update URL if the version changed
                if item["url"] != resource_url:
                    await resources.async_update_item(
                        item["id"],
                        {"res_type": "module", "url": resource_url},
                    )
                    LOGGER.debug("GridSense: updated Lovelace resource to %s", resource_url)
                return

        await resources.async_create_item({"res_type": "module", "url": resource_url})
        LOGGER.debug("GridSense: registered Lovelace resource %s", resource_url)

    except Exception:  # noqa: BLE001
        LOGGER.warning(
            "GridSense: could not auto-register Lovelace resource. "
            "Add it manually: %s",
            resource_url,
        )
        await _async_notify_yaml_mode(hass)


async def _async_notify_yaml_mode(hass: HomeAssistant) -> None:
    """Show a one-time persistent notification for YAML-mode users."""
    resource_url = f"{_RESOURCE_URL}?v={_CARD_VERSION}"
    pn_create(
        hass,
        title="GridSense — manual step required",
        message=(
            "GridSense could not auto-register its Lovelace card "
            "(you appear to be using YAML-mode Lovelace). "
            "Please add the following to your `configuration.yaml`:\n\n"
            "```yaml\n"
            "lovelace:\n"
            "  resources:\n"
            f"    - url: {resource_url}\n"
            "      type: module\n"
            "```\n\n"
            "Then add a card with `type: custom:gridsense-card`."
        ),
        notification_id=_NOTIFICATION_ID,
    )

