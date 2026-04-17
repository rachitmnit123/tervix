export const SLOT_TIMES = [
  { start: '08:30', end: '10:30' },
  { start: '10:30', end: '12:30' },
  { start: '12:30', end: '14:30' },
  { start: '14:30', end: '16:30' },
  { start: '16:30', end: '18:30' },
  { start: '18:30', end: '20:30' },
  { start: '20:30', end: '22:30' },
  { start: '22:30', end: '00:30' },
];

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // UTC+5:30

/** Returns current time shifted to IST */
function nowInIST(): Date {
  return new Date(Date.now() + IST_OFFSET_MS);
}

/** Returns today's date at IST midnight, as a UTC Date (for DB queries) */
export function getTodayDate(): Date {
  const ist = nowInIST();
  // Zero out the time portion in IST, then shift back to UTC for DB storage
  const istMidnight = new Date(Date.UTC(
    ist.getUTCFullYear(),
    ist.getUTCMonth(),
    ist.getUTCDate(),
    0, 0, 0, 0
  ));
  // istMidnight is 00:00 IST expressed as UTC (i.e. subtract IST offset)
  return new Date(istMidnight.getTime() - IST_OFFSET_MS);
}

/** Checks if a slot start time (IST HH:MM) is still in the future */
export function isSlotInFuture(startTime: string): boolean {
  const ist = nowInIST();
  const [hours, minutes] = startTime.split(':').map(Number);
  // Build slot time using current IST date + slot's IST hour/minute
  const slotIST = new Date(Date.UTC(
    ist.getUTCFullYear(),
    ist.getUTCMonth(),
    ist.getUTCDate(),
    hours,
    minutes,
    0, 0
  ));
  return slotIST > ist;
}

export function formatSlotTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

export function getSlotNumber(startTime: string): number {
  return SLOT_TIMES.findIndex(s => s.start === startTime) + 1;
}