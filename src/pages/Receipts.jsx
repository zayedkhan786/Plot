import { useState, useRef } from 'react';
import { usePlots } from '../context/PlotContext';
import { formatIndian, numberToIndianWords } from '../utils/indianNumbers';
import html2canvas from 'html2canvas';

function ReceiptTemplate({ data, type }) {
  const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <div className="receipt" id="receipt-print-area">
      {/* Header */}
      <div className="receipt-header">
        <div>
          <div className="receipt-company-name">Shree Dungar Residency</div>
          <div className="receipt-company-sub">
            Sehi Kalan, Chirawa Road, Surajgarh — 333 029<br />
            Jhunjhunu, Rajasthan &nbsp;|&nbsp; GSTIN: — &nbsp;|&nbsp; Ph: —
          </div>
        </div>
        <div className="receipt-type-badge">
          {type === 'booking' ? '📋 Booking Receipt' : type === 'installment' ? '💳 Installment Receipt' : '✅ Payment Receipt'}
        </div>
      </div>

      {/* Meta */}
      <div className="receipt-meta">
        <div className="receipt-meta-item">
          <label>Receipt No.</label>
          <span>{data.receiptNumber || 'SDR-XXXX'}</span>
        </div>
        <div className="receipt-meta-item">
          <label>Date</label>
          <span>{today}</span>
        </div>
        <div className="receipt-meta-item">
          <label>Plot</label>
          <span>{data.plotNumber}</span>
        </div>
        <div className="receipt-meta-item">
          <label>Phase</label>
          <span>Phase {data.phase}</span>
        </div>
      </div>

      {/* Body */}
      <div className="receipt-body">
        {/* Buyer Info */}
        <div className="receipt-section-title">Buyer Details</div>
        <div className="receipt-grid" style={{ marginBottom: 16 }}>
          <div className="receipt-field"><label>Buyer Name</label><span>{data.buyerName || '—'}</span></div>
          <div className="receipt-field"><label>Phone</label><span>{data.buyerPhone || '—'}</span></div>
          <div className="receipt-field"><label>Plot Dimensions</label><span>{data.dimensions}</span></div>
          <div className="receipt-field"><label>Facing</label><span>{data.facing}</span></div>
          <div className="receipt-field"><label>Area</label><span>{data.areaSqYd} sq yards</span></div>
          <div className="receipt-field"><label>Plot Location</label><span>Sehi Kalan, Surajgarh</span></div>
        </div>

        {/* Payment Info */}
        <div className="receipt-section-title">Payment Details</div>
        <div className="receipt-grid">
          <div className="receipt-field"><label>Agreed Price</label><span>₹{formatIndian(data.price)}</span></div>
          <div className="receipt-field"><label>Amount Received (total)</label><span>₹{formatIndian(data.amountReceived)}</span></div>
          <div className="receipt-field"><label>Amount Pending</label><span>₹{formatIndian(data.amountPending)}</span></div>
          <div className="receipt-field"><label>Payment Mode</label><span>Cash / Cheque</span></div>
        </div>

        {/* This payment */}
        {data.thisPayment > 0 && (
          <div className="receipt-amount-box">
            <div>
              <div className="receipt-amount-label">
                {type === 'booking' ? 'Booking Amount Received' : type === 'installment' ? 'Installment Amount' : 'Payment Received'}
              </div>
              <div className="receipt-amount-words">{numberToIndianWords(data.thisPayment)}</div>
            </div>
            <div className="receipt-amount-value">₹{formatIndian(data.thisPayment)}</div>
          </div>
        )}

        {/* Conditions */}
        <div style={{ marginTop: 16, padding: '12px 16px', background: '#FFF9F2', border: '1px solid #FED7AA', borderRadius: 8 }}>
          <div style={{ fontSize: 11, color: '#92400E', fontWeight: 600, marginBottom: 6 }}>Terms & Conditions</div>
          <ul style={{ fontSize: 11, color: '#78350F', lineHeight: 1.8, paddingLeft: 16 }}>
            <li>This receipt is subject to realisation of cheque (if applicable).</li>
            <li>Plot is booked on first-come-first-served basis.</li>
            <li>All disputes subject to Surajgarh jurisdiction.</li>
            <li>Stamp duty and registration charges as per state norms will be borne by the buyer.</li>
          </ul>
        </div>
      </div>

      {/* Footer */}
      <div className="receipt-footer">
        <div className="receipt-sign-box">
          <div className="receipt-sign-line" />
          <div className="receipt-sign-label">Buyer's Signature</div>
        </div>
        <div className="receipt-note">
          *This is a computer-generated receipt.<br />
          For queries contact: Shree Dungar Residency office<br />
          Chirawa Road, Surajgarh, Rajasthan
        </div>
        <div className="receipt-sign-box">
          <div className="receipt-sign-line" />
          <div className="receipt-sign-label">Authorised Signatory</div>
        </div>
      </div>
    </div>
  );
}

