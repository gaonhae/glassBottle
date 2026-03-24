import { randomInt } from "node:crypto";

export const MIN_DELAY_HOURS = 1;
export const MAX_DELAY_HOURS = 72;
export const MIN_DELAY_SECONDS = MIN_DELAY_HOURS * 60 * 60;
export const MAX_DELAY_SECONDS = MAX_DELAY_HOURS * 60 * 60;

export function generateRandomDelaySeconds(randomizer?: () => number): number {
  if (randomizer) {
    const sampled = randomizer();
    if (sampled < 0 || sampled > 1) {
      throw new Error("Randomizer must return a value between 0 and 1.");
    }

    if (sampled === 1) {
      return MAX_DELAY_SECONDS;
    }

    return Math.floor(sampled * (MAX_DELAY_SECONDS - MIN_DELAY_SECONDS + 1)) + MIN_DELAY_SECONDS;
  }

  return randomInt(MIN_DELAY_SECONDS, MAX_DELAY_SECONDS + 1);
}

export function computeSchedule(now: Date, randomizer?: () => number) {
  const delaySeconds = generateRandomDelaySeconds(randomizer);
  const scheduledAt = new Date(now.getTime() + delaySeconds * 1000);

  return {
    delaySeconds,
    scheduledAt
  };
}
