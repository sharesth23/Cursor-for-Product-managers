import { Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";
import Landing from "./pages/Landing.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import SuperAdminLogin from "./pages/SuperAdminLogin.jsx";
import SuperAdminDashboard from "./pages/SuperAdminDashboard.jsx";
import CompanyAdmin from "./pages/CompanyAdmin.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Project from "./pages/Project.jsx";
import Upload from "./pages/Upload.jsx";
import Analysis from "./pages/Analysis.jsx";
import Tasks from "./pages/Tasks.jsx";
import Navbar from "./components/Navbar.jsx";
import Splash from "./components/Splash.jsx";

import { AuthProvider } from "./context/AuthContext.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return <Splash onFinish={() => setShowSplash(false)} />;
  }

  return (
    <AuthProvider>
      <div className="app">
        <Navbar />
        <div className="app-body">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/:companySlug/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            
            {/* Super Admin Routes */}
            <Route path="/super-admin/login" element={<SuperAdminLogin />} />
            <Route 
              path="/super-admin/dashboard" 
              element={
                <ProtectedRoute requireSuperAdmin>
                  <SuperAdminDashboard />
                </ProtectedRoute>
              } 
            />

            {/* Tenant Routes */}
            {/* Company Admin Panel */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute minRole="admin">
                  <CompanyAdmin />
                </ProtectedRoute>
              }
            />

            {/* Employee Workspace Routes */}
            <Route
              path="/:companySlug/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/:companySlug/projects/:projectId"
              element={
                <ProtectedRoute>
                  <Project />
                </ProtectedRoute>
              }
            />
            <Route
              path="/:companySlug/projects/:projectId/upload"
              element={
                <ProtectedRoute>
                  <Upload />
                </ProtectedRoute>
              }
            />
            <Route
              path="/:companySlug/projects/:projectId/analysis"
              element={
                <ProtectedRoute>
                  <Analysis />
                </ProtectedRoute>
              }
            />
            <Route
              path="/:companySlug/projects/:projectId/tasks"
              element={
                <ProtectedRoute>
                  <Tasks />
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </div>
    </AuthProvider>
  );
}
