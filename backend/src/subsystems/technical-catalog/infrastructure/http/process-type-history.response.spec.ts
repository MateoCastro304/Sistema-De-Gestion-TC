import { ProcessTypePriceChange } from '../../core/domain/entities/process-type-price-change.entity';
import { ProcessTypeHistoryResponse } from './process-type-history.response';

describe('ProcessTypeHistoryResponse', () => {
  it('mapea cada cambio con el usuario y respeta el orden recibido', () => {
    const newer = ProcessTypePriceChange.reconstruct({
      id: 14,
      changedAt: new Date('2026-10-01T13:22:00.000Z'),
      changedBy: { id: 4, username: 'lbenitez' },
      exchangeRate: 1377.88,
      previousValueUsd: 1.21,
      newValueUsd: 1.13,
    });
    const older = ProcessTypePriceChange.reconstruct({
      id: 6,
      changedAt: new Date('2026-07-04T14:05:00.000Z'),
      changedBy: { id: 3, username: 'fpaz' },
      exchangeRate: 1287.5,
      previousValueUsd: 1.1,
      newValueUsd: 1.21,
    });

    expect(ProcessTypeHistoryResponse.from([newer, older])).toEqual({
      items: [
        {
          id: 14,
          changedAt: '2026-10-01T13:22:00.000Z',
          changedBy: { id: 4, username: 'lbenitez' },
          exchangeRate: 1377.88,
          previousValueUsd: 1.21,
          newValueUsd: 1.13,
        },
        {
          id: 6,
          changedAt: '2026-07-04T14:05:00.000Z',
          changedBy: { id: 3, username: 'fpaz' },
          exchangeRate: 1287.5,
          previousValueUsd: 1.1,
          newValueUsd: 1.21,
        },
      ],
    });
  });

  it('sin cambios de precio devuelve items vacío', () => {
    expect(ProcessTypeHistoryResponse.from([])).toEqual({ items: [] });
  });
});
