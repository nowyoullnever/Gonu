import { t } from "../i18n/i18n";

export function openDialog(title: string, body: string) {
  const dialog = document.createElement("dialog");
  dialog.setAttribute("aria-labelledby", "dialog-title");
  dialog.innerHTML = `<button class="close" aria-label="${t("general.close")}">×</button><h2 id="dialog-title">${title}</h2>${body}`;
  document.body.append(dialog);
  dialog.querySelector<HTMLButtonElement>(".close")!.onclick = () =>
    dialog.close();
  dialog.addEventListener("close", () => dialog.remove());
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) {
      const r = dialog.getBoundingClientRect();
      if (
        e.clientX < r.left ||
        e.clientX > r.right ||
        e.clientY < r.top ||
        e.clientY > r.bottom
      )
        dialog.close();
    }
  });
  dialog.showModal();
  return dialog;
}
