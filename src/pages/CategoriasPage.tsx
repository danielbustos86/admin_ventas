import { useEffect, useState } from 'react';
import { CategoriasAPI } from '../api/endpoints';
import type { Categoria } from '../api/types';

export function CategoriasPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Categoria | null>(null);
  const [creating, setCreating] = useState(false);

  const reload = async () => {
    setLoading(true);
    try {
      setCategorias(await CategoriasAPI.list(true));
      setError(null);
    } catch (e: any) {
      setError(e.response?.data?.message ?? 'Error al cargar categorías');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { reload(); }, []);

  const sorted = [...categorias].sort((a, b) => a.orden - b.orden);

  const move = async (cat: Categoria, dir: -1 | 1) => {
    const idx = sorted.findIndex(c => c.id === cat.id);
    const neighbor = sorted[idx + dir];
    if (!neighbor) return;
    await Promise.all([
      CategoriasAPI.update(cat.id,      { orden: neighbor.orden }),
      CategoriasAPI.update(neighbor.id, { orden: cat.orden }),
    ]);
    reload();
  };

  const toggleActiva = async (cat: Categoria) => {
    await CategoriasAPI.update(cat.id, { activa: !cat.activa });
    reload();
  };

  return (
    <div>
      <h2>Categorías</h2>

      <div className="toolbar">
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
                <th>Orden</th>
                <th>Nombre</th>
                <th>Visible en web</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((c, idx) => (
                <tr key={c.id} style={{ opacity: c.activa ? 1 : 0.5 }}>
                  <td>
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      <button
                        className="ghost"
                        style={{ padding: '2px 6px' }}
                        disabled={idx === 0}
                        onClick={() => move(c, -1)}
                      >↑</button>
                      <button
                        className="ghost"
                        style={{ padding: '2px 6px' }}
                        disabled={idx === sorted.length - 1}
                        onClick={() => move(c, 1)}
                      >↓</button>
                      <span style={{ color: 'var(--muted)', fontSize: '0.85em', minWidth: '20px' }}>{idx + 1}</span>
                    </div>
                  </td>
                  <td>{c.nombre}</td>
                  <td>
                    <button
                      className={`badge ${c.activa ? 'success' : 'muted'}`}
                      style={{ cursor: 'pointer', border: 'none', background: 'none' }}
                      onClick={() => toggleActiva(c)}
                      title={c.activa ? 'Click para ocultar' : 'Click para mostrar'}
                    >
                      {c.activa ? 'Visible' : 'Oculta'}
                    </button>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="ghost" onClick={() => setEditing(c)}>Editar</button>
                  </td>
                </tr>
              ))}
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', color: 'var(--muted)' }}>
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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setSaving(true);
    setError(null);
    try {
      if (categoria) {
        await CategoriasAPI.update(categoria.id, { nombre });
      } else {
        await CategoriasAPI.create({ nombre });
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
