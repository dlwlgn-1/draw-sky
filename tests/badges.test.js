import { test } from "node:test";
import assert from "node:assert/strict";
import { BADGES, emptyStats, cleanStats, recordPost, recordVote, observe, stamp } from "../src/game/badges.js";
import { cleanPlayer, ranking } from "../src/game/rules.js";

const post = (s, day, cid, extra = {}) => recordPost(s, { day, cid, isNew: true, story: "", lines: [[0, 1]], orig: [[0, 2]], topicCid: "uma", hour: 12, ...extra });

test("posting counts posts, constellations, topic posts and stories; edits do not", () => {
  const s = emptyStats();
  post(s, "2026-10-27", "uma", { story: "아침 해" });
  post(s, "2026-10-27", "uma", { isNew: false, story: "고침" });
  post(s, "2026-10-27", "ori");
  assert.equal(s.posts, 2); assert.equal(s.topicPosts, 1); assert.equal(s.stories, 1);
  assert.deepEqual(s.drawn, { uma: 1, ori: 1 });
  assert.deepEqual(stamp(s, "2026-10-27").sort(), ["first", "topic"]);
  assert.deepEqual(stamp(s, "2026-10-27"), []);   // stamped once
});

test("streaks grow on consecutive days and restart after a gap", () => {
  const s = emptyStats();
  for (const d of ["2026-10-25", "2026-10-26", "2026-10-26", "2026-10-27"]) post(s, d, "ori");
  assert.equal(s.streak, 3); assert.equal(s.best, 3);
  post(s, "2026-10-30", "ori");
  assert.equal(s.streak, 1); assert.equal(s.best, 3);
  assert.ok(stamp(s, "2026-10-30").includes("streak3"));
});

test("special marks: big drawings, the traditional figure, small hours", () => {
  const s = emptyStats();
  post(s, "2026-10-27", "cas", { lines: [[1, 0], [0, 2]], orig: [[0, 1], [2, 0]], hour: 2 });
  assert.deepEqual(s.marks, { classic: 1, owl: 1 });
  post(s, "2026-10-27", "ori", { lines: Array.from({ length: 20 }, (_, i) => [0, i + 1]) });
  assert.equal(s.marks.big, 1);
});

test("only a newly given vote counts", () => {
  const s = emptyStats();
  recordVote(s, false, true); recordVote(s, true, true); recordVote(s, true, false);
  assert.equal(s.given, 1);
});

test("stars received and finished days won come from the rankings", () => {
  const entry = (d, c) => ({ c, d, name: "x", story: "", lines: [[0, 1]], t: 1 });
  const players = new Map([
    ["me", { entries: { "2026-10-26_ori": entry("2026-10-26", "ori"), "2026-10-27_ori": entry("2026-10-27", "ori") }, votes: {} }],
    ["u_b", { entries: {}, votes: { "2026-10-26": { ori: "me" }, "2026-10-27": { ori: "me" } } }]
  ]);
  const s = emptyStats();
  const changed = observe(s, "me", players.get("me").entries, (d, c) => ranking(players, d, c), "2026-10-27");
  assert.ok(changed);
  assert.equal(s.maxStars, 1);
  assert.deepEqual(s.wins, { "2026-10-26_ori": 1 });   // today is not over yet
  assert.equal(observe(s, "me", players.get("me").entries, (d, c) => ranking(players, d, c), "2026-10-27"), false);
  assert.deepEqual(stamp(s, "2026-10-27").sort(), ["star1", "win1"]);
});

test("stats from the store are cleaned, and survive cleanPlayer", () => {
  const s = cleanStats({ posts: 3, given: -4, drawn: { ori: 2, nope: 1 }, wins: { "2026-10-26_ori": 1, bad: 1 }, badges: { first: "2026-10-27", fake: "2026-10-27", topic: 5 }, marks: { owl: true, hack: 1 } }, new Set(["ori"]));
  assert.equal(s.posts, 3); assert.equal(s.given, 0);
  assert.deepEqual(s.drawn, { ori: 2 }); assert.deepEqual(s.wins, { "2026-10-26_ori": 1 });
  assert.deepEqual(s.badges, { first: "2026-10-27" }); assert.deepEqual(s.marks, { owl: 1 });
  assert.equal(cleanPlayer({ stats: { posts: 2 } }).stats.posts, 2);
  assert.equal(BADGES.length, new Set(BADGES.map(b => b.id)).size);
});
