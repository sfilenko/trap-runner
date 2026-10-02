export const TILE = 16;
export const LEVEL_HEIGHT = 15;

export type Rect = [x: number, y: number, w: number, h: number];

export interface InputFrame {
  left: boolean;
  right: boolean;
  jump: boolean;
}

export interface RleInput {
  ticks: number;
  left?: boolean;
  right?: boolean;
  jump?: boolean;
}

export type TrapTrigger =
  | { kind: "zone"; rect: Rect }
  | { kind: "event"; event: "coinCollected" | "enemyStomped"; id: string };

export type TrapAction =
  | { kind: "removeTiles"; rect: Rect }
  | { kind: "addSpikes"; rect: Rect }
  | { kind: "moveGoal"; to: [x: number, y: number] };

export interface TrapDef {
  id: string;
  trigger: TrapTrigger;
  action: TrapAction;
  delayTicks: number;
}

export interface EnemyDef {
  id: string;
  x: number;
  y: number;
  patrol: [from: number, to: number];
  speed: number;
}

export interface LevelDef {
  id: string;
  tiles: string[];
  enemies?: EnemyDef[];
  traps: TrapDef[];
}

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Player extends Box {
  vx: number;
  vy: number;
  onGround: boolean;
  jumpHeld: boolean;
}

export interface Enemy extends Box {
  id: string;
  vx: number;
  minX: number;
  maxX: number;
  alive: boolean;
}

export interface Coin {
  id: string;
  x: number;
  y: number;
}

export interface Pending {
  trapIndex: number;
  dueTick: number;
}

export type DeathCause = "spikes" | "pit" | "enemy";

export type GameEvent =
  | { tick: number; type: "trapTriggered"; id: string }
  | { tick: number; type: "coinCollected"; id: string }
  | { tick: number; type: "enemyStomped"; id: string }
  | { tick: number; type: "died"; cause: DeathCause }
  | { tick: number; type: "levelComplete" };

export interface World {
  level: LevelDef;
  tick: number;
  grid: string[][];
  player: Player;
  enemies: Enemy[];
  coins: Coin[];
  collected: string[];
  goal: { x: number; y: number };
  triggered: string[];
  pending: Pending[];
  events: GameEvent[];
  status: "playing" | "dead" | "complete";
}
