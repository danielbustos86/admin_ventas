import { useEffect, useState } from 'react';
import { SaboresAPI } from '../api/endpoints';
import type { Sabor } from '../api/types';

export function SaboresPage() {
  const [sabores, setSabores] = useState<Sabor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Sabor | null>(null);
  const [creating, setCreating] = useState(false);

  const reload = async () => {
    setLoading(true);
    try {
      setSabores(await SaboresAPI.list());
      setError(null);
    } catch (e: any) {
      setError(e.response?.data?.message ?? 'Error al cargar sabores');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { reload(); }, []);

  const handleDelete = async (s: Sabor) => {
    if (!confirm(`¿Eliminar "${s.nombre}"?`)) return;
    try {
      await SaboresAPI.remove(s.id);
      reload();
    } catch (e: any) {
      alert(e.response?.data?.message ?? 'Error al eliminar');
    }
  };

  return (
    <div>
      <h2>Sabores Actuales</h2>

      <div className="toolbar">
        <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
          {sabores.filter((s) => s.activo).length} activos · {sabores.length} total
        </span>
        <button onClick={() => setCreating(true)}>+ Nuevo sabor</button>
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
                <th>Color</th>
                <th>Nombre</th>
                <th>Orden</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sabores.map((s) => (
                <tr key={s.id}>
                  <td>{s.id}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 4,
                          background: s.color,
                          border: '1px solid rgba(0,0,0,0.15)',
                          flexShrink: 0,
                        }}
                      />
                      <code style={{ fontSize: '0.78rem' }}>{s.color}</code>
                    </div>
                  </td>
                  <td>{s.nombre}</td>
                  <td>{s.orden}</td>
                  <td>
                    <span className={`badge ${s.activo ? 'success' : 'muted'}`}>
                      {s.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <button className="ghost" onClick={() => setEditing(s)}>Editar</button>
                    <button
                      className="ghost"
                      style={{ color: 'var(--danger, #c0392b)', marginLeft: '0.25rem' }}
                      onClick={() => handleDelete(s)}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
              {sabores.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--muted)' }}>
                    Sin sabores. Crea el primero.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {creating && (
        <SaborForm
          onClose={() => setCreating(false)}
          onSaved={() => { setCreating(false); reload(); }}
        />
      )}
      {editing && (
        <SaborForm
          sabor={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); reload(); }}
        />
      )}
    </div>
  );
}

function SaborForm({
  sabor,
  onClose,
  onSaved,
}: {
  sabor?: Sabor;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [nombre, setNombre] = useState(sabor?.nombre ?? '');
  const [color, setColor]   = useState(sabor?.color ?? '#CCCCCC');
  const [orden, setOrden]   = useState<number>(sabor?.orden ?? 0);
  const [activo, setActivo] = useState<boolean>(sabor?.activo ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  const submit = async () => {
    setSaving(true);
    setError(null);
    try {
      if (sabor) {
        await SaboresAPI.update(sabor.id, { nombre, color, orden, activo });
      } else {
        await SaboresAPI.create({ nombre, color, orden });
      }
      onSaved();
    } catch (e: any) {
      setError(e.response?.data?.message?.toString() ?? 'Error al guardar');
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{sabor ? `Editar sabor #${sabor.id}` : 'Nuevo sabor'}</h3>
        <div className="form-grid">
          <div className="full">
            <label>Nombre</label>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Dulce de Leche"
              style={{ width: '100%' }}
            />
          </div>
          <div>
            <label>Color</label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value.toUpperCase())}
                style={{ width: 44, height: 36, padding: 2, cursor: 'pointer', borderRadius: 4 }}
              />
              <input
                value={color}
                onChange={(e) => setColor(e.target.value.toUpperCase())}
                placeholder="#CCCCCC"
                style={{ flex: 1 }}
                maxLength={7}
              />
            </div>
          </div>
          <div>
            <label>Orden</label>
            <input
              type="number"
              value={orden}
              onChange={(e) => setOrden(parseInt(e.target.value || '0', 10))}
              style={{ width: '100%' }}
            />
          </div>
          {sabor && (
            <div className="full">
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
        {error && <div className="error">{error}</div>}
        <div className="actions">
          <button className="ghost" onClick={onClose}>Cancelar</button>
          <button onClick={submit} disabled={saving || !nombre.trim()}>
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}
