/* Badges and the lasting record behind them. Pure functions only (no DOM), tested in Node.

   Entries and votes are pruned after a week, so progress lives in a separate record that is never pruned:
     stats: { posts, topicPosts, stories, given, drawn: { cid: n }, streak, best, lastDay,
              maxStars, wins: { "<day>_<cid>": 1 }, marks: { big, classic, owl, night }, badges: { id: "<day earned>" },
              seen: { day, posted: { cid: 1 }, voted: { cid: 1 } } }   ← what today already counted, so removing and
                                                                           redoing a post or a vote never counts twice
   Each player writes only their own record, so badges are a personal log rather than a contest result. */

import { NAMED, REGIONS } from "../data/constellations.js";

const NAMED_IDS = NAMED.map(c => c.id), REGION_IDS = REGIONS.map(c => c.id);
const drewNamed = s => NAMED_IDS.filter(id => s.drawn[id]).length;
const drewRegions = s => REGION_IDS.filter(id => s.drawn[id]).length;
export { drewNamed, drewRegions };

export const BADGES = [
  { id: "first",    name: "첫 별자리",      how: "작품을 처음 올리기",                 test: s => s.posts >= 1 },
  { id: "topic",    name: "주제 도전",      how: "오늘의 주제로 작품 올리기",           test: s => s.topicPosts >= 1 },
  { id: "topic10",  name: "주제 장인",      how: "오늘의 주제로 10번 올리기",           test: s => s.topicPosts >= 10 },
  { id: "all8",     name: "하늘 일주",      how: "이름 있는 별자리 8개를 모두 다시 그리기", test: s => drewNamed(s) >= 8 },
  { id: "pioneer",  name: "개척자",         how: "이름 없는 하늘에 처음 이름 붙이기",   test: s => drewRegions(s) >= 1 },
  { id: "streak3",  name: "사흘 연속",      how: "3일 연속 작품 올리기",               test: s => s.best >= 3 },
  { id: "streak7",  name: "일주일 개근",    how: "7일 연속 작품 올리기",               test: s => s.best >= 7 },
  { id: "star1",    name: "첫 별",          how: "다른 사람에게 별 받기",               test: s => s.maxStars >= 1 },
  { id: "star5",    name: "빛나는 별자리",  how: "한 작품으로 별 5개 받기",             test: s => s.maxStars >= 5 },
  { id: "win1",     name: "그날의 1위",     how: "하루를 1위로 마치기",                 test: s => Object.keys(s.wins).length >= 1 },
  { id: "win3",     name: "세 번의 왕관",   how: "1위로 마친 날 3번",                   test: s => Object.keys(s.wins).length >= 3 },
  { id: "giver",    name: "별 나눔",        how: "다른 작품에 별 10번 주기",            test: s => s.given >= 10 },
  { id: "story",    name: "이야기꾼",       how: "이야기를 붙인 작품 5개 올리기",       test: s => s.stories >= 5 },
  { id: "big",      name: "큰 그림",        how: "선 20개 이상으로 그리기",             test: s => !!s.marks.big },
  { id: "owl",      name: "올빼미",         how: "새벽 0시~4시에 작품 올리기",          test: s => !!s.marks.owl },
  { id: "night",    name: "특별한 밤",      how: "유성우·기념일 특집 날 그 하늘에 올리기", test: s => !!s.marks.night },
  { id: "classic",  name: "옛사람의 눈",    how: "원래 별자리 선과 똑같이 긋기",        test: s => !!s.marks.classic, secret: true }
];
const IDS = new Set(BADGES.map(b => b.id));
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
const WIN_RE = /^\d{4}-\d{2}-\d{2}_[a-z]+$/;
const count = v => Number.isInteger(v) && v > 0 ? Math.min(v, 1e6) : 0;

const emptySeen = (day = "") => ({ day, posted: {}, voted: {} });
export const emptyStats = () => ({ posts: 0, topicPosts: 0, stories: 0, given: 0, drawn: {}, streak: 0, best: 0, lastDay: "", maxStars: 0, wins: {}, marks: {}, badges: {}, seen: emptySeen() });

