import { useEffect, useMemo, useState } from 'react';
import { CategoriasAPI, ProductosAPI } from '../api/endpoints';
import type { Categoria, Producto, TipoProducto } from '../api/types';

export function ProductosPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtroCategoria, setFiltroCategoria] = useState<string>('');
  const [filtroTipo, setFiltroTipo] = useState<string>('');
  const [editing, setEditing] = useState<Producto | null>(null);
  const [creating, setCreating] = useState(false);
  const [comboFor, setComboFor] = useState<Producto | null>(null);

  const reload = async () => {
    setLoading(true);
    try {
      const [cats, prods] = await Promise.all([
        CategoriasAPI.list(true),
        ProductosAPI.list({
          categoriaId: filtroCategoria ? parseInt(filtroCategoria, 10) : undefined,
          tipo: (filtroTipo || undefined) as TipoProducto | undefined,
        }),
      ]);
      setCategorias(cats);
      setProductos(prods);
      setError(null);
    } catch (e: any) {
      setError(e.response?.data?.message ?? 'Error al cargar');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
  }, [filtroCategoria, filtroTipo]);

  const categoriasMap = useMemo(() => new Map(categorias.map((c) => [c.id, c])), [categorias]);

  return (
    <div>
      <h2>Productos</h2>

      <div className="toolbar">
        <div className="field">
          <label>Categoría</label>
          <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)}>
            <option value="">Todas</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Tipo</label>
          <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}>
            <option value="">Todos</option>
            <option value="SIMPLE">Simple</option>
            <option value="COMBO">Combo</option>
          </select>
        </div>
        <button onClick={() => setCreating(true)} disabled={categorias.length === 0}>+ Nuevo producto</button>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="card">
        {loading ? (
          <div>Cargando…</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Código</th>
                <th>Nombre</th>
                <th>Categoría</th>
                <th>Tipo</th>
                <th>Precio</th>
                <th>Variante</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {productos.map((p) => (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td>{p.codigo}</td>
                  <td>{p.nombre}</td>
                  <td>{categoriasMap.get(p.categoriaId)?.nombre ?? p.categoriaId}</td>
                  <td>
                    <span className={`badge ${p.tipo === 'COMBO' ? 'warn' : 'muted'}`}>{p.tipo}</span>
                  </td>
                  <td>${p.precioClp.toLocaleString('es-CL')}</td>
                  <td style={{ color: 'var(--muted)' }}>
                    {p.grupoVariante ? `${p.grupoVariante} / ${p.etiquetaVariante ?? ''}` : '—'}
                  </td>
                  <td>
                    <span className={`badge ${p.activo ? (p.disponible ? 'success' : 'warn') : 'muted'}`}>
                      {p.activo ? (p.disponible ? 'Disponible' : 'No disponible') : 'Inactivo'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <button className="ghost" onClick={() => setEditing(p)} style={{ marginRight: 6 }}>
                      Editar
                    </button>
                    {p.tipo === 'COMBO' && (
                      <button className="ghost" onClick={() => setComboFor(p)}>Combo</button>
                    )}
                  </td>
                </tr>
              ))}
              {productos.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', color: 'var(--muted)' }}>
                    Sin productos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {creating && (
        <ProductoForm
          categorias={categorias}
          onClose={() => setCreating(false)}
          onSaved={() => {
            setCreating(false);
            reload();
          }}
        />
      )}
      {editing && (
        <ProductoForm
          producto={editing}
          categorias={categorias}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            reload();
          }}
        />
      )}
      {comboFor && (
        <ComboForm
          combo={comboFor}
          productos={productos.filter((p) => p.tipo === 'SIMPLE' && p.id !== comboFor.id)}
          onClose={() => setComboFor(null)}
          onSaved={() => {
            setComboFor(null);
            reload();
          }}
        />
      )}
    </div>
  );
}

