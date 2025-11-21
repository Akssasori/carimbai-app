import { useState } from 'react'
import HomeScreen from './components/HomeScreen'
import StaffScreen from './components/StaffScreen'
import './App.css'

function App() {
  const [mode, setMode] = useState<'customer' | 'staff'>('customer')

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
        <HomeScreen customerId={1} customerName="Lucas" />
      ) : (
        <StaffScreen />
      )}
    </div>
  )
}

export default App
