import { ProcessType } from '../../core/domain/entities/process-type.entity';
import { ProcessTypeListResponse } from './process-type-list.response';

const processType = ProcessType.reconstruct({
  id: 7,
  name: 'Armado / Desarmado',
  nameKey: 'armado / desarmado',
  description: null,
  hourlyRateArs: 1180,
  hourlyRateUsd: 0.85,
  exchangeRate: 1385.5,
  createdAt: new Date('2026-06-02T11:34:00.000Z'),
  updatedAt: new Date('2026-06-02T11:34:00.000Z'),
});

describe('ProcessTypeListResponse', () => {
  it('arma la página con el total y los parámetros efectivos', () => {
    expect(ProcessTypeListResponse.from({ items: [processType], total: 7 }, 2, 1)).toEqual({
      items: [
        {
          id: 7,
          name: 'Armado / Desarmado',
          description: null,
          hourlyRateArs: 1180,
          hourlyRateUsd: 0.85,
          exchangeRate: 1385.5,
          createdAt: '2026-06-02T11:34:00.000Z',
          updatedAt: '2026-06-02T11:34:00.000Z',
        },
      ],
      total: 7,
      page: 2,
      limit: 1,
    });
  });

  it('sin resultados devuelve items vacío y total 0, no un error', () => {
    expect(ProcessTypeListResponse.from({ items: [], total: 0 }, 1, 20)).toEqual({
      items: [],
      total: 0,
      page: 1,
      limit: 20,
    });
  });
});
