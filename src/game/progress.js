/* Keeps my badge record and hall of fame up to date with what the rankings say (stars received, days won).
   Runs whenever the shared data changes; writes only when something new turned up. */
import { S, rank, canAct } from "./state.js";
import { observe, stamp } from "./badges.js";
import { today } from "./time.js";
import { writeMine, writeError } from "./store.js";

let busy = false;

export function checkProgress(){
  if (busy || !canAct() || !S.mine) return;
  const d = today(), probe = JSON.parse(JSON.stringify(S.mine.stats));
  const hall = JSON.parse(JSON.stringify(S.mine.hall || {}));
  const changed = observe(probe, S.myId, S.mine.entries, rank, d, hall), fresh = stamp(probe, d);
  if (!changed && !fresh.length) return;
  busy = true;
  writeMine(m => { m.hall ||= {}; observe(m.stats, S.myId, m.entries, rank, d, m.hall); stamp(m.stats, d); })
    .catch(writeError)
    .finally(() => { busy = false; });
}
