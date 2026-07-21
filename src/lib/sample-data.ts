import type { AppData } from "./types";
import { createRegistroDiario } from "./defaults";

const OP1 = "op-demo-001";
const OP2 = "op-demo-002";
const SV1 = "sv-demo-001";

export function getSampleAppData(): AppData {
  const hoy = new Date();
  const ayer = new Date(hoy);
  ayer.setDate(ayer.getDate() - 1);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);

  const registroHoy = createRegistroDiario(fmt(hoy));
  registroHoy.operadorId = OP1;
  registroHoy.salvavidasId = SV1;
  registroHoy.condiciones = {
    horaInicio: "06:00",
    horaFinal: "18:00",
    temperaturaAire: 28,
    humedadRelativa: 65,
    numeroBanistas: 45,
    horasFiltracion: 12,
    presionTrabajo: 15,
    volumenRecirculado: 120,
    nivelAguaProfundidad: 1.8,
    volumenAguaSuministrada: 2,
    velocidadFlujo: 0.4,
    periodoRecirculacion: 6,
  };
  registroHoy.calidadFisica = {
    color: "aceptable",
    materiaFlotante: "aceptable",
    olor: "aceptable",
    transparencia: "aceptable",
  };
  registroHoy.calidadQuimica.ph = { manana: 7.4, mediodia: 7.5, tarde: 7.3 };
  registroHoy.calidadQuimica.cloroLibre = { manana: 1.8, mediodia: 1.6, tarde: 1.5 };
  registroHoy.calidadQuimica.cloroCombinado = { manana: 0.2, mediodia: 0.2, tarde: 0.3 };
  registroHoy.calidadQuimica.turbidez = 2;
  registroHoy.calidadQuimica.temperatura = 26;
  registroHoy.labores.limpiezaMaterialFlotante = true;
  registroHoy.labores.lavadoFiltro = true;
  registroHoy.labores.lavapies = true;

  return {
    instalacionId: "inst-demo-antioquia-001",
    ultimaSincronizacion: null,
    configuracion: {
      razonSocial: "Club Campestre El Bosque S.A.S.",
      representanteLegal: "Carlos Mendoza Garcia",
      administrador: "Ana Lucia Restrepo",
      operadores: [
        { id: OP1, nombre: "Juan Perez OPR-01", identificacion: "1012345678" },
        { id: OP2, nombre: "Maria Gomez OPR-02", identificacion: "1098765432" },
      ],
      direccion: "Calle 45 # 23-10",
      municipio: "Medellin",
      localidad: "El Poblado",
      telefonoFijo: "604-3214567",
      telefonoMovil: "300-1234567",
      nit: "900123456-7",
      email: "operaciones@clubbosque.com",
      salvavidas: [{ id: SV1, nombre: "Pedro Sanchez SV-01", identificacion: "1055544433" }],
      nombreEstanque: "Piscina Olimpica Principal",
      usoColectiva: true,
      usoPublico: true,
      usoParticular: false,
      presentacionDescubierta: true,
      presentacionCubierta: false,
      largo: 25,
      ancho: 12.5,
      diametro: null,
      profundidad: 2.0,
      volumen: 625,
      areaSuperficial: 312.5,
      maximoBanistas: 80,
      fuenteAguaPotable: true,
      fuenteAguaNatural: false,
      sistemaRecirculacion: true,
      sistemaRenovacionContinua: false,
      sistemaDesalojo: false,
      sistemaRestringido: false,
      sistemaEspecial: false,
    },
    registros: [registroHoy],
    visitas: [
      {
        id: crypto.randomUUID(),
        fecha: fmt(ayer),
        hora: "10:30",
        autoridadSanitaria: "Secretaria de Salud de Medellin",
        conceptoEmitido: "Cumple condiciones sanitarias. Continuar con registro diario.",
        funcionarioNombre: "Dra. Sandra Ruiz",
        funcionarioCargo: "Inspectora sanitaria",
      },
    ],
  };
}