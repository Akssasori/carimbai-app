import HomeScreen from './components/HomeScreen';
import StaffScreen from './components/StaffScreen';
import { useCustomer } from './hooks/useCustomer';
import { CustomerOnboarding } from './components/CustomerOnboarding';
import './App.css';
import { Route, Routes, Navigate } from 'react-router-dom';
import StaffLogin from './components/StaffLogin';

function App() {
  const { customer, loading, loginOrRegister } = useCustomer();

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
                <CustomerOnboarding
                  onSubmit={async ({ name, email, phone }) => {
                    await loginOrRegister({
                      name,
                      email,
                      phone,
                      providerId: undefined, // depois você pode trocar por um UUID do device
                    });
                    // o hook atualiza `customer` e a HomeScreen aparece sozinha
                  }}
                />
              )}

              {!loading && customer && (
                <HomeScreen
                  customerId={customer.customerId}
                  customerName={customer.name ?? 'Cliente'}
                />
              )}
            </>
          }
        />

        {/* Rota especial do lojista */}
        <Route path="/staff" element={<StaffLogin />} />
        <Route path="/staff/dashboard" element={<StaffScreen />} />

        {/* Qualquer outra URL redireciona pra home do cliente */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;