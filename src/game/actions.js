/* What a player can do: draw lines, move between constellations, look at entries, vote, post, remove. */
import { S, draft, rank, canAct, whyNot, viewedEntry } from "./state.js";
import { MAX_LINES, toggleVote } from "./rules.js";
import { recordPost, recordVote, stamp } from "./badges.js";
import { topicOf } from "./topic.js";
import { today, kstHour } from "./time.js";
import { ORDER, BYID } from "../data/constellations.js";
import { writeMine, writeError } from "./store.js";
import { flyTo, requestDraw } from "../sky/motion.js";
import { renderTop, renderBottom } from "../ui/panels.js";
import { toast } from "../ui/dom.js";
import { entryCard } from "../sky/card.js";
import { names } from "./store.js";

/* join stars a and b, or remove the line if they are already joined */
export function toggleLine(a, b){
  const d = draft(); if (a > b) [a, b] = [b, a];
  (S.history[S.cid] ||= []).push(d.lines.map(l => [...l]));
  if (S.history[S.cid].length > 100) S.history[S.cid].shift();
  const i = d.lines.findIndex(l => l[0] === a && l[1] === b);
  if (i >= 0) d.lines.splice(i, 1);
  else if (d.lines.length < MAX_LINES) d.lines.push([a, b]);
  else toast(`선은 ${MAX_LINES}개까지 그을 수 있어요.`, true);
  d.touched = true;
}

export function undoLine(){
  const h = S.history[S.cid]; if (!h || !h.length) return;
  draft().lines = h.pop(); S.selected = null; renderBottom(); requestDraw();
}

export function clearLines(){
  const d = draft(); if (!d.lines.length) return;
  (S.history[S.cid] ||= []).push(d.lines.map(l => [...l]));
  d.lines = []; d.touched = true; S.selected = null; renderBottom(); requestDraw();
  toast("모두 지웠어요. 되돌리기로 살릴 수 있어요.");
}

export function selectConst(cid, view = null){
  S.cid = cid; S.selected = null; S.down = null; S.viewing = view;
  S.noRefit = true; renderTop(); renderBottom(); S.noRefit = false;
  requestAnimationFrame(() => flyTo(cid));
}

/* dir +1 goes right on screen (west), -1 left */
export function stepConst(dir){ const i = ORDER.indexOf(S.cid); selectConst(ORDER[(i + dir + ORDER.length) % ORDER.length]); }

export function showEntry(day, author){ S.viewing = { day, author }; S.selected = null; renderBottom(); requestDraw(); }
export function closeEntry(){ S.viewing = null; renderBottom(); requestDraw(); }

export function stepEntry(dir){
  if (!S.viewing) return;
  const list = rank(S.viewing.day, S.cid), i = list.findIndex(e => e.author === S.viewing.author), n = list[i + dir];
  if (n) showEntry(S.viewing.day, n.author);
}

/* day: the day the button was drawn for, so a tap just after midnight does not land on the new day */
export async function vote(author, cid, day){
  if (!canAct()){ toast(whyNot(), true); return; }
  if (author === S.myId) return;
  if (day !== today()){ toast("날짜가 바뀌었어요. 오늘 작품에 다시 별을 주세요.", true); renderTop(); renderBottom(); return; }
  try {
    const msg = await writeMine(m => {
      const had = m.votes[day] && m.votes[day][cid];
      toggleVote(m, day, cid, author);
      const now = m.votes[day] && m.votes[day][cid];
      recordVote(m.stats, day, cid, !!now); stamp(m.stats, day);
      return !now ? "별을 회수했어요" : had ? "별을 이 작품으로 옮겼어요" : "별을 줬어요";
    });
    toast(msg);
  } catch (err){ toast(writeError(err), true); }
}

/* post today's entry for the current constellation (replacing an earlier one); throws on a failed write.
   nick: my nickname, where the backend asks for one */
export async function postEntry(name, story, nick){
  const day = today(), cid = S.cid, lines = draft().lines.map(l => [...l]);
  const again = !!(S.mine && S.mine.entries[day + "_" + cid]);
  await writeMine(m => {
    const k = day + "_" + cid, prev = m.entries[k];
    m.entries[k] = { c: cid, d: day, name, story, lines, t: prev && prev.t || Date.now() };
    if (nick) m.nick = nick;
    recordPost(m.stats, { day, cid, story, lines, orig: BYID[cid].orig, topicCid: topicOf(day).cid, hour: kstHour() });
    stamp(m.stats, day);
  });
  showEntry(day, S.myId);
  return again;
}

/* save the entry being viewed as a picture; one save at a time */
export async function saveEntryImage(){
  const v = viewedEntry();
  if (!v || !S.backend || !S.backend.saveFile || S.saving) return;
  S.saving = true; renderBottom();
  try {
    const tp = topicOf(v.d), nm = await names([v.author]);
    const author = v.author === S.myId ? "내 작품" : nm[v.author];
    const blob = await entryCard(v, BYID[v.c], author, tp.cid === v.c ? tp.theme : "");
    const safe = v.name.replace(/[\\/:*?"<>|]/g, "").trim() || "별자리";
    await S.backend.saveFile(`${safe}.png`, blob);
    toast("이미지로 저장했어요");
  } catch (err){
    if (!err || err.code !== "declined") toast("이미지를 저장하지 못했어요.", true);
  } finally { S.saving = false; renderBottom(); }
}

export async function removeEntry(){
  const k = S.viewing.day + "_" + S.cid;
  try { await writeMine(m => { delete m.entries[k]; }); closeEntry(); toast("작품을 내렸어요. 그린 선은 그대로 남아 있어요."); }
  catch (err){ toast(writeError(err), true); }
}
