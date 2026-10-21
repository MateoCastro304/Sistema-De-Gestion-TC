export const SUPPLIER_TYPES = ['PROCESS', 'REPLACEMENT', 'MATERIAL', 'PAINT'] as const;

export type SupplierType = (typeof SUPPLIER_TYPES)[number];

export function isSupplierType(value: string): value is SupplierType {
  return (SUPPLIER_TYPES as readonly string[]).includes(value);
}
