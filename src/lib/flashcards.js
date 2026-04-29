// خوارزمية SM-2 المبسطة لجدولة بطاقات الاستذكار.
// تقييمات: 0 = مرة أخرى، 1 = صعب، 2 = جيد، 3 = سهل.

const DAY = 86400000;

export function initialCard({ front, back, fileId = null, page = null }) {
  return {
    front,
    back,
    fileId,
    page,
    ease: 2.5,
    interval: 0,
    repetitions: 0,
    dueDate: Date.now(),
  };
}

export function review(card, rating) {
  let { ease, interval, repetitions } = card;
  const q = ratingToQ(rating);

  if (q < 3) {
    repetitions = 0;
    interval = 1;
  } else {
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 6;
    else interval = Math.round(interval * ease);
    repetitions += 1;
  }

  ease = Math.max(1.3, ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));

  return {
    ...card,
    ease,
    interval,
    repetitions,
    dueDate: Date.now() + interval * DAY,
  };
}

function ratingToQ(r) {
  // 0..3 -> SM-2 quality 0..5
  return [0, 3, 4, 5][r] ?? 3;
}

export function dueNow(card) {
  return (card.dueDate ?? 0) <= Date.now();
}
