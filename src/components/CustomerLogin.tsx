import { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import AppleSignin from 'react-apple-signin-auth';
import FacebookLogin from '@greatsumini/react-facebook-login';
import type { SocialProvider } from '../types';

interface Props {
  onSubmit: (data: { name?: string; email?: string; phone?: string }) => Promise<void>;
  onSocialLogin: (provider: SocialProvider, token: string) => Promise<void>;
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
    padding: '19px 21px',
    borderRadius: '8px',
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

  const socialBtnStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px 20px',
    borderRadius: '10px',
    border: '1.5px solid #e4e8f0',
    backgroundColor: 'white',
    fontSize: '15px',
    fontWeight: '600',
    cursor: loading ? 'default' : 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    transition: 'all 0.2s',
    color: '#20232d',
    fontFamily: 'inherit',
    opacity: loading ? 0.6 : 1,
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
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <p style={{ color: '#c4b5fd', fontSize: '18px', marginBottom: '8px', fontWeight: '500' }}>
            Olá, bem-vindo!
          </p>
          <h1 style={{ color: '#1f2330', fontSize: '42px', fontWeight: '800', marginBottom: '8px', lineHeight: '1.1', letterSpacing: '-1px' }}>
            Faça seu cadastro
          </h1>
          <p style={{ color: '#e0e7ff', fontSize: '16px', fontWeight: '400', paddingTop: '4px' }}>
            Conecte-se para acessar seu cartão de fidelidade
          </p>
        </div>

        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '40px 32px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)',
          position: 'relative',
        }}>

          {/* Botões sociais */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>

            {/* Google */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <GoogleLogin
                onSuccess={(res) => {
                  if (res.credential) handleSocial('GOOGLE', res.credential);
                }}
                onError={() => setError('Erro ao entrar com Google')}
                width="396"
                text="continue_with"
                shape="rectangular"
                theme="outline"
              />
            </div>

            {/* Apple */}
            <AppleSignin
              authOptions={{
                clientId: import.meta.env.VITE_APPLE_CLIENT_ID ?? '',
                scope: 'email name',
                redirectURI: import.meta.env.VITE_APPLE_REDIRECT_URI ?? window.location.origin,
                usePopup: true,
              }}
              onSuccess={(res: { authorization?: { id_token?: string } }) => {
                const token = res?.authorization?.id_token;
                if (token) handleSocial('APPLE', token);
              }}
              onError={(err: unknown) => {
                console.warn('Apple sign-in error', err);
                setError('Erro ao entrar com Apple');
              }}
              render={(props: React.HTMLAttributes<HTMLButtonElement>) => (
                <button
                  {...props}
                  disabled={loading}
                  style={{
                    ...socialBtnStyle,
                    backgroundColor: '#000',
                    border: 'none',
                    color: 'white',
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                  Continuar com Apple
                </button>
              )}
            />

            {/* Facebook */}
            <FacebookLogin
              appId={import.meta.env.VITE_FACEBOOK_APP_ID ?? ''}
              onSuccess={(res: { accessToken: string }) => handleSocial('FACEBOOK', res.accessToken)}
              onFail={(err: unknown) => {
                console.warn('Facebook login error', err);
                setError('Erro ao entrar com Facebook');
              }}
              render={({ onClick }: { onClick: React.MouseEventHandler<HTMLButtonElement> }) => (
                <button
                  onClick={onClick}
                  disabled={loading}
                  style={{ ...socialBtnStyle, color: '#1877f2', border: '1.5px solid #1877f2' }}
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
          <div style={{ display: 'flex', alignItems: 'center', margin: '0 0 24px 0', padding: '4px 0' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(0,0,0,0.08)' }}></div>
            <span style={{ padding: '0 16px', color: '#9aa0b2', fontSize: '14px', fontWeight: '500' }}>ou cadastre-se com email</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(0,0,0,0.08)' }}></div>
          </div>

          {/* Formulário de email/nome/telefone */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <input
              type="text"
              placeholder="Nome completo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={inputStyle}
              onFocus={(e) => { e.target.style.borderColor = '#6a56ff'; e.target.style.boxShadow = '0 0 0 3px rgba(106, 86, 255, 0.1)'; }}
              onBlur={(e) => { e.target.style.borderColor = 'transparent'; e.target.style.boxShadow = 'none'; }}
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ ...inputStyle, border: `1px solid ${errors.email ? '#dc2626' : 'transparent'}` }}
                onFocus={(e) => { e.target.style.borderColor = '#6a56ff'; e.target.style.boxShadow = '0 0 0 3px rgba(106, 86, 255, 0.1)'; }}
                onBlur={(e) => { e.target.style.borderColor = errors.email ? '#dc2626' : 'transparent'; e.target.style.boxShadow = 'none'; }}
              />
              {errors.email && (
                <span style={{ color: '#dc2626', fontSize: '14px' }}>{errors.email}</span>
              )}
            </div>

            <input
              type="tel"
              placeholder="Telefone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={inputStyle}
              onFocus={(e) => { e.target.style.borderColor = '#6a56ff'; e.target.style.boxShadow = '0 0 0 3px rgba(106, 86, 255, 0.1)'; }}
              onBlur={(e) => { e.target.style.borderColor = 'transparent'; e.target.style.boxShadow = 'none'; }}
            />

            {error && (
              <p style={{ color: '#dc2626', fontSize: '14px', textAlign: 'center', margin: '0' }}>
                {error}
              </p>
            )}

            <div style={{ paddingTop: '8px' }}>
              <button
                onClick={handleSubmit}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '18px',
                  borderRadius: '12px',
                  border: 'none',
                  color: 'white',
                  fontSize: '18px',
                  fontWeight: '700',
                  cursor: loading ? 'default' : 'pointer',
                  background: '#6a56ff',
                  boxShadow: '0 10px 25px -5px rgba(107, 70, 193, 0.4)',
                  transition: 'all 0.3s',
                  opacity: loading ? 0.7 : 1,
                  transform: loading ? 'scale(0.98)' : 'scale(1)',
                  fontFamily: 'inherit',
                }}
                onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 15px 35px -5px rgba(107, 70, 193, 0.5)'; } }}
                onMouseLeave={(e) => { if (!loading) { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(107, 70, 193, 0.4)'; } }}
              >
                {loading ? 'Cadastrando...' : 'Entrar'}
              </button>
            </div>
          </div>

          {/* Rodapé */}
          <div style={{ textAlign: 'center', padding: '16px 16px 0' }}>
            <button style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              color: '#ff7ad1',
              fontWeight: '500',
              fontSize: '15px',
              cursor: 'pointer',
              padding: '0',
              transition: 'color 0.2s',
              lineHeight: '1.4',
              fontFamily: 'inherit',
            }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#e563b8'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#ff7ad1'}
            >
              Se não tiver login o login sera criado ao clicar em entrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
