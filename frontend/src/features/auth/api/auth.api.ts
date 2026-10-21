import { http } from '@/shared/api/http'
import type { LoginRequest, SessionResponse } from '../types/session'

const AUTH = '/auth'

/** Inicia sesión. El servidor deja la cookie del refresh token. */
export async function login(input: LoginRequest): Promise<SessionResponse> {
  const { data } = await http.post<SessionResponse>(`${AUTH}/login`, input)
  return data
}

/** Renueva el accessToken con la cookie del refresh token, sin cuerpo (D-45). */
export async function refresh(): Promise<SessionResponse> {
  const { data } = await http.post<SessionResponse>(`${AUTH}/refresh`)
  return data
}