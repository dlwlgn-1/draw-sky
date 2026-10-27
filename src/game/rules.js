/* Game rules over the shared store. Pure functions only (no DOM), so they can be tested in Node.

   Each player owns one document, players/<id>:
     entries: { "<day>_<constellation>": { c, d, name, story, lines: [[a, b], …], t } }
     votes:   { "<day>": { "<constellation>": "<author id>" } }
     stats:   the lasting record behind badges (see badges.js); never pruned
     hall:    { "<day>_<constellation>": { c, d, name, story, lines, votes, t } } — my days in first place
              (see hall.js); never pruned
   Everything read from the store is someone else's input, so it is cleaned before use. */
import { BYID } from "../data/constellations.js";
import { DAY, dayOf } from "./time.js";
import { cleanStats } from "./badges.js";

export const MAX_LINES = 80;
export const NAME_MAX = 20;
export const STORY_MAX = 140;
export const KEEP_DAYS = 7;

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
const CIDS = new Set(Object.keys(BYID));

export const str = (v, n) => typeof v === "string" ? v.trim().slice(0, n) : "";

/* star index pairs, each joining two different stars of a constellation with n stars; no repeats */
export function cleanLines(v, n){
  if (!Array.isArray(v)) return [];
  const seen = new Set(), out = [];
  for (const p of v.slice(0, MAX_LINES)){
    if (!Array.isArray(p) || p.length !== 2) continue;
    let [a, b] = p; if (!Number.isInteger(a) || !Number.isInteger(b) || a === b || a < 0 || b < 0 || a >= n || b >= n) continue;
    if (a > b) [a, b] = [b, a]; const k = a + "-" + b; if (seen.has(k)) continue; seen.add(k); out.push([a, b]);
  }
  return out;
}

/* one entry stored under key "<day>_<constellation>", or null if it does not hold together */
function cleanEntry(k, e){
  if (!e || typeof e !== "object") return null;
  const c = typeof e.c === "string" && Object.hasOwn(BYID, e.c) ? BYID[e.c] : null;
  if (!c || typeof e.d !== "string" || !DAY_RE.test(e.d) || k !== e.d + "_" + e.c) return null;
  const lines = cleanLines(e.lines, c.stars.length); if (!lines.length) return null;
  return { c: e.c, d: e.d, name: str(e.name, NAME_MAX) || "이름 없는 별자리", story: str(e.story, STORY_MAX), lines, t: Number.isFinite(e.t) ? e.t : 0 };
}

export function cleanPlayer(d){
  const out = { entries: {}, votes: {}, stats: cleanStats(d && d.stats, CIDS), hall: {} };
  const E = d && typeof d.entries === "object" && d.entries || {};
  for (const k of Object.keys(E)){ const e = cleanEntry(k, E[k]); if (e) out.entries[k] = e; }
  const H = d && typeof d.hall === "object" && d.hall || {};
  for (const k of Object.keys(H).slice(0, 2000)){
    const e = cleanEntry(k, H[k]); if (e) out.hall[k] = { ...e, votes: Number.isInteger(H[k].votes) && H[k].votes > 0 ? H[k].votes : 1 };
  }
  const V = d && typeof d.votes === "object" && d.votes || {};
  for (const day of Object.keys(V)){
    if (!DAY_RE.test(day) || !V[day] || typeof V[day] !== "object") continue;
    const m = {}; for (const cid of Object.keys(V[day])) if (Object.hasOwn(BYID, cid) && typeof V[day][cid] === "string") m[cid] = V[day][cid].slice(0, 200);
    out.votes[day] = m;
  }
  return out;
}

/* One day's ranking for one constellation. A vote counts only for an entry of that same day,
   never for the voter's own entry. Ties share a rank; earlier entries are listed first. */
export function ranking(players, day, cid){
  const list = [];
  for (const [id, p] of players){ const e = p.entries[day + "_" + cid]; if (e) list.push({ author: id, ...e, votes: 0 }); }
  const by = new Map(list.map(e => [e.author, e]));
  for (const [id, p] of players){ const v = p.votes[day] && p.votes[day][cid]; if (v && v !== id && by.has(v)) by.get(v).votes++; }
  list.sort((a, b) => b.votes - a.votes || a.t - b.t);
  let rank = 0, prev = null; list.forEach((e, i) => { if (e.votes !== prev){ rank = i + 1; prev = e.votes; } e.rank = rank; });
  return list;
}

/* drop entries and votes older than KEEP_DAYS, and empty vote days (mutates doc); stats are kept */
export function prune(doc, now = Date.now()){
  const cut = dayOf(now - KEEP_DAYS * DAY);
  for (const k of Object.keys(doc.entries)) if (doc.entries[k].d < cut) delete doc.entries[k];
  for (const d of Object.keys(doc.votes)) if (d < cut || !Object.keys(doc.votes[d]).length) delete doc.votes[d];
}

/* give my one vote for (day, cid) to author; giving it again to the same author takes it back */
export function toggleVote(doc, day, cid, author){
  const v = doc.votes[day] ||= {};
  if (v[cid] === author) delete v[cid]; else v[cid] = author;
}
