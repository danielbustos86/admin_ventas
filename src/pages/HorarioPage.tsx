import { useEffect, useRef, useState } from 'react';
import { HorarioAPI } from '../api/endpoints';
import type { DiaHorario, ForzarEstadoHorario } from '../api/types';

const DIA_NOMBRES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const HORARIO_DEFAULT: DiaHorario[] = DIA_NOMBRES.map((nombre, dia) => ({
  dia,
  nombre,
  cerrado: false,
  abre: '14:00',
  cierra: dia === 0 || dia === 6 ? '19:00' : '20:00',
}));

export function HorarioPage() {
  const [horario, setHorario]           = useState<DiaHorario[]>(HORARIO_DEFAULT);
  const [forzarEstado, setForzarEstado] = useState<ForzarEstadoHorario>('AUTO');
  const [loading, setLoading]           = useState(true);
  const [savingToggle, setSavingToggle] = useState(false);
  const [saving, setSaving]             = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [saved, setSaved]               = useState(false);
  const horarioRef = useRef(horario);
  horarioRef.current = horario;

  useEffect(() => {
    HorarioAPI.get()
      .then((data) => {
        setHorario(data.horario as DiaHorario[]);
        setForzarEstado(data.forzarEstado);
      })
      .catch((e) => setError(e.response?.data?.message ?? 'Error al cargar horario'))
      .finally(() => setLoading(false));
  }, []);

  const updateDia = (idx: number, patch: Partial<DiaHorario>) => {
    setHorario((prev) => prev.map((d, i) => (i === idx ? { ...d, ...patch } : d)));
    setSaved(false);
  };

  // El toggle de estado guarda al instante — sin necesidad de presionar Guardar
  const handleToggleForzar = async (nuevo: ForzarEstadoHorario) => {
    if (nuevo === forzarEstado || savingToggle) return;
    setSavingToggle(true);
    setError(null);
    try {
      const data = await HorarioAPI.update({ horario: horarioRef.current, forzarEstado: nuevo });
      setHorario(data.horario as DiaHorario[]);
      setForzarEstado(data.forzarEstado);
    } catch (e: any) {
      setError(e.response?.data?.message ?? 'Error al cambiar estado');
    } finally {
      setSavingToggle(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const data = await HorarioAPI.update({ horario, forzarEstado });
      setHorario(data.horario as DiaHorario[]);
      setForzarEstado(data.forzarEstado);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      setError(e.response?.data?.message ?? 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const estadoLabel: Record<ForzarEstadoHorario, string> = {
    AUTO:    'Automático (según horario)',
    ABIERTO: 'Forzar ABIERTO',
    CERRADO: 'Forzar CERRADO',
  };

  const estadoBadgeClass: Record<ForzarEstadoHorario, string> = {
    AUTO:    'muted',
    ABIERTO: 'success',
    CERRADO: 'danger',
  };

  return (
    <div>
      <h2>Horario de atención</h2>

      {/* ── Estado manual override ── */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginTop: 0, marginBottom: '0.5rem' }}>Estado del local</h3>
        <p style={{ color: 'var(--muted)', fontSize: '0.85rem', margin: '0 0 1rem 0' }}>
          Tiene prioridad sobre el horario. Se guarda al instante al hacer click.
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {(['AUTO', 'ABIERTO', 'CERRADO'] as ForzarEstadoHorario[]).map((opt) => {
            const isActive = forzarEstado === opt;
            return (
              <button
                key={opt}
                onClick={() => handleToggleForzar(opt)}
                disabled={savingToggle}
                style={{
                  padding: '0.6rem 1.2rem',
                  borderRadius: 8,
                  border: isActive ? '2px solid var(--accent, #2563eb)' : '2px solid transparent',
                  background: isActive ? 'var(--accent-bg, #eff6ff)' : 'var(--surface2, #f4f4f5)',
                  fontWeight: isActive ? 700 : 400,
                  cursor: savingToggle ? 'wait' : 'pointer',
                  fontSize: '0.9rem',
                  color: isActive
                    ? (opt === 'CERRADO' ? '#c0392b' : opt === 'ABIERTO' ? '#16a34a' : 'var(--accent, #2563eb)')
                    : 'inherit',
                  opacity: savingToggle && !isActive ? 0.5 : 1,
                  transition: 'all 0.15s',
                }}
              >
                {opt === 'AUTO'    && '🔄 '}
                {opt === 'ABIERTO' && '🟢 '}
                {opt === 'CERRADO' && '🔴 '}
                {savingToggle && isActive ? 'Guardando…' : estadoLabel[opt]}
              </button>
            );
          })}
        </div>

        <div style={{ marginTop: '1rem' }}>
          <span>Estado actual en web: </span>
          <span className={`badge ${estadoBadgeClass[forzarEstado]}`}>
            {forzarEstado === 'AUTO'    ? 'Según horario' :
             forzarEstado === 'ABIERTO' ? 'ABIERTO (manual)' :
                                          'CERRADO (manual)'}
          </span>
        </div>
      </div>

      {/* ── Horario semanal ── */}
      <div className="card">
        <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Horario semanal</h3>

        {loading ? (
          <div>Cargando…</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Día</th>
                <th>Estado</th>
                <th>Abre</th>
                <th>Cierra</th>
              </tr>
            </thead>
            <tbody>
              {horario.map((d, idx) => (
                <tr key={d.dia}>
                  <td style={{ fontWeight: 600 }}>{d.nombre}</td>
                  <td>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={!d.cerrado}
                        onChange={(e) => updateDia(idx, { cerrado: !e.target.checked })}
                      />
                      <span className={`badge ${d.cerrado ? 'muted' : 'success'}`}>
                        {d.cerrado ? 'Cerrado' : 'Abierto'}
                      </span>
                    </label>
                  </td>
                  <td>
                    <input
                      type="time"
                      value={d.abre ?? ''}
                      disabled={!!d.cerrado}
                      onChange={(e) => updateDia(idx, { abre: e.target.value })}
                      style={{ width: 110, opacity: d.cerrado ? 0.4 : 1 }}
                    />
                  </td>
                  <td>
                    <input
                      type="time"
                      value={d.cierra ?? ''}
                      disabled={!!d.cerrado}
                      onChange={(e) => updateDia(idx, { cierra: e.target.value })}
                      style={{ width: 110, opacity: d.cerrado ? 0.4 : 1 }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {error && <div className="error" style={{ marginTop: '1rem' }}>{error}</div>}

      <div className="toolbar" style={{ marginTop: '1.5rem', justifyContent: 'flex-end' }}>
        {saved && (
          <span className="badge success" style={{ marginRight: '1rem', padding: '0.4rem 0.9rem' }}>
            Horario guardado
          </span>
        )}
        <button onClick={handleSave} disabled={saving || loading}>
          {saving ? 'Guardando…' : 'Guardar horario'}
        </button>
      </div>
    </div>
  );
}
