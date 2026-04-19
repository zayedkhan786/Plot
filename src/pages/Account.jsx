import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { changeAccountEmail, changeAccountPassword } from '../firebase/auth';

function authErrorMessage(err) {
  const code = err?.code || '';
  if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
    return 'Current password is incorrect.';
  }
  if (code === 'auth/requires-recent-login') {
    return 'Please sign out and sign in again, then retry.';
  }
  if (code === 'auth/email-already-in-use') {
    return 'That email is already used by another account.';
  }
  if (code === 'auth/invalid-email') {
    return 'Enter a valid email address.';
  }
  if (code === 'auth/weak-password') {
    return 'Password should be at least 6 characters.';
  }
  return err?.message || 'Something went wrong. Try again.';
}

export default function Account() {
  const { user } = useAuth();

  const [emailNew, setEmailNew] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailMsg, setEmailMsg] = useState(null);
  const [emailErr, setEmailErr] = useState('');

  const [pwCurrent, setPwCurrent] = useState('');
  const [pwNew, setPwNew] = useState('');
  const [pwConfirm, setPwConfirm] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState(null);
  const [pwErr, setPwErr] = useState('');

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setEmailErr('');
    setEmailMsg(null);
    const next = emailNew.trim();
    if (!next) {
      setEmailErr('Enter a new email address.');
      return;
    }
    if (next.toLowerCase() === (user?.email || '').toLowerCase()) {
      setEmailErr('That is already your email.');
      return;
    }
    setEmailLoading(true);
    try {
      await changeAccountEmail(user, emailPassword, next);
      setEmailMsg('Email updated. Check the new inbox if Firebase sends a verification link.');
      setEmailNew('');
      setEmailPassword('');
    } catch (err) {
      setEmailErr(authErrorMessage(err));
    } finally {
      setEmailLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPwErr('');
    setPwMsg(null);
    if (pwNew.length < 6) {
      setPwErr('New password must be at least 6 characters.');
      return;
    }
    if (pwNew !== pwConfirm) {
      setPwErr('New password and confirmation do not match.');
      return;
    }
    setPwLoading(true);
    try {
      await changeAccountPassword(user, pwCurrent, pwNew);
      setPwMsg('Password updated. Use the new password next time you sign in.');
      setPwCurrent('');
      setPwNew('');
      setPwConfirm('');
    } catch (err) {
      setPwErr(authErrorMessage(err));
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <h1 className="page-title">🔐 Account</h1>
        <p className="page-subtitle">Signed in as <strong>{user?.email}</strong></p>
      </div>

      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="card-lg">
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Change email</h2>
          <p className="text-muted fs-13" style={{ marginBottom: 16, lineHeight: 1.6 }}>
            Enter your current password to confirm, then the new email. Your Firebase project may send a verification email to the new address.
          </p>
          {emailErr && (
            <div className="login-error" style={{ marginBottom: 12 }}>
              ⚠️ {emailErr}
            </div>
          )}
          {emailMsg && (
            <div
              style={{
                marginBottom: 12,
                padding: '10px 14px',
                borderRadius: 8,
                background: 'rgba(16,185,129,0.1)',
                border: '1px solid rgba(16,185,129,0.3)',
                fontSize: 13,
                color: 'var(--accent-green)',
              }}
            >
              ✅ {emailMsg}
            </div>
          )}
          <form onSubmit={handleEmailSubmit}>
            <div className="form-group">
              <label className="form-label">New email</label>
              <input
                type="email"
                className="form-input"
                value={emailNew}
                onChange={(e) => setEmailNew(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Current password</label>
              <input
                type="password"
                className="form-input"
                value={emailPassword}
                onChange={(e) => setEmailPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={emailLoading}>
              {emailLoading ? 'Updating…' : 'Update email'}
            </button>
          </form>
        </div>

        <div className="card-lg">
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Change password</h2>
          <p className="text-muted fs-13" style={{ marginBottom: 16, lineHeight: 1.6 }}>
            Enter your current password, then choose a new one (at least 6 characters).
          </p>
          {pwErr && (
            <div className="login-error" style={{ marginBottom: 12 }}>
              ⚠️ {pwErr}
            </div>
          )}
          {pwMsg && (
            <div
              style={{
                marginBottom: 12,
                padding: '10px 14px',
                borderRadius: 8,
                background: 'rgba(16,185,129,0.1)',
                border: '1px solid rgba(16,185,129,0.3)',
                fontSize: 13,
                color: 'var(--accent-green)',
              }}
            >
              ✅ {pwMsg}
            </div>
          )}
          <form onSubmit={handlePasswordSubmit}>
            <div className="form-group">
              <label className="form-label">Current password</label>
              <input
                type="password"
                className="form-input"
                value={pwCurrent}
                onChange={(e) => setPwCurrent(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">New password</label>
              <input
                type="password"
                className="form-input"
                value={pwNew}
                onChange={(e) => setPwNew(e.target.value)}
                autoComplete="new-password"
                required
                minLength={6}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm new password</label>
              <input
                type="password"
                className="form-input"
                value={pwConfirm}
                onChange={(e) => setPwConfirm(e.target.value)}
                autoComplete="new-password"
                required
                minLength={6}
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={pwLoading}>
              {pwLoading ? 'Updating…' : 'Update password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
