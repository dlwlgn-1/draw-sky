/* Who else is on each sky right now. My page shares { cid, drawing }; everyone's is counted per sky.
   Nothing here is stored: it disappears when a page closes. */
import { S, draft } from "./state.js";
import { BYID } from "../data/constellations.js";

/* peers: the room's participants → { cid: { here, drawing } }, leaving out my own pages and counting a person once per sky */
export function peersBySky(peers){
  const out = {}, seen = new Set();
  for (const p of peers){
    if (p.kind !== "viewer" || p.isMe) continue;
    const pr = p.presence || {}, cid = typeof pr.cid === "string" && Object.hasOwn(BYID, pr.cid) ? pr.cid : null;
    if (!cid) continue;
    const key = (p.by || p.peer) + "|" + cid; if (seen.has(key)) continue; seen.add(key);
    const c = out[cid] ||= { here: 0, drawing: 0 };
    c.here++; if (pr.drawing === true) c.drawing++;
  }
  return out;
}

let last = "";
/* tell the room where I am and whether I am drawing; sent only when it changes */
export function sharePresence(){
  if (!S.backend || !S.backend.setPresence) return;
  const me = { cid: S.cid, drawing: !S.viewing && draft().lines.length > 0 }, json = JSON.stringify(me);
  if (json === last) return;
  last = json; S.backend.setPresence(me);
}

/* short text for a sky's live count, or "" when nobody else is there */
export function liveText(cid){
  const p = S.peers[cid]; if (!p || !p.here) return "";
  return p.drawing ? `${p.drawing}명 그리는 중` : `${p.here}명 보는 중`;
}
