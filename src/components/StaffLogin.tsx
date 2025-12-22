import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';

const STAFF_STORAGE_KEY = 'carimbai_staff_session';

export default function StaffLogin() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const raw = localStorage.getItem(STAFF_STORAGE_KEY);
    if (raw) {
      try {
        JSON.parse(raw);
        navigate('/staff/dashboard', { replace: true });
      } catch {}
    }
  }, [navigate]);

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await apiService.loginStaff(email, senha);
      const session = {
        token: res.token,
        staffId: res.staffId,
        role: res.role,
        merchantId: res.merchantId,
      };
      localStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(session));
      navigate('/staff/dashboard', { replace: true });
    } catch (err: any) {
      setError(err.message ?? 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    console.log('Recuperar senha');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const styles = {
    container: {
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'linear-gradient(180deg, #3d2a7c 0%, #6b5bbd 50%, #8b9dd9 100%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    },
    header: {
      padding: '16px',
      color: 'white',
      fontSize: '14px',
      opacity: 0.8
    },
    mainContent: {
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    },
    wrapper: {
      width: '100%',
      maxWidth: '450px'
    },
    title: {
      fontSize: '48px',
      fontWeight: 'bold',
      color: 'white',
      textAlign: 'center',
      marginBottom: '48px',
      margin: '0 0 48px 0'
    },
    card: {
      backgroundColor: 'white',
      borderRadius: '24px',
      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
      padding: '40px'
    },
    cardTitle: {
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#1f2937',
      marginBottom: '8px',
      margin: '0 0 8px 0'
    },
    cardSubtitle: {
      fontSize: '16px',
      color: '#6b7280',
      marginBottom: '32px',
      margin: '0 0 32px 0'
    },
    inputGroup: {
      marginBottom: '16px'
    },
    input: {
      width: '100%',
      padding: '16px 24px',
      borderRadius: '50px',
      border: 'none',
      backgroundColor: '#f9fafb',
      fontSize: '16px',
      color: '#1f2937',
      outline: 'none',
      transition: 'all 0.3s',
      boxSizing: 'border-box'
    },
    button: {
      width: '100%',
      padding: '16px',
      borderRadius: '50px',
      border: 'none',
      background: 'linear-gradient(90deg, #7c3aed 0%, #3b82f6 100%)',
      color: 'white',
      fontSize: '18px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s',
      boxShadow: '0 4px 12px rgba(124, 58, 237, 0.4)',
      marginTop: '16px'
    },
    divider: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '24px 0'
    },
    dividerLine: {
      flex: 1,
      height: '1px',
      backgroundColor: '#d1d5db'
    },
    dividerText: {
      padding: '0 16px',
      color: '#6b7280',
      fontSize: '14px'
    },
    forgotLink: {
      textAlign: 'center',
      marginTop: '16px'
    },
    link: {
      color: '#6b7280',
      fontSize: '14px',
      cursor: 'pointer',
      textDecoration: 'none',
      border: 'none',
      background: 'none',
      transition: 'color 0.3s'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        
      </div>

      <div style={styles.mainContent}>
        <div style={styles.wrapper}>
          <h1 style={styles.title}>Login</h1>

          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Bem-vindo, gerente!</h2>
            <p style={styles.cardSubtitle}>Acesse sua conta de gerente</p>

            <div>
              <div style={styles.inputGroup}>
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={handleKeyPress}
                  style={styles.input}
                  onFocus={(e) => e.target.style.boxShadow = '0 0 0 2px #7c3aed'}
                  onBlur={(e) => e.target.style.boxShadow = 'none'}
                />
              </div>

              <div style={styles.inputGroup}>
                <input
                  type="password"
                  placeholder="Senha"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  onKeyPress={handleKeyPress}
                  style={styles.input}
                  onFocus={(e) => e.target.style.boxShadow = '0 0 0 2px #7c3aed'}
                  onBlur={(e) => e.target.style.boxShadow = 'none'}
                />
              </div>

              {error && (
                <div style={{ color: '#ef4444', marginBottom: '12px', textAlign: 'center' as const }}>
                  {error}
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={loading}
                style={{ ...styles.button, opacity: loading ? 0.7 : 1 }}
                onMouseEnter={(e) => {
                  (e.target as HTMLElement).style.transform = 'scale(1.02)';
                  (e.target as HTMLElement).style.boxShadow = '0 8px 20px rgba(124, 58, 237, 0.5)';
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLElement).style.transform = 'scale(1)';
                  (e.target as HTMLElement).style.boxShadow = '0 4px 12px rgba(124, 58, 237, 0.4)';
                }}
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </button>

              <div style={styles.divider}>
                <div style={styles.dividerLine}></div>
                <span style={styles.dividerText}>ou</span>
                <div style={styles.dividerLine}></div>
              </div>

              <div style={styles.forgotLink}>
                <button
                  onClick={handleForgotPassword}
                  style={styles.link}
                  onMouseEnter={(e) => {
                    e.target.style.color = '#7c3aed';
                    e.target.style.textDecoration = 'underline';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.color = '#6b7280';
                    e.target.style.textDecoration = 'none';
                  }}
                >
                  Esqueceu a senha? Clique aqui para recuperar.
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}