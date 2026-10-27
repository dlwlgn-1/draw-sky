# 다시 그린 하늘

실제 별 위치에 나만의 선을 긋고 새 이름을 붙인 뒤, 별자리마다 그날 가장 잘 상상한 작품을 투표로 뽑는 모바일 웹 게임입니다.

- 게시된 페이지: https://claude.ai/artifact/5efJ7s1EX9DU2Gh8K9jgfX

## 개발

```bash
npm install
npm run dev      # 개발 서버 (http://localhost:5173)
npm test         # 게임 규칙 테스트
npm run build    # dist/index.html (한 파일로 묶은 페이지), dist/artifact.html (아티팩트 게시용), dist/sky.json
```

개발 서버나 일반 웹 서버에서 열면 하늘 그리기와 선 긋기는 되지만, 저장·투표·이름 표시는 claude.ai 아티팩트 안에서만 동작합니다 (`window.claude.use("db")`, `use("user")`).

### 게시

`npm run build` 후 `dist/artifact.html`을 페이지로, `dist/sky.json`을 같은 경로의 파일로 아티팩트에 게시합니다.
아티팩트는 문서 틀(`<!doctype>`, `<head>`, `<body>`)을 스스로 붙이므로, `scripts/artifact.mjs`가 빌드 결과에서 그 틀을 걷어 냅니다.

## 구조

```
index.html              화면 뼈대 (마크업)
public/sky.json         실제 별·은하수 데이터 (빌드 때 그대로 복사)
src/
  main.js               시작점: 모듈을 연결하고 페이지를 엽니다
  styles.css            디자인
  data/
    constellations.js   놀이용 별자리 8개의 별과 원래 선
    topics.js           오늘의 주제 목록
    deepSky.js          성운·은하·성단
  sky/                  하늘 그리기
    math.js             구면 좌표, 보간 같은 계산
    catalog.js          sky.json 불러오기, 별 밝기·색 묶음
    projection.js       평사도법 카메라 (하늘 → 화면 좌표), 별자리 맞춤
    render.js           배경, 은하수, 성운, 별, 고른 별자리 그리기
    chalk.js            분필처럼 그어지는 선
    motion.js           별자리 사이 이동 연출, 선이 서서히 나타나는 효과
    thumb.js            목록용 작은 그림
  game/                 게임 규칙과 데이터
    rules.js            순위 계산, 저장 데이터 검증, 투표, 7일 보관 (DOM 없음 → 테스트 대상)
    time.js             한국 시간 기준 하루
    topic.js            날짜로 오늘의 별자리·주제 정하기
    state.js            공유 상태와 그 위의 읽기 함수
    store.js            공유 데이터베이스 연결, 내 문서 쓰기, 이름 불러오기
    actions.js          선 긋기, 별자리 이동, 작품 보기, 투표, 올리기, 내리기
  ui/                   화면
    panels.js           위·아래 조작부, 작품 카드, 시트(올리기·순위·별자리 목록)
    controls.js         버튼, 입력 폼, 키보드
    skyInput.js         하늘 위 터치: 별 잇기, 좌우 스와이프
    intro.js            첫 화면 (별을 밀어 올려 입장)
    clock.js            마감까지 남은 시간
    dom.js              DOM 도우미, 색, 토스트, 좌표 표기
tests/                  게임 규칙·오늘의 주제 테스트 (node:test)
scripts/artifact.mjs    빌드 결과를 아티팩트 게시 형식으로 바꾸기
```

## 게임 규칙

- 별자리 8개: 오리온, 큰곰, 카시오페이아, 백조, 전갈, 사자, 쌍둥이, 거문고
- 한 사람은 별자리마다 하루 한 작품을 올리고, 같은 날 안에서는 고쳐 올릴 수 있습니다.
- 별자리마다 하루 한 작품에만 별(투표)을 줄 수 있고, 자기 작품에는 줄 수 없습니다.
- 하루는 한국 시간 자정에 바뀌며, 작품과 투표는 7일 동안 보관됩니다.
- **오늘의 주제:** 날짜마다 별자리 하나와 그리기 주제 하나가 정해집니다(`src/game/topic.js`). 서버 없이 날짜만으로 계산하므로 모두에게 같습니다. 별자리는 8일마다 한 바퀴 돌고 이틀 연속 같은 별자리는 나오지 않으며, 주제는 목록(`src/data/topics.js`, 40개)을 다 쓰기 전에는 반복되지 않습니다. 새로 들어오면 오늘의 별자리에서 시작합니다. 다른 별자리도 지금처럼 자유롭게 그릴 수 있습니다.

## 저장 구조

작품과 투표는 아티팩트의 공유 데이터베이스(`db` 기능)에 저장됩니다.

- 문서 경로: `players/<사용자 ID>` (각자 자기 문서만 쓸 수 있음)
- 문서 모양:

```json
{
  "entries": {
    "2026-10-27_ori": { "c": "ori", "d": "2026-10-27", "name": "…", "story": "…", "lines": [[0, 2], [2, 5]], "t": 1793000000000 }
  },
  "votes": {
    "2026-10-27": { "ori": "<별을 준 작품의 작성자 ID>" }
  }
}
```

- 접근 규칙: `players`는 모두 읽기, `players/{self}`는 참여자(Contributor) 이상이 자기 문서만 쓰기

## 데이터 출처

- 별: XHIP — An Extended Hipparcos Compilation (Anderson & Francis 2012, VizieR V/137D)
- 은하수 윤곽과 별 데이터 가공: [d3-celestial](https://github.com/ofrohn/d3-celestial) 0.7.35, Copyright (c) 2015 Olaf Frohn, BSD 3-Clause License (`THIRD_PARTY_d3-celestial-LICENSE.txt`)
- 성운·은하의 위치와 크기는 공개된 천체 목록 값을 바탕으로 직접 넣었습니다.
