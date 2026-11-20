import { useEffect, useState } from 'react';
import { VisitasAPI } from '../api/endpoints';
import type { VisitaStat, VisitaRow } from '../api/types';

function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function hace30Dias() {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' });
}

function toIso(date: string, eod = false) {
  if (!date) return undefined;
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1, eod ? 23 : 0, eod ? 59 : 0, 0).toISOString();
}

export function VisitasPage() {
  const [desde, setDesde] = useState(hace30Dias());
  const [hasta, setHasta] = useState(todayIso());
  const [stats, setStats] = useState<VisitaStat[]>([]);
  const [listado, setListado] = useState<VisitaRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const consultar = async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, l] = await Promise.all([
        VisitasAPI.stats(toIso(desde), toIso(hasta, true)),
        VisitasAPI.listado(200),
      ]);
      setStats(s);
      setListado(l);
    } catch {
      setError('Error al cargar visitas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { consultar(); }, []);

  const totalVisitas = stats.reduce((s, r) => s + r.visitas, 0);
  const maxVisitas = stats[0]?.visitas ?? 1;

  return (
    <div>
      <h2>Visitas web por origen</h2>

      <div className="toolbar">
        <div className="field">
          <label>Desde</label>
          <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
        </div>
        <div className="field">
          <label>Hasta</label>
          <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
        </div>
        <button onClick={consultar} disabled={loading}>
          {loading ? 'Cargando…' : 'Consultar'}
        </button>
      </div>

      {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}

      {/* ── Ranking de orígenes ── */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <strong>Ranking de orígenes</strong>
          <span style={{ color: 'var(--muted)', fontSize: 13 }}>
            {totalVisitas} visita{totalVisitas !== 1 ? 's' : ''} en total
          </span>
        </div>

        {stats.length === 0 && !loading && (
          <p style={{ color: 'var(--muted)', margin: 0 }}>Sin datos en el período seleccionado.</p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {stats.map((row) => {
            const pct = totalVisitas > 0 ? (row.visitas / totalVisitas) * 100 : 0;
            const barW = totalVisitas > 0 ? (row.visitas / maxVisitas) * 100 : 0;
            return (
              <div key={row.origin}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
                  <code style={{ color: 'var(--accent)' }}>{row.origin}</code>
                  <span>
                    <strong>{row.visitas}</strong>
                    <span style={{ color: 'var(--muted)', marginLeft: 8 }}>{pct.toFixed(1)}%</span>
                  </span>
                </div>
                <div style={{ height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${barW}%`,
                      background: 'var(--accent)',
                      borderRadius: 4,
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Últimas visitas ── */}
      <div className="card">
        <strong style={{ display: 'block', marginBottom: 12 }}>
          Últimas {listado.length} visitas registradas
        </strong>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ color: 'var(--muted)', textAlign: 'left' }}>
                <th style={{ padding: '6px 10px', borderBottom: '1px solid var(--border)' }}>Origen</th>
                <th style={{ padding: '6px 10px', borderBottom: '1px solid var(--border)' }}>IP</th>
                <th style={{ padding: '6px 10px', borderBottom: '1px solid var(--border)' }}>Referrer</th>
                <th style={{ padding: '6px 10px', borderBottom: '1px solid var(--border)' }}>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {listado.map((v) => (
                <tr key={v.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '6px 10px' }}>
                    <code style={{ color: 'var(--accent)' }}>{v.origin}</code>
                  </td>
                  <td style={{ padding: '6px 10px', color: 'var(--muted)' }}>{v.ip ?? '—'}</td>
                  <td style={{ padding: '6px 10px', color: 'var(--muted)', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {v.referrer ?? '—'}
                  </td>
                  <td style={{ padding: '6px 10px', whiteSpace: 'nowrap' }}>{fmtDateTime(v.createdAt)}</td>
                </tr>
              ))}
              {listado.length === 0 && !loading && (
                <tr>
                  <td colSpan={4} style={{ padding: '12px 10px', color: 'var(--muted)', textAlign: 'center' }}>
                    Sin visitas registradas
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
