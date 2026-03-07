export const TIME_SLOT_INTERVALS = [15, 30, 60] as const;
export type TimeSlotInterval = (typeof TIME_SLOT_INTERVALS)[number];
