import { useState } from 'react';

interface Props {
  onSubmit: (data: { name?: string; email?: string; phone?: string }) => Promise<void>;
}

export function CustomerOnboarding({ onSubmit }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');

    if (!validate()) {
    return;
    }

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

  const [errors, setErrors] = useState<{
  name?: string;
  email?: string;
  phone?: string;
  }>({});

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
          <p style={{ 
            color: '#c4b5fd', 
            fontSize: '18px', 
            marginBottom: '8px',
            fontWeight: '500'
          }}>
            Olá, bem-vindo!
          </p>
          <h1 style={{ 
            color: '#1f2330', 
            fontSize: '42px', 
            fontWeight: '800', 
            marginBottom: '8px',
            lineHeight: '1.1',
            letterSpacing: '-1px'
          }}>
            Faça seu cadastro
          </h1>
          <p style={{ 
            color: '#e0e7ff', 
            fontSize: '16px',
            fontWeight: '400',
            paddingTop: '4px'
          }}>
            Conecte-se para acessar seu cartão de fidelidade
          </p>
        </div>

        {/* Form Card */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '40px 32px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)',
          position: 'relative'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Nome Input */}
            <input
              type="text"
              placeholder="Nome completo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
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
                fontFamily: 'inherit'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#6a56ff';
                e.target.style.boxShadow = '0 0 0 3px rgba(106, 86, 255, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'transparent';
                e.target.style.boxShadow = 'none';
              }}
            />

            {/* Email Input */}
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '19px 21px',
                borderRadius: '8px',
                border: `1px solid ${errors.email ? '#dc2626' : 'transparent'}`,
                backgroundColor: '#f1f6ff',
                fontSize: '16px',
                fontWeight: '500',
                color: '#20232d',
                outline: 'none',
                transition: 'all 0.2s',
                boxSizing: 'border-box',
                fontFamily: 'inherit'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#6a56ff';
                e.target.style.boxShadow = '0 0 0 3px rgba(106, 86, 255, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = errors.email ? '#dc2626' : 'transparent';
                e.target.style.boxShadow = 'none';
              }}
            />

            {errors.email && (
                <span style={{ color: '#dc2626', fontSize: '14px', marginTop: '-16px' }}>
                  {errors.email}
                </span>
            )}

            {/* Phone Input */}
            <input
              type="tel"
              placeholder="Telefone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={{
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
                fontFamily: 'inherit'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#6a56ff';
                e.target.style.boxShadow = '0 0 0 3px rgba(106, 86, 255, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'transparent';
                e.target.style.boxShadow = 'none';
              }}
            />

            {/* Error Message */}
            {error && (
              <p style={{ 
                color: '#dc2626', 
                fontSize: '14px', 
                textAlign: 'center',
                margin: '0'
              }}>
                {error}
              </p>
            )}

            {/* Submit Button */}
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
                  fontFamily: 'inherit'
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 15px 35px -5px rgba(107, 70, 193, 0.5)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(107, 70, 193, 0.4)';
                  }
                }}
              >
                {loading ? 'Cadastrando...' : 'Entrar'}
              </button>
            </div>
          </div>

          {/* Divider */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            margin: '24px 0',
            padding: '8px 0'
          }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(0,0,0,0.08)' }}></div>
            <span style={{ 
              padding: '0 16px', 
              color: '#9aa0b2', 
              fontSize: '14px',
              fontWeight: '500'
            }}>
              ou
            </span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(0,0,0,0.08)' }}></div>
          </div>

          {/* Alternative Action */}
          <div style={{ textAlign: 'center', padding: '0 16px' }}>
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
              fontFamily: 'inherit'
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
