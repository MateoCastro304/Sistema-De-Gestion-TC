import type { Customer } from '../types/customer'
import type { Factory } from '../types/factory'

/**
 * Tablas de fábricas y encargados del mock. La de fábricas la lee también el
 * mock de Rubros: un rubro no se da de baja si una fábrica activa lo usa.
 * Se resetean al recargar la página.
 */

export const customersDb = {
  // categoryId: ids de los rubros de categories.db ('3' Autopartes, '5' Petróleo y gas).
  factories: [
    {
      id: '1',
      name: 'EDASA',
      cuit: '30712345671',
      address: 'Av. Siempre Viva 123, Córdoba',
      payMethod: 'Cliente puntual con los pagos, suele abonar por transferencia a 30 días.',
      categoryId: '3',
      isActive: true,
    },
    {
      id: '2',
      name: 'OxyCAM',
      cuit: '30798765430',
      address: 'Ruta 9 Km 7, Córdoba',
      payMethod: 'Casi siempre paga adelantado. Pedir seña en trabajos grandes.',
      categoryId: '5',
      isActive: true,
    },
    {
      // Sin encargados: para ver el aviso de "no será posible enviar
      // informes de cotización" y poder darla de baja.
      id: '3',
      name: 'Agro Pampa',
      cuit: '30711122237',
      address: '',
      payMethod: '',
      categoryId: '4',
      isActive: true,
    },
  ] as Factory[],

  // `id` is a per-factory counter (DB `manager_customer(factory_id, id)`): it
  // restarts from 1 for each factory, so two managers in different factories can
  // share id '1'. A manager is identified by the (factoryId, id) pair.
  customers: [
    {
      id: '1',
      firstName: 'Laura',
      lastName: 'Gómez',
      phone: '+5493515550001',
      mail: 'compras@edasa.com',
      factoryId: '1',
      isActive: true,
    },
    {
      id: '1',
      firstName: 'Martín',
      lastName: 'Pérez',
      phone: '+5493515550002',
      mail: 'pedidos@oxycam.com',
      factoryId: '2',
      isActive: true,
    },
  ] as Customer[],
}

export function findFactory(id: string): Factory | undefined {
  return customersDb.factories.find((f) => f.id === id)
}
