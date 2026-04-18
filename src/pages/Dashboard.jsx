import { useMemo } from 'react';
import { usePlots } from '../context/PlotContext';
import { formatLakhs, formatIndian } from '../utils/indianNumbers';
import { useNavigate } from 'react-router-dom';

/* ─── Donut Chart (pure SVG, no library) ─── */
function DonutChart({ available, pending, sold, total }) {
  const SIZE  = 160;
  const R     = 62;
  const CX    = SIZE / 2;
  const CY    = SIZE / 2;
  const STROKE= 22;
  const CIRC  = 2 * Math.PI * R;

  const segments = [
    { value: sold,      color: '#10B981', label: 'Sold' },
    { value: pending,   color: '#F59E0B', label: 'Pending' },
    { value: available, color: '#3B82F6', label: 'Available' },
  ];

  let offset = 0;
  const arcs = segments.map((seg) => {
    const pct  = total > 0 ? seg.value / total : 0;
    const dash = pct * CIRC;
    const gap  = CIRC - dash;
    const arc  = { ...seg, dash, gap, offset };
    offset += dash;
    return arc;
  });

  const soldPct = total > 0 ? Math.round((sold / total) * 100) : 0;

  return (
    <div className="donut-layout">
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <svg width={SIZE} height={SIZE}>
          {/* background ring */}
          <circle cx={CX} cy={CY} r={R} fill="none" stroke="var(--border)" strokeWidth={STROKE} />
          {arcs.map((arc, i) => (
            <circle
              key={i}
              cx={CX} cy={CY} r={R}
              fill="none"
              stroke={arc.color}
              strokeWidth={STROKE}
              strokeDasharray={`${arc.dash} ${arc.gap}`}
              strokeDashoffset={-arc.offset}
              strokeLinecap="butt"
              style={{ transition: 'stroke-dasharray 1s ease' }}
              transform={`rotate(-90 ${CX} ${CY})`}
            />
          ))}
          <text x={CX} y={CY - 8} textAnchor="middle" fill="var(--text-primary)"
            fontSize={26} fontWeight={800} fontFamily="Outfit, sans-serif">{total}</text>
          <text x={CX} y={CY + 12} textAnchor="middle" fill="var(--text-muted)" fontSize={11}>plots</text>
          <text x={CX} y={CY + 26} textAnchor="middle" fill="var(--accent-green)" fontSize={12} fontWeight={700}>{soldPct}% sold</text>
        </svg>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
        {segments.map((seg) => (
          <div key={seg.label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: seg.color, display: 'inline-block' }} />
                {seg.label}
              </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: seg.color }}>{seg.value}</span>
            </div>
            <div style={{ height: 5, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${total > 0 ? (seg.value / total) * 100 : 0}%`,
                background: seg.color,
                borderRadius: 99,
                transition: 'width 1s ease',
              }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Mini Plot Status Grid (visual heatmap) ─── */
function PlotGrid({ plots, phase }) {
  const COLS = phase === 1 ? 13 : 7;
  const phaseData = plots.filter(p => p.phase === phase);

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${COLS}, 1fr)`,
      gap: 3,
    }}>
      {phaseData.map(p => (
        <div
          key={p.id}
          title={`${p.plotNumber} — ${p.status}${p.buyerName ? ` (${p.buyerName})` : ''}`}
          style={{
            height: 10,
            borderRadius: 2,
            background:
              p.status === 'sold'      ? '#10B981' :
              p.status === 'pending'   ? '#F59E0B' :
                                         '#2A3A55',
            transition: 'transform 0.15s',
            cursor: 'default',
          }}
        />
      ))}
    </div>
  );
}

