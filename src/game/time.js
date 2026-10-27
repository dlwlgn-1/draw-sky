/* The game day runs on Korean time: rankings close at midnight KST. */

export const DAY = 864e5;
const KST = 9 * 36e5;

export const dayOf = t => new Date(t + KST).toISOString().slice(0, 10);
export const today = () => dayOf(Date.now());
export const yesterday = () => dayOf(Date.now() - DAY);
export const shortDay = d => `${+d.slice(5, 7)}월 ${+d.slice(8, 10)}일`;

/* milliseconds left until the next KST midnight */
export const untilMidnight = (now = Date.now()) => (Math.floor((now + KST) / DAY) + 1) * DAY - KST - now;
