import { tariffsCol, getDoc, listDocs, createDoc, updateDoc } from '../lib/db.js';
import type { Tariff } from '../lib/types.js';
import { logger } from '../lib/logger.js';

export async function getActiveTariffs(category?: string) {
  const snap = await tariffsCol.where('isActive', '==', true).get();
  let results = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  results.sort((a: any, b: any) => (a.minUnits ?? 0) - (b.minUnits ?? 0));
  if (category) {
    results = results.filter((t: any) => t.category === category);
  }
  return results;
}

export async function createTariff(data: Omit<Tariff, 'tariffId' | 'createdAt' | 'updatedAt'>) {
  const tariff = await createDoc<Tariff>('tariffs', {
    ...data,
  } as any);

  logger.info({ tariffId: tariff.id, tierName: data.tierName }, 'Tariff created');
  return tariff;
}

export async function updateTariff(tariffId: string, data: Partial<Tariff>) {
  await updateDoc('tariffs', tariffId, data);
  logger.info({ tariffId, fields: Object.keys(data) }, 'Tariff updated');
}

export async function listTariffs() {
  return listDocs<Tariff & { id: string }>('tariffs', undefined, { field: 'minUnits', direction: 'asc' });
}

// Sri Lankan NWSDB default tariffs
export const DEFAULT_TARIFFS = [
  { tierName: 'Lifeline', minUnits: 0, maxUnits: 5, ratePerUnit: 15, category: 'residential' },
  { tierName: 'Low Usage', minUnits: 5, maxUnits: 10, ratePerUnit: 42, category: 'residential' },
  { tierName: 'Standard', minUnits: 10, maxUnits: 20, ratePerUnit: 60, category: 'residential' },
  { tierName: 'High Usage', minUnits: 20, maxUnits: null, ratePerUnit: 75, category: 'residential' },
];

export async function seedDefaultTariffs() {
  const existing = await tariffsCol.where('isActive', '==', true).limit(1).get();
  if (!existing.empty) return;

  for (const tier of DEFAULT_TARIFFS) {
    await createDoc('tariffs', {
      category: tier.category,
      tierName: tier.tierName,
      minUnits: tier.minUnits,
      maxUnits: tier.maxUnits,
      ratePerUnit: tier.ratePerUnit,
      fixedCharge: 250,
      systemLevy: 50,
      stampDuty: 25,
      effectiveFrom: '2024-01-01',
      isActive: true,
    } as any);
  }

  logger.info('Default tariffs seeded');
}
