import { useEffect, useState } from 'react';
import { InsumosAPI } from '../api/endpoints';
import type { Insumo, UnidadMedida } from '../api/types';

function etiquetaPrecio(unidad: UnidadMedida): string {
  return unidad === 'GR' ? 'Precio por kilo (CLP)' : 'Precio por unidad (CLP)';
}

function sufijoUnidad(unidad: UnidadMedida): string {
  return unidad === 'GR' ? '/ kg' : '/ un';
}

export function InsumosPage() {
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [incluirInactivos, setIncluirInactivos] = useState(true);
  const [editing, setEditing] = useState<Insumo | null>(null);
  const [creating, setCreating] = useState(false);

  const reload = async () => {
    setLoading(true);
    try {
      setInsumos(await InsumosAPI.list(incluirInactivos));
      setError(null);
    } catch (e: any) {
      setError(e.response?.data?.message ?? 'Error al cargar insumos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
  }, [incluirInactivos]);

  const eliminar = async (ins: Insumo) => {
    if (!confirm(`¿Eliminar insumo "${ins.nombre}"?`)) return;
    try {
      await InsumosAPI.remove(ins.id);
      reload();
    } catch (e: any) {
      alert(e.response?.data?.message ?? 'Error al eliminar');
    }
  };

  return (
    <div>
      <h2>Insumos</h2>

      <div className="toolbar">
        <div className="field">
          <label>Mostrar</label>
          <select
            value={incluirInactivos ? 'todos' : 'activos'}
            onChange={(e) => setIncluirInactivos(e.target.value === 'todos')}
          >
            <option value="activos">Solo activos</option>
            <option value="todos">Todos</option>
          </select>
        </div>
        <button onClick={() => setCreating(true)}>+ Nuevo insumo</button>
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
                <th>Nombre</th>
                <th>Unidad</th>
                <th>Precio</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {insumos.map((i) => (
                <tr key={i.id}>
                  <td>{i.id}</td>
                  <td>{i.nombre}</td>
                  <td>{i.unidadMedida === 'GR' ? 'Gramos (precio por kg)' : 'Unidad'}</td>
                  <td>
                    ${i.precioUnitario.toLocaleString('es-CL')} {sufijoUnidad(i.unidadMedida)}
                  </td>
                  <td>
                    <span className={`badge ${i.activo ? 'success' : 'muted'}`}>
                      {i.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <button className="ghost" onClick={() => setEditing(i)} style={{ marginRight: 6 }}>
                      Editar
                    </button>
                    <button className="ghost" onClick={() => eliminar(i)}>
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
              {insumos.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--muted)' }}>
                    Sin insumos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {creating && (
        <InsumoForm
          onClose={() => setCreating(false)}
          onSaved={() => {
            setCreating(false);
            reload();
          }}
        />
      )}
      {editing && (
        <InsumoForm
          insumo={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            reload();
          }}
        />
      )}
    </div>
  );
}

function InsumoForm({
  insumo,
  onClose,
  onSaved,
}: {
  insumo?: Insumo;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [nombre, setNombre] = useState(insumo?.nombre ?? '');
  const [unidadMedida, setUnidadMedida] = useState<UnidadMedida>(insumo?.unidadMedida ?? 'GR');
  const [precioUnitario, setPrecioUnitario] = useState<number>(insumo?.precioUnitario ?? 0);
  const [activo, setActivo] = useState<boolean>(insumo?.activo ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setSaving(true);
    setError(null);
    try {
      if (insumo) {
        await InsumosAPI.update(insumo.id, { nombre, unidadMedida, precioUnitario, activo });
      } else {
        await InsumosAPI.create({ nombre, unidadMedida, precioUnitario });
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
        <h3>{insumo ? `Editar insumo #${insumo.id}` : 'Nuevo insumo'}</h3>
        <div className="form-grid">
          <div className="full">
            <label>Nombre</label>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="ej. Piña, Helado frutilla, Vaso 500cc"
              style={{ width: '100%' }}
            />
          </div>
          <div>
            <label>Unidad de medida</label>
            <select
              value={unidadMedida}
              onChange={(e) => setUnidadMedida(e.target.value as UnidadMedida)}
              style={{ width: '100%' }}
            >
              <option value="GR">Gramos</option>
              <option value="UN">Unidad</option>
            </select>
          </div>
          <div>
            <label>{etiquetaPrecio(unidadMedida)}</label>
            <input
              type="number"
              min={0}
              value={precioUnitario}
              onChange={(e) => setPrecioUnitario(parseInt(e.target.value || '0', 10))}
              style={{ width: '100%' }}
            />
          </div>
          {insumo && (
            <div>
              <label>Estado</label>
              <select
                value={activo ? '1' : '0'}
                onChange={(e) => setActivo(e.target.value === '1')}
                style={{ width: '100%' }}
              >
                <option value="1">Activo</option>
                <option value="0">Inactivo</option>
              </select>
            </div>
          )}
        </div>
        {unidadMedida === 'GR' && (
          <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 8 }}>
            Las recetas consumen este insumo en gramos. El costo se calcula como:
            cantidad_gramos × precio_kilo / 1000.
          </div>
        )}
        {error && <div className="error">{error}</div>}
        <div className="actions">
          <button className="ghost" onClick={onClose}>
            Cancelar
          </button>
          <button onClick={submit} disabled={saving || !nombre.trim() || precioUnitario < 0}>
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}
