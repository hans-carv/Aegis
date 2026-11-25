// src/services/clinicoService.ts
import { apiRequest } from './api';
import type {
  ExpedienteClinicoData,
  CreateTratamientoClinicoPayload,
  ControlInmunologicoRegistro,
  CreateInmunizacionPayload,
  TratamientoClinicoRegistro,
  FichaSanitariaFelino,
} from '../types/clinico';

export async function obtenerExpedienteClinico(gatoId: string): Promise<ExpedienteClinicoData> {
  const res = await apiRequest<{ ok: boolean; data: ExpedienteClinicoData }>(
    `/admin/cats/${gatoId}/historial-clinico`
  );
  return res.data;
}

export async function registrarTratamientoClinico(
  gatoId: string,
  payload: CreateTratamientoClinicoPayload
): Promise<{
  registroClinico: TratamientoClinicoRegistro;
  estadoFelinoActualizado: FichaSanitariaFelino;
}> {
  const res = await apiRequest<{
    ok: boolean;
    mensaje: string;
    data: {
      registroClinico: TratamientoClinicoRegistro;
      estadoFelinoActualizado: FichaSanitariaFelino;
    };
  }>(`/admin/cats/${gatoId}/historial-clinico`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.data;
}

export async function obtenerInmunizaciones(gatoId: string): Promise<ControlInmunologicoRegistro[]> {
  const res = await apiRequest<{ ok: boolean; data: ControlInmunologicoRegistro[] }>(
    `/admin/cats/${gatoId}/inmunizaciones`
  );
  return res.data || [];
}

export async function registrarInmunizacion(
  gatoId: string,
  payload: CreateInmunizacionPayload
): Promise<ControlInmunologicoRegistro> {
  const res = await apiRequest<{
    ok: boolean;
    mensaje: string;
    data: ControlInmunologicoRegistro;
  }>(`/admin/cats/${gatoId}/inmunizaciones`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.data;
}
