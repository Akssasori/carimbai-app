import { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import FacebookLogin from '@greatsumini/react-facebook-login';
import { Stamp } from 'lucide-react';
import type { SocialProvider } from '../types';

interface Props {
  onSocialLogin: (provider: SocialProvider, token: string) => Promise<unknown>;
}

export function CustomerOnboarding({ onSocialLogin }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const googleLogin = useGoogleLogin({
    onSuccess: (res) => handleSocial('GOOGLE', res.access_token),
    onError: () => setError('Erro ao entrar com Google'),
  });

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
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '72px',
            height: '72px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, #7c6fff 0%, #5a45e8 100%)',
            boxShadow: '0 6px 20px rgba(106,86,255,0.30)',
            marginBottom: '16px',
          }}>
            <Stamp size={36} color="white" strokeWidth={2} aria-hidden="true" />
          </div>
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
            Entre para acessar
          </h1>
          <p style={{
            color: '#6b7280',
            fontSize: '15px',
            fontWeight: '400',
            marginTop: '6px',
          }}>
            Conecte-se com sua conta para ver seus cartões de fidelidade
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

            {/* Google */}
            <button
              onClick={() => googleLogin()}
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
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continuar com o Google
            </button>

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

          {error && (
            <p style={{ color: '#dc2626', fontSize: '13px', textAlign: 'center', marginTop: '16px', marginBottom: '0' }}>
              {error}
            </p>
          )}

          {/* Rodapé */}
          <p style={{
            color: '#9aa0b2',
            fontSize: '13px',
            lineHeight: '1.4',
            textAlign: 'center',
            marginTop: '20px',
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
