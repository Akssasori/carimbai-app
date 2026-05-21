import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';

/**
 * Tela /staff/forgot-password — solicita reset de senha por email.
 * Resposta do backend e sempre 204 (anti-enumeration), entao a UI mostra
 * mensagem generica de sucesso mesmo se o email nao existir.
 */
export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (!email.trim()) {
      setError('Informe o email.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await apiService.forgotPassword(email.trim());
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao solicitar reset');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.mainContent}>
        <div style={styles.wrapper}>
          <h1 style={styles.title}>Recuperar senha</h1>

          <div style={styles.card}>
            {done ? (
              <>
                <h2 style={styles.cardTitle}>Pronto!</h2>
                <p style={styles.cardSubtitle}>
                  Se este email estiver cadastrado, voce vai receber um link em instantes.
                  O link expira em 1 hora.
                </p>
                <button
                  onClick={() => navigate('/staff')}
                  style={styles.button}
                >
                  Voltar para login
                </button>
              </>
            ) : (
              <>
                <h2 style={styles.cardTitle}>Esqueceu a senha?</h2>
                <p style={styles.cardSubtitle}>
                  Informe o email cadastrado. Enviaremos um link para redefinir sua senha.
                </p>

                <div style={styles.inputGroup}>
                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                    style={styles.input}
                    autoFocus
                  />
                </div>

                {error && (
                  <div style={styles.errorBox}>{error}</div>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  style={{ ...styles.button, opacity: loading ? 0.7 : 1 }}
                >
                  {loading ? 'Enviando...' : 'Enviar link'}
                </button>

                <button
                  onClick={() => navigate('/staff')}
                  style={styles.linkBtn}
                >
                  Voltar para login
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    background: 'linear-gradient(180deg, #3d2a7c 0%, #6b5bbd 50%, #8b9dd9 100%)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  mainContent: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px',
  },
  wrapper: { width: '100%', maxWidth: '450px' },
  title: {
    fontSize: '40px',
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: '40px',
    margin: '0 0 40px 0',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '24px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
    padding: '40px',
  },
  cardTitle: {
    fontSize: '22px',
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: '8px',
    margin: '0 0 8px 0',
  },
  cardSubtitle: {
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '24px',
    margin: '0 0 24px 0',
    lineHeight: 1.5,
  },
  inputGroup: { marginBottom: '16px' },
  input: {
    width: '100%',
    padding: '14px 20px',
    borderRadius: '50px',
    border: 'none',
    backgroundColor: '#f9fafb',
    fontSize: '15px',
    color: '#1f2937',
    outline: 'none',
    boxSizing: 'border-box',
  },
  errorBox: {
    color: '#dc2626',
    fontSize: '14px',
    marginBottom: '12px',
    padding: '10px',
    background: '#fee2e2',
    borderRadius: '8px',
  },
  button: {
    width: '100%',
    padding: '14px',
    borderRadius: '50px',
    border: 'none',
    background: 'linear-gradient(90deg, #7c3aed 0%, #3b82f6 100%)',
    color: 'white',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(124, 58, 237, 0.4)',
    marginTop: '8px',
  },
  linkBtn: {
    width: '100%',
    marginTop: '16px',
    padding: '8px',
    background: 'transparent',
    border: 'none',
    color: '#6b7280',
    fontSize: '14px',
    cursor: 'pointer',
  },
};
