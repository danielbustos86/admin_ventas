import { api } from './client';
import type {
  Categoria,
  Producto,
  ResumenVentas,
  ListadoVentas,
  TipoProducto,
  MedioPago,
  VentasPorProducto,
  VentasPorHorario,
} from './types';

export const CategoriasAPI = {
  list: (incluirInactivas = false) =>
    api.get<Categoria[]>('/api/categorias', { params: { incluirInactivas } }).then((r) => r.data),
  create: (data: { nombre: string; orden?: number }) =>
    api.post<Categoria>('/api/categorias', data).then((r) => r.data),
  update: (id: number, data: Partial<Pick<Categoria, 'nombre' | 'orden' | 'activa'>>) =>
    api.patch<Categoria>(`/api/categorias/${id}`, data).then((r) => r.data),
};

export const ProductosAPI = {
  list: (params?: { categoriaId?: number; tipo?: TipoProducto; soloDisponibles?: boolean }) =>
    api.get<Producto[]>('/api/productos', { params }).then((r) => r.data),
  create: (data: {
    codigo: string;
    nombre: string;
    precioClp: number;
    categoriaId: number;
    tipo?: TipoProducto;
    grupoVariante?: string | null;
    etiquetaVariante?: string | null;
    disponible?: boolean;
    activo?: boolean;
  }) => api.post<Producto>('/api/productos', data).then((r) => r.data),
  update: (
    id: number,
    data: Partial<{
      codigo: string;
      nombre: string;
      precioClp: number;
      categoriaId: number;
      tipo: TipoProducto;
      grupoVariante: string | null;
      etiquetaVariante: string | null;
      disponible: boolean;
      activo: boolean;
    }>,
  ) => api.patch<Producto>(`/api/productos/${id}`, data).then((r) => r.data),
  setCombo: (id: number, componentes: { productoId: number; cantidad: number }[]) =>
    api.put(`/api/productos/${id}/combo`, { componentes }).then((r) => r.data),
};

export interface VentasFiltros {
  desde?: string;
  hasta?: string;
  medioPago?: MedioPago;
}

export const VentasAPI = {
  resumen: (filtros: VentasFiltros) =>
    api.get<ResumenVentas>('/api/ventas/resumen', { params: filtros }).then((r) => r.data),
  listado: (filtros: VentasFiltros & { page?: number; pageSize?: number }) =>
    api.get<ListadoVentas>('/api/ventas', { params: filtros }).then((r) => r.data),
  porProducto: (filtros: { desde?: string; hasta?: string }) =>
    api.get<VentasPorProducto>('/api/ventas/por-producto', { params: filtros }).then((r) => r.data),
  porHorario: (filtros: VentasFiltros) =>
    api.get<VentasPorHorario>('/api/ventas/por-horario', { params: filtros }).then((r) => r.data),
};
