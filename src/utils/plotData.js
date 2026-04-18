/**
 * Generates initial data for all 166 plots.
 * Phase 1: 131 plots  (P1-001 … P1-131)
 * Phase 2:  35 plots  (P2-001 … P2-035)
 *
 * Plot sizes used (sq yards):
 *   Type A  30×40  = 1200 sqft  ~133 sqyd   (most common)
 *   Type B  30×50  = 1500 sqft  ~167 sqyd
 *   Type C  40×60  = 2400 sqft  ~267 sqyd   (corner plots)
 *
 * Facing cycles: East, North, West, South
 */

const FACINGS = ['East', 'North', 'West', 'South'];

const PHASE1_TYPES = (() => {
  const types = [];
  for (let i = 1; i <= 131; i++) {
    // Corners (every ~10th) → Type C; every 7th → Type B; else Type A
    if (i % 30 === 0 || i === 1 || i === 131 || i === 65 || i === 66) {
      types.push('C');
    } else if (i % 7 === 0) {
      types.push('B');
    } else {
      types.push('A');
    }
  }
  return types;
})();

const PHASE2_TYPES = (() => {
  const types = [];
  for (let i = 1; i <= 35; i++) {
    if (i % 15 === 0 || i === 1 || i === 35) {
      types.push('C');
    } else if (i % 6 === 0) {
      types.push('B');
    } else {
      types.push('A');
    }
  }
  return types;
})();

const plotSpec = {
  A: { dimensions: '30×40 ft', areaSqYd: 133, basePricePerSqYd: 3000 },
  B: { dimensions: '30×50 ft', areaSqYd: 167, basePricePerSqYd: 3000 },
  C: { dimensions: '40×60 ft', areaSqYd: 267, basePricePerSqYd: 3200 },
};

function buildPlot(phase, index, type) {
  const num = String(index).padStart(3, '0');
  const plotNumber = `P${phase}-${num}`;
  const id = plotNumber;
  const { dimensions, areaSqYd, basePricePerSqYd } = plotSpec[type];
  const facing = FACINGS[(index - 1) % 4];
  const price = areaSqYd * basePricePerSqYd;

  // Row/col for map positioning
  const cols = phase === 1 ? 13 : 7;
  const col = ((index - 1) % cols);
  const row = Math.floor((index - 1) / cols);

  return {
    id,
    plotNumber,
    phase,
    plotType: type,
    dimensions,
    areaSqYd,
    facing,
    status: 'available',
    price,
    amountReceived: 0,
    amountPending: 0,
    buyerName: '',
    buyerPhone: '',
    notes: '',
    row,
    col,
  };
}

export const PHASE1_PLOTS = PHASE1_TYPES.map((type, i) =>
  buildPlot(1, i + 1, type)
);

export const PHASE2_PLOTS = PHASE2_TYPES.map((type, i) =>
  buildPlot(2, i + 1, type)
);

export const ALL_PLOTS = [...PHASE1_PLOTS, ...PHASE2_PLOTS];

export const PLOT_COLORS = {
  available: '#3B82F6',
  pending: '#F59E0B',
  sold: '#10B981',
};

export const STATUS_LABELS = {
  available: 'Available',
  pending: 'Pending',
  sold: 'Sold',
};
