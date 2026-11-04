import { Fragment, useEffect, useState } from 'react';
import { VentasAPI, type VentasFiltros } from '../api/endpoints';
import type {
  ListadoVentas,
  ResumenVentas,
  MedioPago,
  VentasPorProducto,
  VentasPorHorario,
} from '../api/types';

function toIsoFromLocal(date: string, time: string): string | undefined {
  if (!date) return undefined;
  const t = time || '00:00';
  const [y, m, d] = date.split('-').map(Number);
  const [hh, mm] = t.split(':').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1, hh ?? 0, mm ?? 0, 0).toISOString();
}

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function clp(n: number) {
  return `$${n.toLocaleString('es-CL')}`;
}

function fmtDateTime(iso: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' });
}

function fmtHora(h: number) {
  return `${String(h).padStart(2, '0')}:00`;
}

function heatLevel(cantidad: number, max: number): number {
  if (max <= 0 || cantidad <= 0) return 0;
  const ratio = cantidad / max;
  if (ratio >= 0.85) return 5;
  if (ratio >= 0.65) return 4;
  if (ratio >= 0.45) return 3;
  if (ratio >= 0.25) return 2;
  return 1;
}

export function VentasPage() {
  const [desdeFecha, setDesdeFecha] = useState(todayIso());
  const [desdeHora, setDesdeHora] = useState('00:00');
  const [hastaFecha, setHastaFecha] = useState(todayIso());
  const [hastaHora, setHastaHora] = useState('23:59');
  const [medioPago, setMedioPago] = useState<'' | MedioPago>('');

  const [resumen, setResumen] = useState<ResumenVentas | null>(null);
  const [listado, setListado] = useState<ListadoVentas | null>(null);
  const [porProducto, setPorProducto] = useState<VentasPorProducto | null>(null);
  const [porHorario, setPorHorario] = useState<VentasPorHorario | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buildFiltros = (): VentasFiltros => ({
    desde: toIsoFromLocal(desdeFecha, desdeHora),
    hasta: toIsoFromLocal(hastaFecha, hastaHora),
    medioPago: medioPago || undefined,
  });

  const consultar = async (p = 1) => {
    setLoading(true);
    setError(null);
    try {
      const filtros = buildFiltros();
      const [r, l, pp, ph] = await Promise.all([
        VentasAPI.resumen(filtros),
        VentasAPI.listado({ ...filtros, page: p, pageSize: 25 }),
        VentasAPI.porProducto({ desde: filtros.desde, hasta: filtros.hasta }),
        VentasAPI.porHorario(filtros),
      ]);
      setResumen(r);
      setListado(l);
      setPorProducto(pp);
      setPorHorario(ph);
      setPage(p);
    } catch (e: any) {
      setError(e.response?.data?.message?.toString() ?? 'Error al consultar ventas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    consultar(1);
  }, []);

  const limpiar = () => {
    setDesdeFecha(todayIso());
    setDesdeHora('00:00');
    setHastaFecha(todayIso());
    setHastaHora('23:59');
    setMedioPago('');
  };

  return (
    <div>
      <h2>Resumen de ventas</h2>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="toolbar">
          <div className="field">
            <label>Desde (fecha)</label>
            <input type="date" value={desdeFecha} onChange={(e) => setDesdeFecha(e.target.value)} />
          </div>
          <div className="field">
            <label>Desde (hora)</label>
            <input type="time" value={desdeHora} onChange={(e) => setDesdeHora(e.target.value)} />
          </div>
          <div className="field">
            <label>Hasta (fecha)</label>
            <input type="date" value={hastaFecha} onChange={(e) => setHastaFecha(e.target.value)} />
          </div>
          <div className="field">
            <label>Hasta (hora)</label>
            <input type="time" value={hastaHora} onChange={(e) => setHastaHora(e.target.value)} />
          </div>
          <div className="field">
            <label>Medio de pago</label>
            <select value={medioPago} onChange={(e) => setMedioPago(e.target.value as any)}>
              <option value="">Todos</option>
              <option value="EFECTIVO">Efectivo</option>
              <option value="MERCADO_PAGO">Mercado Pago</option>
            </select>
          </div>
          <button onClick={() => consultar(1)} disabled={loading}>
            {loading ? 'Consultando…' : 'Aplicar filtros'}
          </button>
          <button className="ghost" onClick={limpiar} disabled={loading}>Limpiar</button>
        </div>
      </div>

      {error && <div className="error" style={{ marginBottom: 16 }}>{error}</div>}

      {resumen && (
        <>
          <div className="kpis">
            <div className="kpi">
              <div className="label">Total vendido</div>
              <div className="value">{clp(resumen.totalVentas)}</div>
            </div>
            <div className="kpi">
              <div className="label">Cantidad de pagos</div>
              <div className="value">{resumen.cantidadPagos}</div>
            </div>
            <div className="kpi">
              <div className="label">Ticket promedio</div>
              <div className="value">{clp(resumen.ticketPromedio)}</div>
            </div>
          </div>

          <div className="row" style={{ marginBottom: 20, alignItems: 'stretch' }}>
            <div className="card" style={{ flex: 1, minWidth: 280 }}>
              <h3 style={{ marginTop: 0 }}>Por medio de pago</h3>
              <table className="table">
                <thead>
                  <tr>
                    <th>Medio</th>
                    <th>Pagos</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {resumen.porMedioPago.length === 0 && (
                    <tr><td colSpan={3} style={{ color: 'var(--muted)' }}>Sin datos.</td></tr>
                  )}
                  {resumen.porMedioPago.map((r) => (
                    <tr key={r.medioPago}>
                      <td>{r.medioPago === 'MERCADO_PAGO' ? 'Mercado Pago' : 'Efectivo'}</td>
                      <td>{r.cantidad}</td>
                      <td>{clp(r.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="card" style={{ flex: 1, minWidth: 280 }}>
              <h3 style={{ marginTop: 0 }}>Por día</h3>
              <table className="table">
                <thead>
                  <tr>
                    <th>Día</th>
                    <th>Pagos</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {resumen.porDia.length === 0 && (
                    <tr><td colSpan={3} style={{ color: 'var(--muted)' }}>Sin datos.</td></tr>
                  )}
                  {resumen.porDia.map((r) => (
                    <tr key={r.dia}>
                      <td>{r.dia}</td>
                      <td>{r.cantidad}</td>
                      <td>{clp(r.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {porProducto && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ marginTop: 0 }}>Ventas por producto</h3>
          <div style={{ color: 'var(--muted)', fontSize: 12, marginBottom: 8 }}>
            Suma de unidades de cada producto en órdenes creadas dentro del rango.
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Código</th>
                <th>Producto</th>
                <th style={{ textAlign: 'right' }}>Cantidad</th>
                <th style={{ textAlign: 'right' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {porProducto.data.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--muted)' }}>Sin ventas.</td></tr>
              )}
              {porProducto.data.map((r, idx) => (
                <tr key={r.productoId}>
                  <td>{idx + 1}</td>
                  <td>{r.codigo}</td>
                  <td>{r.nombre}</td>
                  <td style={{ textAlign: 'right' }}>{r.cantidad}</td>
                  <td style={{ textAlign: 'right' }}>{clp(r.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {porHorario && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ marginTop: 0 }}>Días y horas con más ventas</h3>
          <div style={{ color: 'var(--muted)', fontSize: 12, marginBottom: 12 }}>
            Pagos aprobados agrupados por día de la semana y hora local, dentro del rango.
          </div>

          {porHorario.totalPagos === 0 ? (
            <div style={{ color: 'var(--muted)' }}>Sin pagos aprobados en el rango.</div>
          ) : (
            <>
              <div className="kpis" style={{ marginBottom: 16 }}>
                <div className="kpi">
                  <div className="label">Día más fuerte</div>
                  <div className="value">
                    {porHorario.mejorDia ? porHorario.mejorDia.nombre : '—'}
                  </div>
                  {porHorario.mejorDia && (
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                      {porHorario.mejorDia.cantidad} pagos · {clp(porHorario.mejorDia.total)}
                    </div>
                  )}
                </div>
                <div className="kpi">
                  <div className="label">Hora peak</div>
                  <div className="value">
                    {porHorario.mejorHora
                      ? `${fmtHora(porHorario.mejorHora.hora)}–${fmtHora(porHorario.mejorHora.hora + 1)}`
                      : '—'}
                  </div>
                  {porHorario.mejorHora && (
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                      {porHorario.mejorHora.cantidad} pagos · {clp(porHorario.mejorHora.total)}
                    </div>
                  )}
                </div>
                <div className="kpi">
                  <div className="label">Momento más fuerte</div>
                  <div className="value">
                    {porHorario.mejorCelda
                      ? `${porHorario.mejorCelda.nombreDia} ${fmtHora(porHorario.mejorCelda.hora)}`
                      : '—'}
                  </div>
                  {porHorario.mejorCelda && (
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                      {porHorario.mejorCelda.cantidad} pagos · {clp(porHorario.mejorCelda.total)}
                    </div>
                  )}
                </div>
              </div>

              {(() => {
                const maxCelda = porHorario.porDiaHora.reduce((m, c) => Math.max(m, c.cantidad), 0);
                const matrix = new Map<string, { cantidad: number; total: number }>();
                porHorario.porDiaHora.forEach((c) =>
                  matrix.set(`${c.diaSemana}-${c.hora}`, { cantidad: c.cantidad, total: c.total }),
                );
                const ordenDias = [1, 2, 3, 4, 5, 6, 0];
                const nombres: Record<number, string> = {
                  0: 'Dom', 1: 'Lun', 2: 'Mar', 3: 'Mié', 4: 'Jue', 5: 'Vie', 6: 'Sáb',
                };
                return (
                  <div style={{ overflowX: 'auto', marginBottom: 16 }}>
                    <div className="heatmap" style={{ minWidth: 720 }}>
                      <div className="hm-corner"></div>
                      {Array.from({ length: 24 }, (_, h) => (
                        <div key={`col-${h}`} className="hm-colhead">{String(h).padStart(2, '0')}</div>
                      ))}
                      {ordenDias.map((dow) => (
                        <Fragment key={`row-${dow}`}>
                          <div className="hm-rowhead">{nombres[dow]}</div>
                          {Array.from({ length: 24 }, (_, h) => {
                            const cell = matrix.get(`${dow}-${h}`);
                            const cantidad = cell?.cantidad ?? 0;
                            const lvl = heatLevel(cantidad, maxCelda);
                            const titulo = cell
                              ? `${nombres[dow]} ${fmtHora(h)} — ${cantidad} pagos · ${clp(cell.total)}`
                              : `${nombres[dow]} ${fmtHora(h)} — sin ventas`;
                            return (
                              <div
                                key={`cell-${dow}-${h}`}
                                className={`hm-cell lvl-${lvl}`}
                                title={titulo}
                              >
                                {cantidad > 0 ? cantidad : ''}
                              </div>
                            );
                          })}
                        </Fragment>
                      ))}
                    </div>
                  </div>
                );
              })()}

              <div className="row" style={{ alignItems: 'stretch' }}>
                <div style={{ flex: 1, minWidth: 260 }}>
                  <h4 style={{ margin: '0 0 8px' }}>Por día de la semana</h4>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Día</th>
                        <th style={{ textAlign: 'right' }}>Pagos</th>
                        <th style={{ textAlign: 'right' }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[1, 2, 3, 4, 5, 6, 0].map((dow) => {
                        const r = porHorario.porDiaSemana[dow];
                        return (
                          <tr key={dow}>
                            <td>{r.nombre}</td>
                            <td style={{ textAlign: 'right' }}>{r.cantidad}</td>
                            <td style={{ textAlign: 'right' }}>{clp(r.total)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div style={{ flex: 1, minWidth: 260 }}>
                  <h4 style={{ margin: '0 0 8px' }}>Top 5 horas</h4>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Hora</th>
                        <th style={{ textAlign: 'right' }}>Pagos</th>
                        <th style={{ textAlign: 'right' }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...porHorario.porHora]
                        .filter((r) => r.cantidad > 0)
                        .sort((a, b) => b.cantidad - a.cantidad)
                        .slice(0, 5)
                        .map((r) => (
                          <tr key={r.hora}>
                            <td>{fmtHora(r.hora)}–{fmtHora(r.hora + 1)}</td>
                            <td style={{ textAlign: 'right' }}>{r.cantidad}</td>
                            <td style={{ textAlign: 'right' }}>{clp(r.total)}</td>
                          </tr>
                        ))}
                      {porHorario.porHora.every((r) => r.cantidad === 0) && (
                        <tr><td colSpan={3} style={{ color: 'var(--muted)' }}>Sin datos.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {listado && (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Pagos ({listado.total})</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Orden</th>
                <th>Medio</th>
                <th>Monto</th>
                <th>Ítems</th>
                <th>Estado pago</th>
                <th>Estado orden</th>
              </tr>
            </thead>
            <tbody>
              {listado.data.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--muted)' }}>Sin pagos.</td></tr>
              )}
              {listado.data.map((p) => (
                <tr key={p.pagoId}>
                  <td>{fmtDateTime(p.fechaPago)}</td>
                  <td>{p.numeroOrden}</td>
                  <td>{p.medioPago === 'MERCADO_PAGO' ? 'Mercado Pago' : 'Efectivo'}</td>
                  <td>{clp(p.monto)}</td>
                  <td>{p.cantidadItems}</td>
                  <td>
                    <span className={`badge ${p.estadoPago === 'APROBADO' ? 'success' : 'muted'}`}>
                      {p.estadoPago}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        p.estadoOrden === 'PAGADA'
                          ? 'success'
                          : p.estadoOrden === 'CANCELADA' || p.estadoOrden === 'RECHAZADA'
                          ? 'danger'
                          : 'muted'
                      }`}
                    >
                      {p.estadoOrden}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="pagination">
            <span style={{ color: 'var(--muted)' }}>
              Página {listado.page} de {listado.totalPages}
            </span>
            <button
              className="ghost"
              disabled={page <= 1 || loading}
              onClick={() => consultar(page - 1)}
            >
              Anterior
            </button>
            <button
              className="ghost"
              disabled={page >= listado.totalPages || loading}
              onClick={() => consultar(page + 1)}
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
