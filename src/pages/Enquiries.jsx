import { useState, useMemo } from 'react';
import { subscribeEnquiries, addEnquiry, updateEnquiry } from '../firebase/firestore';
import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

function EnquiryForm({ initial, onClose, onSave }) {
  const { user } = useAuth();
  const [form, setForm] = useState(initial || {
    customerName: '', phone: '', interestedPlots: '', budget: '', notes: '', followUpDate: '', status: 'open'
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({ ...form, createdBy: user.email });
      onClose();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <div className="drawer-title">{initial ? 'Edit Enquiry' : '+ New Enquiry'}</div>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="drawer-body">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Customer Name *</label>
                <input name="customerName" className="form-input" required value={form.customerName} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Phone *</label>
                <input name="phone" className="form-input" required value={form.phone} onChange={handleChange} placeholder="+91" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Interested Plots</label>
                <input name="interestedPlots" className="form-input" value={form.interestedPlots} onChange={handleChange} placeholder="e.g. P1-045, P1-060" />
              </div>
              <div className="form-group">
                <label className="form-label">Budget (₹)</label>
                <input name="budget" className="form-input" value={form.budget} onChange={handleChange} placeholder="e.g. 5,00,000" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Follow-up Date</label>
                <input name="followUpDate" type="date" className="form-input" value={form.followUpDate} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select name="status" className="form-select" value={form.status} onChange={handleChange}>
                  <option value="open">Open</option>
                  <option value="follow_up">Follow Up</option>
                  <option value="converted">Converted</option>
                  <option value="lost">Lost</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea name="notes" className="form-textarea" value={form.notes} onChange={handleChange} placeholder="Visit notes, requirements, preferences…" />
            </div>
          </div>
          <div className="drawer-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? '⏳ Saving…' : '💾 Save Enquiry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const STATUS_COLORS = {
  open:      { bg:'rgba(59,130,246,0.1)',  color:'var(--accent-blue)',   label:'Open' },
  follow_up: { bg:'rgba(245,158,11,0.1)', color:'var(--accent-gold)',  label:'Follow Up' },
  converted: { bg:'rgba(16,185,129,0.1)', color:'var(--accent-green)', label:'Converted' },
  lost:      { bg:'rgba(239,68,68,0.1)',  color:'var(--accent-red)',   label:'Lost' },
};

export default function Enquiries() {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const unsub = subscribeEnquiries((data) => { setEnquiries(data); setLoading(false); });
    return unsub;
  }, []);

  const filtered = useMemo(() => {
    return enquiries.filter((e) => {
      if (statusFilter !== 'all' && e.status !== statusFilter) return false;
      if (search && !e.customerName?.toLowerCase().includes(search.toLowerCase()) && !e.phone?.includes(search)) return false;
      return true;
    });
  }, [enquiries, search, statusFilter]);

  const handleSaveNew = (data) => addEnquiry(data);
  const handleSaveEdit = (data) => updateEnquiry(editing.id, data);

  const stats = {
    open: enquiries.filter(e=>e.status==='open').length,
    follow_up: enquiries.filter(e=>e.status==='follow_up').length,
    converted: enquiries.filter(e=>e.status==='converted').length,
    lost: enquiries.filter(e=>e.status==='lost').length,
  };

  return (
    <div className="page-wrapper">
      <div className="page-header page-header--split">
        <div>
          <h1 className="page-title">📞 Enquiries</h1>
          <p className="page-subtitle">Customer lead management &amp; follow-up tracker</p>
        </div>
        <div className="page-header-actions">
          <button type="button" className="btn btn-primary" id="add-enquiry-btn" onClick={() => { setEditing(null); setShowForm(true); }}>
            + New Enquiry
          </button>
        </div>
      </div>

      {/* Status pills */}
      <div className="kpi-grid kpi-grid-4">
        {Object.entries(STATUS_COLORS).map(([key, cfg]) => (
          <div key={key} className="kpi-card" style={{ cursor: 'pointer', borderColor: statusFilter===key ? cfg.color : 'transparent' }}
            onClick={() => setStatusFilter(statusFilter === key ? 'all' : key)}>
            <div style={{ fontSize: 28, fontWeight: 800, color: cfg.color }}>{stats[key]}</div>
            <div className="kpi-label">{cfg.label}</div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="filter-bar">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input placeholder="Search by name or phone…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <button className={`filter-chip ${statusFilter==='all' ? 'active-all' : ''}`} onClick={() => setStatusFilter('all')}>All ({enquiries.length})</button>
      </div>

      {loading ? (
        <div className="loading-screen"><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📞</div>
          <h3>No enquiries found</h3>
          <p>Add your first customer enquiry above</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map((enq) => {
            const cfg = STATUS_COLORS[enq.status] || STATUS_COLORS.open;
            const isOverdue = enq.followUpDate && new Date(enq.followUpDate) < new Date() && enq.status !== 'converted';
            return (
              <div key={enq.id} className="card" style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                {/* Left accent */}
                <div style={{ width: 4, minHeight: 80, borderRadius: 99, background: cfg.color, flexShrink: 0 }} />

                <div style={{ flex: 1 }}>
                  <div className="flex-between mb-8">
                    <div>
                      <span className="fw-700" style={{ fontSize: 15 }}>{enq.customerName}</span>
                      <span className="text-muted fs-13" style={{ marginLeft: 10 }}>{enq.phone}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ background: cfg.bg, color: cfg.color, borderRadius: 99, padding: '2px 10px', fontSize: 12, fontWeight: 600 }}>
                        {cfg.label}
                      </span>
                      <button className="btn btn-secondary btn-sm" onClick={() => { setEditing(enq); setShowForm(true); }}>
                        Edit
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                    {enq.interestedPlots && <span className="text-secondary fs-13">📍 {enq.interestedPlots}</span>}
                    {enq.budget && <span className="text-secondary fs-13">💰 Budget: {enq.budget}</span>}
                    {enq.followUpDate && (
                      <span className={`fs-13 ${isOverdue ? 'text-danger' : 'text-secondary'}`}>
                        📅 Follow-up: {new Date(enq.followUpDate).toLocaleDateString('en-IN')}
                        {isOverdue ? ' ⚠️ Overdue' : ''}
                      </span>
                    )}
                    <span className="text-muted fs-12">
                      {enq.createdAt?.toDate?.()?.toLocaleDateString('en-IN') || '—'} · {enq.createdBy?.split('@')[0]}
                    </span>
                  </div>

                  {enq.notes && <div className="text-secondary fs-13 mt-8" style={{ borderLeft: '2px solid var(--border)', paddingLeft: 10 }}>{enq.notes}</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <EnquiryForm
          initial={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSave={editing ? handleSaveEdit : handleSaveNew}
        />
      )}
    </div>
  );
}
