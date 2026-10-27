/* 명예의 전당: every finished day's first place in each sky. Pure functions (no DOM).

   Entries are pruned after a week, so a winner's own document keeps a copy of the winning entry
   (doc.hall, written by the winner's page when it notices the win; see badges.observe). For days still
   in the store the winners are also worked out from the rankings, which covers winners who have not
   been back since. Each player writes only their own document, so like badges this is a friendly
   record rather than a tamper-proof one. */
import { ORDER } from "../data/constellations.js";

const pos = Object.fromEntries(ORDER.map((id, i) => [id, i]));

/* players: Map(id → cleaned doc); rankOf(day, cid) → ranking; today: "YYYY-MM-DD" → newest first */
export function hallOf(players, rankOf, today){
  const out = new Map();
  for (const [id, p] of players) for (const h of Object.values(p.hall || {})) if (h.d < today) out.set(`${h.d}_${h.c}_${id}`, { ...h, author: id });
  const days = new Set();
  for (const p of players.values()) for (const e of Object.values(p.entries)) if (e.d < today) days.add(e.d + "_" + e.c);
  for (const key of days){
    const d = key.slice(0, 10), c = key.slice(11);
    for (const w of rankOf(d, c)) if (w.rank === 1 && w.votes > 0)
      out.set(`${key}_${w.author}`, { c, d, name: w.name, story: w.story, lines: w.lines, votes: w.votes, t: w.t, author: w.author });
  }
  return [...out.values()].sort((a, b) => b.d.localeCompare(a.d) || pos[a.c] - pos[b.c] || a.t - b.t);
}
