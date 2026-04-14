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

export function getTodayDate(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

export function isSlotInFuture(startTime: string): boolean {
  const now = new Date();
  const [hours, minutes] = startTime.split(':').map(Number);
  const slotTime = new Date();
  slotTime.setHours(hours, minutes, 0, 0);
  return slotTime > now;
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
