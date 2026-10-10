// Seed de datos de demo para desarrollo: 5 rubros, 5 proveedores y 8 fabricas
// con 1 a 3 encargados cada una. Idempotente: se puede ejecutar varias veces.
//
//   npx prisma db seed        (o `make seed`)
import 'dotenv/config';
import Module from 'node:module';
import { PrismaPg } from '@prisma/adapter-pg';

// El cliente generado importa './x.js' aunque el archivo es './x.ts' (resolucion
// nodenext); ts-node no hace ese mapeo, asi que se resuelve aca antes de cargarlo.
const resolveFilename = (Module as any)._resolveFilename;
(Module as any)._resolveFilename = function (request: string, ...rest: unknown[]) {
  try {
    return resolveFilename.call(this, request, ...rest);
  } catch (error) {
    if (/^\.{1,2}\/.+\.js$/.test(request)) return resolveFilename.call(this, request.slice(0, -3), ...rest);
    throw error;
  }
};

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require('../src/generated/prisma/client') as typeof import('../src/generated/prisma/client');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { SupplierType } = require('../src/generated/prisma/enums') as typeof import('../src/generated/prisma/enums');

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

/** Completa los 10 digitos base con el digito verificador del CUIT. */
function cuitDigits(base: string): string {
  const weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  const sum = [...base].reduce((acc, d, i) => acc + Number(d) * weights[i], 0);
  const check = 11 - (sum % 11);
  if (check === 10) throw new Error(`CUIT base ${base} no tiene digito verificador valido`);
  return `${base}${check === 11 ? 0 : check}`;
}

/** XX-XXXXXXXX-X, formato del contrato (proveedores). */
function cuitDashed(base: string): string {
  const d = cuitDigits(base);
  return `${d.slice(0, 2)}-${d.slice(2, 10)}-${d.slice(10)}`;
}

const CATEGORIES = ['Metalúrgica', 'Automotriz', 'Agroindustria', 'Petróleo y Gas', 'Alimenticia'];

const SUPPLIERS = [
  {
    legalName: 'Aceros del Sur S.A.',
    supplierType: SupplierType.MATERIAL,
    cuit: cuitDashed('3070123456'),
    contactName: 'Diego Fernández',
    contactEmail: 'ventas@acerosdelsur.com.ar',
    contactPhone: '+54 9 351 444-1001',
    address: 'Av. Circunvalación 4500, Córdoba',
  },
  {
    legalName: 'Metales Córdoba S.R.L.',
    supplierType: SupplierType.MATERIAL,
    cuit: cuitDashed('3071234567'),
    contactName: 'Laura Benítez',
    contactEmail: 'compras@metalescordoba.com.ar',
    contactPhone: '+54 9 351 444-1002',
    address: 'Ruta 9 Km 695, Córdoba',
  },
  {
    legalName: 'Tratamientos Térmicos Pampa S.A.',
    supplierType: SupplierType.PROCESS,
    cuit: cuitDashed('3068765431'),
    contactName: 'Ricardo Molina',
    contactEmail: 'planta@ttpampa.com.ar',
    contactPhone: '+54 9 351 444-1003',
    address: 'Parque Industrial Ferreyra, Córdoba',
  },
  {
    legalName: 'Rodamientos y Repuestos del Centro',
    supplierType: SupplierType.REPLACEMENT,
    cuit: cuitDashed('3069988776'),
    contactName: 'Marta Quiroga',
    contactEmail: 'pedidos@rrcentro.com.ar',
    contactPhone: '+54 9 351 444-1004',
    address: 'Bv. San Juan 1250, Córdoba',
  },
  {
    legalName: 'Pinturas Industriales Andina S.A.',
    supplierType: SupplierType.PAINT,
    cuit: cuitDashed('3067654321'),
    contactName: 'Julián Paz',
    contactEmail: 'comercial@pinturasandina.com.ar',
    contactPhone: '+54 9 351 444-1005',
    address: 'Av. Colón 3300, Córdoba',
  },
];

type ManagerSeed = { name: string; lastName: string; phone?: string; mail?: string };

