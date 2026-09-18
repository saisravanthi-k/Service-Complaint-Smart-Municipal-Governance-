import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import LoginRegister from './pages/LoginRegister';
import CitizenPortal from './pages/CitizenPortal';
import OfficerPortal from './pages/OfficerPortal';
import AdminPortal from './pages/AdminPortal';
import CommissionerPortal from './pages/CommissionerPortal';
import ComplaintDetails from './pages/ComplaintDetails';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white text-sm">Loading Application...</div>;
  if (!user) return <Navigate to="/" replace />;
  if (allowedRoles && !allowedRoles.includes(user.user_type)) {
    if (user.user_type === 'officer') return <Navigate to="/officer" replace />;
    if (user.user_type === 'admin') return <Navigate to="/admin" replace />;
    if (user.user_type === 'commissioner') return <Navigate to="/commissioner" replace />;
    return <Navigate to="/citizen" replace />;
  }
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LoginRegister />} />
      <Route
        path="/citizen"
        element={
          <ProtectedRoute allowedRoles={['citizen']}>
            <CitizenPortal />
          </ProtectedRoute>
        }
      />
      <Route
        path="/officer"
        element={
          <ProtectedRoute allowedRoles={['officer']}>
            <OfficerPortal />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminPortal />
          </ProtectedRoute>
        }
      />
      <Route
        path="/commissioner"
        element={
          <ProtectedRoute allowedRoles={['commissioner']}>
            <CommissionerPortal />
          </ProtectedRoute>
        }
      />
      <Route path="/complaint/:id" element={<ComplaintDetails />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </LanguageProvider>
  );
}