/* stats read from the store are the player's own input: keep only known fields of the right shape */
export function cleanStats(v, cids){
  const s = emptyStats(); if (!v || typeof v !== "object") return s;
  for (const k of ["posts", "topicPosts", "stories", "given", "streak", "best", "maxStars"]) s[k] = count(v[k]);
  if (typeof v.lastDay === "string" && DAY_RE.test(v.lastDay)) s.lastDay = v.lastDay;
  if (v.drawn && typeof v.drawn === "object") for (const c of Object.keys(v.drawn)) if (cids.has(c)) s.drawn[c] = count(v.drawn[c]) || 1;
  if (v.wins && typeof v.wins === "object") for (const k of Object.keys(v.wins).slice(0, 2000)) if (WIN_RE.test(k)) s.wins[k] = 1;
  if (v.marks && typeof v.marks === "object") for (const k of ["big", "classic", "owl", "night"]) if (v.marks[k]) s.marks[k] = 1;
  if (v.badges && typeof v.badges === "object") for (const k of Object.keys(v.badges)) if (IDS.has(k) && typeof v.badges[k] === "string" && DAY_RE.test(v.badges[k])) s.badges[k] = v.badges[k];
  const sn = v.seen;
  if (sn && typeof sn === "object" && typeof sn.day === "string" && DAY_RE.test(sn.day)){
    s.seen.day = sn.day;
    for (const part of ["posted", "voted"]) if (sn[part] && typeof sn[part] === "object") for (const c of Object.keys(sn[part])) if (cids.has(c)) s.seen[part][c] = 1;
  }
  return s;
}

const prevDay = day => { const t = Date.UTC(+day.slice(0, 4), +day.slice(5, 7) - 1, +day.slice(8, 10)) - 864e5; return new Date(t).toISOString().slice(0, 10); };
const sameLines = (a, b) => a.length === b.length && a.every(([p, q]) => b.some(([r, t]) => (p === r && q === t) || (p === t && q === r)));

const seenOn = (s, day) => s.seen.day === day ? s.seen : (s.seen = emptySeen(day));

/* a post or a re-post: p = { day, cid, story, lines, orig, topicCid, hour, event } where hour is the KST hour
   and event is true on a special night (game/topic.js).
   Counters move only for the first post of a constellation on a day. */
export function recordPost(s, p){
  const seen = seenOn(s, p.day);
  if (!seen.posted[p.cid]){
    seen.posted[p.cid] = 1;
    s.posts++;
    s.drawn[p.cid] = (s.drawn[p.cid] || 0) + 1;
    if (p.story) s.stories++;
    if (p.cid === p.topicCid) s.topicPosts++;
    if (s.lastDay !== p.day){
      s.streak = s.lastDay === prevDay(p.day) ? s.streak + 1 : 1;
      s.lastDay = p.day; s.best = Math.max(s.best, s.streak);
    }
  }
  if (p.lines.length >= 20) s.marks.big = 1;
  if (p.event && p.cid === p.topicCid) s.marks.night = 1;
  if (p.orig && sameLines(p.lines, p.orig)) s.marks.classic = 1;
  if (p.hour < 4) s.marks.owl = 1;
}

/* a vote: counts once per constellation per day, however often it is moved or taken back and given again */
export function recordVote(s, day, cid, nowVoted){
  if (!nowVoted) return;
  const seen = seenOn(s, day);
  if (!seen.voted[cid]){ seen.voted[cid] = 1; s.given++; }
}

/* what the rankings say about my entries: most stars on one entry, and days I finished first.
   rankOf(day, cid) returns that day's ranking; a day counts as won only once it has closed.
   hall (optional): my hall of fame, which gets a lasting copy of each winning entry. */
export function observe(s, myId, entries, rankOf, today, hall){
  let changed = false;
  for (const e of Object.values(entries)){
    const mine = rankOf(e.d, e.c).find(x => x.author === myId); if (!mine) continue;
    if (mine.votes > s.maxStars){ s.maxStars = mine.votes; changed = true; }
    const key = e.d + "_" + e.c;
    if (e.d < today && mine.rank === 1 && mine.votes > 0){
      if (!s.wins[key]){ s.wins[key] = 1; changed = true; }
      const h = hall && hall[key];
      if (hall && (!h || h.votes !== mine.votes)){ hall[key] = { c: e.c, d: e.d, name: e.name, story: e.story, lines: e.lines, votes: mine.votes, t: e.t }; changed = true; }
    }
  }
  return changed;
}

/* stamp every badge whose condition now holds; returns the ids earned just now */
export function stamp(s, day){
  const fresh = [];
  for (const b of BADGES) if (!s.badges[b.id] && b.test(s)){ s.badges[b.id] = day; fresh.push(b.id); }
  return fresh;
}
