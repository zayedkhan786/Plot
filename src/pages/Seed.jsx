import { useState } from 'react';
import { seedPlots } from '../firebase/firestore';
import { ALL_PLOTS } from '../utils/plotData';

const STEP_TITLES = [
  'Create a Firebase Project',
  'Enable Authentication (Email/Password)',
  'Enable Firestore Database + Security Rules',
  'Get your Firebase Config Keys → Fill .env file',
  'Seed the Plot Database (one time only)',
];

function Step1() {
  return (
    <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
      <p>
        Go to{' '}
        <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer"
          style={{ color: 'var(--accent-blue)', textDecoration: 'underline' }}>
          console.firebase.google.com
        </a>{' '}
        → click <strong style={{ color: 'var(--text-primary)' }}>Add project</strong> → name it <strong style={{ color:'var(--text-primary)' }}>shree-dungar-residency</strong> → click through and create.
      </p>
      <div style={{
        background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
        borderRadius: 8, padding: '10px 14px', marginTop: 12, fontSize: 13,
      }}>
        ✅ Firebase <strong>Spark (Free) plan</strong> is perfectly enough for 3–5 users managing 166 plots. <strong>No credit card required</strong>.
      </div>
    </div>
  );
}

function Step2() {
  return (
    <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
      <p>In Firebase Console → <strong style={{ color:'var(--text-primary)' }}>Authentication</strong> → <strong>Get Started</strong> → <strong>Email/Password</strong> → Enable → Save.</p>
      <p style={{ marginTop: 8 }}>Then go to the <strong style={{ color:'var(--text-primary)' }}>Users</strong> tab → <strong>Add User</strong>.</p>
      <p style={{ marginTop: 8 }}>Add each team member:</p>
      <pre style={{ background:'#0D1B2A', borderRadius:8, padding:'10px 14px', fontSize:12, color:'#93C5FD', marginTop:8, lineHeight:1.8 }}>
{`Example users to add:
  admin@shree-dungar.in    → strong password
  sales@shree-dungar.in   → strong password
  office@shree-dungar.in  → strong password`}
      </pre>
      <div style={{ background:'rgba(16,185,129,0.08)', border:'1px solid rgba(16,185,129,0.2)', borderRadius:8, padding:'10px 14px', marginTop:12, fontSize:13 }}>
        🔒 <strong>No public signup</strong> — only users you manually add can log in. Nobody can self-register.
      </div>
    </div>
  );
}

function Step3() {
  const [copied, setCopied] = useState(false);
  const rules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}`;
  const copy = () => {
    navigator.clipboard.writeText(rules).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };
  return (
    <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
      <p>In Firebase Console → <strong style={{ color:'var(--text-primary)' }}>Firestore Database</strong> → <strong>Create Database</strong> → choose <strong>Production Mode</strong> → select <strong>asia-south1</strong> (Mumbai) → Done.</p>
      <p style={{ marginTop: 12 }}>Then go to <strong style={{ color:'var(--text-primary)' }}>Rules</strong> tab and paste this:</p>
      <div style={{ position: 'relative', marginTop: 8 }}>
        <pre style={{ background:'#0D1B2A', borderRadius:8, padding:'12px 14px', fontSize:12, color:'#93C5FD', lineHeight:1.8, paddingRight: 80 }}>
{rules}
        </pre>
        <button
          onClick={copy}
          style={{
            position:'absolute', top:10, right:10,
            background: copied ? 'rgba(16,185,129,0.2)' : 'rgba(59,130,246,0.2)',
            border: `1px solid ${copied ? 'rgba(16,185,129,0.4)' : 'rgba(59,130,246,0.4)'}`,
            color: copied ? 'var(--accent-green)' : 'var(--accent-blue)',
            padding:'4px 10px', borderRadius:6, fontSize:12, cursor:'pointer'
          }}
        >
          {copied ? '✅ Copied!' : '📋 Copy'}
        </button>
      </div>
      <p style={{ marginTop:8, fontSize:12, color:'var(--text-muted)' }}>Click <strong>Publish</strong>. Only your logged-in team members can read/write data.</p>
      <div style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:8, padding:'10px 14px', marginTop:12, fontSize:13, color:'var(--accent-red)' }}>
        ⚠️ <strong>Important:</strong> Without publishing these rules, the "Seed" button will fail with a "Missing or insufficient permissions" error.
      </div>
    </div>
  );
}

function Step4() {
  return (
    <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
      <p>In Firebase Console → <strong style={{ color:'var(--text-primary)' }}>Project Settings</strong> (gear icon, top left) → scroll to <strong>Your apps</strong> → click the <strong>&lt;/&gt; Web</strong> icon → register app → copy the config.</p>
      <p style={{ marginTop: 8 }}>Open this file in a text editor and replace the placeholder values:</p>
      <pre style={{ background:'#0D1B2A', borderRadius:8, padding:'12px 14px', fontSize:12, color:'#93C5FD', marginTop:8, lineHeight:1.9 }}>
{`# File: shree-dungar-residency/.env

VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123`}
      </pre>
      <div style={{ background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.2)', borderRadius:8, padding:'10px 14px', marginTop:12, fontSize:13, color:'var(--accent-gold)' }}>
        ⚠️ After saving .env, <strong>restart the dev server</strong>: press Ctrl+C then run <code>npm run dev</code> again.
      </div>
    </div>
  );
}

function Step5() {
  const [phase, setPhase] = useState('idle'); // idle | confirm | seeding | done | error
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  const handleSeed = async () => {
    setPhase('seeding');
    setProgress(0);
    setError('');
    try {
      // Chunk into batches of 50 to show progress & stay well under Firestore's 500-doc batch limit
      const CHUNK = 50;
      const total = ALL_PLOTS.length;
      for (let i = 0; i < total; i += CHUNK) {
        const chunk = ALL_PLOTS.slice(i, i + CHUNK);
        await seedPlots(chunk);
        setProgress(Math.min(100, Math.round(((i + chunk.length) / total) * 100)));
      }
      setPhase('done');
    } catch (e) {
      setError(e.message || String(e));
      setPhase('error');
    }
  };

  if (phase === 'done') {
    return (
      <div style={{ background:'rgba(16,185,129,0.08)', border:'1px solid var(--accent-green)', borderRadius:10, padding:'20px 22px', textAlign:'center' }}>
        <div style={{ fontSize: 40, marginBottom: 10 }}>🎉</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent-green)', marginBottom: 8 }}>
          {ALL_PLOTS.length} plots created in Firestore!
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          Go to <strong>Plot Map</strong> to see all plots and start managing sales.
        </p>
      </div>
    );
  }

  return (
    <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
      <p>
        Once Firebase is configured and you're logged in, click below to initialize all{' '}
        <strong style={{ color:'var(--text-primary)' }}>{ALL_PLOTS.length} plots</strong> in Firestore.
        Each plot starts as <em>Available</em> with no buyer info.
      </p>

      <div style={{ background:'var(--bg-surface)', borderRadius:8, padding:14, margin:'14px 0', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'6px 24px' }}>
        {[
          ['Phase 1 plots', ALL_PLOTS.filter(p=>p.phase===1).length],
          ['Phase 2 plots', ALL_PLOTS.filter(p=>p.phase===2).length],
          ['Type A — 30×40 ft', ALL_PLOTS.filter(p=>p.plotType==='A').length],
          ['Type B — 30×50 ft', ALL_PLOTS.filter(p=>p.plotType==='B').length],
          ['Type C — 40×60 ft', ALL_PLOTS.filter(p=>p.plotType==='C').length],
          ['Total plots', ALL_PLOTS.length],
        ].map(([l,v]) => (
          <div key={l} style={{ display:'flex', justifyContent:'space-between', fontSize:13 }}>
            <span style={{ color:'var(--text-muted)' }}>{l}:</span>
            <span style={{ fontWeight:700, color:'var(--text-primary)' }}>{v}</span>
          </div>
        ))}
      </div>

      <div style={{ background:'rgba(245,158,11,0.06)', border:'1px solid rgba(245,158,11,0.2)', borderRadius:8, padding:'10px 14px', marginBottom:16, fontSize:13, color:'var(--accent-gold)' }}>
        ⚠️ Run this <strong>ONCE only</strong>. Existing plot data is not overwritten (uses merge).
      </div>

      {/* Error state */}
      {phase === 'error' && (
        <div style={{ background:'rgba(239,68,68,0.08)', border:'1px solid var(--accent-red)', borderRadius:8, padding:'14px 16px', marginBottom:16 }}>
          <div style={{ color:'var(--accent-red)', fontWeight:700, marginBottom:6 }}>❌ Seeding failed</div>
          <div style={{ fontSize:13, color:'var(--text-secondary)', marginBottom:10 }}>{error}</div>
          {error.toLowerCase().includes('permission') && (
            <div style={{ fontSize:12, color:'var(--accent-gold)', background:'rgba(245,158,11,0.08)', borderRadius:6, padding:'8px 12px' }}>
              💡 <strong>Fix:</strong> Go to Firebase Console → Firestore → <strong>Rules</strong> tab → paste and publish the rules shown in Step 3 above.
            </div>
          )}
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setPhase('idle')}
            style={{ marginTop: 12 }}
          >
            ↩ Try Again
          </button>
        </div>
      )}

      {/* Seeding progress */}
      {phase === 'seeding' && (
        <div style={{ background:'var(--bg-surface)', border:'1px solid var(--border)', borderRadius:10, padding:'20px 22px', marginBottom:16 }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8, fontSize:13 }}>
            <span style={{ color:'var(--text-secondary)' }}>⏳ Creating plots in Firestore…</span>
            <span style={{ fontWeight:700, color:'var(--accent-blue)' }}>{progress}%</span>
          </div>
          <div style={{ height:8, background:'var(--border)', borderRadius:99, overflow:'hidden' }}>
            <div style={{
              height:'100%', width:`${progress}%`,
              background:'var(--gradient-accent)',
              borderRadius:99,
              transition:'width 0.4s ease',
            }} />
          </div>
          <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:8, textAlign:'center' }}>
            {Math.round((progress / 100) * ALL_PLOTS.length)} / {ALL_PLOTS.length} plots written
          </div>
        </div>
      )}

      {/* In-UI confirmation */}
      {phase === 'confirm' && (
        <div style={{
          background:'rgba(59,130,246,0.06)', border:'1px solid rgba(59,130,246,0.25)',
          borderRadius:10, padding:'18px 20px', marginBottom:16,
        }}>
          <div style={{ fontWeight:700, fontSize:15, marginBottom:8 }}>Confirm Database Initialization</div>
          <p style={{ fontSize:13, color:'var(--text-secondary)', marginBottom:16 }}>
            This will write <strong style={{ color:'var(--text-primary)' }}>{ALL_PLOTS.length} plots</strong> to your Firestore database.
            Existing plots will <strong>not</strong> be overwritten. Proceed?
          </p>
          <div style={{ display:'flex', gap:10 }}>
            <button id="seed-confirm-yes" className="btn btn-success btn-sm" onClick={handleSeed}>
              ✅ Yes, Initialize {ALL_PLOTS.length} Plots
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => setPhase('idle')}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Main action button */}
      {(phase === 'idle' || phase === 'error') && phase !== 'error' && (
        <button
          id="seed-plots-btn"
          className="btn btn-primary"
          onClick={() => setPhase('confirm')}
        >
          🌱 Initialize {ALL_PLOTS.length} Plots in Firestore
        </button>
      )}

      {phase === 'idle' && (
        <button
          id="seed-plots-btn"
          className="btn btn-primary"
          onClick={() => setPhase('confirm')}
        >
          🌱 Initialize {ALL_PLOTS.length} Plots in Firestore
        </button>
      )}
    </div>
  );
}

export default function Seed() {
  const [open, setOpen] = useState(null);

  const STEPS = [Step1, Step2, Step3, Step4, Step5];

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <h1 className="page-title">⚙️ Setup & Firebase Guide</h1>
        <p className="page-subtitle">Follow these 5 steps to go live — takes about 10 minutes</p>
      </div>

      {/* Free tier banner */}
      <div style={{
        background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.2)',
        borderRadius:12, padding:'16px 22px', marginBottom:28,
        display:'flex', gap:18, alignItems:'flex-start', flexWrap:'wrap',
      }}>
        <div style={{ fontSize:36, lineHeight:1 }}>🆓</div>
        <div>
          <div style={{ fontWeight:700, fontSize:15, color:'var(--accent-green)', marginBottom:6 }}>
            Firebase Free Plan — enough for your team forever
          </div>
          <div style={{ fontSize:13, color:'var(--text-secondary)', lineHeight:1.8 }}>
            <strong>50,000 reads/day</strong> · <strong>20,000 writes/day</strong> · <strong>1 GB storage</strong> · <strong>5 simultaneous connections</strong><br />
            For 3–5 people managing 166 plots — this is more than enough. <strong>No credit card. Always free.</strong>
          </div>
        </div>
      </div>

      {/* Quick Firestore Rules Alert */}
      <div style={{
        background:'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.2)',
        borderRadius:12, padding:'16px 22px', marginBottom:28,
        display:'flex', gap:14, alignItems:'flex-start',
      }}>
        <div style={{ fontSize:28, lineHeight:1 }}>🔑</div>
        <div>
          <div style={{ fontWeight:700, fontSize:14, color:'var(--accent-red)', marginBottom:4 }}>
            Common issue: "Missing or insufficient permissions"
          </div>
          <div style={{ fontSize:13, color:'var(--text-secondary)' }}>
            If the seed fails, open <strong>Step 3</strong> below → copy the security rules → paste them in Firebase Console → Firestore → Rules → Publish.
          </div>
        </div>
      </div>

      {/* Accordion Steps */}
      <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:28 }}>
        {STEP_TITLES.map((title, idx) => {
          const StepContent = STEPS[idx];
          const isOpen = open === idx;
          return (
            <div key={idx} className="card-lg" style={{ padding:0, overflow:'hidden' }}>
              <button
                style={{
                  width:'100%', background:'none', display:'flex', alignItems:'center',
                  gap:14, padding:'16px 22px', textAlign:'left', cursor:'pointer',
                  borderBottom: isOpen ? '1px solid var(--border)' : 'none',
                }}
                onClick={() => setOpen(isOpen ? null : idx)}
                id={`setup-step-${idx+1}`}
              >
                <div style={{
                  width:30, height:30, borderRadius:'50%', flexShrink:0,
                  background: idx === 4 ? 'var(--gradient-green)' : 'var(--gradient-accent)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:13, fontWeight:800, color:'#fff',
                }}>
                  {idx + 1}
                </div>
                <span style={{ fontSize:14, fontWeight:700, flex:1 }}>{title}</span>
                {idx === 4 && <span style={{ fontSize:11, color:'var(--accent-green)', background:'rgba(16,185,129,0.1)', borderRadius:99, padding:'2px 10px' }}>Action Required</span>}
                <span style={{ color:'var(--text-muted)', fontSize:16 }}>{isOpen ? '▲' : '▼'}</span>
              </button>

              {isOpen && (
                <div style={{ padding:'18px 22px' }}>
                  <StepContent />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Database structure reference */}
      <div className="card-lg">
        <h3 style={{ fontSize:15, fontWeight:700, marginBottom:16 }}>📦 Firestore Database Structure</h3>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:12 }}>
          {[
            { col:'plots',        icon:'📍', desc:'166 plots: status, buyer name/phone, price, payments, notes'},
            { col:'transactions', icon:'💸', desc:'Every payment with receipt number, amount, type, date'},
            { col:'enquiries',    icon:'📞', desc:'Customer leads, budget, follow-up dates, status'},
            { col:'meta',         icon:'🔢', desc:'Receipt counter — auto-generates SDR-0001, SDR-0002…'},
          ].map((c) => (
            <div key={c.col} style={{ background:'var(--bg-panel)', borderRadius:8, padding:14 }}>
              <div style={{ fontSize:22, marginBottom:6 }}>{c.icon}</div>
              <div style={{ fontSize:13, fontWeight:700, color:'var(--accent-blue)', marginBottom:4 }}>{c.col}</div>
              <div style={{ fontSize:12, color:'var(--text-muted)', lineHeight:1.6 }}>{c.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
