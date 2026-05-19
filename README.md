# Castle Defend V162

Mobile-friendly tower defense and assault prototype.

## V162 Notes

- Version text is centralized as `APP_VERSION = 'V162'`.
- Debug mode now always starts every mission with 1000 gold, regardless of each map's configured `startingScore`.
- Level result accounting now uses the same debug starting-score override.

## V161 Notes

- Version text is centralized as `APP_VERSION = 'V161'`.
- Moved J Rocket Squad movement, sight, attack, damage, count, and triangle formation parameters into `js/weapon_config.js`.
- Reduced J Rocket Squad support range by one third: sight range 6, attack range 4.7, and path movement radius 6.
- J Rocket Squad now chooses one squad target and moves all three robots together in a triangle formation.
- Q Support Helicopter movement radius and movement speed are also configurable in `js/weapon_config.js`.

## V160 Notes

- Version text is centralized as `APP_VERSION = 'V160'`.
- J rocket robots and Q support helicopter now move along enemy road paths instead of cutting freely across the whole map.
- J rocket robots use the elite drone movement speed and keep walking animation active while advancing or returning to base.
- The current map path is exposed to card support systems through `CASTLE_DEFEND_RUNTIME`.

## V159 Notes

- Version text is centralized as `APP_VERSION = 'V159'`.
- Q helicopter support now uses a 9-unit movement leash from the base before returning after combat.
- J card support robots now move out from the base, engage targets, and return home when the area is clear.
- Rebuilt the friendly rocket robot from the animation-library style helmet, torso armor, mechanical arms, and mechanical legs, with a shoulder-carried launcher and two-handed support pose.
- J card faces now show a small rocket robot support icon.

## V158 Notes

- Version text is centralized as `APP_VERSION = 'V158'`.
- Added a friendly rocket launcher robot and rocket launcher animation assets.
- Activating the J card now deploys a three-unit rocket squad from the base, with 9 sight range, 7 attack range, and Pulse-style firing for now.
- The animation asset page now uses English UI text, adds a collapsible bottom control panel, and supports mouse drag orbit plus wheel zoom for freer inspection.

## V157 Notes

- Version text is centralized as `APP_VERSION = 'V157'`.
- Added a matching robot torso armor asset with white chest armor, shoulder armor, abdomen-to-hip connector plates, rear backpack armor, and twin oxygen cylinders.
- The torso armor keeps the streamlined white shell and blue glass/glow language from the robot helmet asset.

## V156 Notes

- Version text is centralized as `APP_VERSION = 'V156'`.
- Added a new stream-lined robot helmet animation asset with a white angular shell, blue glass face visor, side intakes, crown fin, and subtle visor glow animation.

## V155 Notes

- Version text is centralized as `APP_VERSION = 'V155'`.
- Added two viewable animation assets based on the Z mechanical arm principle: upright robot upper limb and upright robot lower limb.
- Each limb asset uses three unequal rigid segments with hexagonal prism joints and independent motion sliders for the main joints.

## V154 Notes

- Version text is centralized as `APP_VERSION = 'V154'`.
- Added a Z-shaped mechanical arm to the animation asset viewer, built from unequal large-arm, forearm, and palm segments connected by hexagonal prism joints.
- The new mechanical arm asset includes viewer sliders for motion speed and the swing amplitude of the large arm, forearm, and palm.

## V153 Notes

- Version text is centralized as `APP_VERSION = 'V153'`.
- Added standalone DIY backup model files for the Q card base support helicopter and white robot:
  `backups/q_support_helicopter_model.js` and `backups/white_robot_model.js`.

## V152 Notes

- Version text is centralized as `APP_VERSION = 'V152'`.
- Cyber-road assets are darker and their visual surface is lowered slightly to reduce intersections with unit and tower models.
- Boss death now uses the imported voxel explosion style from `preview.html`: blocky flash, fireball, shock rings, debris, scorch, and mushroom-cloud motion scaled to the Boss size.
- Normal enemy and small battle explosions keep the existing lightweight explosion effect.

## V151 Notes

