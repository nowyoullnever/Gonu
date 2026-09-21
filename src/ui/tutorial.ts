import { openDialog } from "./dialog";
import { tutorialDiagram } from "./tutorialDiagrams";
const steps = [
  [
    "THREE ACTIONS",
    "● ● ●",
    "Take exactly three actions: MOVE or ROAD in any order. The same stone can move repeatedly. Your third action automatically passes the turn. Black begins with six stones at C1–H1; White has six at C10–H10.",
  ],
  [
    "BUILD ROADS",
    "A ───── B",
    "Connect any two points, with or without stones. Roads are permanent, shared, and undirected. Maximum length: √65. A road cannot pass through another board point: (4,1) is legal; (2,0) is not. Crossing roads do not connect.",
  ],
  [
    "MOVE",
    "● ───── · → ●",
    "Select your stone, then an empty endpoint connected by one road. A length-1 road and a length-√65 road each cost one action. You may immediately use a road just built this turn.",
  ],
  [
    "CAPTURE",
    "● ○ ● → ● · ●",
    "Sandwich an enemy on three consecutive horizontal or vertical points. Roads are irrelevant; diagonal and gapped patterns do not capture. Remove at most one stone per action. Choose if there are several targets. Moving into an enemy sandwich is legal: your moved stone must be removed, taking priority over other captures.",
  ],
  [
    "REPRODUCE",
    "FAR EDGE: ●A   ↓   HOME: ◉B",
    "Newly enter the opponent’s home row by MOVE: Black enters row 10, White row 1. Choose any empty point on your own home row to create a child for free. If your home row is full, no child is created and your lineage stays unchanged. Moving along the far row does not trigger birth.",
  ],
  [
    "REPRODUCTION LINEAGE",
    "A arrives → ◉B\nB arrives → ◉C",
    "Initially any stone can reproduce. After A creates B, only B can create the next stone. The small center mark identifies this carrier; it is still an ordinary stone. If B is captured, the lineage resets: any surviving stone may begin a new chain. A stone already at the far edge must leave that row and later re-enter; there is no retroactive birth.",
  ],
  [
    "WIN",
    "● ● ●     WHITE 0",
    "Capture every opposing stone to win immediately. Reproduction resolves before capture. You may undo complete actions or cancel a pending choice during your active turn, including a winning action. Once the third action passes control, the previous turn is locked. Then rematch or return to the lobby.",
  ],
];
export function openTutorial() {
  let index = 0;
  const dialog = openDialog(
    "HOW TO PLAY",
    '<div class="lesson"></div><div class="lesson-nav"><button id="prev">PREVIOUS</button><span id="step"></span><button id="next">NEXT</button></div>',
  );
  function render() {
    const [title, diagram, copy] = steps[index];
    dialog.querySelector(".lesson")!.innerHTML =
      `<h3>${title}</h3>${tutorialDiagram(index)}<pre class="diagram">${diagram}</pre><p>${copy}</p>`;
    dialog.querySelector("#step")!.textContent =
      `${index + 1} / ${steps.length}`;
    dialog.querySelector<HTMLButtonElement>("#prev")!.disabled = index === 0;
    dialog.querySelector("#next")!.textContent =
      index === steps.length - 1 ? "DONE" : "NEXT";
  }
  dialog.querySelector<HTMLButtonElement>("#prev")!.onclick = () => {
    index--;
    render();
  };
  dialog.querySelector<HTMLButtonElement>("#next")!.onclick = () => {
    if (index === steps.length - 1) dialog.close();
    else {
      index++;
      render();
    }
  };
  render();
}
