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

  // se não tiver erro, retorna true
  return Object.keys(newErrors).length === 0;
};

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{ width: '100%', maxWidth: '450px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <p style={{ 
            color: '#c4b5fd', 
            fontSize: '18px', 
            marginBottom: '8px',
            fontWeight: '400'
          }}>
            Olá, bem-vindo!
          </p>
          <h1 style={{ 
            color: 'white', 
            fontSize: '48px', 
            fontWeight: 'bold', 
            marginBottom: '12px',
            lineHeight: '1.1'
          }}>
            Faça seu cadastro
          </h1>
          <p style={{ 
            color: '#e9d5ff', 
            fontSize: '16px',
            fontWeight: '300'
          }}>
            Conecte-se para acessar seu cartão de fidelidade
          </p>
        </div>

        {/* Form Card */}
        <div style={{
          background: 'white',
          borderRadius: '24px',
          padding: '32px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Nome Input */}
            <input
              type="text"
              placeholder="Nome completo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: '100%',
                padding: '16px 24px',
                borderRadius: '16px',
                border: '2px solid #e5e7eb',
                fontSize: '16px',
                outline: 'none',
                transition: 'all 0.2s',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#a855f7';
                e.target.style.boxShadow = '0 0 0 3px rgba(168, 85, 247, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e5e7eb';
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
                padding: '16px 24px',
                borderRadius: '16px',
                border: `2px solid ${errors.email ? '#dc2626' : '#e5e7eb'}`,
                fontSize: '16px',
                outline: 'none',
                transition: 'all 0.2s',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#a855f7';
                e.target.style.boxShadow = '0 0 0 3px rgba(168, 85, 247, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e5e7eb';
                e.target.style.boxShadow = 'none';
              }}
            />

            {errors.email && (
                <span style={{ color: '#dc2626', fontSize: '14px' }}>
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
                padding: '16px 24px',
                borderRadius: '16px',
                border: '2px solid #e5e7eb',
                fontSize: '16px',
                outline: 'none',
                transition: 'all 0.2s',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#a855f7';
                e.target.style.boxShadow = '0 0 0 3px rgba(168, 85, 247, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e5e7eb';
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
            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: '9999px',
                border: 'none',
                color: 'white',
                fontSize: '18px',
                fontWeight: '600',
                cursor: loading ? 'default' : 'pointer',
                background: 'linear-gradient(135deg, #a855f7 0%, #3b82f6 100%)',
                boxShadow: '0 10px 25px rgba(168, 85, 247, 0.3)',
                transition: 'all 0.3s',
                opacity: loading ? 0.7 : 1,
                transform: loading ? 'scale(0.98)' : 'scale(1)'
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 15px 35px rgba(168, 85, 247, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 10px 25px rgba(168, 85, 247, 0.3)';
                }
              }}
            >
              {loading ? 'Cadastrando...' : 'Entrar'}
            </button>
          </div>

          {/* Divider */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            margin: '24px 0' 
          }}>
            <div style={{ flex: 1, height: '1px', background: '#d1d5db' }}></div>
            <span style={{ 
              padding: '0 16px', 
              color: '#9ca3af', 
              fontSize: '14px' 
            }}>
              ou
            </span>
            <div style={{ flex: 1, height: '1px', background: '#d1d5db' }}></div>
          </div>

          {/* Alternative Action */}
          <button style={{
            width: '100%',
            background: 'transparent',
            border: 'none',
            color: '#9333ea',
            fontWeight: '500',
            fontSize: '16px',
            cursor: 'pointer',
            padding: '8px',
            transition: 'color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#7c3aed'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#9333ea'}
          >
            Se não tiver login o login sera criado ao clicar em entrar
          </button>
        </div>

        {/* Footer Links */}
        <div style={{ 
          textAlign: 'center', 
          marginTop: '32px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <button style={{
            background: 'transparent',
            border: 'none',
            color: '#e9d5ff',
            fontSize: '16px',
            cursor: 'pointer',
            transition: 'color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'white'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#e9d5ff'}
          >
            ...
          </button>
          
          <p style={{ 
            color: '#e9d5ff', 
            fontSize: '16px',
            margin: 0
          }}>
            <span style={{ color: '#c4b5fd' }}>...</span> ...{' '}
            <button style={{
              background: 'transparent',
              border: 'none',
              color: '#c084fc',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '16px',
              transition: 'color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#e9d5ff'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#c084fc'}
            >
              ...
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}