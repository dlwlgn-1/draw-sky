/* Today's topic: one sky and one theme for everyone, worked out from the date alone.
   Skies step through the list by a number that shares no factor with its length, so every one comes round
   (and neighbours in the sky are not picked on consecutive days); themes step by 7, so none repeats for 40 days.
   Until 2026-10-27 only the 8 named constellations were in the rotation (step 3); from 2026-10-28 the
   unnamed skies join it (step 5 through 18). Days before the change keep the topics they had.
   From 2026-10-28 special nights (data/events.js) take their date's place; the day either side steps one sky
   along if it would have landed on the same sky, so no sky comes twice in a row. */
import { ORDER, BYID } from "../data/constellations.js";
import { THEMES } from "../data/topics.js";
import { EVENTS } from "../data/events.js";
import { DAY } from "./time.js";

const T_STEP = 7, ALL_FROM = "2026-10-28";
const NAMED_ORDER = ORDER.filter(id => !BYID[id].region);

const dayIndex = day => Math.round(Date.UTC(+day.slice(0, 4), +day.slice(5, 7) - 1, +day.slice(8, 10)) / DAY);
const dayAt = i => new Date(i * DAY).toISOString().slice(0, 10);
const mod = (a, n) => ((a % n) + n) % n;
const eventOn = day => day >= ALL_FROM ? EVENTS[day.slice(5)] || null : null;

/* the plain rotation, before special nights: { cid, theme, example } */
export function baseTopic(day, shift = 0){
  const i = dayIndex(day), [theme, example] = THEMES[mod(i * T_STEP, THEMES.length)];
  const [pool, step] = day < ALL_FROM ? [NAMED_ORDER, 3] : [ORDER, 5];
  return { cid: pool[mod(i * step + shift, pool.length)], theme, example };
}

/* day: "YYYY-MM-DD" (a KST game day) → { cid, theme, example, event } where event is the special night or null */
export function topicOf(day){
  const ev = eventOn(day);
  if (ev) return { cid: ev.cid, theme: ev.theme, example: ev.example, event: ev };
  const i = dayIndex(day), base = baseTopic(day);
  const clash = [dayAt(i - 1), dayAt(i + 1)].some(d => { const e = eventOn(d); return e && e.cid === base.cid; });
  return { ...(clash ? baseTopic(day, 1) : base), event: null };
}

/* the next special night within `within` days after day: { day, inDays, ...event } or null */
export function nextEvent(day, within = 7){
  const i = dayIndex(day);
  for (let k = 1; k <= within; k++){ const d = dayAt(i + k), ev = eventOn(d); if (ev) return { ...ev, day: d, inDays: k }; }
  return null;
}