function ProductoForm({
  producto,
  categorias,
  onClose,
  onSaved,
}: {
  producto?: Producto;
  categorias: Categoria[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [codigo, setCodigo] = useState(producto?.codigo ?? '');
  const [nombre, setNombre] = useState(producto?.nombre ?? '');
  const [precioClp, setPrecioClp] = useState<number>(producto?.precioClp ?? 0);
  const [categoriaId, setCategoriaId] = useState<number>(producto?.categoriaId ?? categorias[0]?.id ?? 0);
  const [tipo, setTipo] = useState<TipoProducto>(producto?.tipo ?? 'SIMPLE');
  const [grupoVariante, setGrupoVariante] = useState(producto?.grupoVariante ?? '');
  const [etiquetaVariante, setEtiquetaVariante] = useState(producto?.etiquetaVariante ?? '');
  const [disponible, setDisponible] = useState(producto?.disponible ?? true);
  const [activo, setActivo] = useState(producto?.activo ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setSaving(true);
    setError(null);
    const payload = {
      codigo: codigo.trim(),
      nombre: nombre.trim(),
      precioClp,
      categoriaId,
      tipo,
      grupoVariante: grupoVariante.trim() || null,
      etiquetaVariante: etiquetaVariante.trim() || null,
      disponible,
      activo,
    };
    try {
      if (producto) {
        await ProductosAPI.update(producto.id, payload);
      } else {
        await ProductosAPI.create(payload);
      }
      onSaved();
    } catch (e: any) {
      const msg = e.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(', ') : (msg?.toString() ?? 'Error al guardar'));
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{producto ? `Editar producto #${producto.id}` : 'Nuevo producto'}</h3>
        <div className="form-grid">
          <div>
            <label>Código</label>
            <input value={codigo} onChange={(e) => setCodigo(e.target.value)} style={{ width: '100%' }} />
          </div>
          <div>
            <label>Precio (CLP)</label>
            <input
              type="number"
              min={0}
              value={precioClp}
              onChange={(e) => setPrecioClp(parseInt(e.target.value || '0', 10))}
              style={{ width: '100%' }}
            />
          </div>
          <div className="full">
            <label>Nombre</label>
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} style={{ width: '100%' }} />
          </div>
          <div>
            <label>Categoría</label>
            <select
              value={categoriaId}
              onChange={(e) => setCategoriaId(parseInt(e.target.value, 10))}
              style={{ width: '100%' }}
            >
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label>Tipo</label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value as TipoProducto)}
              style={{ width: '100%' }}
            >
              <option value="SIMPLE">Simple</option>
              <option value="COMBO">Combo</option>
            </select>
          </div>
          <div>
            <label>Grupo variante (opcional)</label>
            <input
              value={grupoVariante}
              onChange={(e) => setGrupoVariante(e.target.value)}
              placeholder="ej. Gaseosas"
              style={{ width: '100%' }}
            />
          </div>
          <div>
            <label>Etiqueta variante (opcional)</label>
            <input
              value={etiquetaVariante}
              onChange={(e) => setEtiquetaVariante(e.target.value)}
              placeholder="ej. Grande"
              style={{ width: '100%' }}
            />
          </div>
          {producto && (
            <>
              <div>
                <label>Disponible</label>
                <select
                  value={disponible ? '1' : '0'}
                  onChange={(e) => setDisponible(e.target.value === '1')}
                  style={{ width: '100%' }}
                >
                  <option value="1">Sí</option>
                  <option value="0">No</option>
                </select>
              </div>
              <div>
                <label>Activo</label>
                <select
                  value={activo ? '1' : '0'}
                  onChange={(e) => setActivo(e.target.value === '1')}
                  style={{ width: '100%' }}
                >
                  <option value="1">Sí</option>
                  <option value="0">No</option>
                </select>
              </div>
            </>
          )}
        </div>
        {error && <div className="error">{error}</div>}
        <div className="actions">
          <button className="ghost" onClick={onClose}>Cancelar</button>
          <button
            onClick={submit}
            disabled={saving || !codigo.trim() || !nombre.trim() || !categoriaId}
          >
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ComboForm({
  combo,
  productos,
  onClose,
  onSaved,
}: {
  combo: Producto;
  productos: Producto[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [componentes, setComponentes] = useState<{ productoId: number; cantidad: number }[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const add = () => {
    if (productos.length === 0) return;
    setComponentes([...componentes, { productoId: productos[0].id, cantidad: 1 }]);
  };

  const update = (i: number, patch: Partial<{ productoId: number; cantidad: number }>) =>
    setComponentes(componentes.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));

  const remove = (i: number) => setComponentes(componentes.filter((_, idx) => idx !== i));

  const submit = async () => {
    setSaving(true);
    setError(null);
    try {
      await ProductosAPI.setCombo(combo.id, componentes);
      onSaved();
    } catch (e: any) {
      setError(e.response?.data?.message?.toString() ?? 'Error al guardar');
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Componentes del combo "{combo.nombre}"</h3>
        {componentes.length === 0 && (
          <div style={{ color: 'var(--muted)', marginBottom: 12 }}>
            Agrega los productos que componen este combo.
          </div>
        )}
        {componentes.map((c, i) => (
          <div key={i} className="row" style={{ marginBottom: 8, alignItems: 'center' }}>
            <select
              value={c.productoId}
              onChange={(e) => update(i, { productoId: parseInt(e.target.value, 10) })}
              style={{ flex: 1 }}
            >
              {productos.map((p) => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
            <input
              type="number"
              min={1}
              value={c.cantidad}
              onChange={(e) => update(i, { cantidad: parseInt(e.target.value || '1', 10) })}
              style={{ width: 80 }}
            />
            <button className="ghost" onClick={() => remove(i)}>Quitar</button>
          </div>
        ))}
        <button className="ghost" onClick={add} disabled={productos.length === 0}>+ Agregar componente</button>
        {productos.length === 0 && (
          <div style={{ color: 'var(--muted)', marginTop: 8 }}>No hay productos SIMPLE disponibles.</div>
        )}
        {error && <div className="error">{error}</div>}
        <div className="actions">
          <button className="ghost" onClick={onClose}>Cancelar</button>
          <button onClick={submit} disabled={saving || componentes.length === 0}>
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}
