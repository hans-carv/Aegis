export type TipoProcedimientoClinico =
  | 'CASTRACION'
  | 'PRUEBA_VIRAL'
  | 'TRATAMIENTO_FARMACOLOGICO'
  | 'CIRUGIA_GENERAL';

export type ResultadoViral = 'NO_REALIZADO' | 'PENDIENTE' | 'NEGATIVO' | 'POSITIVO';

export type EstadoMedico = 'SANO' | 'EN_TRATAMIENTO' | 'AISLAMIENTO';

export type TipoControlInmunologico = 'VACUNA' | 'DESPARASITACION';

export interface TratamientoClinicoRegistro {
  id: string;
  tipoProcedimiento: TipoProcedimientoClinico;
  diagnostico: string;
  descripcionTratamiento: string;
  esEsterilizacion: boolean;
  resultadoVif?: ResultadoViral | null;
  resultadoVilef?: ResultadoViral | null;
  estadoMedicoResultante: EstadoMedico;
  requiereAislamientoOCritico: boolean;
  veterinarioResponsable: string;
  administradorResponsable?: string;
  fechaRegistro: string;
}

export interface FichaSanitariaFelino {
  id: string;
  nombre: string;
  codigoFelino: string;
  estado: string;
  esterilizado: boolean;
  resultadoVif: ResultadoViral;
  resultadoVilef: ResultadoViral;
  estadoMedico: EstadoMedico;
}

export interface ExpedienteClinicoData {
  fichaSanitaria: FichaSanitariaFelino;
  historialClinico: TratamientoClinicoRegistro[];
}

export interface CreateTratamientoClinicoPayload {
  tipoProcedimiento: TipoProcedimientoClinico;
  diagnostico: string;
  descripcionTratamiento: string;
  esEsterilizacion?: boolean;
  resultadoVif?: ResultadoViral;
  resultadoVilef?: ResultadoViral;
  estadoMedico?: EstadoMedico;
  requiereAislamientoOCritico?: boolean;
  veterinarioResponsable: string;
}

export interface ControlInmunologicoRegistro {
  id: string;
  gatoId: string;
  tipoControl: TipoControlInmunologico;
  nombreBiologico: string;
  fechaAplicacion: string;
  fechaProximoRefuerzo: string;
  lote?: string | null;
  veterinarioResponsable?: string | null;
  observaciones?: string | null;
  createdAt?: string;
}

export interface CreateInmunizacionPayload {
  tipoControl: TipoControlInmunologico;
  nombreBiologico: string;
  fechaAplicacion: string;
  fechaProximoRefuerzo: string;
  lote?: string;
  veterinarioResponsable?: string;
  observaciones?: string;
}
