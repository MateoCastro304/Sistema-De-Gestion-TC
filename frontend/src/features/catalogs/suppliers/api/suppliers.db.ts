import type { Supplier } from '../types/supplier'

/**
 * Estado mutable del mock: los POST/PATCH/DELETE lo modifican, así la app se
 * comporta como si hubiera un backend. Se resetea al recargar la página.
 */
export const db = {
  suppliers: [
    {
      id: 1,
      legalName: 'Aceros del Sur S.A.',
      cuit: '30-70987654-2',
      supplierTypes: ['MATERIAL', 'PROCESS'],
      contactName: 'Diego Fernández',
      contactEmail: 'ventas@acerosdelsur.com',
      contactPhone: '+54 9 351 444-5678',
      address: 'Av. Circunvalación 4500, Córdoba',
      active: true,
      createdAt: '2026-03-11T14:20:00Z',
      updatedAt: '2026-03-11T14:20:00Z',
    },
    {
      id: 2,
      legalName: 'Metalúrgica Rivadavia S.R.L.',
      cuit: '30-71234567-1',
      supplierTypes: ['PAINT'],
      contactName: 'Laura Giménez',
      contactEmail: 'compras@metrivadavia.com.ar',
      contactPhone: '+54 9 11 5566-7788',
      address: 'Rivadavia 2310, Buenos Aires',
      active: true,
      createdAt: '2026-04-02T09:05:00Z',
      updatedAt: '2026-06-18T16:40:00Z',
    },
    {
      id: 3,
      legalName: 'Bronces Industriales Castro',
      cuit: '33-69874521-0',
      supplierTypes: ['REPLACEMENT'],
      contactName: 'Martín Sosa',
      contactEmail: 'info@broncescastro.com',
      contactPhone: '+54 9 341 220-1199',
      address: 'Parque Industrial Alvear, Rosario',
      active: true,
      createdAt: '2026-05-20T11:00:00Z',
      updatedAt: '2026-05-20T11:00:00Z',
    },
    {
      // Sin contacto ni teléfono: para ver cómo se comporta la tabla
      // cuando faltan los campos opcionales.
      id: 4,
      legalName: 'Insumos Técnicos del Litoral S.A.',
      cuit: '30-71987456-4',
      supplierTypes: ['PAINT'],
      contactEmail: 'pedidos@itlitoral.com.ar',
      address: 'Ruta 11 km 8, Santa Fe',
      active: true,
      createdAt: '2026-06-01T08:30:00Z',
      updatedAt: '2026-06-01T08:30:00Z',
    },
    {
      // Dado de baja: para ver el badge de inactivo sin tener que
      // dar de baja nada a mano.
      id: 5,
      legalName: 'Aluminios Pampa S.R.L.',
      cuit: '30-70112233-6',
      supplierTypes: ['PROCESS'],
      contactName: 'Carla Ibáñez',
      contactPhone: '+54 9 2954 33-8877',
      active: false,
      createdAt: '2026-07-14T13:15:00Z',
      updatedAt: '2026-08-02T10:10:00Z',
    },
    {
      // Sin CUIT: el cuit es opcional. Está acá para ver el guion en la
      // columna del listado y el encabezado sin CUIT en el detalle, sin
      // tener que dar de alta uno a mano en cada recarga.
      id: 6,
      legalName: 'Tornillos y Bulones del Centro',
      supplierTypes: ['REPLACEMENT'],
      contactName: 'Nadia Ruiz',
      contactEmail: 'ventas@tybcentro.com.ar',
      contactPhone: '+54 9 353 415-2200',
      address: 'Belgrano 145, Villa María',
      active: true,
      createdAt: '2026-08-19T10:45:00Z',
      updatedAt: '2026-08-19T10:45:00Z',
    },
  ] as Supplier[],
  nextId: 7,
}
