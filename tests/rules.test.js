import { test } from "node:test";
import assert from "node:assert/strict";
import { cleanLines, cleanPlayer, ranking, prune, toggleVote, MAX_LINES } from "../src/game/rules.js";
import { dayOf, untilMidnight } from "../src/game/time.js";

const DAY = "2026-10-27";
const entry = (lines, t = 1, extra = {}) => ({ c: "ori", d: DAY, name: "활 쏘는 고양이", story: "", lines, t, ...extra });
const player = (entries = {}, votes = {}) => ({ entries, votes });

test("the game day turns at midnight Korean time", () => {
  assert.equal(dayOf(Date.UTC(2026, 9, 26, 14, 59, 59)), "2026-10-26");   // 23:59:59 KST
  assert.equal(dayOf(Date.UTC(2026, 9, 26, 15, 0, 0)), "2026-10-27");     // 00:00 KST
  assert.equal(untilMidnight(Date.UTC(2026, 9, 26, 14, 0, 0)), 3600e3);
});

test("cleanLines keeps valid pairs once, in ascending order", () => {
  assert.deepEqual(cleanLines([[2, 0], [0, 2], [1, 1], [0, 9], [-1, 2], ["0", 1], [3, 4]], 5), [[0, 2], [3, 4]]);
  assert.deepEqual(cleanLines("nope", 5), []);
  const many = Array.from({ length: MAX_LINES + 20 }, (_, i) => [0, i + 1]);
  assert.equal(cleanLines(many, 200).length, MAX_LINES);
});

test("cleanPlayer drops entries that do not match their key or constellation", () => {
  const p = cleanPlayer({
    entries: {
      [`${DAY}_ori`]: entry([[0, 1]], 5, { name: "  " }),
      [`${DAY}_uma`]: entry([[0, 1]]),               // key says uma, body says ori
      [`${DAY}_xxx`]: { ...entry([[0, 1]]), c: "xxx" },
      [`${DAY}_ori2`]: entry([])
    },
    votes: { [DAY]: { ori: "u_a", nope: "u_b", leo: 7 }, "not-a-day": { ori: "u_c" } }
  });
  assert.deepEqual(Object.keys(p.entries), [`${DAY}_ori`]);
  assert.equal(p.entries[`${DAY}_ori`].name, "이름 없는 별자리");
  assert.deepEqual(p.votes, { [DAY]: { ori: "u_a" } });
});

test("ranking counts one vote per player, ignores self-votes, and shares ranks on ties", () => {
  const k = `${DAY}_ori`;
  const players = new Map([
    ["u_a", player({ [k]: entry([[0, 1]], 30) }, { [DAY]: { ori: "u_a" } })],   // votes for self: ignored
    ["u_b", player({ [k]: entry([[0, 2]], 10) }, { [DAY]: { ori: "u_a" } })],
    ["u_c", player({ [k]: entry([[0, 3]], 20) }, { [DAY]: { ori: "u_b" } })],
    ["u_d", player({}, { [DAY]: { ori: "u_a" }, "2026-10-26": { ori: "u_c" } })],  // yesterday's vote does not count today
    ["u_e", player({}, { [DAY]: { ori: "u_x" } })]                                 // vote for someone with no entry
  ]);
  const list = ranking(players, DAY, "ori");
  assert.deepEqual(list.map(e => [e.author, e.votes, e.rank]), [["u_a", 2, 1], ["u_b", 1, 2], ["u_c", 0, 3]]);

  const tied = new Map([
    ["u_a", player({ [k]: entry([[0, 1]], 30) })],
    ["u_b", player({ [k]: entry([[0, 2]], 10) })]
  ]);
  assert.deepEqual(ranking(tied, DAY, "ori").map(e => [e.author, e.rank]), [["u_b", 1], ["u_a", 1]]);   // earlier entry first
});

test("toggleVote moves or takes back the single vote", () => {
  const doc = { entries: {}, votes: {} };
  toggleVote(doc, DAY, "ori", "u_a");
  assert.equal(doc.votes[DAY].ori, "u_a");
  toggleVote(doc, DAY, "ori", "u_b");
  assert.equal(doc.votes[DAY].ori, "u_b");
  toggleVote(doc, DAY, "ori", "u_b");
  assert.equal(doc.votes[DAY].ori, undefined);
});

test("prune keeps seven days and drops empty vote days", () => {
  const now = Date.UTC(2026, 9, 27, 3);   // 12:00 KST, 2026-10-27
  const doc = {
    entries: { "2026-10-20_ori": entry([[0, 1]], 1, { d: "2026-10-20" }), "2026-10-19_ori": entry([[0, 1]], 1, { d: "2026-10-19" }) },
    votes: { "2026-10-20": { ori: "u_a" }, "2026-10-19": { ori: "u_a" }, [DAY]: {} }
  };
  prune(doc, now);
  assert.deepEqual(Object.keys(doc.entries), ["2026-10-20_ori"]);
  assert.deepEqual(Object.keys(doc.votes), ["2026-10-20"]);
});
