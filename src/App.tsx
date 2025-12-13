import { useState } from 'react';
import HomeScreen from './components/HomeScreen';
import StaffScreen from './components/StaffScreen';
import { useCustomer } from './hooks/useCustomer';
import { CustomerOnboarding } from './components/CustomerOnboarding';
import './App.css';

function App() {
  const [mode, setMode] = useState<'customer' | 'staff'>('customer');
  const { customer, loading, loginOrRegister } = useCustomer();

  return (
    <div className="app-container">
      <div className="mode-selector">
        <button
          className={`mode-btn ${mode === 'customer' ? 'active' : ''}`}
          onClick={() => setMode('customer')}
        >
          👤 Cliente
        </button>
        <button
          className={`mode-btn ${mode === 'staff' ? 'active' : ''}`}
          onClick={() => setMode('staff')}
        >
          🏪 Lojista
        </button>
      </div>

      {mode === 'customer' ? (
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
                // não precisa "redirecionar":
                // o useCustomer vai atualizar `customer`
                // e o App vai passar a renderizar a HomeScreen automaticamente
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
      ) : (
        <StaffScreen />
      )}
    </div>
  );
}

export default App;