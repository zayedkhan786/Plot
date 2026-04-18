import { useState, useMemo, useCallback } from 'react';
import { usePlots } from '../context/PlotContext';
import { getPlot } from '../firebase/firestore';
import { PLOT_COLORS } from '../utils/plotData';
import { formatLakhs } from '../utils/indianNumbers';
import PlotDrawer from './PlotDrawer';
import { useNavigate } from 'react-router-dom';

const CELL_W  = 52;
const CELL_H  = 38;
const GAP     = 4;
const ROAD_W  = 28;
const COLS_P1 = 13;
const COLS_P2 = 7;

export default function MapView() {
  const { plots, loading, dbError } = usePlots();
  const navigate = useNavigate();
  const [filter, setFilter]           = useState('all');
  const [search, setSearch]           = useState('');
  const [selectedPlot, setSelectedPlot] = useState(null);
  const [drawerLoading, setDrawerLoading] = useState(false);

  const phase1 = useMemo(() => plots.filter((p) => p.phase === 1), [plots]);
  const phase2 = useMemo(() => plots.filter((p) => p.phase === 2), [plots]);

  const filterPlot = useCallback((p) => {
    if (filter !== 'all' && p.status !== filter) return false;
    if (search) {
      const s = search.toLowerCase();
      if (!p.plotNumber.toLowerCase().includes(s) &&
          !(p.buyerName || '').toLowerCase().includes(s)) return false;
    }
    return true;
  }, [filter, search]);

  const handlePlotClick = useCallback(async (p) => {
    // Fetch the freshest data from Firestore before opening
    setDrawerLoading(true);
    try {
      const fresh = await getPlot(p.id);
      setSelectedPlot(fresh || p);
    } catch {
      setSelectedPlot(p);
    } finally {
      setDrawerLoading(false);
    }
  }, []);

  if (loading) {
    return <div className="loading-screen"><div className="spinner" /><span style={{ marginTop: 16, color: 'var(--text-secondary)' }}>Loading plots…</span></div>;
  }

  if (dbError) {
    return (
      <div className="loading-screen">
        <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
        <h3 style={{ color: 'var(--text-primary)', marginBottom: 8 }}>Firebase not connected</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>{dbError}</p>
        <button className="btn btn-primary" onClick={() => navigate('/seed')}>⚙️ Go to Setup Guide</button>
      </div>
    );
  }

  if (plots.length === 0) {
    return (
      <div className="page-wrapper">
        <div className="page-header">
          <h1 className="page-title">🗺️ Plot Map</h1>
        </div>
        <div className="empty-state" style={{ marginTop: 60 }}>
          <div className="empty-state-icon">🌱</div>
          <h3>No plots in database yet</h3>
          <p style={{ marginBottom: 20 }}>Go to Setup to initialize all 166 plots</p>
          <button className="btn btn-primary" onClick={() => navigate('/seed')}>⚙️ Setup & Seed Database</button>
        </div>
      </div>
    );
  }

  // SVG dimensions
  const p1Rows = Math.ceil(phase1.length / COLS_P1);
  const p2Rows = Math.ceil(phase2.length / COLS_P2);
  const p1W = COLS_P1 * (CELL_W + GAP) + ROAD_W;
  const p1H = p1Rows * (CELL_H + GAP) + ROAD_W * 2 + 30;
  const p2W = COLS_P2 * (CELL_W + GAP) + 20;
  const p2H = p2Rows * (CELL_H + GAP) + ROAD_W + 30;
  const totalW = p1W + 60 + p2W;
  const totalH = Math.max(p1H, p2H) + 20;

  return (
    <div className="page-wrapper" style={{ maxWidth: '100%' }}>
      <div className="page-header">
        <h1 className="page-title">🗺️ Plot Map</h1>
        <p className="page-subtitle">
          Phase 1: {phase1.length} plots &nbsp;·&nbsp; Phase 2: {phase2.length} plots &nbsp;·&nbsp;
          Click any plot to <strong>view or edit</strong>
        </p>
      </div>

      <div className="map-container">
        {/* Toolbar */}
        <div className="map-toolbar">
          <span className="map-toolbar-title">Shree Dungar Residency — Site Layout</span>

          <div className="search-box" style={{ flex: '0 0 220px' }}>
            <span className="search-icon">🔍</span>
            <input
              placeholder="Plot no. or buyer name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[
              { f: 'all',       label: 'All', count: plots.length },
              { f: 'available', label: 'Available', count: plots.filter(p=>p.status==='available').length },
              { f: 'pending',   label: 'Pending',   count: plots.filter(p=>p.status==='pending').length },
              { f: 'sold',      label: 'Sold',      count: plots.filter(p=>p.status==='sold').length },
            ].map(({ f, label, count }) => (
              <button
                key={f}
                className={`filter-chip ${filter === f ? `active-${f}` : ''}`}
                onClick={() => setFilter(f)}
                id={`map-filter-${f}`}
              >
                {label} ({count})
              </button>
            ))}
          </div>

          {/* Legend */}
          <div className="legend">
            {[['available','🔵'],['pending','🟡'],['sold','✅']].map(([s, e]) => (
              <div key={s} className="legend-item">
                <div className="legend-dot" style={{ background: PLOT_COLORS[s] }} />
                {s.charAt(0).toUpperCase()+s.slice(1)}
              </div>
            ))}
            <div className="legend-item"><div className="legend-dot" style={{ background: '#2A6049' }} />Park</div>
          </div>
        </div>

        {/* Map Canvas */}
        <div className="map-scroll-area">
          {drawerLoading && (
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 10 }}>
              <div className="spinner" />
            </div>
          )}

          <svg className="plot-map-svg" width={totalW} height={totalH} viewBox={`0 0 ${totalW} ${totalH}`}>

            {/* ── PHASE 1 ── */}
            <rect x={0} y={0} width={p1W} height={p1H} fill="#0D1B2A" rx={8} />
            <rect x={0} y={30} width={ROAD_W} height={p1H - 60} fill="#3A3A3A" rx={3} />
            <rect x={0} y={p1H - ROAD_W} width={p1W} height={ROAD_W} fill="#3A3A3A" rx={3} />
            <text x={p1W / 2} y={18} textAnchor="middle" fill="#8FA8C8" fontSize={11} fontWeight={700} fontFamily="Outfit, sans-serif">
              PHASE 1 — {phase1.length} PLOTS
            </text>
            <text x={12} y={p1H / 2} fill="#666" fontSize={9} textAnchor="middle"
              transform={`rotate(-90, 12, ${p1H / 2})`}>MAIN ROAD</text>
            <text x={p1W / 2} y={p1H - 6} fill="#666" fontSize={9} textAnchor="middle">CHIRAWA ROAD</text>

            {/* Park area (Phase 1 bottom-right) */}
            {(() => {
              const parkCols = 3, parkRows = 2;
              const px = ROAD_W + (COLS_P1 - parkCols) * (CELL_W + GAP);
              const py = 30 + ROAD_W / 2 + (p1Rows - parkRows - 1) * (CELL_H + GAP);
              return (
                <g>
                  <rect x={px} y={py} width={(CELL_W + GAP) * parkCols - GAP} height={(CELL_H + GAP) * parkRows - GAP} fill="#1B3A2B" rx={4} />
                  <text x={px + ((CELL_W + GAP) * parkCols - GAP) / 2} y={py + (CELL_H + GAP) * parkRows / 2}
                    textAnchor="middle" dominantBaseline="middle" fill="#34D399" fontSize={8} fontWeight={700}>
                    🌳 PARK
                  </text>
                </g>
              );
            })()}

            {phase1.map((p) => {
              const visible = filterPlot(p);
              const color   = visible ? PLOT_COLORS[p.status] : '#1A2235';
              const x = ROAD_W + p.col * (CELL_W + GAP);
              const y = 30 + ROAD_W / 2 + p.row * (CELL_H + GAP);
              // Skip park slots
              const isPark = p.col >= COLS_P1 - 3 && p.row >= p1Rows - 3;
              if (isPark) return null;
              return (
                <g key={p.id} onClick={() => visible && handlePlotClick(p)} style={{ cursor: visible ? 'pointer' : 'default' }}>
                  <rect x={x} y={y} width={CELL_W} height={CELL_H} fill={color} opacity={visible ? 0.88 : 0.2} rx={3} />
                  {visible && (
                    <text x={x + CELL_W/2} y={y + CELL_H/2 + 1} textAnchor="middle" dominantBaseline="middle"
                      fill="#fff" fontSize={7} fontWeight={700} style={{ pointerEvents: 'none' }}>
                      {p.plotNumber.replace('P1-','')}
                    </text>
                  )}
                </g>
              );
            })}

            {/* ── PHASE 2 ── */}
            <g transform={`translate(${p1W + 60}, 0)`}>
              <rect x={0} y={0} width={p2W} height={p2H} fill="#0D1B2A" rx={8} />
              <rect x={0} y={p2H - ROAD_W} width={p2W} height={ROAD_W} fill="#3A3A3A" rx={3} />
              <text x={p2W / 2} y={18} textAnchor="middle" fill="#8FA8C8" fontSize={11} fontWeight={700} fontFamily="Outfit, sans-serif">
                PHASE 2 — {phase2.length} PLOTS
              </text>
              <text x={p2W / 2} y={p2H - 6} fill="#666" fontSize={9} textAnchor="middle">SEHI KALAN ROAD</text>

              {phase2.map((p) => {
                const visible = filterPlot(p);
                const color   = visible ? PLOT_COLORS[p.status] : '#1A2235';
                const x = p.col * (CELL_W + GAP);
                const y = 30 + p.row * (CELL_H + GAP);
                return (
                  <g key={p.id} onClick={() => visible && handlePlotClick(p)} style={{ cursor: visible ? 'pointer' : 'default' }}>
                    <rect x={x} y={y} width={CELL_W} height={CELL_H} fill={color} opacity={visible ? 0.88 : 0.2} rx={3} />
                    {visible && (
                      <text x={x + CELL_W/2} y={y + CELL_H/2 + 1} textAnchor="middle" dominantBaseline="middle"
                        fill="#fff" fontSize={7} fontWeight={700} style={{ pointerEvents: 'none' }}>
                        {p.plotNumber.replace('P2-','')}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          </svg>
        </div>
      </div>

      {/* Status summary cards */}
      <div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
        {['available','pending','sold'].map((s) => {
          const list = plots.filter((p) => p.status === s);
          return (
            <div key={s} className="card" style={{ flex: '1', minWidth: 180 }}>
              <div className="flex-between">
                <span className={`badge badge-${s}`}>{s.charAt(0).toUpperCase()+s.slice(1)}</span>
                <span style={{ fontSize: 28, fontWeight: 800 }}>{list.length}</span>
              </div>
              <div className="text-muted fs-12 mt-8">
                ₹{formatLakhs(list.reduce((a,p)=>a+(p.amountReceived||0),0)).replace('₹','')} received
              </div>
            </div>
          );
        })}
      </div>

      {/* Drawer */}
      {selectedPlot && (
        <PlotDrawer
          plot={selectedPlot}
          onClose={() => setSelectedPlot(null)}
          onUpdated={() => setSelectedPlot(null)}
        />
      )}
    </div>
  );
}
