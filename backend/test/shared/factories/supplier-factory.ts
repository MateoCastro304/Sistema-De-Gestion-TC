import { SupplierType } from '../../../src/generated/prisma/enums';
import { getPrisma } from '../harness/test-app';

// ---------------------------------------------------------------------------
// Datos deterministas
// ---------------------------------------------------------------------------

/**
 * Se generan con un contador en vez de con faker, por dos razones.
 *
 * La tecnica: Prisma 7 carga su compilador WASM con un import() dinamico, que
 * obliga a correr jest con --experimental-vm-modules, y bajo ese modo el
 * bundle de @faker-js/faker falla con "exports is not defined". Sin faker, los
 * dos conviven.
 *
 * La de fondo: la razon social es unica entre los activos, asi que los valores
 * tienen que ser distintos en cada llamada. Un contador lo garantiza; faker
 * puede repetir y hacer fallar un test por un 409 que nadie pidio.
 */
let sequence = 0;

function nextSequence(): number {
  sequence += 1;
  return sequence;
}

// ---------------------------------------------------------------------------
// CUIT
// ---------------------------------------------------------------------------

const CUIT_WEIGHTS = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];

/**
 * Digito verificador de un CUIT, o null cuando da 10, que no es asignable.
 * Mismo algoritmo que el value object Cuit de shared/domain.
 */
function checkDigit(firstTen: string): number | null {
  const sum = [...firstTen].reduce((acc, digit, i) => acc + Number(digit) * CUIT_WEIGHTS[i], 0);
  const check = 11 - (sum % 11);

  if (check === 11) return 0;
  if (check === 10) return null;
  return check;
}

let cuitSequence = 0;

/**
 * Genera un CUIT valido y distinto en cada llamada.
 *
 * No se puede usar faker ni una constante: el backend valida el prefijo y el
 * digito verificador, y el CUIT es unico entre los proveedores activos, asi
 * que un valor fijo haria fallar la segunda alta con un 409.
 */
export function aValidCuit(): string {
  for (;;) {
    cuitSequence += 1;
    const body = String(cuitSequence).padStart(8, '0');
    const check = checkDigit(`30${body}`);

    if (check !== null) return `30-${body}-${check}`;
  }
}

// ---------------------------------------------------------------------------
// Payloads HTTP
// ---------------------------------------------------------------------------

export type SupplierPayload = {
  legalName: string;
  supplierType: string;
  cuit: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  observation: string;
};

/**
 * Cuerpo valido para POST /suppliers. Los overrides con `undefined` borran la
 * clave, para poder probar un campo ausente.
 */
export function aSupplier(overrides: Partial<SupplierPayload> = {}): Partial<SupplierPayload> {
  const n = nextSequence();

  const payload: SupplierPayload = {
    // La columna legal_name es VARCHAR(80) y el DTO valida lo mismo.
    legalName: `Proveedor de Prueba ${n}`,
    supplierType: SupplierType.MATERIAL,
    cuit: aValidCuit(),
    contactName: `Contacto ${n}`,
    contactEmail: `contacto${n}@proveedor.test`,
    contactPhone: '+54 9 351 444-5678',
    address: `Av. Siempre Viva ${n}`,
    observation: 'Entrega los martes',
    ...overrides,
  };

  for (const key of Object.keys(payload) as (keyof SupplierPayload)[]) {
    if (payload[key] === undefined) delete payload[key];
  }

  return payload;
}

// ---------------------------------------------------------------------------
// Filas en la base
// ---------------------------------------------------------------------------

type SupplierOverrides = {
  legalName?: string;
  supplierType?: SupplierType;
  cuit?: string | null;
  contactName?: string | null;
  isActive?: boolean;
};

/**
 * Inserta un proveedor directo por Prisma, saltando la API. Para armar el
 * estado previo de un caso sin depender de que el POST funcione.
 */
export async function createSupplier(overrides: SupplierOverrides = {}) {
  return getPrisma().supplier.create({
    data: {
      legalName: overrides.legalName ?? `Proveedor Almacenado ${nextSequence()}`,
      supplierType: overrides.supplierType ?? SupplierType.MATERIAL,
      cuit: overrides.cuit === undefined ? null : overrides.cuit,
      contactName: overrides.contactName === undefined ? null : overrides.contactName,
      isActive: overrides.isActive ?? true,
    },
  });
}