/* ─── Revenue Progress Bar ─── */
function RevenueBar({ received, pending, total }) {
  const recPct = total > 0 ? (received / total) * 100 : 0;
  const penPct = total > 0 ? (pending  / total) * 100 : 0;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total Deal Value</span>
        <span style={{ fontSize: 13, fontWeight: 700 }}>{formatLakhs(total)}</span>
      </div>
      <div style={{ height: 12, background: 'var(--border)', borderRadius: 99, overflow: 'hidden', display: 'flex' }}>
        <div style={{
          width: `${recPct}%`, background: 'var(--gradient-green)',
          borderRadius: '99px 0 0 99px', transition: 'width 1s ease',
        }} />
        <div style={{
          width: `${penPct}%`, background: 'var(--gradient-gold)',
          transition: 'width 1s ease',
        }} />
      </div>
      <div style={{ display: 'flex', gap: 20, marginTop: 8 }}>
        {[
          { color: 'var(--accent-green)', label: 'Received', val: formatLakhs(received) },
          { color: 'var(--accent-gold)',  label: 'Pending',  val: formatLakhs(pending)  },
        ].map(({ color, label, val }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
            <span style={{ color: 'var(--text-muted)' }}>{label}:</span>
            <span style={{ fontWeight: 700, color }}>{val}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Phase Card ─── */
function PhaseCard({ phase, plots }) {
  const arr      = plots.filter(p => p.phase === phase);
  const total    = arr.length;
  const sold     = arr.filter(p => p.status === 'sold').length;
  const pending  = arr.filter(p => p.status === 'pending').length;
  const avail    = arr.filter(p => p.status === 'available').length;
  const revenue  = arr.reduce((s, p) => s + (p.amountReceived || 0), 0);
  const pendAmt  = arr.reduce((s, p) => s + (p.amountPending  || 0), 0);

  return (
    <div className="card-lg">
      <div className="flex-between" style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700 }}>Phase {phase}</h3>
        <span className="text-muted fs-12">{total} plots</span>
      </div>

      {/* Mini Grid */}
      <div style={{ marginBottom: 14 }}>
        <PlotGrid plots={plots} phase={phase} />
      </div>

      {/* Counts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
        {[
          { label: 'Sold',      val: sold,    color: 'var(--accent-green)', bg: 'rgba(16,185,129,0.1)' },
          { label: 'Pending',   val: pending, color: 'var(--accent-gold)',  bg: 'rgba(245,158,11,0.1)'  },
          { label: 'Available', val: avail,   color: 'var(--accent-blue)',  bg: 'rgba(59,130,246,0.1)'  },
        ].map(s => (
          <div key={s.label} style={{ textAlign:'center', background: s.bg, borderRadius: 8, padding: '10px 4px' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.val}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="divider" />

      {/* Revenue mini-bar */}
      <div style={{ marginBottom: 6 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
          <span style={{ color: 'var(--text-muted)' }}>Revenue</span>
          <span style={{ fontWeight: 700, color: 'var(--accent-green)' }}>{formatLakhs(revenue)}</span>
        </div>
        <div style={{ height: 6, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${(sold / Math.max(total, 1)) * 100}%`,
            background: 'var(--gradient-green)',
            borderRadius: 99,
            transition: 'width 1s ease',
          }} />
        </div>
      </div>
      {pendAmt > 0 && (
        <div style={{ fontSize: 12, color: 'var(--accent-gold)' }}>
          ⏳ Pending collection: <strong>{formatLakhs(pendAmt)}</strong>
        </div>
      )}
    </div>
  );
}

/* ─── Recent Transactions ─── */
function RecentTx({ transactions }) {
  const navigate = useNavigate();
  const recent   = transactions.slice(0, 8);

  return (
    <div className="card-lg">
      <div className="flex-between mb-16">
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>🧾 Recent Transactions</h2>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/finance')}>
          View All →
        </button>
      </div>

      {recent.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">💸</div>
          <h3>No transactions yet</h3>
          <p>Book a plot to get started</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Receipt</th>
                <th>Plot</th>
                <th>Buyer</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {recent.map(tx => (
                <tr key={tx.id}>
                  <td className="text-blue fw-600">{tx.receiptNumber || '—'}</td>
                  <td className="fw-600">{tx.plotNumber}</td>
                  <td>{tx.buyerName}</td>
                  <td>
                    <span className={`badge badge-${tx.type === 'booking' ? 'pending' : 'sold'}`}>
                      {tx.type === 'booking' ? 'Booking' : tx.type === 'installment' ? 'Installment' : 'Full Pay'}
                    </span>
                  </td>
                  <td className="fw-700 text-success">₹{formatIndian(tx.amount)}</td>
                  <td className="text-secondary fs-12">
                    {tx.createdAt?.toDate
                      ? tx.createdAt.toDate().toLocaleDateString('en-IN')
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ─── Top Sold Plots ─── */
function TopSoldPlots({ plots }) {
  const top = plots
    .filter(p => p.status !== 'available' && p.amountReceived > 0)
    .sort((a, b) => (b.amountReceived || 0) - (a.amountReceived || 0))
    .slice(0, 5);

  if (top.length === 0) return null;

  return (
    <div className="card-lg">
      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>🏆 Top Transactions by Plot</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {top.map((p, i) => {
          const pct = p.price > 0 ? Math.round((p.amountReceived / p.price) * 100) : 0;
          return (
            <div key={p.id} className="top-sold-row">
              <div style={{
                width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                background: i === 0 ? 'var(--gradient-gold)' : 'var(--bg-panel)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 800, color: i === 0 ? '#fff' : 'var(--text-muted)',
              }}>
                {i + 1}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: 13 }}>{p.plotNumber}</span>
                    {p.buyerName && <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 8 }}>{p.buyerName}</span>}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-green)' }}>
                    {formatLakhs(p.amountReceived)}
                  </span>
                </div>
                <div style={{ height: 5, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${pct}%`,
                    background: p.status === 'sold' ? 'var(--gradient-green)' : 'var(--gradient-gold)',
                    borderRadius: 99,
                  }} />
                </div>
              </div>
              <span className={`badge badge-${p.status}`} style={{ flexShrink: 0 }}>{p.status}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Main Dashboard ─── */
export default function Dashboard() {
  const { plots, transactions, stats, loading, dbError } = usePlots();
  const navigate = useNavigate();

  const totalDealValue = useMemo(() =>
    plots.filter(p => p.status !== 'available').reduce((s, p) => s + (p.price || 0), 0),
    [plots]
  );

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <span style={{ marginTop: 16, color: 'var(--text-secondary)' }}>Loading dashboard…</span>
      </div>
    );
  }

  if (dbError) {
    return (
      <div className="loading-screen">
        <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
        <h3 style={{ color: 'var(--text-primary)', marginBottom: 8 }}>Firebase not connected</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 20, maxWidth: 400, textAlign: 'center', lineHeight: 1.7 }}>
          {dbError}
          {dbError.toLowerCase().includes('permission') && (
            <><br /><br /><strong style={{ color: 'var(--accent-gold)' }}>Fix:</strong> Go to Firebase → Firestore → Rules → publish the rules from Setup Step 3.</>
          )}
        </p>
        <button className="btn btn-primary" onClick={() => navigate('/seed')}>⚙️ Go to Setup Guide</button>
      </div>
    );
  }

  // Empty state
  if (plots.length === 0) {
    return (
      <div className="page-wrapper">
        <div className="page-header">
          <h1 className="page-title">📊 Dashboard</h1>
          <p className="page-subtitle">Shree Dungar Residency · Sehi Kalan, Surajgarh</p>
        </div>
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16,
          padding: '60px 40px', textAlign: 'center', maxWidth: 540, margin: '60px auto',
        }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🌱</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 10 }}>Database is empty</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.7 }}>
            Firebase is connected! Initialise the database with all 166 plots to get started.
          </p>
          <button className="btn btn-primary btn-lg" onClick={() => navigate('/seed')}>
            ⚙️ Go to Setup &amp; Seed Plots
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      {/* ── Header ── */}
      <div className="page-header page-header--split">
        <div>
          <h1 className="page-title">📊 Dashboard</h1>
          <p className="page-subtitle">Shree Dungar Residency · Sehi Kalan, Surajgarh</p>
        </div>
        <div className="page-header-actions">
          <button type="button" className="btn btn-primary" onClick={() => navigate('/map')}>
            🗺️ View Plot Map
          </button>
        </div>
      </div>

      {/* ── KPI Row ── */}
      <div className="kpi-grid">
        {[
          { icon:'📍', color:'blue',   label:'Total Plots',       value: stats.total,     sub:`${stats.available} available` },
          { icon:'✅', color:'green',  label:'Sold',              value: stats.sold,      sub:`${stats.total > 0 ? ((stats.sold/stats.total)*100).toFixed(1) : 0}% of total` },
          { icon:'⏳', color:'gold',   label:'Pending',           value: stats.pending,   sub:'Booking taken' },
          { icon:'💰', color:'green',  label:'Amount Received',   value: formatLakhs(stats.totalRevenue),  sub:`₹${formatIndian(stats.totalRevenue)}` },
          { icon:'⚠️', color:'purple', label:'Amount Pending',    value: formatLakhs(stats.totalPending),  sub:`₹${formatIndian(stats.totalPending)}` },
          { icon:'📋', color:'blue',   label:'Total Deal Value',  value: formatLakhs(totalDealValue), sub:`${stats.sold + stats.pending} plots booked` },
        ].map(k => (
          <div key={k.label} className={`kpi-card ${k.color}`}>
            <div className={`kpi-icon ${k.color}`}>{k.icon}</div>
            <div className="kpi-value">{k.value}</div>
            <div className="kpi-label">{k.label}</div>
            <div className="text-muted fs-12 mt-8">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Visual Row: Donut + Revenue Bar ── */}
      <div className="grid-2" style={{ marginBottom: 24 }}>

        {/* Donut Chart Card */}
        <div className="card-lg">
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>📊 Plot Status Overview</h3>
          <DonutChart
            available={stats.available}
            pending={stats.pending}
            sold={stats.sold}
            total={stats.total}
          />
        </div>

        {/* Revenue Breakdown Card */}
        <div className="card-lg">
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>💰 Revenue Breakdown</h3>
          <RevenueBar
            received={stats.totalRevenue}
            pending={stats.totalPending}
            total={totalDealValue}
          />

          <div className="divider" style={{ margin: '20px 0' }} />

          {/* Quick stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { label: 'Avg. Plot Price',  val: formatLakhs(plots.filter(p=>p.status!=='available').reduce((s,p)=>s+(p.price||0),0) / Math.max(stats.sold + stats.pending, 1)), color: 'var(--text-primary)' },
              { label: 'Collection Rate', val: `${totalDealValue > 0 ? Math.round((stats.totalRevenue/totalDealValue)*100) : 0}%`, color: 'var(--accent-green)' },
              { label: 'Phase 1 Sold',    val: `${plots.filter(p=>p.phase===1&&p.status==='sold').length} / ${plots.filter(p=>p.phase===1).length}`, color: 'var(--accent-blue)' },
              { label: 'Phase 2 Sold',    val: `${plots.filter(p=>p.phase===2&&p.status==='sold').length} / ${plots.filter(p=>p.phase===2).length}`, color: 'var(--accent-purple)' },
            ].map(s => (
              <div key={s.label} style={{ background: 'var(--bg-surface)', borderRadius: 8, padding: '12px 14px' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.val}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Phase Breakdown with Mini Grid ── */}
      <div className="grid-2" style={{ marginBottom: 24 }}>
        <PhaseCard phase={1} plots={plots} />
        <PhaseCard phase={2} plots={plots} />
      </div>

      {/* ── Bottom Row: Transactions + Top Plots ── */}
      <div className="grid-sidebar" style={{ marginBottom: 24 }}>
        <RecentTx transactions={transactions} />
        <TopSoldPlots plots={plots} />
      </div>
    </div>
  );
}
