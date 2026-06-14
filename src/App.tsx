import HomeScreen from './components/CustomerScreen';
import StaffScreen from './components/StaffScreen';
import { useCustomer } from './hooks/useCustomer';
import { CustomerOnboarding } from './components/CustomerLogin';
import './App.css';
import { Route, Routes, Navigate } from 'react-router-dom';
import StaffLogin from './components/StaffLogin';
import ForgotPassword from './components/staff/ForgotPassword';
import ResetPassword from './components/staff/ResetPassword';
import ProgramsAdmin from './components/admin/ProgramsAdmin';
import StaffAdmin from './components/admin/StaffAdmin';
import LocationsAdmin from './components/admin/LocationsAdmin';

interface StaffSessionLite {
  role?: 'ADMIN' | 'CASHIER';
}

/**
 * Rota apenas para staff com role ADMIN. Le a sessao do localStorage
 * (mesmo pattern usado por StaffLogin/StaffScreen). Sem sessao → /staff.
 * Sessao nao-ADMIN → /staff/dashboard.
 */
function AdminRoute({ children }: { children: React.ReactNode }) {
  const raw = localStorage.getItem('carimbai_staff_session');
  if (!raw) return <Navigate to="/staff" replace />;

  let session: StaffSessionLite | null = null;
  try {
    session = JSON.parse(raw) as StaffSessionLite;
  } catch {
    session = null;
  }

  if (!session) return <Navigate to="/staff" replace />;
  if (session.role !== 'ADMIN') return <Navigate to="/staff/dashboard" replace />;
  return <>{children}</>;
}

function App() {
  const { customer, loading, loginOrRegister, socialLogin, logout } = useCustomer();
  const { customer, loading, socialLogin } = useCustomer();

  return (
    <div className="app-container">
      <Routes>
        {/* Rota padrão: fluxo do cliente */}
        <Route
          path="/"
          element={
            <>
              {loading && <div>Carregando...</div>}

              {!loading && !customer && (
                <CustomerOnboarding onSocialLogin={socialLogin} />
              )}

              {!loading && customer && (
                <HomeScreen
                  customerId={customer.customerId}
                  customerName={customer.name ?? 'Cliente'}
                  customerEmail={customer.email}
                  customerToken={customer.token}
                />
              )}
            </>
          }
        />

        {/* Rotas do lojista */}
        <Route path="/staff" element={<StaffLogin />} />
        <Route path="/staff/forgot-password" element={<ForgotPassword />} />
        <Route path="/staff/reset-password" element={<ResetPassword />} />
        <Route path="/staff/dashboard" element={<StaffScreen />} />

        {/* Rotas admin (gestao) */}
        <Route path="/staff/admin/programs" element={<AdminRoute><ProgramsAdmin /></AdminRoute>} />
        <Route path="/staff/admin/staff" element={<AdminRoute><StaffAdmin /></AdminRoute>} />
        <Route path="/staff/admin/locations" element={<AdminRoute><LocationsAdmin /></AdminRoute>} />

        {/* Qualquer outra URL redireciona pra home do cliente */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
