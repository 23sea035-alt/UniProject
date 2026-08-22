import { readingsCol } from '../lib/db.js';
import { logger } from '../lib/logger.js';

export async function getDailyConsumption(meterId: string, days: number = 30) {
  const now = new Date();
  const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  const snap = await readingsCol
    .where('meterId', '==', meterId)
    .where('recordedAt', '>=', startDate)
    .where('recordedAt', '<=', now)
    .get();

  const readings = snap.docs.map((d: any) => d.data()).sort((a, b) => {
    const aTime = a.recordedAt?.toMillis?.() ?? 0;
    const bTime = b.recordedAt?.toMillis?.() ?? 0;
    return aTime - bTime;
  });
  if (readings.length === 0) return [];

  // Group by day and calculate daily consumption
  const dailyMap = new Map<string, { start: number; end: number; count: number }>();

  for (const r of readings) {
    const day = r.recordedAt.toDate ? r.recordedAt.toDate().toISOString().split('T')[0] : new Date(r.recordedAt).toISOString().split('T')[0];
    const existing = dailyMap.get(day);
    if (existing) {
      existing.end = r.totalCubicMetres ?? 0;
      existing.count++;
    } else {
      dailyMap.set(day, {
        start: r.totalCubicMetres ?? 0,
        end: r.totalCubicMetres ?? 0,
        count: 1,
      });
    }
  }

  const result: { day: string; usage: number }[] = [];
  for (const [day, data] of dailyMap) {
    result.push({
      day,
      usage: Math.max(0, data.end - data.start),
    });
  }

  return result.sort((a, b) => a.day.localeCompare(b.day));
}

export async function getMonthlyConsumption(meterId: string, months: number = 12) {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth() - months, 1);

  const snap = await readingsCol
    .where('meterId', '==', meterId)
    .where('recordedAt', '>=', startDate)
    .where('recordedAt', '<=', now)
    .get();

  const readings = snap.docs.map((d: any) => d.data()).sort((a, b) => {
    const aTime = a.recordedAt?.toMillis?.() ?? 0;
    const bTime = b.recordedAt?.toMillis?.() ?? 0;
    return aTime - bTime;
  });
  if (readings.length === 0) return [];

  // Group by month
  const monthlyMap = new Map<string, { first: number; last: number }>();

  for (const r of readings) {
    const date = r.recordedAt.toDate ? r.recordedAt.toDate() : new Date(r.recordedAt);
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const existing = monthlyMap.get(month);
    if (!existing) {
      monthlyMap.set(month, { first: r.totalCubicMetres ?? 0, last: r.totalCubicMetres ?? 0 });
    } else {
      existing.last = r.totalCubicMetres ?? 0;
    }
  }

  const result: { month: string; usage: number }[] = [];
  for (const [month, data] of monthlyMap) {
    result.push({
      month,
      usage: Math.max(0, data.last - data.first),
    });
  }

  return result.sort((a, b) => a.month.localeCompare(b.month));
}

export async function getPeriodConsumption(meterId: string, startDate: Date, endDate: Date) {
  const snap = await readingsCol
    .where('meterId', '==', meterId)
    .where('recordedAt', '>=', startDate)
    .where('recordedAt', '<=', endDate)
    .get();

  const readings = snap.docs.map((d: any) => d.data()).sort((a, b) => {
    const aTime = a.recordedAt?.toMillis?.() ?? 0;
    const bTime = b.recordedAt?.toMillis?.() ?? 0;
    return aTime - bTime;
  });
  if (readings.length === 0) return { consumptionM3: 0, consumptionLitres: 0, readingsCount: 0 };

  const first = readings[0];
  const last = readings[readings.length - 1];
  const consumptionM3 = Math.max(0, (last.totalCubicMetres ?? 0) - (first.totalCubicMetres ?? 0));

  return {
    consumptionM3,
    consumptionLitres: consumptionM3 * 1000,
    readingsCount: readings.length,
  };
}
