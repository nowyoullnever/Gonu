# MVP verification

## Automated

- Vitest: pure engine and local-session coverage, DOM button-level integration.
- Full match: serializable commands from `createGame()`; no fixture injection. Replay after JSON serialization equals the original final state.
- Production: TypeScript strict check and Vite `/Gonu/` build.

## Actual browser match

Verified in the Codex browser at `http://127.0.0.1:5173/Gonu/` on 2026-09-21, using the real displayed buttons:

1. Start through NEW GAME → LOCAL TWO PLAYER.
2. Build and traverse arbitrary-angle roads. C1 → D4 is length √10.
3. Spend three actions and confirm automatic handoff.
4. Black D1 → G5 completes a sandwich and captures White at F5.
5. White D10 → F5 voluntarily suicides into that sandwich.
6. Black H2 → I10 reproduces; place the new carrier at B1.
7. White reaches A1 and C1; the latter captures the black carrier at B1 and resets Black's lineage.
8. Black I10 → I9 → I10 triggers a second lineage; a new carrier appears at B1.
9. Continue legal movement/captures until the last White stone is removed. Final events include WHITE lineage resets and BLACK WINS.
10. REMATCH restores six stones per side, Black's turn, three actions, no roads.

A long initial automation batch was interrupted by changing viewport/scroll geometry and did not reliably apply every move. Replaying with a fixed desktop viewport and an observation after each click completed the entire sequence successfully. The matching DOM integration test also passes.

## Rule decisions

Mandatory moved-stone suicide takes the one-capture slot. Full home rows skip birth and preserve lineage. Unchosen old sandwiches are not harvested by a later road action. These decisions are documented in the README and taught in the tutorial where applicable.

## Responsive and theme checks

- Desktop dark theme: complete browser match at 1100 × 1100.
- Mobile light theme: 390 × 844; the board measured equal width and height, rendered exactly 100 point controls, and had no horizontal overflow.
- Tutorial: checked the first lesson and reproduction-lineage page at mobile size; diagrams, text, and navigation remained visible.
- Local font URL in the production stylesheet is based at /Gonu/fonts/.
