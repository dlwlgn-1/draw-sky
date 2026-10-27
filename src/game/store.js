/* The game's link to its backend: loading everyone's documents, writing my own, and names. */
import { S } from "./state.js";
import { cleanPlayer, prune } from "./rules.js";
import { emptyStats } from "./badges.js";
import { checkProgress } from "./progress.js";
import { openClaudeBackend } from "../backend/claude.js";
import { renderUI } from "../ui/panels.js";
import { toast } from "../ui/dom.js";

export async function connect(){
  const be = await openClaudeBackend().catch(() => null);
  S.backend = be; S.dbChecked = true;
  if (!be || !be.hasStore){ renderUI(); return; }
  S.db = be; S.myId = be.myId; S.canWrite = be.canWrite;
  renderUI();
  /* Writing replaces my whole document, so nothing is written until my own document has been read:
     it is watched on its own (the list of everyone may not include it), and a failed read never counts as loaded. */
  let gotAll = false, gotMine = !S.myId;
  const changed = () => { S.loaded = gotAll && gotMine; renderUI(); checkProgress(); };
  const failed = () => { toast("작품 목록을 받아오지 못하고 있어요. 페이지를 새로 열어 주세요.", true); renderUI(); };
  const putMine = m => { if (!S.myId || !gotMine) return; if (S.mine) m.set(S.myId, S.mine); else m.delete(S.myId); };
  if (S.myId) be.watchPlayer(S.myId, d => { S.mine = d ? cleanPlayer(d) : null; gotMine = true; putMine(S.players); changed(); }, failed);
  be.watchPlayers(docs => {
    const m = new Map(docs.map(([id, d]) => [id, cleanPlayer(d)]));
    putMine(m); S.players = m; gotAll = true; changed();
  }, failed);
}

/* change my own document; writes run one at a time and resolve with what mutate returned */
export function writeMine(mutate){
  const run = async () => {
    if (!S.loaded) throw { code: "not_ready" };
    const base = JSON.parse(JSON.stringify(S.mine || { entries: {}, votes: {}, stats: emptyStats() }));
    const result = mutate(base); prune(base);
    await S.db.savePlayer(S.myId, base);
    S.mine = cleanPlayer(base); S.players.set(S.myId, S.mine); renderUI();
    return result;
  };
  const p = S.chain.then(run); S.chain = p.catch(() => {}); return p;
}

/* a message for the viewer explaining a failed write */
export function writeError(err){
  const code = err && err.code;
  if (code === "invalid_argument"){ S.canWrite = false; renderUI(); return "이 링크에서는 저장할 권한이 없어요."; }
  if (code === "quota_exceeded") return "저장 공간이 가득 찼어요.";
  if (code === "resource_exhausted") return "너무 빨라요. 몇 초 뒤에 다시 눌러 주세요.";
  if (code === "not_ready") return "아직 내 기록을 불러오는 중이에요. 잠시 후 다시 해 주세요.";
  return "저장하지 못했어요. 연결을 확인해 주세요.";
}

/* display names for author ids, as this viewer sees them */
export async function names(ids){
  const ps = S.backend && ids.length ? await S.backend.names(ids) : {};
  const out = {};
  for (const id of ids) out[id] = id === S.myId ? "나" : ps[id] || "익명의 관측자";
  return out;
}