- Version text is centralized as `APP_VERSION = 'V151'`.
- Weapon configs now distinguish attack `range` from longer `sightRange`.
- Defensive towers pre-aim at enemies inside sight range but only fire inside attack range.
- Q support helicopter detects enemies from the base using sight range, flies toward them, and fires only after its own position brings them into attack range.

## V150 Notes

- Version text is centralized as `APP_VERSION = 'V150'`.
- Q support helicopter weapon tuning now lives in `js/weapon_config.js` as `Q_HELICOPTER`.
- Q helicopter targeting range now matches Tesla range and keeps the Rail-style six-shot burst with a pause.
- Q helicopter shots now use a brighter pale-blue tracer to make the machine-gun path easier to read.

## V149 Notes

- Version text is centralized as `APP_VERSION = 'V149'`.
- Q support helicopter colors now swap the white and blue body panels to stand apart from the base.
- Q support attack range is reduced to half Rail range, while it still watches from the base helipad.
- The helicopter now lifts off from the H pad to attack, returns when no target remains, and stops its rotors while docked.

## V148 Notes

- Version text is centralized as `APP_VERSION = 'V148'`.
- Fixed the next-level crash by keeping Q helicopter cleanup inside `clearRunObjects()` and frame updates inside the game loop.
- Performed a lightweight syntax check without launching extra browser sessions.

## V147 Notes

- Version text is centralized as `APP_VERSION = 'V147'`.
- Q card support now prioritizes stability by placing the blue-white helicopter directly on the base H helipad.
- The support helicopter keeps Rail range, Rail burst damage/timing, and card bonuses while firing from the helipad.
- Main HTML and i18n files were rewritten as clean UTF-8 to prevent broken UI text and malformed end screens.

## V146 Notes

- Version text is centralized as `APP_VERSION = 'V146'`.
- Q support helicopter now uses a game-runtime bridge so buying the Q card reliably creates the aircraft and pad assets.
- The Q helicopter landing point now aligns with the base model's H-shaped helipad.
- End-of-level UI now hides gameplay controls and constrains the summary panel on smaller screens.

## V145 Notes

- Version text is centralized as `APP_VERSION = 'V145'`.
- The normal helicopter asset now uses a blue and white support colorway.
- Activating the Q spade card now calls in a support helicopter that lands by the base, takes off when enemies enter Rail range, and fires with Rail damage, timing, and card bonuses.
- The active Q card face now shows a small helicopter marker under the card.

## V144 Notes

- Version text is centralized as `APP_VERSION = 'V144'`.
- Map editor card rules now let J/Q/K be enabled or disabled independently.
- Enabling any individual card automatically keeps the card panel enabled; disabling all cards turns the panel off.
- The global card toggle no longer forces card edits to behave like an all-or-nothing switch.

## V143 Notes

- Version text is centralized as `APP_VERSION = 'V143'`.
- Wheelbarrow animation controls now use a wheel rotation axis selector for X/Y/Z plus spin speed.
- Wheelbarrow turret animation now exposes swing amplitude and swing speed controls.
- Animation Assets part controls now support select inputs as well as range sliders.

## V142 Notes

- Version text is centralized as `APP_VERSION = 'V142'`.
- Wheelbarrow animation editor now separates wheel spin speed from wheel rotation direction.
- Saved wheelbarrow presets migrate older signed spin-speed values into speed plus direction.
- Assault missions no longer use boss-kill victory checks; victory is only driven by enemy base HP.

## V141 Notes

- Version text is centralized as `APP_VERSION = 'V141'`.
- Animation Assets page logic moved into `js/animation_assets_page.js` so the page can grow into a proper animation editor.
- Wheelbarrow wheel is now a separate wheel assembly with saved animation controls for spin speed, wobble, and camber.
- Animation presets are saved in browser local storage per asset and reloaded when that asset is selected again.

## V140 Notes

- Version text is centralized as `APP_VERSION = 'V140'`.
- Animation asset viewer now supports a grouped dropdown covering effects, enemy units, bosses, player towers, airstrike, and the base.
- Added `js/animation_showcase_assets.js` to keep animation preview registry and unit preview behavior separate from gameplay.
- Unit previews reuse the in-game models and loop their idle, walking, rotor, portal, tower, and base animations.

## V139 Notes

