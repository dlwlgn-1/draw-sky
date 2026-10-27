/* Talking to the artifact's shared database and identity services (window.claude). */
import { S } from "./state.js";
import { cleanPlayer, prune } from "./rules.js";
import { renderUI } from "../ui/panels.js";
import { toast } from "../ui/dom.js";

export async function connect(){
  if (!window.claude || typeof window.claude.use !== "function"){ S.dbChecked = true; renderUI(); return; }
  const [db, user] = await Promise.all([window.claude.use("db"), window.claude.use("user")]);
  S.user = user; S.dbChecked = true;
  if (!db){ renderUI(); return; }
  S.db = db;
  if (user){ S.myId = await user.id(); S.canWrite = await user.can("data.write"); }
  renderUI();
  db.collection("players").limit(1000).onSnapshot(snap => {
    const m = new Map();
    for (const d of snap.docs) if (d.exists) m.set(d.id, cleanPlayer(d.data()));
    S.players = m; S.mine = S.myId ? m.get(S.myId) || S.mine || null : null;
    if (S.mine && S.myId) S.players.set(S.myId, S.mine);
    S.loaded = true; renderUI();
  }, () => { S.loaded = true; toast("작품 목록을 받아오지 못하고 있어요. 페이지를 새로 열어 주세요.", true); renderUI(); });
}

/* change my own document; writes run one at a time */
export function writeMine(mutate){
  const run = async () => {
    const base = JSON.parse(JSON.stringify(S.mine || { entries: {}, votes: {} }));
    mutate(base); prune(base);
    await S.db.doc("players/" + S.myId).set(base);
    S.mine = cleanPlayer(base); S.players.set(S.myId, S.mine); renderUI();
  };
  const p = S.chain.then(run); S.chain = p.catch(() => {}); return p;
}

/* a message for the viewer explaining a failed write */
export function writeError(err){
  const code = err && err.code;
  if (code === "invalid_argument"){ S.canWrite = false; renderUI(); return "이 링크에서는 저장할 권한이 없어요."; }
  if (code === "quota_exceeded") return "저장 공간이 가득 찼어요.";
  if (code === "resource_exhausted") return "너무 빨라요. 몇 초 뒤에 다시 눌러 주세요.";
  return "저장하지 못했어요. 연결을 확인해 주세요.";
}

/* display names for author ids, as this viewer sees them */
export async function names(ids){
  const out = {}; let ps = {};
  if (S.user && ids.length){ try { ps = await S.user.profiles(ids); } catch {} }
  for (const id of ids) out[id] = id === S.myId ? "나" : (ps[id] && ps[id].name) || "익명의 관측자";
  return out;
}
