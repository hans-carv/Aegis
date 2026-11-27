// 1. PRINCIPIO STRATEGY (Polimorfismo / Composicion):
// Cada procedimiento clinico encapsula su propia regla de transicion sanitaria
// sin modificar el flujo principal del procesador clinico.


export interface EstadoGatoActual {
  id: string;
  estado: 'CUARENTENA' | 'DISPONIBLE' | 'ADOPCION' | 'ADOPTADO';
  esterilizado: boolean;
  resultadoVif: string;
  resultadoVilef: string;
  estadoMedico: 'SANO' | 'EN_TRATAMIENTO' | 'AISLAMIENTO';
}

export interface EstrategiaEventoClinico {
  calcularNuevoEstado(gatoActual: EstadoGatoActual): Partial<EstadoGatoActual>;
}

// Estrategia 1: Cirugia de Castración / Esterilización
export class EstrategiaCastracion implements EstrategiaEventoClinico {
  calcularNuevoEstado(gatoActual: EstadoGatoActual): Partial<EstadoGatoActual> {
    return {
      esterilizado: true,
      estadoMedico: 'SANO',
      estado: gatoActual.estado === 'CUARENTENA' ? 'DISPONIBLE' : gatoActual.estado,
    };
  }
}

// Estrategia 2: Tratamiento Critico / Aislamiento (oculta automaticamente del catalogo)
export class EstrategiaTratamientoCritico implements EstrategiaEventoClinico {
  calcularNuevoEstado(_gatoActual: EstadoGatoActual): Partial<EstadoGatoActual> {
    return {
      estadoMedico: 'EN_TRATAMIENTO',
      estado: 'CUARENTENA', // Bloquea adopcion y oculta de GET /api/public/cats
    };
  }
}

// Estrategia 3: Prueba Viral VIF/ViLeF (extensible sin tocar el flujo principal)
export class EstrategiaPruebaViral implements EstrategiaEventoClinico {
  constructor(
    private readonly vif: 'NEGATIVO' | 'POSITIVO',
    private readonly vilef: 'NEGATIVO' | 'POSITIVO'
  ) {}

  calcularNuevoEstado(gatoActual: EstadoGatoActual): Partial<EstadoGatoActual> {
    const esPositivo = this.vif === 'POSITIVO' || this.vilef === 'POSITIVO';
    return {
      resultadoVif: this.vif,
      resultadoVilef: this.vilef,
      estadoMedico: esPositivo ? 'AISLAMIENTO' : gatoActual.estadoMedico,
      estado: esPositivo ? 'CUARENTENA' : gatoActual.estado,
    };
  }
}

// 2. ORTOGONALIDAD (Interfaces de Repositorio y Auditoría desacopladas de SQL)


export interface RepositorioClinico {
  obtenerGatoPorId(gatoId: string): Promise<EstadoGatoActual | null>;
  guardarRegistroClinico(datos: Record<string, unknown>): Promise<any>;
  actualizarEstadoGato(gatoId: string, cambios: Partial<EstadoGatoActual>): Promise<EstadoGatoActual>;
}

export interface ServicioNotificacion {
  notificarAlertaSanitaria(gatoId: string, mensaje: string): Promise<void>;
}

// 3. FLUJO UNICO UNIFICADO (DRY + "Los programas muertos no mienten")

export class ProcesadorClinicoAegis {
  constructor(
    private readonly repositorio: RepositorioClinico,
    private readonly notificador: ServicioNotificacion
  ) {}

  async ejecutarProcedimiento(
    gatoId: string,
    datosRegistro: Record<string, unknown>,
    estrategia: EstrategiaEventoClinico
  ) {
    // DRY: unica validacion centralizada de existencia del felino
    const gatoActual = await this.repositorio.obtenerGatoPorId(gatoId);
    if (!gatoActual) {
      throw { status: 404, message: `El felino con ID ${gatoId} no existe.` };
    }

    // Polimorfismo: delega el calculo del nuevo estado sin if/else gigantes
    const cambiosEstado = estrategia.calcularNuevoEstado(gatoActual);

    // Fail Fast ("Los programas muertos no mienten"):
    // No hay catch silenciosos; si falla la BD o la notificación, el error detiene el flujo
    const registro = await this.repositorio.guardarRegistroClinico({
      gatoId,
      ...datosRegistro,
    });

    const gatoActualizado = await this.repositorio.actualizarEstadoGato(gatoId, cambiosEstado);

    if (gatoActualizado.estado === 'CUARENTENA') {
      await this.notificador.notificarAlertaSanitaria(
        gatoId,
        `Felino ${gatoId} movido a CUARENTENA y ocultado del catálogo público.`
      );
    }

    return { registro, gatoActualizado };
  }
}