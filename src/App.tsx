import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import { ThemeProvider } from "./context/ThemeContext";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import JoinPage from "./pages/JoinPage";
import Dashboard from "./pages/Dashboard";
import CreateIncident from "./pages/CreateIncident";
import IncidentRoom from "./pages/IncidentRoom";
import IncidentHistory from "./pages/IncidentHistory";
import AdminDashboard from "./pages/AdminDashboard";
import SettingsPage from "./pages/SettingsPage";
import DashboardLayout from "./layouts/DashboardLayout";


function AppRoutes() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-primary dark:bg-bg-primary flex items-center justify-center transition-colors duration-200">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" /> : <LoginPage />} />
        <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" /> : <RegisterPage />} />
        <Route path="/join" element={<JoinPage />} />
        
        {/* Protected Dashboard Routes */}
        <Route path="/dashboard" element={
          isAuthenticated ? <DashboardLayout><Dashboard /></DashboardLayout> : <Navigate to="/login" />
        } />
        <Route path="/create" element={
          isAuthenticated ? <DashboardLayout><CreateIncident /></DashboardLayout> : <Navigate to="/login" />
        } />
        <Route path="/history" element={
          isAuthenticated ? <DashboardLayout><IncidentHistory /></DashboardLayout> : <Navigate to="/login" />
        } />
        <Route path="/settings" element={
          isAuthenticated ? <DashboardLayout><SettingsPage /></DashboardLayout> : <Navigate to="/login" />
        } />
        <Route path="/admin" element={
          isAuthenticated && user?.role === 'ADMIN' ? <DashboardLayout><AdminDashboard /></DashboardLayout> : <Navigate to="/dashboard" />
        } />
        <Route path="/incident/:id" element={
          isAuthenticated ? <IncidentRoom /> : <Navigate to="/login" />
        } />
        
        <Route path="*" element={<div>404 Not Found</div>} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
