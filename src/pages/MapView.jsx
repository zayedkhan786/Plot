import { useState, useMemo, useCallback, useEffect } from 'react';
import { usePlots } from '../context/PlotContext';
import { useAuth } from '../context/AuthContext';
import { createPlot, getPlot, subscribePlotSettings, updatePlotSettings } from '../firebase/firestore';
import { PLOT_COLORS } from '../utils/plotData';
import { formatLakhs } from '../utils/indianNumbers';
import {
  mergePhasesWithPlots,
  clampPhaseCols,
  DEFAULT_PHASES,
} from '../utils/plotPhaseSettings';
import PlotDrawer from './PlotDrawer';
import { useNavigate } from 'react-router-dom';

const CELL_W = 52;
const CELL_H = 38;
const GAP = 4;
const ROAD_W = 28;

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
  const [phaseConfig, setPhaseConfig] = useState(DEFAULT_PHASES);
  const [newPhaseName, setNewPhaseName] = useState('');
  const [newPhaseCols, setNewPhaseCols] = useState('8');
  const [activePhaseIndex, setActivePhaseIndex] = useState(0);

  useEffect(() => {
    const unsub = subscribePlotSettings((data) => setPhaseConfig(data.phases));
    return unsub;
  }, []);

  const phases = useMemo(() => mergePhasesWithPlots(phaseConfig, plots), [phaseConfig, plots]);

  const filterPlot = useCallback(
    (p) => {
      if (filter !== 'all' && p.status !== filter) return false;
      if (search) {
        const s = search.toLowerCase();
        if (!p.plotNumber.toLowerCase().includes(s) && !(p.buyerName || '').toLowerCase().includes(s)) return false;
      }
      return true;
    },
    [filter, search]
  );

  const handlePlotClick = useCallback(async (p) => {
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

  const phaseBlocks = useMemo(() => {
    return phases.map((cfg) => {
      const list = plots
        .filter((p) => Number(p.phase) === cfg.id)
        .sort(
          (a, b) =>
            (a.row - b.row) || (a.col - b.col) || String(a.plotNumber).localeCompare(String(b.plotNumber))
        );
      const cols = clampPhaseCols(cfg.cols);
      const nRows = Math.max(1, Math.ceil(Math.max(list.length, 1) / cols));
      const isLegacyP1 = cfg.id === 1 && cols === 13;

      let width;
      let height;
      if (isLegacyP1) {
        width = cols * (CELL_W + GAP) + ROAD_W;
        height = nRows * (CELL_H + GAP) + ROAD_W * 2 + 30;
      } else {
        width = cols * (CELL_W + GAP) + 20;
        height = nRows * (CELL_H + GAP) + ROAD_W + 30;
      }

      return {
        cfg: { ...cfg, cols },
        list,
        cols,
        nRows,
        width,
        height,
        isLegacyP1,
      };
    });
  }, [phases, plots]);

  useEffect(() => {
    setActivePhaseIndex((prev) => {
      if (phaseBlocks.length === 0) return 0;
      return Math.min(Math.max(0, prev), phaseBlocks.length - 1);
    });
  }, [phaseBlocks.length]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      const t = e.target;
      if (t && (t.closest?.('input, textarea, select') || t.isContentEditable)) return;
      if (phaseBlocks.length <= 1) return;
      e.preventDefault();
      setActivePhaseIndex((i) => {
        if (e.key === 'ArrowLeft') return Math.max(0, i - 1);
        return Math.min(phaseBlocks.length - 1, i + 1);
      });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phaseBlocks.length]);

  const handleSavePhases = async () => {
    const toSave = mergePhasesWithPlots(phaseConfig, plots);
    setSettingsSaving(true);
    try {
      await updatePlotSettings({ phases: toSave }, user?.email || 'system');
      setPhaseConfig(toSave);
    } finally {
      setSettingsSaving(false);
    }
  };

  const updatePhaseRow = (id, patch) => {
    setPhaseConfig((prev) => {
      const merged = mergePhasesWithPlots(prev, plots);
      return merged.map((p) => (p.id === id ? { ...p, ...patch } : p));
    });
  };

  const handleAddPhase = () => {
    const merged = mergePhasesWithPlots(phaseConfig, plots);
    const nextId = Math.max(0, ...merged.map((p) => p.id)) + 1;
    const name = newPhaseName.trim() || `Phase ${nextId}`;
    const cols = clampPhaseCols(newPhaseCols);
    setPhaseConfig([...merged, { id: nextId, name, cols }]);
    setNewPhaseName('');
    setNewPhaseCols('8');
  };

  const handleCreatePlot = async () => {
    const plotNumber = String(newPlot.plotNumber || '').trim().toUpperCase();
    if (!plotNumber) return;
    if (plots.some((p) => p.id === plotNumber || String(p.plotNumber || '').toUpperCase() === plotNumber)) {
      alert('A plot with this number already exists.');
      return;
    }

    const phaseId = Number(newPlot.phase) || 1;
    const cfg = phases.find((p) => p.id === phaseId);
    const cols = cfg ? clampPhaseCols(cfg.cols) : 8;
    const phaseItems = plots.filter((p) => Number(p.phase) === phaseId);
    const slot = nextFreeSlot(phaseItems, cols);

    await createPlot(
      {
        id: plotNumber,
        plotNumber,
        phase: phaseId,
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

    setNewPlot({ ...DEFAULT_NEW_PLOT, phase: String(phaseId) });
    setShowAddForm(false);
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <span style={{ marginTop: 16, color: 'var(--text-secondary)' }}>Loading plots…</span>
      </div>
    );
  }

  if (dbError) {
    return (
      <div className="loading-screen">
        <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
        <h3 style={{ color: 'var(--text-primary)', marginBottom: 8 }}>Firebase not connected</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>{dbError}</p>
        <button className="btn btn-primary" onClick={() => navigate('/seed')}>
          ⚙️ Go to Setup Guide
        </button>
      </div>
    );
  }

  const phaseSummary = phases.map((p) => {
    const n = plots.filter((x) => Number(x.phase) === p.id).length;
    return `${p.name}: ${n}`;
  }).join(' · ');

  const currentBlock = phaseBlocks[activePhaseIndex];
  const totalW = currentBlock ? currentBlock.width : 400;
  const totalH = currentBlock ? currentBlock.height + 20 : 200;
  const canPrev = activePhaseIndex > 0;
  const canNext = activePhaseIndex < phaseBlocks.length - 1;

  return (
    <div className="page-wrapper" style={{ maxWidth: '100%' }}>
      <div className="page-header">
        <h1 className="page-title">🗺️ Plot Map</h1>
        <p className="page-subtitle">{phaseSummary || 'Configure phases below'} · Use arrows on the map to switch phases · Click a plot to edit</p>
      </div>

      <div className="card map-phases-card" style={{ marginBottom: 14 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Phases &amp; layout</h3>
        <p className="text-muted fs-12" style={{ marginBottom: 12, lineHeight: 1.6 }}>
          Set display name and <strong>columns</strong> per phase (controls grid width). The map shows <strong>one phase at a time</strong> — use arrows below to switch. Save to sync Firebase.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {phases.map((ph) => (
            <div key={ph.id} className="map-phase-row">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Phase {ph.id} name</label>
                <input
                  className="form-input"
                  value={ph.name}
                  onChange={(e) => updatePhaseRow(ph.id, { name: e.target.value })}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Cols</label>
                <input
                  className="form-input"
                  type="number"
                  min={3}
                  max={24}
                  value={ph.cols}
                  onChange={(e) => updatePhaseRow(ph.id, { cols: clampPhaseCols(e.target.value) })}
                />
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 14, alignItems: 'flex-end' }}>
          <div className="form-group" style={{ marginBottom: 0, flex: '1 1 140px' }}>
            <label className="form-label">New phase name</label>
            <input
              className="form-input"
              value={newPhaseName}
              onChange={(e) => setNewPhaseName(e.target.value)}
              placeholder="e.g. Phase 3"
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0, width: 88 }}>
            <label className="form-label">Cols</label>
            <input
              className="form-input"
              type="number"
              min={3}
              max={24}
              value={newPhaseCols}
              onChange={(e) => setNewPhaseCols(e.target.value)}
            />
          </div>
          <button type="button" className="btn btn-primary btn-sm" onClick={handleAddPhase}>
            + Add phase
          </button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={handleSavePhases} disabled={settingsSaving}>
            {settingsSaving ? 'Saving…' : '💾 Save phases'}
          </button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="flex-between">
          <h3 style={{ fontSize: 15, fontWeight: 700 }}>Add / Remove Plots</h3>
          <button type="button" className="btn btn-primary btn-sm" onClick={() => setShowAddForm((v) => !v)}>
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
                  placeholder="e.g. P3-001"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Phase</label>
                <select
                  className="form-select"
                  value={newPlot.phase}
                  onChange={(e) => setNewPlot((p) => ({ ...p, phase: e.target.value }))}
                >
                  {phases.map((ph) => (
                    <option key={ph.id} value={String(ph.id)}>
                      {ph.name} (id {ph.id})
                    </option>
                  ))}
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
            <button type="button" className="btn btn-success btn-sm" onClick={handleCreatePlot}>
              ✅ Create Plot
            </button>
            <p className="text-muted fs-12 mt-8">To remove a plot, open it from the map and use Delete in the drawer.</p>
          </div>
        )}
      </div>

      <div className="map-container">
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
              { f: 'all', label: 'All', count: plots.length },
              { f: 'available', label: 'Available', count: plots.filter((p) => p.status === 'available').length },
              { f: 'pending', label: 'Pending', count: plots.filter((p) => p.status === 'pending').length },
              { f: 'sold', label: 'Sold', count: plots.filter((p) => p.status === 'sold').length },
            ].map(({ f, label, count }) => (
              <button
                key={f}
                type="button"
                className={`filter-chip ${filter === f ? `active-${f}` : ''}`}
                onClick={() => setFilter(f)}
                id={`map-filter-${f}`}
              >
                {label} ({count})
              </button>
            ))}
          </div>

          <div className="legend">
            {['available', 'pending', 'sold'].map((s) => (
              <div key={s} className="legend-item">
                <div className="legend-dot" style={{ background: PLOT_COLORS[s] }} />
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </div>
            ))}
            <div className="legend-item">
              <div className="legend-dot" style={{ background: '#2A6049' }} />
              Park
            </div>
          </div>
        </div>

        {phaseBlocks.length > 0 && (
          <div className="map-phase-nav" role="navigation" aria-label="Switch phase">
            <button
              type="button"
              className="map-phase-nav-btn"
              onClick={() => setActivePhaseIndex((i) => Math.max(0, i - 1))}
              disabled={!canPrev}
              aria-label="Previous phase"
            >
              ◀
            </button>
            <div className="map-phase-nav-center">
              <span className="map-phase-nav-name">
                {currentBlock ? shortPhaseLabel(currentBlock.cfg.name, `Phase ${currentBlock.cfg.id}`) : ''}
              </span>
              <span className="map-phase-nav-count text-muted fs-12">
                {activePhaseIndex + 1} / {phaseBlocks.length}
              </span>
            </div>
            <button
              type="button"
              className="map-phase-nav-btn"
              onClick={() => setActivePhaseIndex((i) => Math.min(phaseBlocks.length - 1, i + 1))}
              disabled={!canNext}
              aria-label="Next phase"
            >
              ▶
            </button>
          </div>
        )}

        <div className="map-scroll-area">
          {drawerLoading && (
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 10 }}>
              <div className="spinner" />
            </div>
          )}

          {!currentBlock ? (
            <div className="empty-state" style={{ padding: 40 }}>
              <p className="text-secondary">No phases configured yet.</p>
            </div>
          ) : (
          <svg className="plot-map-svg" width={totalW} height={totalH} viewBox={`0 0 ${totalW} ${totalH}`}>
            {(() => {
              const block = currentBlock;
              const { cfg, list, cols, nRows, width, height, isLegacyP1 } = block;
              const title = shortPhaseLabel(cfg.name, `Phase ${cfg.id}`);

              if (isLegacyP1) {
                return (
                  <g key={cfg.id}>
                    <rect x={0} y={0} width={width} height={height} fill="#0D1B2A" rx={8} />
                    <rect x={0} y={30} width={ROAD_W} height={height - 60} fill="#3A3A3A" rx={3} />
                    <rect x={0} y={height - ROAD_W} width={width} height={ROAD_W} fill="#3A3A3A" rx={3} />
                    <text
                      x={width / 2}
                      y={18}
                      textAnchor="middle"
                      fill="#8FA8C8"
                      fontSize={11}
                      fontWeight={700}
                      fontFamily="Outfit, sans-serif"
                    >
                      {title.toUpperCase()} — {list.length} PLOTS
                    </text>
                    <text x={12} y={height / 2} fill="#666" fontSize={9} textAnchor="middle" transform={`rotate(-90, 12, ${height / 2})`}>
                      MAIN ROAD
                    </text>
                    <text x={width / 2} y={height - 6} fill="#666" fontSize={9} textAnchor="middle">
                      CHIRAWA ROAD
                    </text>
                    {(() => {
                      const parkCols = 3;
                      const parkRows = 2;
                      const px = ROAD_W + (cols - parkCols) * (CELL_W + GAP);
                      const py = 30 + ROAD_W / 2 + (nRows - parkRows - 1) * (CELL_H + GAP);
                      return (
                        <g>
                          <rect
                            x={px}
                            y={py}
                            width={(CELL_W + GAP) * parkCols - GAP}
                            height={(CELL_H + GAP) * parkRows - GAP}
                            fill="#1B3A2B"
                            rx={4}
                          />
                          <text
                            x={px + ((CELL_W + GAP) * parkCols - GAP) / 2}
                            y={py + ((CELL_H + GAP) * parkRows) / 2}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fill="#34D399"
                            fontSize={8}
                            fontWeight={700}
                          >
                            🌳 PARK
                          </text>
                        </g>
                      );
                    })()}
                    {list.map((p) => {
                      const visible = filterPlot(p);
                      const color = visible ? PLOT_COLORS[p.status] : '#1A2235';
                      const x = ROAD_W + p.col * (CELL_W + GAP);
                      const y = 30 + ROAD_W / 2 + p.row * (CELL_H + GAP);
                      const isPark = p.col >= cols - 3 && p.row >= nRows - 3;
                      if (isPark) return null;
                      return (
                        <g key={p.id} onClick={() => visible && handlePlotClick(p)} style={{ cursor: visible ? 'pointer' : 'default' }}>
                          <rect x={x} y={y} width={CELL_W} height={CELL_H} fill={color} opacity={visible ? 0.88 : 0.2} rx={3} />
                          {visible && (
                            <text
                              x={x + CELL_W / 2}
                              y={y + CELL_H / 2 + 1}
                              textAnchor="middle"
                              dominantBaseline="middle"
                              fill="#fff"
                              fontSize={7}
                              fontWeight={700}
                              style={{ pointerEvents: 'none' }}
                            >
                              {labelText(p.plotNumber)}
                            </text>
                          )}
                        </g>
                      );
                    })}
                  </g>
                );
              }

              return (
                <g key={cfg.id}>
                  <rect x={0} y={0} width={width} height={height} fill="#0D1B2A" rx={8} />
                  <rect x={0} y={height - ROAD_W} width={width} height={ROAD_W} fill="#3A3A3A" rx={3} />
                  <text
                    x={width / 2}
                    y={18}
                    textAnchor="middle"
                    fill="#8FA8C8"
                    fontSize={11}
                    fontWeight={700}
                    fontFamily="Outfit, sans-serif"
                  >
                    {title.toUpperCase()} — {list.length} PLOTS
                  </text>
                  <text x={width / 2} y={height - 6} fill="#666" fontSize={9} textAnchor="middle">
                    PHASE {cfg.id}
                  </text>
                  {list.map((p) => {
                    const visible = filterPlot(p);
                    const color = visible ? PLOT_COLORS[p.status] : '#1A2235';
                    const x = 10 + p.col * (CELL_W + GAP);
                    const y = 30 + p.row * (CELL_H + GAP);
                    return (
                      <g key={p.id} onClick={() => visible && handlePlotClick(p)} style={{ cursor: visible ? 'pointer' : 'default' }}>
                        <rect x={x} y={y} width={CELL_W} height={CELL_H} fill={color} opacity={visible ? 0.88 : 0.2} rx={3} />
                        {visible && (
                          <text
                            x={x + CELL_W / 2}
                            y={y + CELL_H / 2 + 1}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fill="#fff"
                            fontSize={7}
                            fontWeight={700}
                            style={{ pointerEvents: 'none' }}
                          >
                            {labelText(p.plotNumber)}
                          </text>
                        )}
                      </g>
                    );
                  })}
                </g>
              );
            })()}
          </svg>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
        {['available', 'pending', 'sold'].map((s) => {
          const list = plots.filter((p) => p.status === s);
          return (
            <div key={s} className="card" style={{ flex: '1', minWidth: 180 }}>
              <div className="flex-between">
                <span className={`badge badge-${s}`}>{s.charAt(0).toUpperCase() + s.slice(1)}</span>
                <span style={{ fontSize: 28, fontWeight: 800 }}>{list.length}</span>
              </div>
              <div className="text-muted fs-12 mt-8">
                ₹{formatLakhs(list.reduce((a, p) => a + (p.amountReceived || 0), 0)).replace('₹', '')} received
              </div>
            </div>
          );
        })}
      </div>

      {selectedPlot && (
        <PlotDrawer plot={selectedPlot} onClose={() => setSelectedPlot(null)} onUpdated={() => setSelectedPlot(null)} />
      )}
    </div>
  );
}
