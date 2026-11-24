import type { Promotion } from "./contracts";

export function getActivePromotions(promotions: readonly Promotion[], at: Date) {
  const instant = at.getTime();
  return promotions.filter((promotion) => {
    const starts = Date.parse(promotion.startsAt);
    const ends = promotion.endsAt === null ? Infinity : Date.parse(promotion.endsAt);
    return starts <= instant && instant < ends;
  });
}
