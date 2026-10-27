/* npm run deploy: build the Firebase site and put it online (site + firestore.rules) in one go.
   Reads the project from .env.local, so there is no `firebase use` step. Needs `npm run login` once per computer. */
import { spawnSync } from "node:child_process";
import { loadEnv } from "vite";

const FIREBASE = "npx --yes firebase-tools@13.29.1";
const env = loadEnv("web", process.cwd(), "VITE_");
const stop = msg => { console.error("\n" + msg + "\n"); process.exit(1); };

const missing = ["VITE_FIREBASE_API_KEY", "VITE_FIREBASE_AUTH_DOMAIN", "VITE_FIREBASE_PROJECT_ID", "VITE_FIREBASE_APP_ID"].filter(k => !env[k]);
if (missing.length) stop(`.env.local에 Firebase 설정이 없어요: ${missing.join(", ")}\n` +
  "Firebase 콘솔 → 프로젝트 설정 → 내 앱 → 웹 앱의 firebaseConfig 값을 .env.local에 채워 주세요(README의 \"공개 웹사이트: Firebase\").");
if (env.VITE_FIREBASE_EMULATOR) stop(".env.local에 VITE_FIREBASE_EMULATOR가 켜져 있어요. 실제 배포 전에는 그 줄을 지우거나 앞에 #을 붙여 주세요.");

const run = (cmd, hint = "") => { console.log(`\n> ${cmd}`); if (spawnSync(cmd, { stdio: "inherit", shell: true }).status !== 0) stop(`실패: ${cmd}${hint}`); };
const project = env.VITE_FIREBASE_PROJECT_ID;

run("npx vite build --mode web");
run(`${FIREBASE} deploy --only hosting,firestore:rules --project ${project} --non-interactive`,
  "\n로그인 전이라면 `npm run login`을 먼저 하세요. Firestore 데이터베이스를 아직 안 만들었다면 콘솔에서 먼저 만들어 주세요.");
console.log(`\n배포 완료: https://${project}.web.app\n`);
