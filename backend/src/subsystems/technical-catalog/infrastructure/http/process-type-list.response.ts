import { ProcessTypeListResult } from '../../core/domain/ports/process-type.repository';
import { ProcessTypeResponse, ProcessTypeResponseBody } from './process-type.response';

export type ProcessTypeListResponseBody = {
  items: ProcessTypeResponseBody[];
  total: number;
  page: number;
  limit: number;
};

/** Arma la respuesta de GET /process-types (§3.4): la página, el total y los parámetros efectivos. */
export class ProcessTypeListResponse {
  static from(result: ProcessTypeListResult, page: number, limit: number): ProcessTypeListResponseBody {
    return {
      items: result.items.map((item) => ProcessTypeResponse.from(item)),
      total: result.total,
      page,
      limit,
    };
  }
}
