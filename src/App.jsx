import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PlotProvider } from './context/PlotContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import MapView from './pages/MapView';
import Finance from './pages/Finance';
import Enquiries from './pages/Enquiries';
import Receipts from './pages/Receipts';
import Seed from './pages/Seed';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <span style={{ color: 'var(--text-secondary)', marginTop: 16 }}>Loading…</span>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <PlotProvider>
              <Layout>
                <Routes>
                  <Route path="/"           element={<Dashboard />} />
                  <Route path="/map"        element={<MapView />} />
                  <Route path="/finance"    element={<Finance />} />
                  <Route path="/receipts"   element={<Receipts />} />
                  <Route path="/enquiries"  element={<Enquiries />} />
                  <Route path="/seed"       element={<Seed />} />
                  <Route path="*"           element={<Navigate to="/" replace />} />
                </Routes>
              </Layout>
            </PlotProvider>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
