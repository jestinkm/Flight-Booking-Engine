import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import AdminProtectedRoute from './components/AdminProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';

// Public & Customer Pages
import Home from './pages/Home';
import SearchFlights from './pages/SearchFlights';
import FlightDetails from './pages/FlightDetails';
import PassengerDetails from './pages/PassengerDetails';
import DemoPayment from './pages/DemoPayment';
import BookingSuccess from './pages/BookingSuccess';
import Login from './pages/Login';
import Register from './pages/Register';
import MyBookings from './pages/MyBookings';
import BookingDetails from './pages/BookingDetails';
import Profile from './pages/Profile';
import UserHome from './pages/UserHome';
import Offers from './pages/Offers';
import Support from './pages/Support';
import Notifications from './pages/Notifications';
import AdminLogin from './pages/AdminLogin';

// Admin Dashboards
import SuperAdminDashboard from './pages/admin/SuperAdminDashboard';
import ScheduleAdminDashboard from './pages/admin/ScheduleAdminDashboard';
import MarketingAdminDashboard from './pages/admin/MarketingAdminDashboard';

import SupportBot from './components/SupportBot';

// Layout controller to conditionally render public navbar/footer
const AppLayout = ({ children }) => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin') || location.pathname === '/admin-login';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-navy">
      {!isAdminRoute && <Navbar />}
      <div className="flex-1">
        <ErrorBoundary>{children}</ErrorBoundary>
      </div>
      {!isAdminRoute && <SupportBot />}
      {!isAdminRoute && <Footer />}
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#0B1F3A',
                color: '#FFFFFF',
                borderRadius: '16px',
                fontSize: '13px',
                fontWeight: '600',
                padding: '12px 18px',
                boxShadow: '0 10px 25px -5px rgba(11, 31, 58, 0.25)'
              },
              success: {
                iconTheme: {
                  primary: '#2496ED',
                  secondary: '#FFFFFF'
                }
              },
              error: {
                iconTheme: {
                  primary: '#F43F5E',
                  secondary: '#FFFFFF'
                }
              }
            }}
          />

          <AppLayout>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/search" element={<SearchFlights />} />
              <Route path="/flights/:instanceId" element={<FlightDetails />} />
              <Route path="/offers" element={<Offers />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/admin-login" element={<AdminLogin />} />

              {/* Protected Customer Routes */}
              <Route
                path="/passenger-details"
                element={
                  <ProtectedRoute>
                    <PassengerDetails />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/payment"
                element={
                  <ProtectedRoute>
                    <DemoPayment />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/booking-success/:bookingId"
                element={
                  <ProtectedRoute>
                    <BookingSuccess />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/user/home"
                element={
                  <ProtectedRoute>
                    <UserHome />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-bookings"
                element={
                  <ProtectedRoute>
                    <MyBookings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/bookings/:id"
                element={
                  <ProtectedRoute>
                    <BookingDetails />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/support"
                element={
                  <ProtectedRoute>
                    <Support />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/notifications"
                element={
                  <ProtectedRoute>
                    <Notifications />
                  </ProtectedRoute>
                }
              />

              {/* Admin Protected Routes */}
              <Route
                path="/admin/super"
                element={
                  <AdminProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                    <SuperAdminDashboard />
                  </AdminProtectedRoute>
                }
              />
              <Route
                path="/admin/schedule"
                element={
                  <AdminProtectedRoute allowedRoles={['SUPER_ADMIN', 'SCHEDULE_ADMIN']}>
                    <ScheduleAdminDashboard />
                  </AdminProtectedRoute>
                }
              />
              <Route
                path="/admin/marketing"
                element={
                  <AdminProtectedRoute allowedRoles={['SUPER_ADMIN', 'MARKETING_ADMIN']}>
                    <MarketingAdminDashboard />
                  </AdminProtectedRoute>
                }
              />

              {/* 404 Catch-All */}
              <Route
                path="*"
                element={
                  <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
                    <h2 className="text-4xl font-black text-navy">404</h2>
                    <p className="text-sm text-slate-500">The destination page does not exist or has been relocated.</p>
                    <a href="/" className="px-5 py-2.5 bg-navy hover:bg-skyblue text-white text-xs font-bold rounded-xl transition">
                      Return to Flight Engine
                    </a>
                  </div>
                }
              />
            </Routes>
          </AppLayout>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