const FACTORIES: {
  name: string;
  cuitBase: string;
  category: string;
  address: string;
  payMethod: string;
  managers: ManagerSeed[];
}[] = [
  {
    name: 'OxyCAM S.A.',
    cuitBase: '3071234001',
    category: 'Metalúrgica',
    address: 'Ruta 9 Km 12, Córdoba',
    payMethod: 'Transferencia a 30 días',
    managers: [{ name: 'Marcela', lastName: 'Ríos', phone: '+54 9 351 555-2001', mail: 'mrios@oxycam.com.ar' }],
  },
  {
    name: 'Autopartes Mediterránea S.R.L.',
    cuitBase: '3071234002',
    category: 'Automotriz',
    address: 'Parque Industrial Ferreyra, Córdoba',
    payMethod: 'Cheque a 60 días',
    managers: [
      { name: 'Hernán', lastName: 'Acosta', phone: '+54 9 351 555-2002', mail: 'hacosta@automediterranea.com.ar' },
      { name: 'Silvia', lastName: 'Luna', mail: 'compras@automediterranea.com.ar' },
    ],
  },
  {
    name: 'Agroinsumos del Litoral S.A.',
    cuitBase: '3071234003',
    category: 'Agroindustria',
    address: 'Ruta 8 Km 410, Río Cuarto',
    payMethod: 'Contado contra entrega',
    managers: [
      { name: 'Pablo', lastName: 'Giménez', phone: '+54 9 358 555-2003', mail: 'pgimenez@agroinsumos.com.ar' },
      { name: 'Carla', lastName: 'Domínguez', phone: '+54 9 358 555-2004' },
      { name: 'Esteban', lastName: 'Soria', mail: 'esoria@agroinsumos.com.ar' },
    ],
  },
  {
    name: 'Petroservicios Cuyo S.A.',
    cuitBase: '3071234004',
    category: 'Petróleo y Gas',
    address: 'Av. Costanera 800, Neuquén',
    payMethod: 'Transferencia a 45 días',
    managers: [{ name: 'Raúl', lastName: 'Cabrera', phone: '+54 9 299 555-2005', mail: 'rcabrera@petrocuyo.com.ar' }],
  },
  {
    name: 'Lácteos La Serrana S.A.',
    cuitBase: '3071234009',
    category: 'Alimenticia',
    address: 'Ruta 19 Km 220, San Francisco',
    payMethod: 'Transferencia a 30 días',
    managers: [
      { name: 'Natalia', lastName: 'Ferreyra', phone: '+54 9 3564 55-2006', mail: 'nferreyra@laserrana.com.ar' },
      { name: 'Gustavo', lastName: 'Peralta', phone: '+54 9 3564 55-2007' },
    ],
  },
  {
    name: 'Matricería Bustos e Hijos',
    cuitBase: '3071234006',
    category: 'Metalúrgica',
    address: 'Barrio Parque Vélez Sarsfield, Córdoba',
    payMethod: 'Contado',
    managers: [
      { name: 'Alberto', lastName: 'Bustos', phone: '+54 9 351 555-2008', mail: 'abustos@matriceriabustos.com.ar' },
      { name: 'Mariana', lastName: 'Bustos', mail: 'mbustos@matriceriabustos.com.ar' },
      { name: 'Joaquín', lastName: 'Ledesma', phone: '+54 9 351 555-2009' },
    ],
  },
  {
    name: 'Transmisiones Argentinas S.A.',
    cuitBase: '3071234007',
    category: 'Automotriz',
    address: 'Av. Fuerza Aérea 5100, Córdoba',
    payMethod: 'Cheque a 30 días',
    managers: [
      { name: 'Verónica', lastName: 'Sosa', phone: '+54 9 351 555-2010', mail: 'vsosa@transmisiones.com.ar' },
      { name: 'Daniel', lastName: 'Arias', mail: 'darias@transmisiones.com.ar' },
    ],
  },
  {
    name: 'Frigorífico Río Tercero S.A.',
    cuitBase: '3071234008',
    category: 'Alimenticia',
    address: 'Ruta 36 Km 80, Río Tercero',
    payMethod: 'Transferencia a 15 días',
    managers: [{ name: 'Lucía', lastName: 'Montenegro', phone: '+54 9 3571 55-2011', mail: 'lmontenegro@frigorio3.com.ar' }],
  },
];

async function main(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('El seed carga datos de demostracion: no se ejecuta con NODE_ENV=production.');
  }

  // Rubros: Category.name no es unico en el schema, se busca por nombre.
  const categoryIds = new Map<string, number>();
  for (const name of CATEGORIES) {
    const existing = await prisma.category.findFirst({ where: { name } });
    const category = existing ?? (await prisma.category.create({ data: { name } }));
    categoryIds.set(name, category.id);
  }

  for (const { cuit, ...rest } of SUPPLIERS) {
    // La unicidad de cuit es un indice parcial (solo activos) que Prisma no expresa: no hay upsert.
  const existing = await prisma.supplier.findFirst({ where: { cuit, isActive: true } });
  if (!existing) await prisma.supplier.create({ data: { cuit, ...rest } });
  }

  let managersCreated = 0;
  for (const { cuitBase, category, managers, ...rest } of FACTORIES) {
    const cuit = cuitDigits(cuitBase); // las fabricas guardan el CUIT en 11 digitos
    // Idem proveedores: unicidad de cuit solo entre activas (indice parcial), sin upsert.
    const factory =
      (await prisma.factory.findFirst({ where: { cuit, isActive: true } })) ??
      (await prisma.factory.create({ data: { cuit, categoryId: categoryIds.get(category)!, ...rest } }));

    // `id` es correlativo por fabrica (lo generaria el trigger fn_gen_id_manager).
    if ((await prisma.customer.count({ where: { factoryId: factory.id } })) === 0) {
      await prisma.customer.createMany({
        data: managers.map((manager, i) => ({ id: i + 1, factoryId: factory.id, ...manager })),
      });
      managersCreated += managers.length;
    }
  }

  const [categories, suppliers, factories, customers] = await Promise.all([
    prisma.category.count(),
    prisma.supplier.count(),
    prisma.factory.count(),
    prisma.customer.count(),
  ]);
  console.log(
    `Seed OK -> rubros: ${categories}, proveedores: ${suppliers}, fabricas: ${factories}, ` +
      `encargados: ${customers} (nuevos en esta corrida: ${managersCreated})`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
