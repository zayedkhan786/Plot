import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { updatePlot, addTransaction, getPlotTransactions, getNextReceiptNumber, deletePlot } from '../firebase/firestore';
import { formatIndian, numberToIndianWords } from '../utils/indianNumbers';

const STATUS_BADGE = { available: 'badge-available', pending: 'badge-pending', sold: 'badge-sold' };

export default function PlotDrawer({ plot, onClose, onUpdated }) {
  const { user } = useAuth();
  const [form, setForm]               = useState({ ...plot });
  const [saving, setSaving]           = useState(false);
  const [txHistory, setTxHistory]     = useState([]);
  const [txLoading, setTxLoading]     = useState(true);
  const [showPayForm, setShowPayForm] = useState(false);
  const [payAmt, setPayAmt]           = useState('');
  const [payType, setPayType]         = useState('booking');
  const [toast, setToast]             = useState(null); // {msg, type}

  useEffect(() => {
    setForm({ ...plot });
  }, [plot]);

  // Load transaction history for this plot
  useEffect(() => {
    setTxLoading(true);
    getPlotTransactions(plot.id)
      .then((txs) => {
        // Sort by date desc
        const sorted = txs.sort((a, b) => {
          const aDate = a.createdAt?.toDate?.() || new Date(0);
          const bDate = b.createdAt?.toDate?.() || new Date(0);
          return bDate - aDate;
        });
        setTxHistory(sorted);
      })
      .catch(() => setTxHistory([]))
      .finally(() => setTxLoading(false));
  }, [plot.id]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      // Auto-recalculate pending when price or received changes
      if (name === 'price' || name === 'amountReceived') {
        next.amountPending = Math.max(0, (Number(next.price) || 0) - (Number(next.amountReceived) || 0));
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (!String(form.plotNumber || '').trim()) {
      showToast('⚠️ Plot number is required', 'error');
      return;
    }
    if (!String(form.dimensions || '').trim()) {
      showToast('⚠️ Dimensions are required', 'error');
      return;
    }

    setSaving(true);
    try {
      const update = {
        plotNumber:     String(form.plotNumber || '').trim().toUpperCase(),
        phase:          Number(form.phase) || 1,
        plotType:       String(form.plotType || '').trim().toUpperCase(),
        dimensions:     String(form.dimensions || '').trim(),
        areaSqYd:       Number(form.areaSqYd) || 0,
        facing:         String(form.facing || '').trim(),
        status:         form.status,
        buyerName:      (form.buyerName || '').trim(),
        buyerPhone:     (form.buyerPhone || '').trim(),
        price:          Number(form.price) || 0,
        amountReceived: Number(form.amountReceived) || 0,
        amountPending:  Math.max(0, (Number(form.price) || 0) - (Number(form.amountReceived) || 0)),
        notes:          (form.notes || '').trim(),
      };
      await updatePlot(plot.id, update, user.email);
      showToast('✅ Plot saved successfully!');
      if (onUpdated) onUpdated({ ...plot, ...update });
    } catch (e) {
      showToast('❌ ' + e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleRecordPayment = async () => {
    const amt = Number(payAmt);
    if (!amt || amt <= 0) { showToast('⚠️ Enter a valid amount', 'error'); return; }
    if (!form.buyerName) { showToast('⚠️ Add buyer name before recording payment', 'error'); return; }

    setSaving(true);
    try {
      const receiptNumber = await getNextReceiptNumber();

      // Record the transaction
      await addTransaction({
        plotId:       plot.id,
        plotNumber:   form.plotNumber || plot.plotNumber,
        buyerName:    form.buyerName,
        buyerPhone:   form.buyerPhone || '',
        amount:       amt,
        type:         payType,
        receiptNumber,
        createdBy:    user.email,
      });

      // Update plot financials
      const newReceived = (Number(form.amountReceived) || 0) + amt;
      const newPending  = Math.max(0, (Number(form.price) || 0) - newReceived);
      const newStatus   = newPending <= 0 ? 'sold'
                        : payType === 'booking' ? 'pending'
                        : form.status;

      await updatePlot(plot.id, {
        amountReceived: newReceived,
        amountPending:  newPending,
        status:         newStatus,
      }, user.email);

      // Update local form state
      setForm((prev) => ({
        ...prev,
        amountReceived: newReceived,
        amountPending:  newPending,
        status:         newStatus,
      }));

      // Refresh transaction list
      const txs = await getPlotTransactions(plot.id);
      setTxHistory(txs.sort((a, b) => (b.createdAt?.toDate?.() || 0) - (a.createdAt?.toDate?.() || 0)));

      setPayAmt('');
      setShowPayForm(false);
      showToast(`✅ Payment recorded! Receipt: ${receiptNumber}`);
      if (onUpdated) onUpdated();
    } catch (e) {
      showToast('❌ ' + e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const pendingAmt = Math.max(0, (Number(form.price) || 0) - (Number(form.amountReceived) || 0));

  const handleDeletePlot = async () => {
    const yes = window.confirm(`Delete ${form.plotNumber || plot.plotNumber}? This action cannot be undone.`);
    if (!yes) return;

    setSaving(true);
    try {
      await deletePlot(plot.id);
      showToast('🗑️ Plot deleted');
      if (onUpdated) onUpdated();
      onClose();
    } catch (e) {
      showToast('❌ ' + e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="drawer" onClick={(e) => e.stopPropagation()}>

        {/* ── Header ── */}
        <div className="drawer-header">
          <div>
            <div className="drawer-title" style={{ fontSize: 20 }}>{form.plotNumber || plot.plotNumber}</div>
            <span className={`badge ${STATUS_BADGE[form.status]}`} style={{ marginTop: 6, display: 'inline-flex' }}>
              {form.status.charAt(0).toUpperCase() + form.status.slice(1)}
            </span>
          </div>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>

        {/* ── Body ── */}
        <div className="drawer-body">

          {/* Plot Info Strip */}
          <div
            className="plot-drawer-meta"
            style={{
              background: 'var(--bg-panel)',
              borderRadius: 10, padding: 14, marginBottom: 20,
            }}
          >
            {[
              ['🏷️ Plot Number', form.plotNumber || '—'],
              ['📐 Dimensions', form.dimensions || '—'],
              ['📏 Area', `${form.areaSqYd || 0} sq yards`],
              ['🧭 Facing', form.facing || '—'],
              ['🏗️ Phase', `Phase ${form.phase || 1}`],
              ['📍 Plot Type', `Type ${form.plotType || 'A'}`],
            ].map(([label, val]) => (
              <div key={label}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{val}</div>
              </div>
            ))}
          </div>

          {/* ── Section: Plot Master Details ── */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, marginBottom: 4 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12 }}>
              Plot Basic Details
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Plot Number</label>
                <input
                  name="plotNumber"
                  className="form-input"
                  value={form.plotNumber || ''}
                  onChange={handleChange}
                  placeholder="e.g. P1-045"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Phase</label>
                <select
                  name="phase"
                  className="form-select"
                  value={String(form.phase || 1)}
                  onChange={handleChange}
                >
                  <option value="1">Phase 1</option>
                  <option value="2">Phase 2</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Plot Type</label>
                <select
                  name="plotType"
                  className="form-select"
                  value={form.plotType || 'A'}
                  onChange={handleChange}
                >
                  <option value="A">Type A</option>
                  <option value="B">Type B</option>
                  <option value="C">Type C</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Facing</label>
                <select
                  name="facing"
                  className="form-select"
                  value={form.facing || 'East'}
                  onChange={handleChange}
                >
                  <option value="East">East</option>
                  <option value="North">North</option>
                  <option value="West">West</option>
                  <option value="South">South</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Dimensions</label>
                <input
                  name="dimensions"
                  className="form-input"
                  value={form.dimensions || ''}
                  onChange={handleChange}
                  placeholder="e.g. 30×40 ft"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Area (sq yards)</label>
                <input
                  name="areaSqYd"
                  type="number"
                  className="form-input"
                  value={form.areaSqYd || ''}
                  onChange={handleChange}
                  placeholder="e.g. 133"
                />
              </div>
            </div>
          </div>

          {/* ── Section: Status ── */}
          <div className="form-group">
            <label className="form-label">Plot Status</label>
            <select
              name="status"
              className="form-select"
              value={form.status}
              onChange={handleChange}
              id={`status-${plot.id}`}
              style={{ fontWeight: 600 }}
            >
              <option value="available">🔵 Available — Open for booking</option>
              <option value="pending">🟡 Pending — Booking received</option>
              <option value="sold">✅ Sold — Full payment done</option>
            </select>
          </div>

          {/* ── Section: Buyer ── */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, marginBottom: 4 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12 }}>
              Buyer Information
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Buyer Full Name</label>
                <input
                  name="buyerName"
                  className="form-input"
                  value={form.buyerName || ''}
                  onChange={handleChange}
                  placeholder="e.g. Ramesh Kumar"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  name="buyerPhone"
                  className="form-input"
                  value={form.buyerPhone || ''}
                  onChange={handleChange}
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>
          </div>

          {/* ── Section: Pricing ── */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, marginBottom: 4 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12 }}>
              Payment Details
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Agreed Total Price (₹)</label>
                <input
                  name="price"
                  type="number"
                  className="form-input"
                  value={form.price || ''}
                  onChange={handleChange}
                  placeholder="e.g. 500000"
                />
                {form.price > 0 && (
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                    = ₹{formatIndian(form.price)} ({numberToIndianWords(Number(form.price)).replace(' Rupees Only','')})
                  </div>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Total Amount Received (₹)</label>
                <input
                  name="amountReceived"
                  type="number"
                  className="form-input"
                  value={form.amountReceived || ''}
                  onChange={handleChange}
                  placeholder="Amount received so far"
                />
              </div>
            </div>

            {/* Pending bar */}
            {form.price > 0 && (
              <div style={{
                background: pendingAmt > 0 ? 'rgba(245,158,11,0.08)' : 'rgba(16,185,129,0.08)',
                border: `1px solid ${pendingAmt > 0 ? 'rgba(245,158,11,0.25)' : 'rgba(16,185,129,0.25)'}`,
                borderRadius: 8, padding: '12px 16px', marginBottom: 16,
              }}>
                <div className="flex-between">
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 3 }}>
                      {pendingAmt > 0 ? '⏳ Amount Pending' : '✅ Fully Paid'}
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: pendingAmt > 0 ? 'var(--accent-gold)' : 'var(--accent-green)' }}>
                      ₹{formatIndian(pendingAmt)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Received</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--accent-green)' }}>
                      ₹{formatIndian(form.amountReceived || 0)}
                    </div>
                  </div>
                </div>
                {pendingAmt > 0 && (
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, fontStyle: 'italic' }}>
                    {numberToIndianWords(pendingAmt)}
                  </div>
                )}
                {/* Progress bar */}
                {form.price > 0 && (
                  <div style={{ marginTop: 10, height: 6, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${Math.min(100, ((form.amountReceived || 0) / form.price * 100))}%`,
                      background: 'var(--accent-green)',
                      transition: 'width 0.5s ease',
                      borderRadius: 99,
                    }} />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Notes ── */}
          <div className="form-group">
            <label className="form-label">Notes / Remarks</label>
            <textarea
              name="notes"
              className="form-textarea"
              value={form.notes || ''}
              onChange={handleChange}
              placeholder="Visit notes, negotiation details, preferences…"
              rows={3}
            />
          </div>

          <div className="divider" />

          {/* ── Record Payment ── */}
          <div style={{ marginBottom: 16 }}>
            <div className="flex-between mb-12">
              <span style={{ fontSize: 13, fontWeight: 700 }}>💸 Record a Payment</span>
              {!showPayForm && (
                <button
                  className="btn btn-warning btn-sm"
                  onClick={() => setShowPayForm(true)}
                  disabled={!form.buyerName}
                  title={!form.buyerName ? 'Add buyer name first' : ''}
                >
                  + Record Payment
                </button>
              )}
            </div>

            {showPayForm && (
              <div style={{ background: 'var(--bg-panel)', borderRadius: 10, padding: 16 }}>
                <div className="form-row">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Amount (₹)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={payAmt}
                      onChange={(e) => setPayAmt(e.target.value)}
                      placeholder="e.g. 100000"
                      autoFocus
                    />
                    {payAmt > 0 && (
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                        {numberToIndianWords(Number(payAmt))}
                      </div>
                    )}
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Payment Type</label>
                    <select
                      className="form-select"
                      value={payType}
                      onChange={(e) => setPayType(e.target.value)}
                    >
                      <option value="booking">📋 Booking Amount</option>
                      <option value="installment">💳 Installment</option>
                      <option value="full_payment">✅ Full Payment</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button className="btn btn-success btn-sm" onClick={handleRecordPayment} disabled={saving}>
                    {saving ? '⏳ Recording…' : '✅ Record & Generate Receipt No.'}
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => { setShowPayForm(false); setPayAmt(''); }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── Transaction History ── */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>
              📜 Payment History ({txHistory.length})
            </div>
            {txLoading ? (
              <div style={{ textAlign: 'center', padding: 16, color: 'var(--text-muted)' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
            ) : txHistory.length === 0 ? (
              <div style={{ padding: '12px 14px', background: 'var(--bg-panel)', borderRadius: 8, fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>
                No payments recorded yet
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {txHistory.map((tx) => (
                  <div key={tx.id} style={{
                    background: 'var(--bg-panel)', borderRadius: 8,
                    padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-blue)' }}>{tx.receiptNumber}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                        {tx.type === 'booking' ? '📋 Booking' : tx.type === 'installment' ? '💳 Installment' : '✅ Full Payment'}
                        {' · '}
                        {tx.createdAt?.toDate?.()?.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) || '—'}
                      </div>
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--accent-green)' }}>
                      ₹{formatIndian(tx.amount)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="drawer-footer">
          <button
            className="btn btn-danger"
            onClick={handleDeletePlot}
            disabled={saving}
          >
            🗑️ Delete Plot
          </button>
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving}
            id={`save-plot-${plot.id}`}
          >
            {saving ? '⏳ Saving…' : '💾 Save Changes'}
          </button>
        </div>
      </div>

      {/* Toast notification */}
      {toast && (
        <div className="toast-container">
          <div className={`toast ${toast.type === 'error' ? 'error' : 'success'}`}>
            {toast.msg}
          </div>
        </div>
      )}
    </div>
  );
}
