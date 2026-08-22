import { TariffConfig, BillSlabDetail, TariffCategoryType } from '../types';

export const DEFAULT_SRI_LANKA_TARIFFS: TariffConfig[] = [
  {
    id: 'tariff-domestic-std',
    category: 'DOMESTIC',
    name: 'Domestic (Standard Household)',
    description: 'Applicable to residential domestic water consumers across all Sri Lankan districts',
    effectiveDate: '2026-01-01',
    gracePeriodDays: 14,
    fixedCharge: 350.0, // LKR fixed monthly charge
    vatPercentage: 0.0,
    ssclPercentage: 2.5,
    slabs: [
      { minM3: 0, maxM3: 5, ratePerM3: 60.0 },
      { minM3: 6, maxM3: 10, ratePerM3: 80.0 },
      { minM3: 11, maxM3: 15, ratePerM3: 100.0 },
      { minM3: 16, maxM3: 20, ratePerM3: 130.0 },
      { minM3: 21, maxM3: 25, ratePerM3: 160.0 },
      { minM3: 26, maxM3: 30, ratePerM3: 200.0 },
      { minM3: 31, maxM3: null, ratePerM3: 250.0 },
    ],
  },
  {
    id: 'tariff-commercial-std',
    category: 'COMMERCIAL',
    name: 'Commercial & Institutional',
    description: 'Applicable to commercial offices, shops, restaurants, and private institutions',
    effectiveDate: '2026-01-01',
    gracePeriodDays: 10,
    fixedCharge: 1200.0,
    vatPercentage: 18.0,
    ssclPercentage: 2.5,
    slabs: [
      { minM3: 0, maxM3: 25, ratePerM3: 210.0 },
      { minM3: 26, maxM3: 50, ratePerM3: 260.0 },
      { minM3: 51, maxM3: 100, ratePerM3: 320.0 },
      { minM3: 101, maxM3: null, ratePerM3: 400.0 },
    ],
  },
  {
    id: 'tariff-industrial-std',
    category: 'INDUSTRIAL',
    name: 'Industrial & Manufacturing',
    description: 'Applicable to factories, production plants, and industrial estates',
    effectiveDate: '2026-01-01',
    gracePeriodDays: 7,
    fixedCharge: 3500.0,
    vatPercentage: 18.0,
    ssclPercentage: 2.5,
    slabs: [
      { minM3: 0, maxM3: 50, ratePerM3: 280.0 },
      { minM3: 51, maxM3: 150, ratePerM3: 350.0 },
      { minM3: 151, maxM3: null, ratePerM3: 450.0 },
    ],
  },
  {
    id: 'tariff-religious-std',
    category: 'RELIGIOUS',
    name: 'Religious & Charitable Places',
    description: 'Concessionary tariff for registered temples, churches, mosques, kovils, and charitable homes',
    effectiveDate: '2026-01-01',
    gracePeriodDays: 30,
    fixedCharge: 150.0,
    vatPercentage: 0.0,
    ssclPercentage: 0.0,
    slabs: [
      { minM3: 0, maxM3: 10, ratePerM3: 25.0 },
      { minM3: 11, maxM3: 25, ratePerM3: 45.0 },
      { minM3: 26, maxM3: null, ratePerM3: 80.0 },
    ],
  },
];

export interface TariffCalculationResult {
  consumptionM3: number;
  consumptionLiters: number;
  slabBreakdown: BillSlabDetail[];
  consumptionCharge: number;
  fixedCharge: number;
  taxesAmount: number;
  totalAmount: number;
}

/**
 * Calculates accurate volumetric water bill based on tiered slabs
 */
export function calculateWaterBill(
  volumeLiters: number,
  tariff: TariffConfig
): TariffCalculationResult {
  const consumptionM3 = Math.max(0, parseFloat((volumeLiters / 1000).toFixed(2)));
  let remainingM3 = consumptionM3;
  const slabBreakdown: BillSlabDetail[] = [];
  let totalConsumptionCharge = 0;

  for (const slab of tariff.slabs) {
    if (remainingM3 <= 0) break;

    const slabCapacity = slab.maxM3 !== null ? slab.maxM3 - slab.minM3 + (slab.minM3 === 0 ? 0 : 1) : Infinity;
    const m3InThisSlab = Math.min(remainingM3, slabCapacity);

    if (m3InThisSlab > 0) {
      const slabCost = m3InThisSlab * slab.ratePerM3;
      totalConsumptionCharge += slabCost;

      const slabLabel = slab.maxM3 !== null 
        ? `${slab.minM3} - ${slab.maxM3} m³` 
        : `> ${slab.minM3 - 1} m³`;

      slabBreakdown.push({
        slab: slabLabel,
        volumeM3: parseFloat(m3InThisSlab.toFixed(2)),
        unitRate: slab.ratePerM3,
        amount: parseFloat(slabCost.toFixed(2)),
      });

      remainingM3 -= m3InThisSlab;
    }
  }

  // Calculate Taxes (SSCL & VAT)
  const taxableSubtotal = totalConsumptionCharge + tariff.fixedCharge;
  const sscl = (taxableSubtotal * (tariff.ssclPercentage || 0)) / 100;
  const vat = ((taxableSubtotal + sscl) * (tariff.vatPercentage || 0)) / 100;
  const taxesAmount = parseFloat((sscl + vat).toFixed(2));

  const totalAmount = parseFloat((totalConsumptionCharge + tariff.fixedCharge + taxesAmount).toFixed(2));

  return {
    consumptionM3,
    consumptionLiters: volumeLiters,
    slabBreakdown,
    consumptionCharge: parseFloat(totalConsumptionCharge.toFixed(2)),
    fixedCharge: tariff.fixedCharge,
    taxesAmount,
    totalAmount,
  };
}
