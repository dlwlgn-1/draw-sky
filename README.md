# 다시 그린 하늘

실제 별 위치에 나만의 선을 긋고 새 이름을 붙인 뒤, 별자리마다 그날 가장 잘 상상한 작품을 투표로 뽑는 모바일 웹 게임입니다.

- 게시된 페이지: https://claude.ai/artifact/5efJ7s1EX9DU2Gh8K9jgfX

## 파일

| 파일 | 내용 |
|---|---|
| `index.html` | 게임 전체(HTML·CSS·JavaScript). claude.ai 아티팩트로 게시되는 페이지 본문입니다. |
| `sky.json` | 실제 별 약 41,000개(8등급까지)의 위치·밝기·색지수와 은하수 윤곽 5단계 데이터. 페이지가 열릴 때 불러옵니다. |

## 게임 규칙

- 별자리 8개: 오리온, 큰곰, 카시오페이아, 백조, 전갈, 사자, 쌍둥이, 거문고
- 한 사람은 별자리마다 하루 한 작품을 올리고, 같은 날 안에서는 고쳐 올릴 수 있습니다.
- 별자리마다 하루 한 작품에만 별(투표)을 줄 수 있고, 자기 작품에는 줄 수 없습니다.
- 하루는 한국 시간 자정에 바뀌며, 작품과 투표는 7일 동안 보관됩니다.

## 저장 구조

작품과 투표는 파일이 아니라 아티팩트의 공유 데이터베이스(`db` 기능)에 저장됩니다.

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

## 실행

`index.html`은 claude.ai 아티팩트 런타임(`window.claude.use("db")`, `use("user")`)을 쓰도록 만들어져 있습니다.
로컬에서 `python3 -m http.server`로 열면 하늘 그리기와 선 긋기는 되지만, 저장·투표는 동작하지 않습니다.

## 데이터 출처

- 별: XHIP — An Extended Hipparcos Compilation (Anderson & Francis 2012, VizieR V/137D)
- 은하수 윤곽과 별 데이터 가공: [d3-celestial](https://github.com/ofrohn/d3-celestial) 0.7.35, Copyright (c) 2015 Olaf Frohn, BSD 3-Clause License
- 성운·은하의 위치와 크기는 공개된 천체 목록 값을 바탕으로 직접 넣었습니다.
