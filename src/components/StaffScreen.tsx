import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { apiService } from '../services/api';
import './StaffScreen.css';
import type { QRCodeData } from '../types';

interface StampResult {
  cardId: string;
  stampsCount: number;
  maxStamps: number;
  rewardEarned: boolean;
  timestamp: string;
}

interface RedeemResult {
  cardId: string;
  timestamp: string;
}

interface HistoryItem {
  id: string;
  type: 'stamp' | 'redeem';
  cardId: string;
  stampsCount?: number;
  maxStamps?: number;
  rewardEarned: boolean;
  timestamp: string;
}

interface StaffSession {
  token: string;
  staffId: number;
  role: 'ADMIN' | 'CASHIER';
  merchantId?: number;
}

const STAFF_STORAGE_KEY = 'carimbai_staff_session';

export default function StaffScreen() {
  const navigate = useNavigate();

  const [session, setSession] = useState<StaffSession | null>(() => {
    const raw = localStorage.getItem(STAFF_STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as StaffSession;
    } catch {
      return null;
    }
  });

  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<StampResult | null>(null);
  const [redeemResult, setRedeemResult] = useState<RedeemResult | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const processingRef = useRef(false);
  const [locationId, setLocationId] = useState<string>('1');
  const [cashierPin, setCashierPin] = useState<string>('');
  const [activeNav, setActiveNav] = useState('scan');

  useEffect(() => {
    if (!session) {
      navigate('/staff', { replace: true });
    }
  }, [session, navigate]);

  function handleLogout() {
    setSession(null);
    localStorage.removeItem(STAFF_STORAGE_KEY);
    setScanning(false);
    if (scannerRef.current) {
      scannerRef.current.clear().catch(console.error);
      scannerRef.current = null;
    }
    navigate('/staff', { replace: true });
  }

  useEffect(() => {
    if (scanning && !scannerRef.current) {
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
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error).finally(() => {
          scannerRef.current = null;
        });
      }
    };
  }, [scanning]);

  const startScanning = () => {
    setScanning(true);
    setError(null);
    setResult(null);
    setRedeemResult(null);
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
      if (scannerRef.current) {
        await scannerRef.current.clear();
        scannerRef.current = null;
      }
      setScanning(false);
      if (qrData.type === 'REDEEM_QR') {
        await applyRedeem(qrData.payload);
      } else {
        await applyStamp(qrData);
      }
    } catch (err) {
      console.error(err);
      setError('QR Code inválido. Não foi possível ler os dados.');
      if (scannerRef.current) {
        await scannerRef.current.clear();
        scannerRef.current = null;
      }
      setScanning(false);
    } finally {
      processingRef.current = false;
    }
  };

  const onScanError = (errorMessage: string) => {
    console.warn(errorMessage);
  };

  const applyStamp = async (qrData: QRCodeData) => {
    try {
      if (!session) {
        setError('Faça login como lojista antes de aplicar carimbos.');
        return;
      }

      const trimmed = locationId.trim();
      const parsedLocationId = Number(trimmed);

      if (!trimmed || Number.isNaN(parsedLocationId) || parsedLocationId <= 0) {
        setError('Informe um ID de loja (Location) válido antes de carimbar.');
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
        parsedLocationId
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
        type: 'stamp',
        id: `${response.cardId}-${Date.now()}`,
      };
      setHistory((prev) => [historyItem, ...prev]);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao processar carimbo';
      setError(message);
    }
  };

  const applyRedeem = async (payload: { cardId: number; nonce: string; exp: number; sig: string }) => {
    try {
      if (!session) {
        setError('Faça login como lojista antes de resgatar recompensas.');
        return;
      }

      const trimmed = locationId.trim();
      const parsedLocationId = Number(trimmed);

      if (!trimmed || Number.isNaN(parsedLocationId) || parsedLocationId <= 0) {
        setError('Informe um ID de loja (Location) válido antes de resgatar.');
        return;
      }

      const response = await apiService.redeemWithQr(
        {
          cardId: payload.cardId,
          locationId: parsedLocationId,
          redeemQr: {
            cardId: payload.cardId,
            nonce: payload.nonce,
            exp: payload.exp,
            sig: payload.sig,
          },
        },
        session.token,
        cashierPin || undefined
      );

      const nowIso = new Date().toISOString();
      const redeemRes: RedeemResult = {
        cardId: (response.cardId ?? payload.cardId).toString(),
        timestamp: nowIso,
      };
      setRedeemResult(redeemRes);
      const historyItem: HistoryItem = {
        id: `redeem-${payload.cardId}-${Date.now()}`,
        type: 'redeem',
        cardId: redeemRes.cardId,
        rewardEarned: true,
        timestamp: nowIso,
      };
      setHistory((prev) => [historyItem, ...prev]);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao resgatar recompensa';
      setError(message);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('pt-BR');
  };

  const todayStamps = history.filter(h => {
    const today = new Date().toDateString();
    return new Date(h.timestamp).toDateString() === today;
  }).length;

  const todayRewards = history.filter(h => {
    const today = new Date().toDateString();
    return new Date(h.timestamp).toDateString() === today && h.rewardEarned;
  }).length;

  if (!session) {
    return null;
  }

  return (
    <div className="staff-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span className="logo-icon">🎯</span>
        </div>
        <nav className="sidebar-nav">
          <button className={`nav-item ${activeNav === 'home' ? 'active' : ''}`} onClick={() => setActiveNav('home')}>
            <span className="nav-icon">🏠</span>
          </button>
          <button className={`nav-item ${activeNav === 'scan' ? 'active' : ''}`} onClick={() => setActiveNav('scan')}>
            <span className="nav-icon">📷</span>
          </button>
          <button className={`nav-item ${activeNav === 'users' ? 'active' : ''}`} onClick={() => setActiveNav('users')}>
            <span className="nav-icon">👥</span>
          </button>
          <button className={`nav-item ${activeNav === 'settings' ? 'active' : ''}`} onClick={() => setActiveNav('settings')}>
            <span className="nav-icon">⚙️</span>
          </button>
        </nav>
        <div className="sidebar-bottom">
          <button className="nav-item" onClick={handleLogout}>
            <span className="nav-icon">🚪</span>
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="top-header">
          <div className="header-left">
            <h1>Painel do Staff</h1>
            <span className="header-subtitle">Staff #{session.staffId} • {session.role}</span>
          </div>
          <div className="header-right">
            <div className="location-select">
              <label>Loja ID:</label>
              <input
                type="number"
                value={locationId}
                onChange={e => setLocationId(e.target.value)}
                placeholder="1"
              />
            </div>
            <div className="location-select">
              <label>PIN Caixa:</label>
              <input
                type="password"
                value={cashierPin}
                onChange={e => setCashierPin(e.target.value)}
                placeholder="opcional"
              />
            </div>
            <button className="btn-logout" onClick={handleLogout}>Sair</button>
          </div>
        </header>

        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-icon blue">📋</div>
            <div className="stat-info">
              <span className="stat-value">{todayStamps}</span>
              <span className="stat-label">Carimbos Hoje</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon orange">🎁</div>
            <div className="stat-info">
              <span className="stat-value">{todayRewards}</span>
              <span className="stat-label">Prêmios Hoje</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon green">👤</div>
            <div className="stat-info">
              <span className="stat-value">{new Set(history.map(h => h.cardId)).size}</span>
              <span className="stat-label">Total Clientes</span>
            </div>
          </div>
        </div>

        <div className="content-grid">
          <section className="scanner-card">
            <h2>Escanear QR Code</h2>
            <p className="scanner-desc">Aponte a câmera para o QR Code do cliente</p>

            {error && <div className="error-message">{error}</div>}

            {!scanning ? (
              <div className="scanner-placeholder" onClick={startScanning}>
                <div className="qr-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                    <rect x="14" y="14" width="3" height="3" />
                    <rect x="18" y="14" width="3" height="3" />
                    <rect x="14" y="18" width="3" height="3" />
                    <rect x="18" y="18" width="3" height="3" />
                  </svg>
                </div>
                <span>Clique para escanear</span>
              </div>
            ) : (
              <div className="scanner-active">
                <div id="qr-reader"></div>
                <button className="btn-cancel" onClick={stopScanning}>Cancelar</button>
              </div>
            )}

            {result && (
              <div className={`result-card ${result.rewardEarned ? 'with-reward' : ''}`}>
                <div className="result-header">
                  <span className="result-status">✅ Carimbo Aplicado</span>
                  <span className="result-time">{formatTimestamp(result.timestamp)}</span>
                </div>
                <div className="result-body">
                  <div className="result-row">
                    <span>Cartão</span>
                    <strong>{result.cardId}</strong>
                  </div>
                  <div className="result-row">
                    <span>Progresso</span>
                    <strong>{result.stampsCount}/{result.maxStamps}</strong>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${(result.stampsCount / result.maxStamps) * 100}%` }}></div>
                  </div>
                  {result.rewardEarned && (
                    <div className="reward-alert">🎉 Prêmio Conquistado!</div>
                  )}
                </div>
              </div>
            )}

            {redeemResult && (
              <div className="result-card with-reward">
                <div className="result-header">
                  <span className="result-status">🎁 Recompensa Resgatada</span>
                  <span className="result-time">{formatTimestamp(redeemResult.timestamp)}</span>
                </div>
                <div className="result-body">
                  <div className="result-row">
                    <span>Cartão</span>
                    <strong>{redeemResult.cardId}</strong>
                  </div>
                  <div className="reward-alert">✅ Resgate confirmado com sucesso!</div>
                </div>
              </div>
            )}
          </section>

          <section className="activity-card">
            <div className="activity-header">
              <h2>Atividade Recente</h2>
              <span className="activity-count">{history.length} registros</span>
            </div>
            <div className="activity-list">
              {history.length === 0 ? (
                <div className="empty-state">
                  <span>📭</span>
                  <p>Nenhuma atividade ainda</p>
                </div>
              ) : (
                history.slice(0, 10).map((item) => (
                  <div key={item.id} className="activity-item">
                    <div className="activity-icon">{item.type === 'redeem' ? '🎁' : item.rewardEarned ? '🎁' : '✓'}</div>
                    <div className="activity-info">
                      <span className="activity-title">Cartão #{item.cardId}</span>
                      <span className="activity-meta">
                        {item.type === 'redeem'
                          ? 'Recompensa resgatada'
                          : `${item.stampsCount}/${item.maxStamps} carimbos`}
                      </span>
                    </div>
                    <span className="activity-time">{formatTimestamp(item.timestamp)}</span>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
