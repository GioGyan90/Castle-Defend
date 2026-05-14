# Castle Defend V127

Mobile-friendly tower defense and assault prototype.

## V127 Notes

- Home screen supports Chinese and English through `js/i18n.js`.
- Version text is centralized as `APP_VERSION = 'V127'`.
- The map editor now falls back to a normal file input when `file://` or the browser blocks File System Access handles; saving downloads a replacement `maps.js` when direct write is unavailable.
- Map rendering assets now live across `js/map_assets.js` and `js/road_assets.js`: spawn point, road segments, turn pads, tower slots, tech pylons, and base placement.
- Road segments now rotate to match any path direction, with consistent rails, lane dashes, shoulder strips, and turn pads on horizontal, vertical, or diagonal routes.
- `map-editor.html` provides a standalone map editor that reads `js/maps.js`, switches missions, previews the route, edits points/slots, and saves through the browser file picker or downloads a replacement file.
- The mission maps use a shared visual language: upper-left spawn, readable road blocks, and tower pads around key turns.
- Mission 2 moves the final approach and base to the marked upper-right landing area.
- Mission 3 follows the marked diagram with a top-left spawn, W-style road, tower pads at the blue positions, and a bottom-right base.
- Gameplay controls respond to orientation: portrait keeps cards and weapons at the bottom, landscape places weapons on the left and cards on the right.
- Scene announcements live in `js/scene_announcer.js` and use smaller top-center HUD messages.
- Announcements now cover mission starts, boss warnings, weapon deployment, airstrikes, explosions, card activation, and base HP changes.
- Mission 4 enemy base HP is currently set to 3. The saved 5-pip HP bar asset settings remain in `ATTACK_BASE_HP_BAR_ASSETS` for later reuse.
