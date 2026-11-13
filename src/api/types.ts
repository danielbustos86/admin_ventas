export type MedioPago = 'MERCADO_PAGO' | 'EFECTIVO';
export type EstadoPago = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO' | 'CANCELADO';
export type EstadoOrden = 'CREADA' | 'PAGANDO' | 'PAGADA' | 'RECHAZADA' | 'CANCELADA' | 'EXPIRADA';
export type TipoProducto = 'SIMPLE' | 'COMBO';
export type UnidadMedida = 'GR' | 'UN';

export interface Insumo {
  id: number;
  nombre: string;
  unidadMedida: UnidadMedida;
  precioUnitario: number;
  activo: boolean;
}

export interface RecetaItem {
  insumoId: number;
  insumo: Insumo;
  cantidad: number;
  costo: number;
}

export interface Receta {
  productoId: number;
  nombre: string;
  precioClp: number;
  costoTotal: number;
  margen: number;
  items: RecetaItem[];
}

export interface Categoria {
  id: number;
  nombre: string;
  orden: number;
  activa: boolean;
}

export interface Producto {
  id: number;
  codigo: string;
  nombre: string;
  precioClp: number;
  categoriaId: number;
  categoria?: Categoria;
  tipo: TipoProducto;
  grupoVariante: string | null;
  etiquetaVariante: string | null;
  disponible: boolean;
  activo: boolean;
}

export interface ResumenVentas {
  filtros: {
    desde: string | null;
    hasta: string | null;
    medioPago: MedioPago | null;
  };
  totalVentas: number;
  cantidadPagos: number;
  ticketPromedio: number;
  porMedioPago: { medioPago: string; total: number; cantidad: number }[];
  porDia: { dia: string; total: number; cantidad: number }[];
}

export interface VentaRow {
  pagoId: number;
  ordenId: number;
  numeroOrden: string;
  medioPago: MedioPago;
  monto: number;
  estadoPago: EstadoPago;
  fechaPago: string | null;
  estadoOrden: EstadoOrden;
  totalOrden: number;
  cantidadItems: number;
}

export interface ListadoVentas {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  data: VentaRow[];
}

export interface VentasPorProducto {
  filtros: { desde: string | null; hasta: string | null };
  data: {
    productoId: number;
    nombre: string;
    codigo: string;
    cantidad: number;
    total: number;
  }[];
}

export interface KioskoImage {
  id: number;
  filename: string;
  titulo: string | null;
  orden: number;
  activa: boolean;
  fijada: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface KioskoPublicImage {
  id: number;
  url: string;
  titulo: string | null;
  orden: number;
  fijada: boolean;
}

export interface KioskoState {
  images: KioskoPublicImage[];
  pinnedId: number | null;
}

export interface VentasPorHorario {
  filtros: {
    desde: string | null;
    hasta: string | null;
    medioPago: MedioPago | null;
  };
  totalPagos: number;
  totalVentas: number;
  porDiaSemana: { diaSemana: number; nombre: string; cantidad: number; total: number }[];
  porHora: { hora: number; cantidad: number; total: number }[];
  porDiaHora: { diaSemana: number; hora: number; cantidad: number; total: number }[];
  mejorDia: { diaSemana: number; nombre: string; cantidad: number; total: number } | null;
  mejorHora: { hora: number; cantidad: number; total: number } | null;
  mejorCelda:
    | { diaSemana: number; nombreDia: string; hora: number; cantidad: number; total: number }
    | null;
}
