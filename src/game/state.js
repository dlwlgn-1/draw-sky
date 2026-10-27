/* The one shared state object, plus read-only views of it. */
import { BYID } from "../data/constellations.js";
import { ranking } from "./rules.js";
import { today } from "./time.js";

export const S = {
  cid: "ori",            // chosen constellation
  viewing: null,         // { day, author } while looking at someone's entry on the big sky
  link: null,            // { cid, day, author } from an entry link the page was opened with, until it is shown
  sheet: null,           // "form" | "rank" | "pick" | "badges" | "hall"
  peers: {},             // who else is on each sky right now: { cid: { here, drawing } }
  ghost: false,          // show the traditional figure
  selected: null, down: null, noRefit: false,
  posting: false, saving: false,   // a post or an image save is under way
  spin: true,            // move the sky between constellations (off: switch at once)
  drafts: {}, history: {},
  players: new Map(), mine: null, loaded: false, dbChecked: false,
  backend: null,         // see backend/claude.js; db is the same object once a shared store is there
  db: null, myId: null, canWrite: null, chain: Promise.resolve(),
  day: today(), cam: null, reveal: 0, P: [], R: [], labels: []
};

export const cur = () => BYID[S.cid];
export const draft = (cid = S.cid) => S.drafts[cid] ||= { lines: [], name: "", story: "", touched: false };
export const rank = (day, cid) => ranking(S.players, day, cid);

/* the entry on the big sky: from the day's ranking, or for an older hall of fame entry the copy it came with */
export function viewedEntry(){
  if (!S.viewing) return null;
  const live = rank(S.viewing.day, S.cid).find(e => e.author === S.viewing.author);
  return live || (S.viewing.entry ? { ...S.viewing.entry, author: S.viewing.author, rank: 1 } : null);
}

export const myVote = (day, cid) => S.mine && S.mine.votes[day] ? S.mine.votes[day][cid] || null : null;
export const canAct = () => !!(S.db && S.myId && S.loaded && S.canWrite !== false);

export function whyNot(){
  if (!S.db) return "저장소에 연결되지 않아 지금은 그려 보기만 할 수 있어요.";
  if (!S.myId) return "로그인해야 올리고 별을 줄 수 있어요.";
  if (S.canWrite === false) return "보기 전용 링크예요. 공유한 사람에게 참여 권한을 요청하세요.";
  if (!S.loaded) return "작품을 불러오는 중이에요.";
  return "";
}
