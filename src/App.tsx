import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { Navbar } from "./components/Navbar";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import StudentDashboard from "./pages/StudentDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";
import CorrectionRequestForm from "./pages/CorrectionRequest";
import LeaveRequest from "./pages/LeaveRequest";
import ViewHistory from "./pages/ViewHistory";
import KitchenDuty from "./pages/KitchenDuty";
import QRScanner from "./pages/QRScanner";
import StudentReportPage from "./pages/StudentReportPage";
import PendingLeaveRequests from "./pages/PendingLeaveRequests";
import AttendanceCorrections from "./pages/AttendanceCorrections";
import QRCodeGenerator from "./pages/QRCodeGenerator";
import StudentRecords from "./pages/StudentRecords";
import LifecycleTracker from "./pages/LifecycleTracker";
import ReportsAndDownloads from "./pages/Document";
// import StudentTrackingForm from "./pages/StudentTracking";


const queryClient = new QueryClient();

function ProtectedRoute({ children, requiredRole }: { children: React.ReactNode; requiredRole?: 'admin' | 'student' }) {
  const { user, role, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && role !== requiredRole) {
    return <Navigate to={role === 'admin' ? '/admin' : '/dashboard'} replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { user, role, signOut } = useAuth();

  return (
    <>
      <Navbar
        isAuthenticated={!!user}
        userRole={role || 'student'}
        onLogout={signOut}
      />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={user ? <Navigate to={role === 'admin' ? '/admin' : '/dashboard'} replace /> : <Login />} />
        <Route path="/signup" element={user ? <Navigate to={role === 'admin' ? '/admin' : '/dashboard'} replace /> : <Signup />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute requiredRole="student">
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/correction"
          element={
            <ProtectedRoute requiredRole="student">
              <CorrectionRequestForm />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/leave"
          element={
            <ProtectedRoute requiredRole="student">
              <LeaveRequest />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/view-history"
          element={
            <ProtectedRoute requiredRole="student">
              <ViewHistory />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/kitchen-duty"
          element={
            <ProtectedRoute requiredRole="student">
              <KitchenDuty />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/qr-scanner"
          element={
            <ProtectedRoute requiredRole="student">
              <QRScanner />
            </ProtectedRoute>
          }
        />

        {/* <Route
          path="/student/tracking"
          element={
            <ProtectedRoute requiredRole="student">
              <StudentTrackingForm />
            </ProtectedRoute>
          }
        /> */}

        <Route
          path="/admin/student-report/:studentId"
          element={
            <ProtectedRoute requiredRole="admin">
              <StudentReportPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/leave"
          element={
            <ProtectedRoute requiredRole="admin">
              <PendingLeaveRequests />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/correction"
          element={
            <ProtectedRoute requiredRole="admin">
              <AttendanceCorrections />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/view-history"
          element={
            <ProtectedRoute requiredRole="admin">
              <StudentRecords />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/tracking"
          element={
            <ProtectedRoute requiredRole="admin">
              <LifecycleTracker />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/qr-generator"
          element={
            <ProtectedRoute>
              <QRCodeGenerator />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/document"
          element={
            <ProtectedRoute>
              <ReportsAndDownloads />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
