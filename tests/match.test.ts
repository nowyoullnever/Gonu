import { it, expect } from "vitest";
import { fullMatch } from "./matchScenario";
import { createGame } from "../src/game/gameState";
import { applyAction } from "../src/game/rules";
it("plays a complete legal match: roads, long moves, capture, suicide, birth, reset, second lineage, win, rematch", () => {
  const { session, transcript, firstCarrier, secondCarrier } = fullMatch();
  expect(firstCarrier).toBeTruthy();
  expect(secondCarrier).toBeTruthy();
  expect(firstCarrier).not.toBe(secondCarrier);
  expect(
    transcript.some((x) =>
      x.events.some((e) => e.type === "lineage-reset" && e.player === "black"),
    ),
  ).toBe(true);
  expect(session.game.winner).toBe("black");
  expect(session.game.stones.every((x) => x.player === "black")).toBe(true);
  let replay = createGame();
  for (const entry of transcript)
    replay = applyAction(replay, JSON.parse(JSON.stringify(entry.action)));
  expect(replay).toEqual(session.game);
  session.rematch();
  expect(session.game).toEqual(createGame());
});
