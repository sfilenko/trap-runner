import { z } from "zod";
import type { LevelDef } from "../src/core/types";

const Int = z.number().int();
const Rect = z.tuple([Int.min(0), Int.min(0), Int.positive(), Int.positive()]);

const Trigger = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("zone"), rect: Rect }),
  z.object({ kind: z.literal("event"), event: z.enum(["coinCollected"]), id: z.string().min(1) }),
]);

const Action = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("removeTiles"), rect: Rect }),
  z.object({ kind: z.literal("addSpikes"), rect: Rect }),
  z.object({ kind: z.literal("moveGoal"), to: z.tuple([Int.min(0), Int.min(0)]) }),
]);

export const LevelSchema = z
  .object({
    id: z.string().regex(/^level-\d\d$/),
    tiles: z.array(z.string().regex(/^[.#^oSG]+$/)).length(15),
    traps: z.array(z.object({ id: z.string().min(1), trigger: Trigger, action: Action, delayTicks: Int.min(0) })),
  })
  .strict();

export const SolutionSchema = z
  .object({
    inputs: z
      .array(
        z
          .object({ ticks: Int.positive(), left: z.boolean().optional(), right: z.boolean().optional(), jump: z.boolean().optional() })
          .strict(),
      )
      .min(1),
  })
  .strict();

// Compile-time check: a parsed level is a LevelDef.
export const asLevelDef = (l: z.infer<typeof LevelSchema>): LevelDef => l;
