/** "HH:mm" 형식 파싱. 유효하면 { h, m } 반환, 아니면 null */
export function parseTime(time: string): { h: number; m: number } | null {
  const match = time.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  return { h, m };
}

/** checkIn/checkOut으로 근무시간 계산. 둘 다 유효한 경우만 결과 반환 */
export function calculateHours(
  checkIn: string | null | undefined,
  checkOut: string | null | undefined,
): { hoursWorked: number; overtimeHours: number } | null {
  if (!checkIn || !checkOut) return null;
  const inTime = parseTime(checkIn);
  const outTime = parseTime(checkOut);
  if (!inTime || !outTime) return null;

  const hoursWorked = Math.max(0, (outTime.h * 60 + outTime.m - (inTime.h * 60 + inTime.m)) / 60);
  const overtimeHours = Math.max(0, hoursWorked - 8);
  return { hoursWorked, overtimeHours };
}
