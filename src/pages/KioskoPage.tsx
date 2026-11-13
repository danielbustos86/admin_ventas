import { useEffect, useRef, useState } from 'react';
import { KioskoAPI } from '../api/endpoints';
import type { KioskoImage } from '../api/types';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001';

export function KioskoPage() {
  const [images, setImages] = useState<KioskoImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState<KioskoImage | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const pinned = images.find((i) => i.fijada) ?? null;

  const reload = async () => {
    try {
      setImages(await KioskoAPI.listAll(true));
      setError(null);
    } catch (e: any) {
      setError(e.response?.data?.message ?? 'Error al cargar imágenes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
    const t = setInterval(reload, 5000);
    return () => clearInterval(t);
  }, []);

  const onPickFile = () => fileInputRef.current?.click();

  const onFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      await KioskoAPI.upload(file);
      await reload();
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Error al subir imagen');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const togglePin = async (img: KioskoImage) => {
    setBusyId(img.id);
    try {
      if (img.fijada) {
        await KioskoAPI.unpin();
      } else {
        await KioskoAPI.pin(img.id);
      }
      await reload();
    } catch (e: any) {
      setError(e.response?.data?.message ?? 'Error al cambiar la fijación');
    } finally {
      setBusyId(null);
    }
  };

  const unpinAll = async () => {
    setBusyId(-1);
    try {
      await KioskoAPI.unpin();
      await reload();
    } finally {
      setBusyId(null);
    }
  };

  const toggleActiva = async (img: KioskoImage) => {
    setBusyId(img.id);
    try {
      await KioskoAPI.update(img.id, { activa: !img.activa });
      await reload();
    } catch (e: any) {
      setError(e.response?.data?.message ?? 'Error al actualizar');
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (img: KioskoImage) => {
    if (!confirm(`¿Eliminar imagen "${img.titulo ?? img.filename}"?`)) return;
    setBusyId(img.id);
    try {
      await KioskoAPI.remove(img.id);
      await reload();
    } catch (e: any) {
      setError(e.response?.data?.message ?? 'Error al eliminar');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <h2>Kiosko</h2>

      <div className="kiosko-banner">
        {pinned ? (
          <>
            <div>
              <div className="kiosko-banner-label">Carrusel detenido en</div>
              <div className="kiosko-banner-title">
                {pinned.titulo ?? `Imagen #${pinned.id}`}
              </div>
            </div>
            <button
              className="danger"
              disabled={busyId === -1}
              onClick={unpinAll}
            >
              {busyId === -1 ? 'Reanudando…' : '▶ Reanudar carrusel'}
            </button>
          </>
        ) : (
          <>
            <div>
              <div className="kiosko-banner-label">Estado</div>
              <div className="kiosko-banner-title">
                Carrusel rotando ({images.filter((i) => i.activa).length} imágenes activas)
              </div>
            </div>
            <span className="badge success" style={{ fontSize: 13, padding: '6px 12px' }}>
              En vivo
            </span>
          </>
        )}
      </div>

      <div className="toolbar">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          style={{ display: 'none' }}
          onChange={onFileSelected}
        />
        <button onClick={onPickFile} disabled={uploading}>
          {uploading ? 'Subiendo…' : '+ Subir imagen'}
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="card">
        {loading ? (
          <div>Cargando…</div>
        ) : images.length === 0 ? (
          <div style={{ color: 'var(--muted)', textAlign: 'center', padding: 40 }}>
            Sin imágenes. Sube la primera con "+ Subir imagen".
          </div>
        ) : (
          <div className="kiosko-grid">
            {images.map((img) => (
              <div
                key={img.id}
                className={`kiosko-card ${img.fijada ? 'pinned' : ''} ${
                  !img.activa ? 'inactive' : ''
                }`}
              >
                <div className="kiosko-thumb">
                  <img src={`${API_BASE}/uploads/kiosko/${img.filename}`} alt="" />
                  {img.fijada && <div className="kiosko-pin-flag">📌 FIJADA</div>}
                  {!img.activa && <div className="kiosko-inactive-flag">INACTIVA</div>}
                </div>
                <div className="kiosko-meta">
                  <div className="kiosko-title">
                    {img.titulo ?? <em style={{ color: 'var(--muted)' }}>Sin título</em>}
                  </div>
                  <div className="kiosko-sub">
                    orden {img.orden} · #{img.id}
                  </div>
                </div>
                <div className="kiosko-actions">
                  <button
                    className={img.fijada ? 'danger' : ''}
                    disabled={busyId === img.id || !img.activa}
                    onClick={() => togglePin(img)}
                    title={
                      !img.activa
                        ? 'Solo se pueden fijar imágenes activas'
                        : img.fijada
                        ? 'Reanudar carrusel'
                        : 'Detener carrusel aquí'
                    }
                  >
                    {img.fijada ? '▶ Reanudar' : '📌 Fijar'}
                  </button>
                  <button
                    className="ghost"
                    disabled={busyId === img.id}
                    onClick={() => setEditing(img)}
                  >
                    Editar
                  </button>
                  <button
                    className="ghost"
                    disabled={busyId === img.id}
                    onClick={() => toggleActiva(img)}
                  >
                    {img.activa ? 'Desactivar' : 'Activar'}
                  </button>
                  <button
                    className="ghost"
                    disabled={busyId === img.id}
                    onClick={() => remove(img)}
                  >
                    🗑
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editing && (
        <EditForm
          image={editing}
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

function EditForm({
  image,
  onClose,
  onSaved,
}: {
  image: KioskoImage;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [titulo, setTitulo] = useState(image.titulo ?? '');
  const [orden, setOrden] = useState<number>(image.orden);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setSaving(true);
    setError(null);
    try {
      await KioskoAPI.update(image.id, {
        titulo: titulo.trim() || null,
        orden,
      });
      onSaved();
    } catch (e: any) {
      setError(e.response?.data?.message ?? 'Error al guardar');
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Editar imagen #{image.id}</h3>
        <div className="form-grid">
          <div className="full">
            <label>Título</label>
            <input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ej: Frappé de vainilla"
              style={{ width: '100%' }}
            />
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
        </div>
        {error && <div className="error">{error}</div>}
        <div className="actions">
          <button className="ghost" onClick={onClose}>Cancelar</button>
          <button onClick={submit} disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}
