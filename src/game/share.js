/* Links to one entry, and the words that go with a share. Pure: no DOM, so tests can run it.
   A link is the site address plus ?c=<sky>&d=<day>&e=<author>; opening it lands on that entry on the sky. */
import { BYID } from "../data/constellations.js";
import { shortDay } from "./time.js";

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/, ID_RE = /^[\w-]{1,128}$/;

/* base: the site address (backend.siteUrl) */
export function entryLink(base, cid, day, author){
  const u = new URL(base);
  u.search = new URLSearchParams({ c: cid, d: day, e: author }).toString(); u.hash = "";
  return u.toString();
}

/* search: location.search → { cid, day, author }, or null when it is not a well-formed entry link */
export function parseLink(search){
  const q = new URLSearchParams(search), cid = q.get("c"), day = q.get("d"), author = q.get("e");
  if (!cid || !Object.hasOwn(BYID, cid) || !DAY_RE.test(day || "") || !ID_RE.test(author || "")) return null;
  return { cid, day, author };
}

/* the words sent with a link to one entry. who: the author's display name; isToday: votes still open */
export function entryText(entry, who, mine, isToday){
  const c = BYID[entry.c], head = mine ? `제가 다시 그린 ${c.title}: 「${entry.name}」` : `${who}님이 다시 그린 ${c.title}: 「${entry.name}」`;
  if (!isToday) return `${head}\n${shortDay(entry.d)}의 하늘이에요. 오늘의 하늘은 직접 다시 그려 보세요.`;
  return mine ? `${head}\n오늘 자정까지 별을 가장 많이 받으면 1위예요. 마음에 들면 별 하나 주세요 ⭐`
              : `${head}\n마음에 들면 별 하나 주세요 ⭐ 나도 오늘 밤 별을 다시 이어 볼까요?`;
}

/* my day in one short message, Wordle style.
   mine: my entries that day, each with its rank and votes ([{ c, name, rank, votes }]); open: the day is not over yet;
   hoursLeft: whole hours until it closes (only used while open) */
export function dayReport(day, mine, open, hoursLeft = 0){
  if (!mine.length) return "";
  const rows = [...mine].sort((a, b) => a.rank - b.rank || b.votes - a.votes).map(e =>
    `${e.rank === 1 && e.votes > 0 ? (open ? "🌟" : "🥇") : "✦"} ${BYID[e.c].title} 「${e.name}」 ${e.rank}위 · 별 ${e.votes}개`);
  const head = `다시 그린 하늘 · ${shortDay(day)}${open ? "" : " 결과"}`;
  const tail = open ? (hoursLeft >= 1 ? `마감까지 ${hoursLeft}시간, 별 주러 와 주세요` : "곧 마감이에요, 별 주러 와 주세요") : "오늘의 하늘도 다시 그려 보세요";
  return [head, ...rows, tail].join("\n");
}
