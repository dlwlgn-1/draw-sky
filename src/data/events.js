/* Special nights: calendar dates ("MM-DD", every year, KST) that put one sky and one theme in place of the day's topic.
   Meteor showers sit on their usual peak night and on the sky their meteors seem to come from;
   the others are days people already send each other things on. game/topic.js applies them from 2026-10-28. */
export const EVENTS = {
  "01-01": { cid: "cas", title: "새해 첫 하늘", theme: "새해 소원", example: "떠오르는 해, 복주머니, 첫눈 위 발자국",
             note: "올해 처음 긋는 별자리에 소원을 담아 보세요" },
  "02-14": { cid: "lyr", title: "발렌타인데이", theme: "둘만의 별자리", example: "마주 잡은 두 손, 반쪽 하트, 같이 쓰는 우산",
             note: "좋아하는 사람에게 보낼 별자리를 그려 보세요. 직녀별 베가가 있는 하늘이에요" },
  "03-14": { cid: "gem", title: "화이트데이", theme: "답장", example: "리본 묶은 상자, 사탕 한 줌, 접은 편지",
             note: "받은 마음에 별자리로 답해 보세요" },
  "04-22": { cid: "lyr", title: "거문고자리 유성우", theme: "별똥별이 지나간 자리", example: "줄 끊어진 거문고, 꼬리 달린 불꽃, 소원 쪽지",
             note: "이맘때 밤, 거문고자리 쪽에서 별똥별이 떨어져요" },
  "08-12": { cid: "cas", title: "페르세우스자리 유성우", theme: "여름밤 별똥별", example: "평상 위 돗자리, 수박 한 통, 모기향 연기",
             note: "카시오페이아 곁 페르세우스자리에서 별똥별이 쏟아지는 밤이에요" },
  "11-11": { cid: "gem", title: "빼빼로데이", theme: "나눠 먹는 마음", example: "반으로 나눈 과자, 길쭉한 막대, 마주 보는 두 사람",
             note: "친구나 좋아하는 사람과 둘만의 별자리를 그려 보세요" },
  "11-17": { cid: "leo", title: "사자자리 유성우", theme: "별똥별이 떨어지는 밤", example: "소원 비는 사람, 꼬리 달린 불꽃, 달리는 사자",
             note: "이맘때 밤, 사자자리 쪽에서 별똥별이 쏟아져요" },
  "12-14": { cid: "gem", title: "쌍둥이자리 유성우", theme: "한 해 가장 많은 별똥별", example: "눈 위의 썰매 자국, 불꽃놀이, 손잡은 쌍둥이",
             note: "한 해 가장 화려한 유성우가 쌍둥이자리 쪽에서 떨어져요" },
  "12-24": { cid: "ori", title: "크리스마스이브", theme: "크리스마스 밤", example: "트리 꼭대기 별, 루돌프 썰매, 머리맡 양말",
             note: "겨울 하늘의 주인공 오리온 위에 크리스마스를 그려 보세요" }
};
