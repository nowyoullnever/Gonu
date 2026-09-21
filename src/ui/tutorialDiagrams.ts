/** Small point boards illustrate geometry; crossings never add nodes. */
export function tutorialDiagram(step: number) {
  const point = (x: number, y: number) =>
    `<circle cx="${x}" cy="${y}" r="2" fill="currentColor"/>`;
  const stone = (x: number, y: number, white = false, carrier = false) =>
    `<circle cx="${x}" cy="${y}" r="12" fill="${white ? "#fafafa" : "#111"}" stroke="#888"/>${carrier ? `<circle cx="${x}" cy="${y}" r="3" fill="#999"/>` : ""}`;
  const line = (x1: number, y1: number, x2: number, y2: number) =>
    `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="currentColor" opacity=".5"/>`;
  let art = "";
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 5; c++) art += point(30 + c * 55, 25 + r * 45);
  if (step === 0) art += stone(85, 70) + stone(140, 70) + stone(195, 70);
  if (step === 1) art += line(30, 25, 250, 70) + line(30, 115, 250, 25);
  if (step === 2)
    art +=
      line(30, 115, 250, 70) +
      stone(30, 115) +
      '<circle cx="250" cy="70" r="12" fill="none" stroke="currentColor" stroke-dasharray="3 3"/>';
  if (step === 3) art += stone(85, 70) + stone(140, 70, true) + stone(195, 70);
  if (step === 4 || step === 5)
    art +=
      stone(195, 115) +
      stone(85, 25, false, true) +
      `<text x="215" y="120" fill="currentColor" font-size="13">A</text><text x="105" y="30" fill="currentColor" font-size="13">B</text>`;
  if (step === 6) art += stone(85, 70) + stone(195, 70);
  return `<svg class="tutorial-board" viewBox="0 0 280 140" role="img" aria-label="${["Three actions", "Two crossing roads without a junction", "One long road, one move", "Consecutive horizontal sandwich", "Arrival at far edge creates a home-row child", "Child B carries the next reproduction", "Enemy removed, friendly stones remain"][step]}">${art}</svg>`;
}
