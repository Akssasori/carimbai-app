import './HomeScreen.css';

interface HomeScreenProps {
  customerName?: string;
}

const HomeScreen = ({ customerName = 'Cliente' }: HomeScreenProps) => {
  return (
    <div className="home-screen">
      <header className="home-header">
        <h1 className="greeting">Olá, {customerName}!</h1>
        <p className="subtitle">Bem-vindo ao seu cartão de fidelidade</p>
      </header>

      <main className="home-content">
        <div className="card-container">
          <div className="loyalty-card">
            <div className="card-header">
              <h2>Seu Cartão</h2>
            </div>
            
            <div className="stamps-grid">
              {[...Array(10)].map((_, index) => (
                <div 
                  key={index} 
                  className={`stamp ${index < 0 ? 'filled' : ''}`}
                >
                  {index < 0 ? '✓' : index + 1}
                </div>
              ))}
            </div>

            <div className="progress-info">
              <p className="stamps-count">0 de 10 carimbos</p>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: '0%' }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className="actions">
          <button className="btn-primary">
            <span className="btn-icon">📱</span>
            Mostrar QR Code
          </button>
        </div>
      </main>
    </div>
  );
};

export default HomeScreen;
