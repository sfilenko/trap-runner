// Left edge of the view in px. The view follows the player and stays inside the level.
export function cameraX(playerCenterX: number, viewW: number, levelW: number): number {
  if (levelW <= viewW) return 0;
  return Math.round(Math.min(Math.max(playerCenterX - viewW / 2, 0), levelW - viewW));
}
