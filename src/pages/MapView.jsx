import { useState, useMemo, useCallback, useEffect } from 'react';
import { usePlots } from '../context/PlotContext';
import { useAuth } from '../context/AuthContext';
import { createPlot, getPlot, subscribePlotSettings, updatePlotSettings } from '../firebase/firestore';
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

const DEFAULT_NEW_PLOT = {
  phase: '1',
  plotNumber: '',
  plotType: 'A',
  dimensions: '30×40 ft',
  areaSqYd: '133',
  facing: 'East',
  price: '',
};

function nextFreeSlot(items, cols) {
  const used = new Set(items.map((p) => `${p.row || 0}-${p.col || 0}`));
  for (let row = 0; row < 300; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const key = `${row}-${col}`;
      if (!used.has(key)) return { row, col };
    }
  }
  return { row: 0, col: 0 };
}

function labelText(plotNumber = '') {
  if (!plotNumber) return '—';
  const core = plotNumber.includes('-') ? plotNumber.split('-').pop() : plotNumber;
  return String(core).length > 4 ? `${String(core).slice(0, 3)}…` : core;
}

function shortPhaseLabel(name = '', fallback = 'Phase') {
  const clean = String(name || fallback).trim();
  return clean.length > 20 ? `${clean.slice(0, 19)}…` : clean;
}

