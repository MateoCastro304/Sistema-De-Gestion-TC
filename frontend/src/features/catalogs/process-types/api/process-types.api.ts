import { http } from '@/shared/api/http'
import type { Page } from '@/shared/api/pagination'
import type {
    ExchangeRate,
    ProcessType,
    ProcessTypeCreate,
    ProcessTypeHistoryEntry,
    ProcessTypeListParams,
    ProcessTypeUpdate,
} from '../types/process-type'

const PROCESS_TYPES = '/process-types'

export async function listProcessTypes(params?: ProcessTypeListParams): Promise<Page<ProcessType>> {
  const { data } = await http.get<Page<ProcessType>>(PROCESS_TYPES, { params })
  return data
}

//Cuantos tipos de proceso hay en total
export async function countProcessTypes(): Promise<number> {
  const { total } = await listProcessTypes({ page: 1, limit: 1 })
  return total
}

//detalle de un proceso
export async function getProcessType(id: number): Promise<ProcessType> {
  const { data } = await http.get<ProcessType>(`${PROCESS_TYPES}/${id}`)
  return data
}

export async function getProcessTypeHistory(id: number): Promise<ProcessTypeHistoryEntry[]> {
    const {data} = await http.get<{items: ProcessTypeHistoryEntry[]}>(`${PROCESS_TYPES}/${id}/history`)
    return data.items
}   

export async function createProcessType(input: ProcessTypeCreate): Promise<ProcessType> {
    const { data } = await http.post<ProcessType>(PROCESS_TYPES, input)
    return data
}

export async function updateProcessType(id:number, input: ProcessTypeUpdate): Promise<ProcessType> {
    const { data } = await http.patch<ProcessType>(`${PROCESS_TYPES}/${id}`, input)
    return data
}

export async function getExchangeRate(): Promise<ExchangeRate> {
    const { data } = await http.get<ExchangeRate>('/exchange-rate')
    return data
}