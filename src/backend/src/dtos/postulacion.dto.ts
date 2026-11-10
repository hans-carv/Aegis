export interface CuestionarioViviendaDto {
  tieneMallasProteccion: boolean;
  permisoPropietario: boolean;
  compromisoTenenciaResponsable: boolean;
  otrosAnimalesEnCasa?: string;
  tiempoSoloAlDiaHoras?: number;
}

export interface CreatePostulacionDto {
  gatoId: string;
  presupuestoMensual: number;
  telefonoContacto: string;
  direccionDomicilio: string;
  cuestionario: CuestionarioViviendaDto;
}