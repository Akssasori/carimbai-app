import { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { apiService } from '../services/api';
import './StaffScreen.css';

interface StampResult {
  cardId: string;
  stampsCount: number;
  maxStamps: number;
  rewardEarned: boolean;
  timestamp: string;
}

interface HistoryItem extends StampResult {
  id: string;
}

interface StaffSession {
  token: string;
  staffId: number;
  role: 'ADMIN' | 'CASHIER';
  merchantId?: number;
}

const STAFF_STORAGE_KEY = 'carimbai_staff_session';

export default function StaffScreen() {

  const [session, setSession] = useState<StaffSession | null>(() => {
    const raw = localStorage.getItem(STAFF_STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as StaffSession;
    } catch {
      return null;
    }
  });

  // estados do login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // estados do fluxo de carimbo
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<StampResult | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const processingRef = useRef(false);

  // location da loja (pra Onda 1, você pode fixar ou deixar um campo)
  const [locationId, setLocationId] = useState<number | ''>('');

  // ==== LOGIN DO STAFF ====

  async function handleLogin() {
    setLoginError(null);
    setLoginLoading(true);

    try {
      const res = await apiService.loginStaff(email, password);
      const sess: StaffSession = {
        token: res.token,
        staffId: res.staffId,
        role: res.role,
        merchantId: res.merchantId,
      };
      setSession(sess);
      localStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(sess));
    } catch (err: any) {
      setLoginError(err.message ?? 'Erro ao fazer login');
    } finally {
      setLoginLoading(false);
    }
  }

  function handleLogout() {
    setSession(null);
    localStorage.removeItem(STAFF_STORAGE_KEY);
    setScanning(false);
    if (scannerRef.current) {
      scannerRef.current.clear().catch(console.error);
      scannerRef.current = null;
    }
  }

  // ==== SCANNER ====

  useEffect(() => {
    if (scanning && !scannerRef.current) {
      // Pequeno delay para garantir que o DOM foi atualizado
      setTimeout(() => {
        const qrScanner = new Html5QrcodeScanner(
          'qr-reader',
          {
            qrbox: { width: 250, height: 250 },
            fps: 10,
            aspectRatio: 1.0,
          },
          false
        );

        scannerRef.current = qrScanner;
        qrScanner.render(onScanSuccess, onScanError);
      }, 100);
    }

    // Cleanup quando o componente desmonta ou quando `scanning` muda
    return () => {
      if (scannerRef.current) {
        scannerRef.current
          .clear()
          .catch(console.error)
          .finally(() => {
            scannerRef.current = null;
          });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanning]);

  const startScanning = () => {
    setScanning(true);
    setError(null);
    setResult(null);
    processingRef.current = false;
  };

  const stopScanning = async () => {
    if (scannerRef.current) {
      await scannerRef.current.clear();
      scannerRef.current = null;
    }
    setScanning(false);
    processingRef.current = false;
  };

  const onScanSuccess = async (decodedText: string) => {
    if (processingRef.current) return;
    processingRef.current = true;

    try {
      const qrData = JSON.parse(decodedText);

      // Limpa o scanner para parar novas leituras
      if (scannerRef.current) {
        await scannerRef.current.clear();
        scannerRef.current = null;
      }
      setScanning(false);

      await applyStamp(qrData);
    } catch (err) {
      console.error(err);
      setError('QR Code inválido. Não foi possível ler os dados.');
      if (scannerRef.current) {
        await scannerRef.current.clear();
        scannerRef.current = null;
      }
      setScanning(false);
    } finally {
      // Se quiser permitir novo scan só depois de clicar em "Escanear novamente",
      // você pode deixar como false aqui mesmo.
      processingRef.current = false;
    }
  };

  const onScanError = (errorMessage: string) => {
    // Ignora erros de scan contínuo
    console.warn(errorMessage);
  };

  const applyStamp = async (qrData: any) => {
    try {
      if (!session) {
        setError('Faça login como lojista antes de aplicar carimbos.');
        return;
      }

      if (!locationId) {
        setError('Informe o ID da loja (Location) antes de carimbar.');
        return;
      }

      const idempotencyKey = `${qrData.idRef}-${Date.now()}-${crypto.randomUUID()}`;

      const response = await apiService.applyStamp(
        {
          type: 'CUSTOMER_QR',
          payload: {
            cardId: qrData.idRef,
            nonce: qrData.nonce,
            exp: qrData.exp,
            sig: qrData.sig,
          },
        },
        idempotencyKey,
        session.token,
        Number(locationId)
      );

      const nowIso = new Date().toISOString();

      const stampResult: StampResult = {
        cardId: response.cardId.toString(),
        stampsCount: response.stamps,
        maxStamps: response.needed,
        rewardEarned: response.rewardIssued,
        timestamp: nowIso,
      };

      setResult(stampResult);

      const historyItem: HistoryItem = {
        ...stampResult,
        id: `${response.cardId}-${Date.now()}`,
      };
      setHistory((prev) => [historyItem, ...prev]);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao processar carimbo');
    }
  };

  const clearHistory = () => {
    setHistory([]);
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('pt-BR');
  };

  // ==== UI ====

  // 1) Se não tem sessão, mostra tela de login do staff
  if (!session) {
    return (
      <div className="staff-screen">
        <div className="staff-header">
          <h1 className="greeting">Login do Comerciante</h1>
          <p className="subtitle">Acesse para aplicar carimbos nos cartões dos clientes</p>
        </div>

        <div className="staff-content">
          <div className="staff-login-card">
            <label>
              E-mail
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="lojista@exemplo.com"
              />
            </label>

            <label>
              Senha
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </label>

            {loginError && <div className="error-message">{loginError}</div>}

            <button
              className="btn-scan"
              onClick={handleLogin}
              disabled={loginLoading}
            >
              {loginLoading ? 'Entrando...' : 'Entrar'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2) Se tem sessão, mostra seu painel atual (scanner + histórico)
  return (
    <div className="staff-screen">
      <div className="staff-header">
        <h1 className="greeting">Painel do Comerciante</h1>
        <p className="subtitle">Escaneie o QR Code do cliente para aplicar carimbos</p>

        <div className="staff-info">
          <span>Staff #{session.staffId} ({session.role})</span>
          <button className="btn-clear-history" onClick={handleLogout}>
            Sair
          </button>
        </div>
      </div>

      <div className="staff-content">
        <div className="scanner-section">
          <h2>Scanner de QR Code</h2>

          <div className="location-input">
            <label>
              ID da loja (Location)
              <input
                type="number"
                value={locationId}
                onChange={e => setLocationId(e.target.value ? Number(e.target.value) : '')}
                placeholder="1"
              />
            </label>
          </div>

          {error && <div className="error-message">{error}</div>}

          {!scanning ? (
            <button className="btn-scan" onClick={startScanning}>
              📷 Escanear QR Code
            </button>
          ) : (
            <>
              <div id="qr-reader" style={{ width: '100%' }}></div>
              <button
                className="btn-scan"
                onClick={stopScanning}
                style={{ marginTop: '10px', background: '#dc3545' }}
              >
                ❌ Cancelar
              </button>
            </>
          )}

          {result && (
            <div className={`result-card ${result.rewardEarned ? 'with-reward' : ''}`}>
              <div className="result-header">
                <h3>✅ Carimbo Aplicado</h3>
                <span className="result-time">{formatTimestamp(result.timestamp)}</span>
              </div>
              <div className="result-details">
                <div className="detail-row">
                  <span className="label">Cartão:</span>
                  <span className="value">{result.cardId}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Carimbos:</span>
                  <span className="value">
                    {result.stampsCount} / {result.maxStamps}
                  </span>
                </div>
                <div className="progress-bar-small">
                  <div
                    className="progress-fill-small"
                    style={{ width: `${(result.stampsCount / result.maxStamps) * 100}%` }}
                  ></div>
                </div>
                {result.rewardEarned && (
                  <div className="reward-badge">
                    <span className="reward-icon">🎉</span>
                    <span>Prêmio Conquistado!</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="history-section">
          <div className="history-header">
            <h2>Histórico</h2>
            {history.length > 0 && (
              <button className="btn-clear-history" onClick={clearHistory}>
                Limpar
              </button>
            )}
          </div>

          {history.length === 0 ? (
            <div className="empty-history">
              <p>Nenhum carimbo aplicado ainda</p>
            </div>
          ) : (
            <div className="history-list">
              {history.map((item) => (
                <div key={item.id} className="history-item">
                  <div className="history-item-header">
                    <span className="card-id">{item.cardId}</span>
                    <span className="timestamp">{formatTimestamp(item.timestamp)}</span>
                  </div>
                  <div className="history-item-stats">
                    <span className="stamps-info">
                      {item.stampsCount}/{item.maxStamps} carimbos
                    </span>
                    {item.rewardEarned && <span className="reward-indicator">🎁</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}