# Go!nu

A local two-player strategy game inspired by Korean Gonu and route-building games. The name connects “Go” and “Gonu.” Build a shared movement network, capture opposing stones, and keep a reproduction lineage alive.

Go!nu is an independent sister project to [ReverSIX](https://github.com/nowyoullnever/ReverSIX): Vite, TypeScript, DOM UI, pure rules, restrained black/white styling, MaruBuri typography, and light/dark themes. The reference repository is not modified. No accounts, AI, clocks, or networking are included. Online multiplayer is planned, not implemented.

## Run

Use Node.js 22.12+ (Node 24 also supported).

```sh
npm ci
npm run dev
npm test
npm run build
npm run preview
```

Open the `/Gonu/` URL printed by Vite. Production files are written to `dist/`.

## Play

- Select **NEW GAME → LOCAL TWO PLAYER**. Black begins at C1–H1 and White at C10–H10 on a 10×10 **point** board. There are no initial roads.
- Take exactly three actions per turn, in any MOVE/ROAD combination. The third completed action passes control automatically. No voluntary early end turn.
- **ROAD:** select any two board points. Ringed destinations are legal. Hover or focus a second point for a length preview; illegal previews are dashed and explained in text. Roads are permanent, undirected, and ownerless.
- **MOVE:** select your stone, then an empty ringed endpoint along one existing road. Use any shared road. The same stone may move repeatedly. A newly built road is immediately usable.
- **UNDO:** restores one complete action, including captures, births, lineage, IDs, AP, and winning state. During a pending choice it cancels that whole action. Once control passes, the previous turn is locked. Winning actions remain undoable because control has not passed.
- Arrow keys move focus between board points; Enter/Space selects. Dialogs support Escape. SETTINGS offers light, dark, and system appearance. Reduced-motion preferences disable animations.

### Road geometry

For endpoint differences `dx, dy`, a road is legal when endpoints are distinct and in bounds, no undirected duplicate exists, `dx² + dy² <= 65`, and `gcd(abs(dx), abs(dy)) === 1`.

Thus `(1,0)`, `(1,1)`, `(4,1)`, `(5,1)`, `(7,4)`, and `(8,1)` are legal. `(2,0)`, `(2,2)`, and `(4,2)` pass through lattice points and are illegal; `(8,2)` is too long. Crossing roads create no junction, stop, or transfer point. One road always costs **one MOVE**, whether its length is 1 or √65.

### Capture and victory

Sandwich one enemy between friendly stones at three consecutive horizontal or vertical points. Diagonals and gaps do not capture. Capture geometry is independent of roads. When an action completes several sandwiches, choose exactly one target. **At most one stone is removed per action.**

A moved stone that arrives inside an enemy sandwich must be removed (suicide is legal). This mandatory self-capture takes priority and uses the action’s single capture slot. A player wins immediately when the opponent has zero stones; unused AP is discarded.

### Reproduction and lineage

Black newly entering row 10, or White newly entering row 1, may trigger birth. Choose any empty point on your own home row for the new stone, at no extra AP cost. The completed MOVE resolves in this order: movement → pending birth placement → child and lineage update → mandatory suicide or one enemy capture → victory → AP/turn update.

Initially each side has no designated carrier: any stone can begin a chain. After A arrives and creates B, **only B** can create the next child. When B arrives and creates C, C becomes the only carrier. The small center mark identifies that stone, whose movement and capture rules are unchanged. Stable stone IDs track the carrier independently of its location.

Capturing the carrier resets that side’s lineage to `null`; any surviving stone may begin again on a future arrival. A stone already at the far edge must leave that row and re-enter it. Moving sideways along the far row does not reproduce.

### Explicit edge-case decisions

- A full home row skips birth without changing the carrier; a later qualifying arrival can try again.
- Capture candidates are enemy sandwiches completed by the moved stone or newborn as an endpoint. A previously unchosen sandwich is not harvested by later road construction.
- Suicide priority applies to the **moved** stone. A newborn does not count as a voluntary move into a sandwich. Newborn placement can itself complete an enemy capture.
- Birth is automatic when eligible and space exists; there is no skip-birth button. Choosing placement is part of the current action.

## Architecture

```text
src/game/   Types, geometry, roads, movement, capture, reproduction, pure reducer
src/local/  Hot-seat session and complete deterministic undo snapshots
src/ui/     SVG board, keyed stone rendering, lobby, tutorial, settings, dialogs
src/main.ts Application composition
tests/      Rule tests, DOM interaction tests, complete legal match/replay
```

`GameState` contains only plain serializable data. `applyAction(state, command)` returns a new state and never changes its input; invalid commands throw. `move` and `build-road` start actions. `reproduce` and `capture` complete pending choices without extra AP. Pending state is serializable too. The engine contains all legality checks; the UI only displays legal choices and sends commands.

`LocalGameSession` owns turn-local snapshots. A future online session can submit/replay the same commands and render the same state without changing core rules or adding networking dependencies to the UI.

## Tests and verification

`npm test` runs Vitest, including geometry boundaries, shared graph movement, crossings without connectivity, capture choice/suicide priority, reproduction/carrier resets, atomic undo, JSON replay, and rendered-button interactions. `tests/matchScenario.ts` creates a full cooperative match from the actual initial position using only legal commands. Its 69 commands cover capture, suicide, birth, carrier loss, a new lineage, and the final win. DOM tests replay the same match and verify rematch.

See [verification notes](docs/verification.md) for browser checks and rule interpretations. No production debug interface or seeded game is exposed.

## GitHub Pages

Vite uses `base: '/Gonu/'`. The Pages workflow tests and builds every pull request, and tests/builds/deploys pushes to `main`. In repository **Settings → Pages → Build and deployment**, select **GitHub Actions**. The workflow uses a Pages artifact and OIDC, not a deployment branch or stored secret.

Expected address: [nowyoullnever.github.io/Gonu/](https://nowyoullnever.github.io/Gonu/).

## Font attribution

MaruBuri Regular is bundled locally with its NAVER license in `public/fonts/LICENSE-NAVER.txt`. No runtime font CDN is required.
