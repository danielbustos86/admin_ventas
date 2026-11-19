import { api } from './client';
import type {
  Categoria,
  Producto,
  ResumenVentas,
  ListadoVentas,
  TipoProducto,
  MedioPago,
  UnidadMedida,
  Insumo,
  Receta,
  VentasPorProducto,
  VentasPorHorario,
  KioskoImage,
  KioskoState,
  Sabor,
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
      visibleWeb: boolean;
    }>,
  ) => api.patch<Producto>(`/api/productos/${id}`, data).then((r) => r.data),
  uploadImagen: (id: number, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api
      .post<Producto>(`/api/productos/${id}/imagen`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },
  setCombo: (id: number, componentes: { productoId: number; cantidad: number }[]) =>
    api.put(`/api/productos/${id}/combo`, { componentes }).then((r) => r.data),
  getReceta: (id: number) =>
    api.get<Receta>(`/api/productos/${id}/receta`).then((r) => r.data),
  setReceta: (id: number, items: { insumoId: number; cantidad: number }[]) =>
    api.put<Receta>(`/api/productos/${id}/receta`, { items }).then((r) => r.data),
};

export const InsumosAPI = {
  list: (incluirInactivos = false) =>
    api.get<Insumo[]>('/api/insumos', { params: { incluirInactivos } }).then((r) => r.data),
  create: (data: { nombre: string; unidadMedida: UnidadMedida; precioUnitario: number }) =>
    api.post<Insumo>('/api/insumos', data).then((r) => r.data),
  update: (
    id: number,
    data: Partial<{ nombre: string; unidadMedida: UnidadMedida; precioUnitario: number; activo: boolean }>,
  ) => api.patch<Insumo>(`/api/insumos/${id}`, data).then((r) => r.data),
  remove: (id: number) => api.delete(`/api/insumos/${id}`).then((r) => r.data),
};

export interface VentasFiltros {
  desde?: string;
  hasta?: string;
  medioPago?: MedioPago;
}

export const KioskoAPI = {
  state: () => api.get<KioskoState>('/api/kiosko/state').then((r) => r.data),
  listAll: (incluirInactivas = true) =>
    api
      .get<KioskoImage[]>('/api/kiosko/images', { params: { incluirInactivas } })
      .then((r) => r.data),
  upload: (file: File, titulo?: string, orden?: number) => {
    const form = new FormData();
    form.append('file', file);
    if (titulo) form.append('titulo', titulo);
    if (orden !== undefined) form.append('orden', String(orden));
    return api
      .post<KioskoImage>('/api/kiosko/images', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },
  update: (
    id: number,
    data: Partial<{ titulo: string | null; orden: number; activa: boolean }>,
  ) => api.patch<KioskoImage>(`/api/kiosko/images/${id}`, data).then((r) => r.data),
  remove: (id: number) =>
    api.delete(`/api/kiosko/images/${id}`).then((r) => r.data),
  pin: (id: number) =>
    api.post<KioskoState>(`/api/kiosko/pin/${id}`).then((r) => r.data),
  unpin: () => api.post<KioskoState>('/api/kiosko/unpin').then((r) => r.data),
};

export const SaboresAPI = {
  list: () => api.get<Sabor[]>('/api/sabores/admin').then((r) => r.data),
  create: (data: { nombre: string; color?: string; orden?: number }) =>
    api.post<Sabor>('/api/sabores', data).then((r) => r.data),
  update: (id: number, data: Partial<Pick<Sabor, 'nombre' | 'color' | 'orden' | 'activo'>>) =>
    api.patch<Sabor>(`/api/sabores/${id}`, data).then((r) => r.data),
  remove: (id: number) => api.delete(`/api/sabores/${id}`).then((r) => r.data),
};

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