export default function Receipts() {
  const { plots, transactions } = usePlots();
  const [selectedPlotId, setSelectedPlotId] = useState('');
  const [selectedTxId, setSelectedTxId]     = useState('');
  const [receiptType, setReceiptType]       = useState('booking');
  const [downloading, setDownloading]       = useState(false);
  const receiptRef = useRef(null);

  const bookedPlots = plots.filter((p) => p.status !== 'available');
  const selectedPlot = bookedPlots.find((p) => p.id === selectedPlotId);
  const plotTx = transactions.filter((t) => t.plotId === selectedPlotId);
  const selectedTx = plotTx.find((t) => t.id === selectedTxId);

  const receiptData = selectedPlot
    ? {
        plotNumber:    selectedPlot.plotNumber,
        phase:         selectedPlot.phase,
        dimensions:    selectedPlot.dimensions,
        areaSqYd:      selectedPlot.areaSqYd,
        facing:        selectedPlot.facing,
        buyerName:     selectedPlot.buyerName,
        buyerPhone:    selectedPlot.buyerPhone,
        price:         selectedPlot.price,
        amountReceived:selectedPlot.amountReceived,
        amountPending: selectedPlot.amountPending,
        receiptNumber: selectedTx?.receiptNumber || '',
        thisPayment:   selectedTx?.amount || 0,
      }
    : null;

  const handleDownload = async () => {
    if (!receiptRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(receiptRef.current, { scale: 2, useCORS: true, backgroundColor: '#fff' });
      const link = document.createElement('a');
      link.download = `receipt-${receiptData?.receiptNumber || 'draft'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (e) {
      alert('Error generating receipt: ' + e.message);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <h1 className="page-title">🧾 Receipts</h1>
        <p className="page-subtitle">Generate booking, installment, and payment receipts</p>
      </div>

      <div className="receipt-layout">
        {/* Controls */}
        <div className="card-lg">
          <h3 style={{ marginBottom: 16, fontSize: 15, fontWeight: 700 }}>Generate Receipt</h3>

          <div className="form-group">
            <label className="form-label">Receipt Type</label>
            <select className="form-select" value={receiptType} onChange={(e) => setReceiptType(e.target.value)} id="receipt-type-select">
              <option value="booking">📋 Booking Receipt</option>
              <option value="installment">💳 Installment Receipt</option>
              <option value="full_payment">✅ Full Payment Receipt</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Select Plot</label>
            <select
              className="form-select"
              value={selectedPlotId}
              onChange={(e) => { setSelectedPlotId(e.target.value); setSelectedTxId(''); }}
              id="receipt-plot-select"
            >
              <option value="">— Select a booked plot —</option>
              {bookedPlots.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.plotNumber} · {p.buyerName || 'No buyer'} · {p.status}
                </option>
              ))}
            </select>
          </div>

          {selectedPlot && plotTx.length > 0 && (
            <div className="form-group">
              <label className="form-label">Select Transaction (optional)</label>
              <select className="form-select" value={selectedTxId} onChange={(e) => setSelectedTxId(e.target.value)} id="receipt-tx-select">
                <option value="">— Show total only —</option>
                {plotTx.map((tx) => (
                  <option key={tx.id} value={tx.id}>
                    {tx.receiptNumber} · ₹{formatIndian(tx.amount)} · {tx.type}
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedPlot && (
            <div style={{ background: 'var(--bg-panel)', padding: 14, borderRadius: 8, marginBottom: 16 }}>
              <div className="text-muted fs-12 mb-8">Plot Details</div>
              {[
                ['Plot', selectedPlot.plotNumber],
                ['Buyer', selectedPlot.buyerName || '—'],
                ['Dimensions', selectedPlot.dimensions],
                ['Agreed', `₹${formatIndian(selectedPlot.price)}`],
                ['Received', `₹${formatIndian(selectedPlot.amountReceived)}`],
                ['Pending', `₹${formatIndian(selectedPlot.amountPending)}`],
              ].map(([l, v]) => (
                <div key={l} className="flex-between mt-8">
                  <span className="text-secondary fs-13">{l}:</span>
                  <span className="fw-600 fs-13">{v}</span>
                </div>
              ))}
            </div>
          )}

          <button
            id="download-receipt-btn"
            className="btn btn-primary btn-full"
            onClick={handleDownload}
            disabled={!selectedPlot || downloading}
          >
            {downloading ? '⏳ Generating…' : '⬇️ Download Receipt (PNG)'}
          </button>
        </div>

        {/* Receipt Preview */}
        <div>
          {receiptData ? (
            <>
              <div className="flex-between mb-16">
                <h3 style={{ fontSize: 15, fontWeight: 700 }}>Preview</h3>
                <span className="text-muted fs-13">Scroll to see full receipt</span>
              </div>
              <div style={{ transform: 'scale(0.88)', transformOrigin: 'top left', width: '114%' }}>
                <div ref={receiptRef}>
                  <ReceiptTemplate data={receiptData} type={receiptType} />
                </div>
              </div>
            </>
          ) : (
            <div className="empty-state" style={{ marginTop: 80 }}>
              <div className="empty-state-icon">🧾</div>
              <h3>Select a plot to preview receipt</h3>
              <p>Only plots with pending or sold status are shown</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
