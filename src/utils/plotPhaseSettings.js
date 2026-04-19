/** Default layout when no meta/plotSettings exists (matches original seed). */
export const DEFAULT_PHASES = [
  { id: 1, name: 'Phase 1', cols: 13 },
  { id: 2, name: 'Phase 2', cols: 7 },
];

export function clampPhaseCols(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 8;
  return Math.max(3, Math.min(24, Math.round(x)));
}

/** Read phases from Firestore doc (supports legacy phaseNames migration). */
export function normalizePhasesFromDoc(data) {
  if (!data) return [...DEFAULT_PHASES];
  if (Array.isArray(data.phases) && data.phases.length > 0) {
    return data.phases
      .map((p) => ({
        id: Number(p.id),
        name: String(p.name ?? `Phase ${p.id}`).trim() || `Phase ${p.id}`,
        cols: clampPhaseCols(p.cols ?? 8),
      }))
      .filter((p) => Number.isFinite(p.id) && p.id > 0)
      .sort((a, b) => a.id - b.id);
  }
  const pn = data.phaseNames || {};
  return [
    { id: 1, name: String(pn[1] || 'Phase 1'), cols: 13 },
    { id: 2, name: String(pn[2] || 'Phase 2'), cols: 7 },
  ];
}

/** Merge stored phases with any phase ids present on plots (orphan phases). */
export function mergePhasesWithPlots(storedPhases, plots) {
  const byId = new Map((storedPhases || []).map((p) => [p.id, { ...p, cols: clampPhaseCols(p.cols) }]));
  (plots || []).forEach((plot) => {
    const pid = Number(plot.phase);
    if (!Number.isFinite(pid) || pid <= 0) return;
    if (!byId.has(pid)) {
      byId.set(pid, {
        id: pid,
        name: `Phase ${pid}`,
        cols: pid === 1 ? 13 : 8,
      });
    }
  });
  return Array.from(byId.values()).sort((a, b) => a.id - b.id);
}
