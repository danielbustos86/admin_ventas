import { useEffect, useState } from 'react';
import { CategoriasAPI } from '../api/endpoints';
import type { Categoria } from '../api/types';

export function CategoriasPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [incluirInactivas, setIncluirInactivas] = useState(true);
  const [editing, setEditing] = useState<Categoria | null>(null);
  const [creating, setCreating] = useState(false);

  const reload = async () => {
    setLoading(true);
    try {
      setCategorias(await CategoriasAPI.list(incluirInactivas));
      setError(null);
    } catch (e: any) {
      setError(e.response?.data?.message ?? 'Error al cargar categorías');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
  }, [incluirInactivas]);

  return (
    <div>
      <h2>Categorías</h2>

      <div className="toolbar">
        <div className="field">
          <label>Mostrar</label>
          <select
            value={incluirInactivas ? 'todas' : 'activas'}
            onChange={(e) => setIncluirInactivas(e.target.value === 'todas')}
          >
            <option value="activas">Solo activas</option>
            <option value="todas">Todas</option>
          </select>
        </div>
        <button onClick={() => setCreating(true)}>+ Nueva categoría</button>
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
                <th>Orden</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {categorias.map((c) => (
                <tr key={c.id}>
                  <td>{c.id}</td>
                  <td>{c.nombre}</td>
                  <td>{c.orden}</td>
                  <td>
                    <span className={`badge ${c.activa ? 'success' : 'muted'}`}>
                      {c.activa ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="ghost" onClick={() => setEditing(c)}>Editar</button>
                  </td>
                </tr>
              ))}
              {categorias.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: 'var(--muted)' }}>
                    Sin categorías.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {creating && (
        <CategoriaForm
          onClose={() => setCreating(false)}
          onSaved={() => {
            setCreating(false);
            reload();
          }}
        />
      )}
      {editing && (
        <CategoriaForm
          categoria={editing}
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

function CategoriaForm({
  categoria,
  onClose,
  onSaved,
}: {
  categoria?: Categoria;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [nombre, setNombre] = useState(categoria?.nombre ?? '');
  const [orden, setOrden] = useState<number>(categoria?.orden ?? 0);
  const [activa, setActiva] = useState<boolean>(categoria?.activa ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setSaving(true);
    setError(null);
    try {
      if (categoria) {
        await CategoriasAPI.update(categoria.id, { nombre, orden, activa });
      } else {
        await CategoriasAPI.create({ nombre, orden });
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
        <h3>{categoria ? `Editar categoría #${categoria.id}` : 'Nueva categoría'}</h3>
        <div className="form-grid">
          <div className="full">
            <label>Nombre</label>
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} style={{ width: '100%' }} />
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
          {categoria && (
            <div>
              <label>Estado</label>
              <select
                value={activa ? '1' : '0'}
                onChange={(e) => setActiva(e.target.value === '1')}
                style={{ width: '100%' }}
              >
                <option value="1">Activa</option>
                <option value="0">Inactiva</option>
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