export default function MapView() {
  const { plots, loading, dbError } = usePlots();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedPlot, setSelectedPlot] = useState(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPlot, setNewPlot] = useState(DEFAULT_NEW_PLOT);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [phaseNames, setPhaseNames] = useState({ 1: 'Phase 1', 2: 'Phase 2' });

  useEffect(() => {
    const unsub = subscribePlotSettings((data) => setPhaseNames(data.phaseNames));
    return unsub;
  }, []);

  const phase1 = useMemo(
    () => plots.filter((p) => Number(p.phase) === 1).sort((a, b) => (a.row - b.row) || (a.col - b.col) || String(a.plotNumber).localeCompare(String(b.plotNumber))),
    [plots]
  );
  const phase2 = useMemo(
    () => plots.filter((p) => Number(p.phase) === 2).sort((a, b) => (a.row - b.row) || (a.col - b.col) || String(a.plotNumber).localeCompare(String(b.plotNumber))),
    [plots]
  );

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

  const handleSavePhaseNames = async () => {
    setSettingsSaving(true);
    try {
      await updatePlotSettings(
        {
          phaseNames: {
            1: String(phaseNames[1] || 'Phase 1').trim() || 'Phase 1',
            2: String(phaseNames[2] || 'Phase 2').trim() || 'Phase 2',
          },
        },
        user?.email || 'system'
      );
    } finally {
      setSettingsSaving(false);
    }
  };

  const handleCreatePlot = async () => {
    const plotNumber = String(newPlot.plotNumber || '').trim().toUpperCase();
    if (!plotNumber) return;
    if (plots.some((p) => p.id === plotNumber || String(p.plotNumber || '').toUpperCase() === plotNumber)) {
      alert('A plot with this number already exists.');
      return;
    }

    const phase = Number(newPlot.phase) || 1;
    const cols = phase === 1 ? COLS_P1 : COLS_P2;
    const phaseItems = phase === 1 ? phase1 : phase2;
    const slot = nextFreeSlot(phaseItems, cols);

    await createPlot(
      {
        id: plotNumber,
        plotNumber,
        phase,
        plotType: String(newPlot.plotType || 'A').toUpperCase(),
        dimensions: String(newPlot.dimensions || '').trim(),
        areaSqYd: Number(newPlot.areaSqYd) || 0,
        facing: String(newPlot.facing || '').trim(),
        status: 'available',
        price: Number(newPlot.price) || 0,
        amountReceived: 0,
        amountPending: 0,
        buyerName: '',
        buyerPhone: '',
        notes: '',
        row: slot.row,
        col: slot.col,
      },
      user?.email || 'system'
    );

    setNewPlot(DEFAULT_NEW_PLOT);
    setShowAddForm(false);
  };

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

  // SVG dimensions
  const p1Rows = Math.max(1, Math.ceil(phase1.length / COLS_P1));
  const p2Rows = Math.max(1, Math.ceil(phase2.length / COLS_P2));
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
          {phaseNames[1]}: {phase1.length} plots &nbsp;·&nbsp; {phaseNames[2]}: {phase2.length} plots &nbsp;·&nbsp; Full edit mode enabled
        </p>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Phase 1 Name</label>
            <input
              className="form-input"
              value={phaseNames[1] || ''}
              onChange={(e) => setPhaseNames((prev) => ({ ...prev, 1: e.target.value }))}
              placeholder="Phase 1"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Phase 2 Name</label>
            <input
              className="form-input"
              value={phaseNames[2] || ''}
              onChange={(e) => setPhaseNames((prev) => ({ ...prev, 2: e.target.value }))}
              placeholder="Phase 2"
            />
          </div>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={handleSavePhaseNames} disabled={settingsSaving}>
          {settingsSaving ? 'Saving…' : '💾 Save Phase Names'}
        </button>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="flex-between">
          <h3 style={{ fontSize: 15, fontWeight: 700 }}>Add / Remove Plots</h3>
          <button className="btn btn-primary btn-sm" onClick={() => setShowAddForm((v) => !v)}>
            {showAddForm ? 'Close' : '+ Add New Plot'}
          </button>
        </div>

        {showAddForm && (
          <div style={{ marginTop: 12 }}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Plot Number</label>
                <input
                  className="form-input"
                  value={newPlot.plotNumber}
                  onChange={(e) => setNewPlot((p) => ({ ...p, plotNumber: e.target.value }))}
                  placeholder="e.g. P1-132"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Phase</label>
                <select
                  className="form-select"
                  value={newPlot.phase}
                  onChange={(e) => setNewPlot((p) => ({ ...p, phase: e.target.value }))}
                >
                  <option value="1">{phaseNames[1] || 'Phase 1'}</option>
                  <option value="2">{phaseNames[2] || 'Phase 2'}</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Dimensions</label>
                <input
                  className="form-input"
                  value={newPlot.dimensions}
                  onChange={(e) => setNewPlot((p) => ({ ...p, dimensions: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Area (sq yards)</label>
                <input
                  className="form-input"
                  type="number"
                  value={newPlot.areaSqYd}
                  onChange={(e) => setNewPlot((p) => ({ ...p, areaSqYd: e.target.value }))}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Facing</label>
                <select
                  className="form-select"
                  value={newPlot.facing}
                  onChange={(e) => setNewPlot((p) => ({ ...p, facing: e.target.value }))}
                >
                  <option value="East">East</option>
                  <option value="North">North</option>
                  <option value="West">West</option>
                  <option value="South">South</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Plot Type</label>
                <select
                  className="form-select"
                  value={newPlot.plotType}
                  onChange={(e) => setNewPlot((p) => ({ ...p, plotType: e.target.value }))}
                >
                  <option value="A">Type A</option>
                  <option value="B">Type B</option>
                  <option value="C">Type C</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Starting Price (optional)</label>
              <input
                className="form-input"
                type="number"
                value={newPlot.price}
                onChange={(e) => setNewPlot((p) => ({ ...p, price: e.target.value }))}
                placeholder="e.g. 450000"
              />
            </div>
            <button className="btn btn-success btn-sm" onClick={handleCreatePlot}>
              ✅ Create Plot
            </button>
            <p className="text-muted fs-12 mt-8">To remove a plot, open it from map and click delete in the drawer.</p>
          </div>
        )}
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
              {shortPhaseLabel(phaseNames[1], 'Phase 1').toUpperCase()} — {phase1.length} PLOTS
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
                      {labelText(p.plotNumber)}
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
                {shortPhaseLabel(phaseNames[2], 'Phase 2').toUpperCase()} — {phase2.length} PLOTS
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
                        {labelText(p.plotNumber)}
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
