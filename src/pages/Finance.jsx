import { useState, useMemo } from 'react';
import { usePlots } from '../context/PlotContext';
import { formatIndian, formatLakhs } from '../utils/indianNumbers';

export default function Finance() {
  const { plots, transactions, stats, loading } = usePlots();
  const [filter, setFilter]     = useState('all');
  const [search, setSearch]     = useState('');
  const [phaseFilter, setPhaseFilter] = useState('all');

  if (loading) {
    return <div className="loading-screen"><div className="spinner" /></div>;
  }

  const filteredTx = useMemo(() => {
    return transactions.filter((tx) => {
      if (filter !== 'all' && tx.type !== filter) return false;
      if (search && !tx.plotNumber?.includes(search) && !tx.buyerName?.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [transactions, filter, search]);

  const phase1 = plots.filter((p) => p.phase === 1);
  const phase2 = plots.filter((p) => p.phase === 2);

  const phaseRevenue = (arr) => arr.reduce((s, p) => s + (p.amountReceived || 0), 0);
  const phasePending = (arr) => arr.reduce((s, p) => s + (p.amountPending || 0), 0);

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <h1 className="page-title">💰 Finance</h1>
        <p className="page-subtitle">Revenue tracking and transaction history</p>
      </div>

      {/* Summary Row */}
      <div className="kpi-grid">
        {[
          { icon:'💵', color:'green', label:'Total Received',  value: formatLakhs(stats.totalRevenue),  sub:`₹${formatIndian(stats.totalRevenue)}`},
          { icon:'⏳', color:'gold',  label:'Total Pending',   value: formatLakhs(stats.totalPending),  sub:`₹${formatIndian(stats.totalPending)}`},
          { icon:'📋', color:'blue',  label:'Total Agreed',    value: formatLakhs(stats.totalAgreed),   sub:`${stats.sold + stats.pending} plots booked`},
          { icon:'🧾', color:'purple',label:'Transactions',    value: transactions.length, sub:'All time'},
        ].map((k) => (
          <div key={k.label} className={`kpi-card ${k.color}`}>
            <div className={`kpi-icon ${k.color}`}>{k.icon}</div>
            <div className="kpi-value">{k.value}</div>
            <div className="kpi-label">{k.label}</div>
            <div className="text-muted fs-12 mt-8">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Phase breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Phase 1', arr: phase1 },
          { label: 'Phase 2', arr: phase2 },
        ].map(({ label, arr }) => (
          <div key={label} className="card-lg">
            <h3 style={{ marginBottom: 14, fontSize: 15, fontWeight: 700 }}>{label} Summary</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {[
                { l: 'Total', v: arr.length, c: 'var(--text-primary)' },
                { l: 'Sold',  v: arr.filter(p=>p.status==='sold').length,    c: 'var(--accent-green)' },
                { l: 'Pending', v: arr.filter(p=>p.status==='pending').length, c: 'var(--accent-gold)' },
              ].map(s => (
                <div key={s.l} style={{ textAlign:'center', background:'var(--bg-surface)', padding:'10px 4px', borderRadius:8 }}>
                  <div style={{ fontSize:22, fontWeight:800, color:s.c }}>{s.v}</div>
                  <div className="text-muted fs-12">{s.l}</div>
                </div>
              ))}
            </div>
            <div className="divider" />
            <div className="flex-between">
              <span className="text-muted fs-13">Received:</span>
              <span className="text-success fw-700">₹{formatIndian(phaseRevenue(arr))}</span>
            </div>
            <div className="flex-between mt-8">
              <span className="text-muted fs-13">Pending:</span>
              <span className="text-warning fw-700">₹{formatIndian(phasePending(arr))}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Transaction Log */}
      <div className="card-lg">
        <div className="flex-between mb-16">
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>Transaction Log</h2>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <div className="search-box" style={{ flex: '0 0 220px' }}>
              <span className="search-icon">🔍</span>
              <input placeholder="Search plot / buyer…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            {['all','booking','installment','full_payment'].map((f) => (
              <button
                key={f}
                className={`filter-chip ${filter === f ? 'active-all' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f === 'all' ? 'All' : f === 'booking' ? 'Booking' : f === 'installment' ? 'Installment' : 'Full Payment'}
              </button>
            ))}
          </div>
        </div>

        {filteredTx.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">💸</div>
            <h3>No transactions</h3>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Receipt No.</th>
                  <th>Plot</th>
                  <th>Buyer</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>By</th>
                </tr>
              </thead>
              <tbody>
                {filteredTx.map((tx, i) => (
                  <tr key={tx.id}>
                    <td className="text-muted">{i + 1}</td>
                    <td className="text-blue fw-600">{tx.receiptNumber || '—'}</td>
                    <td className="fw-600">{tx.plotNumber}</td>
                    <td>{tx.buyerName}</td>
                    <td>
                      <span className={`badge ${tx.type==='full_payment' ? 'badge-sold' : tx.type==='booking' ? 'badge-pending' : 'badge-available'}`}>
                        {tx.type === 'booking' ? 'Booking' : tx.type === 'installment' ? 'Installment' : 'Full Payment'}
                      </span>
                    </td>
                    <td className="fw-700 text-success">₹{formatIndian(tx.amount)}</td>
                    <td className="text-secondary fs-13">
                      {tx.createdAt?.toDate?.()?.toLocaleDateString('en-IN') || '—'}
                    </td>
                    <td className="text-muted fs-12">{tx.createdBy?.split('@')[0]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Total row */}
        <div style={{ textAlign: 'right', marginTop: 16, padding: '12px 0', borderTop: '1px solid var(--border)' }}>
          <span className="text-secondary fs-13">Total in view: </span>
          <span className="fw-700 text-success fs-14">
            ₹{formatIndian(filteredTx.reduce((s, t) => s + (t.amount || 0), 0))}
          </span>
        </div>
      </div>
    </div>
  );
}
