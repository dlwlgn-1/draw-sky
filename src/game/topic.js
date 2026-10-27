/* Today's topic: one sky and one theme for everyone, worked out from the date alone.
   Skies step through the list by a number that shares no factor with its length, so every one comes round
   (and neighbours in the sky are not picked on consecutive days); themes step by 7, so none repeats for 40 days.
   Until 2026-10-27 only the 8 named constellations were in the rotation (step 3); from 2026-10-28 the
   unnamed skies join it (step 5 through 18). Days before the change keep the topics they had. */
import { ORDER, BYID } from "../data/constellations.js";
import { THEMES } from "../data/topics.js";
import { DAY } from "./time.js";

const T_STEP = 7, ALL_FROM = "2026-10-28";
const NAMED_ORDER = ORDER.filter(id => !BYID[id].region);

const dayIndex = day => Math.round(Date.UTC(+day.slice(0, 4), +day.slice(5, 7) - 1, +day.slice(8, 10)) / DAY);
const mod = (a, n) => ((a % n) + n) % n;

/* day: "YYYY-MM-DD" (a KST game day) → { cid, theme, example } */
export function topicOf(day){
  const i = dayIndex(day), [theme, example] = THEMES[mod(i * T_STEP, THEMES.length)];
  const [pool, step] = day < ALL_FROM ? [NAMED_ORDER, 3] : [ORDER, 5];
  return { cid: pool[mod(i * step, pool.length)], theme, example };
}
