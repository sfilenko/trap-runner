const canvas = document.querySelector<HTMLCanvasElement>("#game");
const ctx = canvas?.getContext("2d");
if (ctx) {
  ctx.fillStyle = "#f0f0f0";
  ctx.font = "16px monospace";
  ctx.fillText("Trap Runner", 100, 120);
}
