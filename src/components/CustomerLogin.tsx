import { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import FacebookLogin from '@greatsumini/react-facebook-login';
import type { SocialProvider } from '../types';

interface Props {
  onSubmit: (data: { name?: string; email?: string; phone?: string }) => Promise<void>;
  onSocialLogin: (provider: SocialProvider, token: string) => Promise<unknown>;
}

export function CustomerOnboarding({ onSubmit, onSocialLogin }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<{ email?: string }>({});

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Email inválido';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    setError('');
    if (!validate()) return;
    setLoading(true);
    try {
      await onSubmit({ name, email, phone });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar seus dados';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSocial = async (provider: SocialProvider, token: string) => {
    setError('');
    setLoading(true);
    try {
      await onSocialLogin(provider, token);
    } catch (err) {
      const message = err instanceof Error ? err.message : `Erro ao entrar com ${provider}`;
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '16px 18px',
    borderRadius: '10px',
    border: '1px solid transparent',
    backgroundColor: '#f1f6ff',
    fontSize: '16px',
    fontWeight: '500',
    color: '#20232d',
    outline: 'none',
    transition: 'all 0.2s',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      background: '#f7f8fb',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    }}>
      <div style={{ width: '100%', maxWidth: '460px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <img
            src="/icons/icon-192.png"
            alt="carimbai"
            width={64}
            height={64}
            style={{
              borderRadius: '16px',
              boxShadow: '0 6px 16px rgba(106,86,255,0.18)',
              marginBottom: '20px',
              display: 'inline-block',
            }}
          />
          <p style={{
            color: '#6a56ff',
            fontSize: '12px',
            fontWeight: '600',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            margin: '0 0 8px 0',
          }}>
            CARIMBAI
          </p>
          <h1 style={{
            color: '#1f2330',
            fontSize: '30px',
            fontWeight: '700',
            margin: '0',
            lineHeight: '1.15',
            letterSpacing: '-0.5px',
          }}>
            Faça seu cadastro
          </h1>
          <p style={{
            color: '#6b7280',
            fontSize: '15px',
            fontWeight: '400',
            marginTop: '6px',
          }}>
            Conecte-se para acessar seu cartão de fidelidade
          </p>
        </div>

        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '36px 28px',
          boxShadow: '0 10px 30px -12px rgba(20,30,60,0.18), 0 2px 6px rgba(20,30,60,0.04)',
          position: 'relative',
        }}>

          {/* Botões sociais */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>

            {/* Google */}
            <div style={{ width: '100%', display: 'flex', justifyContent: 'stretch' }}>
              <GoogleLogin
                onSuccess={(res) => {
                  if (res.credential) handleSocial('GOOGLE', res.credential);
                }}
                onError={() => setError('Erro ao entrar com Google')}
                width="396"
                size="large"
                text="continue_with"
                shape="rectangular"
                theme="outline"
              />
            </div>

            {/* Facebook */}
            <FacebookLogin
              appId={import.meta.env.VITE_FACEBOOK_APP_ID ?? ''}
              onSuccess={(res: { accessToken: string }) => handleSocial('FACEBOOK', res.accessToken)}
              onFail={(err: unknown) => {
                console.warn('Facebook login error', err);
                setError('Erro ao entrar com Facebook');
              }}
              render={({ onClick }: { onClick?: () => void }) => (
                <button
                  onClick={onClick}
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '11px 16px',
                    borderRadius: '8px',
                    border: '1.5px solid #dadce0',
                    backgroundColor: 'white',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#3c4043',
                    cursor: loading ? 'default' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    transition: 'all 0.2s',
                    fontFamily: 'inherit',
                    opacity: loading ? 0.6 : 1,
                    minHeight: '44px',
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) {
                      e.currentTarget.style.backgroundColor = '#f8f9fa';
                      e.currentTarget.style.borderColor = '#cdd2d7';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'white';
                    e.currentTarget.style.borderColor = '#dadce0';
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#1877f2">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  Continuar com Facebook
                </button>
              )}
            />
          </div>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', margin: '0 0 20px 0', padding: '4px 0' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(20,30,60,0.08)' }}></div>
            <span style={{ padding: '0 16px', color: '#9aa0b2', fontSize: '14px', fontWeight: '500' }}>ou continue com email</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(20,30,60,0.08)' }}></div>
          </div>

          {/* Formulário de email/nome/telefone */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <input
              type="text"
              placeholder="Nome completo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={inputStyle}
              onFocus={(e) => { e.target.style.borderColor = '#6a56ff'; e.target.style.boxShadow = '0 0 0 4px rgba(106,86,255,0.14)'; }}
              onBlur={(e) => { e.target.style.borderColor = 'transparent'; e.target.style.boxShadow = 'none'; }}
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ ...inputStyle, border: `1px solid ${errors.email ? '#dc2626' : 'transparent'}` }}
                onFocus={(e) => { e.target.style.borderColor = '#6a56ff'; e.target.style.boxShadow = '0 0 0 4px rgba(106,86,255,0.14)'; }}
                onBlur={(e) => { e.target.style.borderColor = errors.email ? '#dc2626' : 'transparent'; e.target.style.boxShadow = 'none'; }}
              />
              {errors.email && (
                <span style={{ color: '#dc2626', fontSize: '13px' }}>{errors.email}</span>
              )}
            </div>

            <input
              type="tel"
              placeholder="Telefone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={inputStyle}
              onFocus={(e) => { e.target.style.borderColor = '#6a56ff'; e.target.style.boxShadow = '0 0 0 4px rgba(106,86,255,0.14)'; }}
              onBlur={(e) => { e.target.style.borderColor = 'transparent'; e.target.style.boxShadow = 'none'; }}
            />

            {error && (
              <p style={{ color: '#dc2626', fontSize: '13px', textAlign: 'center', margin: '0' }}>
                {error}
              </p>
            )}

            <div style={{ paddingTop: '4px' }}>
              <button
                onClick={handleSubmit}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '16px',
                  borderRadius: '10px',
                  border: 'none',
                  color: 'white',
                  fontSize: '17px',
                  fontWeight: '700',
                  cursor: loading ? 'default' : 'pointer',
                  background: '#6a56ff',
                  boxShadow: '0 8px 20px -8px rgba(106,86,255,0.45)',
                  transition: 'all 0.25s',
                  opacity: loading ? 0.7 : 1,
                  transform: loading ? 'scale(0.98)' : 'scale(1)',
                  fontFamily: 'inherit',
                }}
                onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 12px 24px -8px rgba(106,86,255,0.45)'; } }}
                onMouseLeave={(e) => { if (!loading) { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 8px 20px -8px rgba(106,86,255,0.45)'; } }}
              >
                {loading ? 'Cadastrando...' : 'Entrar'}
              </button>
            </div>
          </div>

          {/* Rodapé */}
          <p style={{
            color: '#9aa0b2',
            fontSize: '13px',
            lineHeight: '1.4',
            textAlign: 'center',
            marginTop: '16px',
            marginBottom: '0',
            fontFamily: 'inherit',
          }}>
            Se você ainda não tem cadastro, ele será criado automaticamente ao entrar.
          </p>
        </div>
      </div>
    </div>
  );
}