- Version text is centralized as `APP_VERSION = 'V139'`.
- The imported particle blast has been saved as `js/animation_assets.js` with reusable Boss Explosion and Compact Blast assets.
- Boss deaths now use the scalable boss explosion animation, sized from the unit mesh and kept running through the victory overlay.
- Added `animation-assets.html` as a standalone animation asset viewer with direction, amplitude, and size sliders.

## V138 Notes

- Version text is centralized as `APP_VERSION = 'V138'`.
- Map editor adds per-mission card rules: card panel visibility plus J/Q/K enabled state, price, fire-rate bonus, damage bonus, and income per second.
- Gameplay card logic now reads `LEVELS[currentLevel].cardRules` and hides disabled cards or the whole card panel per mission.
- Decorative tech pylons and old ground art presets moved to `js/background_art_assets.js`; functional maps no longer render those non-gameplay props.

## V137 Notes

- Version text is centralized as `APP_VERSION = 'V137'`.
- Map editor adds separate single-level JS export and import buttons with down/up arrow styling.
- Single-level exports preserve the mission key, title, export time, and level data in `CASTLE_DEFEND_LEVEL_EXPORT`.
- Single-level imports overwrite the currently selected mission and then require saving `maps.js` to affect the game.

## V136 Notes

- Version text is centralized as `APP_VERSION = 'V136'`.
- Enemy tower pad type selection in the map editor now uses direct Pulse/Rail/Tesla style buttons instead of the unreliable dropdown.
- Assault enemy tower creation now casts tower type to a number before building the in-game model, so saved map data reliably changes tower style.

## V135 Notes

- Version text is centralized as `APP_VERSION = 'V135'`.
- Assault missions now support a fully editable attack unit roster in the map editor: all enemy models can be selected, added, removed, priced, tuned, and given purchase limits.
- The in-game assault shop is generated from each mission's `availableAttackUnits` configuration instead of four fixed buttons.
- Enemy tower pads in assault missions remain editable with add-pad and tower-type controls.

## V134 Notes

- Version text is centralized as `APP_VERSION = 'V134'`.
- Map editor now auto-loads the current `js/maps.js`; the separate “read current maps.js” button was removed to keep the file actions cleaner.

## V133 Notes

- Version text is centralized as `APP_VERSION = 'V133'`.
- Map editor now has a mission type selector for defense and assault missions.
- Defense missions show tower slots, purchasable defense weapons, and enemy wave editing; assault missions show enemy base HP, countdown, income rules, purchasable attack units, and editable enemy defense towers.
- Enemy tower markers in assault missions can be edited in the panel or dragged directly on the map canvas.
- The game now reads mission-level attack unit availability and skips player tower-slot assets for assault maps.
- Home screen supports Chinese and English through `js/i18n.js`.
- Wave-scheduled missions now use the map editor as the source of truth for Boss logic: no legacy final Boss is auto-spawned after `enemyWaves`, and victory waits until all scheduled waves are spawned and cleared.
- Boss HP was removed from the left-side map editor fields; Boss health should be configured per Boss wave in the enemy batch panel.
- Any scheduled Boss wave now triggers the system Boss warning announcement when it appears.
- Enemy wave editing now includes Boss units: Tank Boss, Chopper Boss, and Final Boss Alpha can be scheduled in the same batch panel.
- Map editor adds per-mission rules for starting funds and available defense weapons; the game shop now reads those settings when showing and allowing purchases.
- Enemy wave editing now sits in a full-width bottom panel in the map editor, giving the timeline and batch rows enough room to scan and edit comfortably.
- Map editor now supports visual enemy wave editing: unit type, count, start time, interval, path, HP, speed, and timeline bars are editable per mission.
- New missions can be added from `map-editor.html`; saved missions appear in the in-game debug level selector and campaign progression reads the available `LEVELS` list dynamically.
- Defense missions can now use `enemyWaves` in `js/maps.js`; old probability-based spawning still works for maps without a wave schedule.
- Map editor canvas nodes can now be dragged directly: route nodes, spawn, base, and tower-slot markers all update the same map data used for saving.
- The advanced JSON editor remains available in code but is hidden from the editor UI to keep the workflow focused on visual map editing.
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
