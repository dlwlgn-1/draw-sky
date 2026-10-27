/* Today's topic: one constellation and one theme for everyone, worked out from the date alone.
   Constellations step by 3 through the 8 (every one comes round in 8 days, and neighbours in the sky
   are not picked on consecutive days); themes step by 7 through the list, so none repeats for 40 days. */
import { ORDER } from "../data/constellations.js";
import { THEMES } from "../data/topics.js";
import { DAY } from "./time.js";

const C_STEP = 3, T_STEP = 7;

const dayIndex = day => Math.round(Date.UTC(+day.slice(0, 4), +day.slice(5, 7) - 1, +day.slice(8, 10)) / DAY);
const mod = (a, n) => ((a % n) + n) % n;

/* day: "YYYY-MM-DD" (a KST game day) → { cid, theme, example } */
export function topicOf(day){
  const i = dayIndex(day), [theme, example] = THEMES[mod(i * T_STEP, THEMES.length)];
  return { cid: ORDER[mod(i * C_STEP, ORDER.length)], theme, example };
}
