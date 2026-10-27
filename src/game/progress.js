/* Keeps my badge record up to date with what the rankings say (stars received, days won).
   Runs whenever the shared data changes; writes only when something new turned up. */
import { S, rank, canAct } from "./state.js";
import { observe, stamp } from "./badges.js";
import { today } from "./time.js";
import { writeMine } from "./store.js";

let busy = false;

export function checkProgress(){
  if (busy || !canAct() || !S.mine) return;
  const d = today(), probe = JSON.parse(JSON.stringify(S.mine.stats));
  const changed = observe(probe, S.myId, S.mine.entries, rank, d), fresh = stamp(probe, d);
  if (!changed && !fresh.length) return;
  busy = true;
  writeMine(m => { observe(m.stats, S.myId, m.entries, rank, d); stamp(m.stats, d); })
    .catch(() => {})
    .finally(() => { busy = false; });
}
