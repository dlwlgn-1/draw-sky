/* Badges on screen: the medal pictures, the "내 뱃지" sheet, and the pop-up when one is earned. */
import { S, canAct, whyNot } from "../game/state.js";
import { BADGES, emptyStats } from "../game/badges.js";
import { shortDay, today, yesterday } from "../game/time.js";
import { rng } from "../sky/math.js";
import { $, el } from "./dom.js";

const BY = Object.fromEntries(BADGES.map(b => [b.id, b]));
const hash = s => { let h = 2166136261; for (const ch of s) h = Math.imul(h ^ ch.codePointAt(0), 16777619); return h >>> 0; };
const myStats = () => S.mine ? S.mine.stats : emptyStats();
export const earnedCount = () => Object.keys(myStats().badges).length;

/* every badge is a small constellation of its own, drawn from its id */
export function medal(id, on){
  const r = rng(hash(id)), pts = [];
  for (let i = 0; i < 5; i++){ const a = i / 5 * 2 * Math.PI + r() * .9, d = 7 + r() * 9; pts.push([28 + Math.cos(a) * d, 28 + Math.sin(a) * d]); }
  const secret = !on && BY[id] && BY[id].secret;
  const inner = secret
    ? '<text x="28" y="33.5" text-anchor="middle" class="q">?</text>'
    : `<path d="M${pts.map(p => p.map(v => v.toFixed(1)).join(" ")).join(" L")}" class="ln"/>` + pts.map(([x, y], i) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${i ? 1.6 : 2.3}" class="st"/>`).join("");
  return `<svg viewBox="0 0 56 56" class="medal ${on ? "on" : "off"}" aria-hidden="true"><circle cx="28" cy="28" r="26.5" class="disc"/><circle cx="28" cy="28" r="23" class="ring"/>${inner}</svg>`;
}

export function renderBadgeSheet(){
  const s = myStats(), got = s.badges;
  $("#sheetTitle").textContent = `내 뱃지 ${Object.keys(got).length} / ${BADGES.length}`;
  const note = $("#badgeNotice"), why = canAct() ? "" : whyNot(); note.hidden = !why; note.textContent = why;

  const tiles = $("#myStats"); tiles.textContent = "";
  for (const [label, value, sub] of [
    /* a streak still counts if the last post was today or yesterday */
    ["연속 참여", `${s.lastDay === today() || s.lastDay === yesterday() ? s.streak : 0}일`, `최고 ${s.best}일`],
    ["올린 작품", `${s.posts}개`, `별자리 ${Object.keys(s.drawn).length} / 8`],
    ["1위로 마친 날", `${Object.keys(s.wins).length}번`, `한 작품 최다 별 ${s.maxStars}개`],
    ["나눠 준 별", `${s.given}개`, `주제 도전 ${s.topicPosts}번`]
  ]){
    const t = el("div", "tile"); t.append(el("span", "l", label), el("b", "num", value), el("span", "s", sub)); tiles.append(t);
  }

  const ul = $("#badgeList"); ul.textContent = "";
  /* earned first, in the order they were earned; then the rest in list order */
  const order = [...BADGES].sort((a, b) => (got[a.id] ? 0 : 1) - (got[b.id] ? 0 : 1) || (got[a.id] || "").localeCompare(got[b.id] || ""));
  for (const b of order){
    const on = !!got[b.id], li = el("li", "badge" + (on ? " on" : ""));
    li.innerHTML = medal(b.id, on);
    li.append(el("b", null, on || !b.secret ? b.name : "숨은 뱃지"), el("span", null, on ? `${shortDay(got[b.id])} 획득` : b.secret ? "어딘가에 숨어 있어요" : b.how));
    li.setAttribute("aria-label", on ? `${b.name}, ${shortDay(got[b.id])}에 얻음` : b.secret ? "숨은 뱃지, 아직 못 얻음" : `${b.name}, 아직 못 얻음: ${b.how}`);
    ul.append(li);
  }
}

/* pop up badges that appeared since the last look; the first look only takes note of what is already there */
let seen = null, showing = false;
const queue = [];
export function announceBadges(){
  if (!S.loaded) return;
  const got = Object.keys(myStats().badges);
  if (!seen){ seen = new Set(got); return; }
  for (const id of got) if (!seen.has(id)){ seen.add(id); queue.push(id); }
  pump();
}
function pump(){
  if (showing || !queue.length) return;
  const b = BY[queue.shift()], box = $("#award");
  box.textContent = ""; box.innerHTML = medal(b.id, true);
  const txt = el("div"); txt.append(el("span", "l", "뱃지를 얻었어요"), el("b", null, b.name), el("span", "s", b.how));
  box.append(txt); box.hidden = false; showing = true;
  setTimeout(() => { box.hidden = true; showing = false; pump(); }, 3400);
}
