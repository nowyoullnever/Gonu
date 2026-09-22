import { openDialog } from "./dialog";
import { tutorialDiagram } from "./tutorialDiagrams";
import { t, tutorialSteps } from "../i18n/i18n";
export function openTutorial() {
  let index = 0;
  const dialog = openDialog(
    t("tutorial.title"),
    `<div class="lesson"></div><div class="lesson-nav"><button id="prev">← ${t("general.previous")}</button><span id="step"></span><button id="next">${t("general.next")} →</button></div>`,
  );
  function render() {
    const steps = tutorialSteps(),
      { title, diagram, copy } = steps[index];
    dialog.querySelector(".lesson")!.innerHTML =
      `<h3>${title}</h3>${tutorialDiagram(index, title)}<pre class="diagram">${diagram}</pre><p>${copy}</p>`;
    dialog.querySelector("#step")!.textContent =
      `${index + 1} / ${steps.length}`;
    dialog.querySelector<HTMLButtonElement>("#prev")!.disabled = index === 0;
    dialog.querySelector("#next")!.textContent =
      index === steps.length - 1 ? t("general.done") : t("general.next");
  }
  dialog.querySelector<HTMLButtonElement>("#prev")!.onclick = () => {
    index--;
    render();
  };
  dialog.querySelector<HTMLButtonElement>("#next")!.onclick = () => {
    if (index === tutorialSteps().length - 1) dialog.close();
    else {
      index++;
      render();
    }
  };
  const keydown = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      dialog.close();
    } else if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      index--;
      render();
    } else if (
      event.key === "ArrowRight" &&
      index < tutorialSteps().length - 1
    ) {
      event.preventDefault();
      index++;
      render();
    }
  };
  document.addEventListener("keydown", keydown);
  dialog.addEventListener("close", () =>
    document.removeEventListener("keydown", keydown),
  );
  render();
}
