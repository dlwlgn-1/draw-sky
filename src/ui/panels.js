/* Everything drawn in HTML around the sky: title, bottom controls, entry card, and the sheets. */
import { S, cur, draft, rank, viewedEntry, myVote, canAct, whyNot } from "../game/state.js";
import { today, yesterday, shortDay } from "../game/time.js";
import { topicOf } from "../game/topic.js";
import { BYID, ORDER, DATA } from "../data/constellations.js";
import { names } from "../game/store.js";
import { vote, selectConst, showEntry } from "../game/actions.js";
import { flyTo, requestDraw } from "../sky/motion.js";
import { drawThumb } from "../sky/thumb.js";
import { $, el, fmtRA, fmtDec, STAR_SVG, STAR_O_SVG } from "./dom.js";
import { renderBadgeSheet, announceBadges, earnedCount } from "./badges.js";
import { BADGES } from "../game/badges.js";
import { hallOf } from "../game/hall.js";
import { sharePresence, liveText } from "../game/presence.js";

export function renderTop(){
  const c = cur(), n = rank(today(), S.cid).length;
  $("#cKo").textContent = `${c.title}`;
  $("#cMeta").textContent = `${c.la} · ${!S.loaded && S.db ? "…" : n ? `오늘 ${n}작품` : "오늘 아직 없음"}`;
  $("#cname").setAttribute("aria-label", `${c.title}, 별자리 목록 열기`);
  const live = liveText(S.cid), lv = $("#cLive"); lv.hidden = !live; lv.textContent = live;
  $("#badgeCount").textContent = `${earnedCount()}/${BADGES.length}`;
  const tp = topicOf(today()), here = tp.cid === S.cid, btn = $("#topicBtn");
  $("#topicText").textContent = here ? tp.theme : `${BYID[tp.cid].title} · ${tp.theme}`;
  btn.classList.toggle("away", !here);
  btn.setAttribute("aria-label", here ? `오늘의 주제 ${tp.theme}, 예시 보기` : `오늘의 주제 ${tp.theme}, ${BYID[tp.cid].title}로 이동`);
}
let vSeq = 0;
export async function renderBottom(){
  const c = cur(), v = viewedEntry();
  if (S.viewing && !v) S.viewing = null;
  sharePresence();
  const wasView = !$("#vcard").hidden;
  $("#drawUI").hidden = !!S.viewing; $("#vcard").hidden = !S.viewing;
  if (wasView !== !!S.viewing && !S.noRefit) requestAnimationFrame(() => flyTo(S.cid, true));
  if (!S.viewing){
    const d = draft(), hint = $("#hint"); hint.textContent = "";
    if (S.selected != null){
      const s = c.stars[S.selected];
      hint.append(el("b", null, c.region ? c.starName(S.selected) : `${s[0]} ${c.ab}${s[1] ? " " + s[1] : ""}`), document.createTextNode(` · ${s[4].toFixed(1)}등급 · 적경 ${fmtRA(s[2])} 적위 ${fmtDec(s[3])}`));
    } else if (S.ghost){
      hint.append(el("b", null, "원래 그림 · "), document.createTextNode(c.myth));
    } else if (!d.lines.length){
      const tp = topicOf(today());
      hint.textContent = tp.cid === S.cid ? `주제 ‘${tp.theme}’ — 떠오르는 모양대로 별을 이어 보세요` : "밝게 빛나는 별 두 개를 차례로 눌러 선을 이어 보세요";
    }
    else hint.textContent = "하늘을 좌우로 밀면 다른 별자리로 넘어가요";
    $("#lineCount").textContent = d.lines.length ? `선 ${d.lines.length}개` : "";
    $("#undoBtn").disabled = !(S.history[S.cid] && S.history[S.cid].length);
    $("#clearBtn").disabled = !d.lines.length;
    $("#ghostBtn").setAttribute("aria-pressed", String(S.ghost));
    const list = rank(today(), S.cid), mine = list.find(e => e.author === S.myId), sum = $("#rankSum"); sum.textContent = "";
    if (S.db && !S.loaded) sum.textContent = "불러오는 중…";
    else if (mine) sum.textContent = `내 작품 ${mine.rank}위 · ${list.length}작품`;
    else if (list.length) sum.append(el("em", null, list[0].name), document.createTextNode(` 1위 · ${list.length}작품`));
    else sum.textContent = "아직 아무도 안 그렸어요";
    $("#openForm").textContent = mine ? "고쳐서 다시 올리기" : "이름 짓고 올리기";
    return;
  }
  const seq = ++vSeq, isToday = S.viewing.day === today(), list = rank(S.viewing.day, S.cid), i = list.findIndex(e => e.author === v.author);
  const nm = await names([v.author]); if (seq !== vSeq || !S.viewing) return;
  const rk = $("#vRank"); rk.textContent = `${v.rank}위`; rk.classList.toggle("plain", !(v.rank === 1 && v.votes > 0));
  $("#vDay").textContent = `${isToday ? "오늘" : shortDay(S.viewing.day)} ${list.length ? `${list.length}작품 중` : "명예의 전당"}`;
  $("#vName").textContent = v.name;
  const by = $("#vBy"); by.textContent = ""; by.append(el("b", null, nm[v.author]), document.createTextNode(` · 별 ${v.votes}개 · 선 ${v.lines.length}개`));
  const st = $("#vStory"); st.textContent = v.story || "이야기 없이 선만 남긴 작품이에요."; st.classList.toggle("none", !v.story);
  fillStar($("#vVote"), v, S.cid, isToday);
  $("#vPrev").disabled = i <= 0; $("#vNext").disabled = i < 0 || i >= list.length - 1;
  $("#vPrev").hidden = $("#vNext").hidden = list.length < 2;
  $("#vRemove").hidden = !(v.author === S.myId && isToday);
  $("#vSave").hidden = !(S.backend && S.backend.saveFile); $("#vSave").disabled = !!S.saving;
}
function fillStar(b, e, cid, isToday){
  const mine = e.author === S.myId, voted = isToday && myVote(today(), cid) === e.author;
  b.innerHTML = voted || mine ? STAR_SVG : STAR_O_SVG;
  b.append(document.createTextNode(!isToday ? `별 ${e.votes}개` : mine ? `내 작품 · ${e.votes}` : voted ? `별 줬어요 · ${e.votes}` : `별 주기 · ${e.votes}`));
  b.setAttribute("aria-pressed", String(voted));
  b.disabled = mine || !isToday || !canAct();
  b.setAttribute("aria-label", `${mine ? "내 작품" : voted ? "별 회수하기" : "별 주기"}, 별 ${e.votes}개`);
}
/* day: the day this list shows; the vote is refused if the day has turned since */
function voteChip(e, cid, day){
  const isToday = day === today(), b = el("button", "vote num"); b.type = "button";
  const mine = e.author === S.myId, voted = isToday && myVote(today(), cid) === e.author;
  b.innerHTML = voted ? STAR_SVG : STAR_O_SVG; b.append(document.createTextNode(String(e.votes)));
  b.setAttribute("aria-pressed", String(voted)); b.disabled = mine || !isToday || !canAct();
  b.setAttribute("aria-label", `${mine ? "내 작품" : voted ? "별 회수하기" : "별 주기"}, 별 ${e.votes}개`);
  b.addEventListener("click", ev => { ev.stopPropagation(); vote(e.author, cid, day); });
  return b;
}
function entryRow(e, nm, day){
  const li = el("li", "row" + (e.rank === 1 && e.votes > 0 ? " first" : ""));
  li.tabIndex = 0; li.setAttribute("role", "button"); li.setAttribute("aria-label", `${e.rank}위 ${e.name}, 하늘에서 보기`);
  const cv = el("canvas"), meta = el("div", "meta"), by = el("span", "by");
  if (e.author === S.myId) by.append(el("span", "me-tag", "내 작품")); else by.textContent = nm[e.author];
  meta.append(el("span", "nm", e.name), by);
  li.append(el("span", "rk num", String(e.rank)), cv, meta, voteChip(e, e.c, day));
  const open = () => { closeSheet(); showEntry(day, e.author); };
  li.addEventListener("click", open);
  li.addEventListener("keydown", ev => { if (ev.key === "Enter" || ev.key === " "){ ev.preventDefault(); open(); } });
  requestAnimationFrame(() => drawThumb(cv, BYID[e.c], { lines: e.lines }));
  return li;
}
let sSeq = 0;
export async function renderSheet(){
  const sh = $("#sheet"), scrim = $("#scrim");
  sh.hidden = scrim.hidden = !S.sheet;
  if (!S.sheet) return;
  for (const k of ["form", "rank", "pick", "badges", "hall"]) $(`#${k}Body`).hidden = S.sheet !== k;
  if (S.sheet === "badges"){ renderBadgeSheet(); return; }
  const c = cur(), d = today(), seq = ++sSeq, tp = topicOf(d), here = tp.cid === S.cid;
  if (S.sheet === "form"){
    $("#sheetTitle").textContent = `${c.title}에 새 이름 붙이기`;
    const dr = draft(), mine = S.mine && S.mine.entries[d + "_" + S.cid];
    const n = $("#formNotice"), why = canAct() ? "" : whyNot(); n.hidden = !why; n.textContent = why;
    topicCard($("#formTopic"), here && tp, `예: ${tp.example}`);
    $("#nameInput").placeholder = here ? `예: ${tp.example.split(",")[0]}` : "이름을 지어 주세요";
    const askNick = !!(S.backend && S.backend.needsNick), nk = $("#nickInput");
    $("#nickField").hidden = !askNick;
    if (askNick && !nk.value) nk.value = (S.mine && S.mine.nick) || "";
    const info = $("#formInfo"); info.textContent = "";
    if (dr.lines.length < 2) info.append(el("b", null, "선을 두 개 이상 이어야 올릴 수 있어요."), document.createTextNode(" 시트를 닫고 하늘에서 별을 이어 주세요."));
    else info.append(el("b", null, `선 ${dr.lines.length}개 · 별 ${new Set(dr.lines.flat()).size}개`), document.createTextNode(mine ? " · 오늘 올린 작품을 이 그림으로 바꿔요" : " · 오늘 자정까지 순위에 올라가요"));
    $("#submitBtn").textContent = S.posting ? "올리는 중…" : mine ? "고친 내용으로 다시 올리기" : "오늘 하늘에 올리기";
    $("#submitBtn").disabled = !canAct() || S.posting;
    requestAnimationFrame(() => drawThumb($("#formThumb"), c, { lines: dr.lines, ghost: !dr.lines.length, bare: true }));
    return;
  }
  if (S.sheet === "rank"){
    $("#sheetTitle").textContent = `${c.title} 오늘 순위`;
    topicCard($("#rankTopic"), here && tp, "오늘 이 주제로 그린 작품들이에요");
    const list = rank(d, S.cid), ylist = rank(yesterday(), S.cid), yw = ylist[0] && ylist[0].votes > 0 ? ylist[0] : null;
    const nm = await names([...new Set([...list.map(e => e.author), ...(yw ? [yw.author] : [])])]);
    if (seq !== sSeq) return;
    const ol = $("#rankList"); ol.textContent = ""; for (const e of list) ol.append(entryRow(e, nm, d));
    const empty = $("#rankEmpty"); empty.hidden = !!list.length; empty.textContent = "";
    if (!list.length){
      if (S.db && !S.loaded) empty.append(el("b", null, "불러오는 중…"));
      else empty.append(el("b", null, "아직 아무도 안 그렸어요"), document.createTextNode("오늘 이 하늘을 처음 다시 그리면 바로 1위예요."));
    }
    const y = $("#yWinner"); y.textContent = "";
    if (yw){ const ul = el("ol", "list"); ul.append(entryRow(yw, nm, yesterday())); y.append(ul); }
    else y.append(el("p", "none", S.db && !S.loaded ? "불러오는 중…" : "어제는 별을 받은 작품이 없었어요."));
    return;
  }
  if (S.sheet === "hall"){
    $("#sheetTitle").textContent = "명예의 전당";
    const list = hallOf(S.players, rank, d).slice(0, 120);
    const nm = await names([...new Set(list.map(e => e.author))]);
    if (seq !== sSeq) return;
    const box = $("#hallList"); box.textContent = "";
    let day = "", ul = null;
    for (const e of list){
      if (e.d !== day){ day = e.d; box.append(el("h3", "hday", shortDay(day))); ul = el("ul", "list"); box.append(ul); }
      ul.append(hallRow(e, nm));
    }
    const empty = $("#hallEmpty"); empty.hidden = !!list.length; empty.textContent = "";
    if (!list.length) empty.append(el("b", null, S.db && !S.loaded ? "불러오는 중…" : "아직 비어 있어요"), document.createTextNode("하루가 끝나면 별자리마다 별을 가장 많이 받은 작품이 여기에 올라와요."));
    return;
  }
  $("#sheetTitle").textContent = "별자리 고르기";
  /* today's sky first, then the named constellations, then the unnamed skies */
  const named = ORDER.filter(id => !BYID[id].region && id !== tp.cid);
  const regions = DATA.filter(c => c.region && c.id !== tp.cid).map(c => c.id);   // in number order
  const rows = [tp.cid, ...named, ...regions].map(id => ({ k: BYID[id], list: rank(d, id) }));
  const nm = await names([...new Set(rows.flatMap(r => r.list.length ? [r.list[0].author] : []))]);
  if (seq !== sSeq) return;
  const ul = $("#pickList"); ul.textContent = "";
  let sect = false;
  for (const { k, list } of rows){
    if (k.region && k.id !== tp.cid && !sect){ sect = true; ul.append(el("li", "sect", "이름 없는 하늘 · 옛사람들이 그림을 남기지 않은 구역")); }
    const li = el("li", "prow"); li.tabIndex = 0; li.setAttribute("role", "button");
    const cv = el("canvas"), meta = el("div", "meta"), top = list[0];
    const nmEl = el("span", "nm", `${k.title}`); if (k.id === tp.cid) nmEl.append(el("span", "tag", "오늘의 주제"));
    meta.append(nmEl);
    const by = el("span", "by");
    if (top) by.append(el("i", null, `★${top.votes}`), document.createTextNode(` 1위 ‘${top.name}’ · ${nm[top.author]} · ${list.length}작품`));
    else by.textContent = k.id === tp.cid ? `주제 ‘${tp.theme}’ · 오늘 아직 없음` : `${k.la} · 오늘 아직 없음`;
    const live = liveText(k.id); if (live) by.append(document.createTextNode(" · "), el("span", "livetag", live));
    meta.append(by);
    li.append(cv, meta);
    if (k.id === S.cid) li.append(el("span", "here", "지금 여기"));
    else if (top){ const go = el("button", "go", "1위 보기"); go.type = "button"; go.addEventListener("click", ev => { ev.stopPropagation(); closeSheet(); selectConst(k.id, { day: d, author: top.author }); }); li.append(go); }
    li.setAttribute("aria-label", `${k.title}로 이동`);
    const pick = () => { closeSheet(); if (k.id !== S.cid) selectConst(k.id); };
    li.addEventListener("click", pick);
    li.addEventListener("keydown", ev => { if (ev.key === "Enter" || ev.key === " "){ ev.preventDefault(); pick(); } });
    ul.append(li);
    requestAnimationFrame(() => drawThumb(cv, k, { ghost: true, bare: true, ghostAlpha: .8 }));
  }
}
/* one hall of fame entry; opening it shows the entry on the sky (older ones from the copy kept in the hall) */
function hallRow(e, nm){
  const k = BYID[e.c], tp = topicOf(e.d), li = el("li", "hrow");
  li.tabIndex = 0; li.setAttribute("role", "button"); li.setAttribute("aria-label", `${shortDay(e.d)} ${k.title} 1위 ${e.name}, 하늘에서 보기`);
  const cv = el("canvas"), meta = el("div", "meta"), by = el("span", "by");
  by.textContent = `${k.title}${tp.cid === e.c ? ` · 주제 ‘${tp.theme}’` : ""} · ${e.author === S.myId ? "나" : nm[e.author]}`;
  meta.append(el("span", "nm", e.name), by);
  li.append(cv, meta, el("span", "hvotes num", `★ ${e.votes}`));
  const open = () => { closeSheet(); selectConst(e.c, { day: e.d, author: e.author, entry: e }); };
  li.addEventListener("click", open);
  li.addEventListener("keydown", ev => { if (ev.key === "Enter" || ev.key === " "){ ev.preventDefault(); open(); } });
  requestAnimationFrame(() => drawThumb(cv, k, { lines: e.lines }));
  return li;
}
/* today's theme in a sheet, or hidden when the sheet is about another constellation */
function topicCard(box, tp, note){
  box.hidden = !tp; box.textContent = "";
  if (tp) box.append(el("b", null, `오늘의 주제 · ${tp.theme}`), document.createTextNode(note));
}
export function renderUI(){ renderTop(); renderBottom(); if (S.sheet) renderSheet(); requestDraw(); announceBadges(); }

export function openSheet(kind){
  S.sheet = kind;
  if (kind === "form"){ const d = draft(); $("#nameInput").value = d.name; $("#storyInput").value = d.story; updateLens(); }
  renderSheet();
}
export function closeSheet(){ S.sheet = null; renderSheet(); }
export function renderSpin(){ const b = $("#spinBtn"); b.setAttribute("aria-pressed", String(S.spin)); b.textContent = S.spin ? "이동 연출 켜짐" : "이동 연출 꺼짐"; }
export function updateLens(){ $("#nameLen").textContent = `이름 ${$("#nameInput").value.length}/20`; $("#storyLen").textContent = `이야기 ${$("#storyInput").value.length}/140`; }
