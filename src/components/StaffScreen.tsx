import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { apiService } from '../services/api';
import './StaffScreen.css';
import type { QRCodeData, MerchantInfo, ProgramItem, DashboardMetrics, RecentStampItem, RecentRewardItem } from '../types';

type FeedItem =
  | { kind: 'stamp'; timestamp: string; data: RecentStampItem }
  | { kind: 'reward'; timestamp: string; data: RecentRewardItem };

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

interface StaffSession {
  token: string;
  staffId: number;
  role: 'ADMIN' | 'CASHIER';
  merchantId: number;
  merchants: MerchantInfo[];
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
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentStamps, setRecentStamps] = useState<RecentStampItem[]>([]);
  const [recentRewards, setRecentRewards] = useState<RecentRewardItem[]>([]);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const processingRef = useRef(false);
  const [locationId, setLocationId] = useState<string>('1');
  const [cashierPin, setCashierPin] = useState<string>('');
  const [switchingMerchant, setSwitchingMerchant] = useState(false);

  const [enrollCustomerId, setEnrollCustomerId] = useState('');
  const [enrollPrograms, setEnrollPrograms] = useState<ProgramItem[]>([]);
  const [enrollLoading, setEnrollLoading] = useState(false);
  const [enrollError, setEnrollError] = useState<string | null>(null);
  const [enrollSuccess, setEnrollSuccess] = useState<string | null>(null);
  const [enrollingProgramId, setEnrollingProgramId] = useState<number | null>(null);
  const [enrollScanning, setEnrollScanning] = useState(false);
  const enrollScannerRef = useRef<Html5QrcodeScanner | null>(null);
  const enrollProcessingRef = useRef(false);

  const activeMerchantName = session?.merchants?.find(m => m.merchantId === session.merchantId)?.merchantName ?? `Merchant #${session?.merchantId}`;

  const handleSwitchMerchant = async (newMerchantId: number) => {
    if (!session || newMerchantId === session.merchantId) return;
    setSwitchingMerchant(true);
    setError(null);
    try {
      const res = await apiService.switchMerchant(newMerchantId, session.token);
      const updatedSession: StaffSession = {
        ...session,
        token: res.token,
        role: res.role,
        merchantId: res.merchantId,
        merchants: res.merchants ?? session.merchants,
      };
      setSession(updatedSession);
      localStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(updatedSession));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao trocar merchant';
      setError(message);
    } finally {
      setSwitchingMerchant(false);
    }
  };

  const handleLoadPrograms = async () => {
    if (!session || !enrollCustomerId.trim()) return;
    setEnrollLoading(true);
    setEnrollError(null);
    setEnrollSuccess(null);
    setEnrollPrograms([]);
    try {
      const programs = await apiService.getMerchantPrograms(session.merchantId);
      if (programs.length === 0) {
        setEnrollError('Nenhuma promoção ativa para este merchant.');
      }
      setEnrollPrograms(programs);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao buscar promoções';
      setEnrollError(message);
    } finally {
      setEnrollLoading(false);
    }
  };

  const handleEnrollCustomer = async (programId: number) => {
    const customerId = Number(enrollCustomerId.trim());
    if (!customerId || customerId <= 0) {
      setEnrollError('Informe um Customer ID válido.');
      return;
    }
    setEnrollingProgramId(programId);
    setEnrollError(null);
    setEnrollSuccess(null);
    try {
      const res = await apiService.enrollCustomer(programId, customerId);
      if (res.created) {
        setEnrollSuccess(`Cliente #${customerId} inscrito com sucesso! Card #${res.id} criado.`);
      } else {
        setEnrollSuccess(`Cliente #${customerId} já estava inscrito nesta promoção. Card existente: #${res.id} (${res.stampsCount} carimbos).`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao inscrever cliente';
      setEnrollError(message);
    } finally {
      setEnrollingProgramId(null);
    }
  };

  const startEnrollScan = () => {
    setEnrollScanning(true);
    setEnrollError(null);
    setEnrollSuccess(null);
    setEnrollPrograms([]);
    enrollProcessingRef.current = false;
  };

  const stopEnrollScan = async () => {
    if (enrollScannerRef.current) {
      await enrollScannerRef.current.clear();
      enrollScannerRef.current = null;
    }
    setEnrollScanning(false);
    enrollProcessingRef.current = false;
  };

  const onEnrollScanSuccess = async (decodedText: string) => {
    if (enrollProcessingRef.current) return;
    enrollProcessingRef.current = true;
    try {
      const data = JSON.parse(decodedText);
      if (enrollScannerRef.current) {
        await enrollScannerRef.current.clear();
        enrollScannerRef.current = null;
      }
      setEnrollScanning(false);

      if (data.type === 'CUSTOMER_ID' && data.customerId) {
        setEnrollCustomerId(String(data.customerId));
        if (session) {
          setEnrollLoading(true);
          setEnrollError(null);
          setEnrollPrograms([]);
          try {
            const programs = await apiService.getMerchantPrograms(session.merchantId);
            if (programs.length === 0) {
              setEnrollError('Nenhuma promoção ativa para este merchant.');
            }
            setEnrollPrograms(programs);
          } catch (err) {
            const message = err instanceof Error ? err.message : 'Erro ao buscar promoções';
            setEnrollError(message);
          } finally {
            setEnrollLoading(false);
          }
        }
      } else {
        setEnrollError('QR Code inválido. Esperado QR de identificação do cliente.');
      }
    } catch {
      setEnrollError('QR Code inválido. Não foi possível ler os dados.');
      if (enrollScannerRef.current) {
        await enrollScannerRef.current.clear();
        enrollScannerRef.current = null;
      }
      setEnrollScanning(false);
    } finally {
      enrollProcessingRef.current = false;
    }
  };

  useEffect(() => {
    if (enrollScanning && !enrollScannerRef.current) {
      setTimeout(() => {
        const scanner = new Html5QrcodeScanner(
          'enroll-qr-reader',
          { qrbox: { width: 250, height: 250 }, fps: 10, aspectRatio: 1.0 },
          false
        );
        enrollScannerRef.current = scanner;
        scanner.render(onEnrollScanSuccess, () => {});
      }, 100);
    }
    return () => {
      if (enrollScannerRef.current) {
        enrollScannerRef.current.clear().catch(console.error).finally(() => {
          enrollScannerRef.current = null;
        });
      }
    };
  }, [enrollScanning]);

  useEffect(() => {
    if (!session) {
      navigate('/staff', { replace: true });
    }
  }, [session, navigate]);

  const refreshDashboard = async () => {
    if (!session) return;
    try {
      const [m, stamps, rewards] = await Promise.all([
        apiService.getStaffDashboardMetrics(session.token),
        apiService.getRecentStamps(session.token, 10),
        apiService.getRecentRewards(session.token, 10),
      ]);
      setMetrics(m);
      setRecentStamps(stamps);
      setRecentRewards(rewards);
    } catch (err) {
      console.error('Erro ao atualizar dashboard:', err);
    }
  };

  useEffect(() => {
    if (!session) return;
    refreshDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.token, session?.merchantId]);

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
      setError(null);
      refreshDashboard();
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
      setError(null);
      refreshDashboard();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao resgatar recompensa';
      setError(message);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('pt-BR');
  };

  const feed: FeedItem[] = [
    ...recentStamps.map<FeedItem>((s) => ({ kind: 'stamp', timestamp: s.whenAt, data: s })),
    ...recentRewards.map<FeedItem>((r) => ({ kind: 'reward', timestamp: r.issuedAt, data: r })),
  ]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10);

  if (!session) {
    return null;
  }

  return (
    <div className="staff-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="4" />
              <path d="M9 12l2 2 4-4" />
            </svg>
          </div>
        </div>
        <nav className="sidebar-nav">
          <button className="nav-item active" title="Home">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </button>
          <button className="nav-item" title="Documentos">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </button>
          <button className="nav-item" title="Clientes">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </button>
          <button className="nav-item" title="Configurações">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        </nav>
        <div className="sidebar-bottom">
          <button className="nav-item" onClick={handleLogout} title="Sair">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="top-header">
          <div className="header-left">
            <h1>Painel do Staff</h1>
            <span className="header-subtitle">Staff #{session.staffId} • {session.role} • {activeMerchantName}</span>
          </div>
          <div className="header-right">
            {session.merchants && session.merchants.length > 1 && (
              <div className="location-select">
                <label>Merchant:</label>
                <select
                  value={session.merchantId}
                  onChange={e => handleSwitchMerchant(Number(e.target.value))}
                  disabled={switchingMerchant}
                >
                  {session.merchants.map(m => (
                    <option key={m.merchantId} value={m.merchantId}>
                      {m.merchantName}
                    </option>
                  ))}
                </select>
              </div>
            )}
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
            <div className="stat-icon blue">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            </div>
            <div className="stat-info">
              <span className="stat-value">{metrics?.stampsToday ?? '—'}</span>
              <span className="stat-label">Carimbos Hoje</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon orange">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 12 20 22 4 22 4 12" />
                <rect x="2" y="7" width="20" height="5" />
                <line x1="12" y1="22" x2="12" y2="7" />
                <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
                <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
              </svg>
            </div>
            <div className="stat-info">
              <span className="stat-value">{metrics?.rewardsToday ?? '—'}</span>
              <span className="stat-label">Prêmios Hoje</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon green">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div className="stat-info">
              <span className="stat-value">{metrics?.totalCustomers ?? '—'}</span>
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
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="3" width="7" height="7" rx="1" />
                    <rect x="3" y="14" width="7" height="7" rx="1" />
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
                  <span className="result-status">
                    <svg className="result-status-icon" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Carimbo Aplicado
                  </span>
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
                    <div className="reward-alert">Prêmio Conquistado!</div>
                  )}
                </div>
              </div>
            )}

            {redeemResult && (
              <div className="result-card with-reward">
                <div className="result-header">
                  <span className="result-status redeem">
                    <svg className="result-status-icon" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5 5a3 3 0 015-2.236A3 3 0 0114.83 6H16a2 2 0 110 4h-5V9a1 1 0 10-2 0v1H4a2 2 0 110-4h1.17A3 3 0 015 5zm4 1V5a1 1 0 10-1 1h1zm2 0a1 1 0 10-1-1v1h1z" clipRule="evenodd" />
                      <path d="M9 11H3v5a2 2 0 002 2h4v-7zM11 18h4a2 2 0 002-2v-5h-6v7z" />
                    </svg>
                    Recompensa Resgatada
                  </span>
                  <span className="result-time">{formatTimestamp(redeemResult.timestamp)}</span>
                </div>
                <div className="result-body">
                  <div className="result-row">
                    <span>Cartão</span>
                    <strong>{redeemResult.cardId}</strong>
                  </div>
                  <div className="reward-alert">Resgate confirmado com sucesso!</div>
                </div>
              </div>
            )}
          </section>

          <section className="activity-card">
            <div className="activity-header">
              <h2>Atividade Recente</h2>
              <span className="activity-count">{feed.length} registros</span>
            </div>
            <div className="activity-list">
              {feed.length === 0 ? (
                <div className="empty-state">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="empty-state-icon">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="M2 8h20" />
                    <path d="M9 14h6" />
                  </svg>
                  <p>Nenhuma atividade ainda</p>
                </div>
              ) : (
                feed.map((item) => {
                  const isReward = item.kind === 'reward';
                  const cardId = item.data.cardId;
                  const customerLabel = item.data.customerName ?? `Cliente #${item.data.customerId}`;
                  const meta = isReward
                    ? `Prêmio: ${item.data.rewardName}`
                    : `${item.data.stampsCount}/${item.data.stampsNeeded} carimbos`;
                  const key = `${item.kind}-${item.data.id}`;
                  return (
                    <div key={key} className="activity-item">
                      <div className={`activity-icon ${isReward ? 'reward' : 'stamp'}`}>
                        {isReward ? (
                          <svg viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5 5a3 3 0 015-2.236A3 3 0 0114.83 6H16a2 2 0 110 4h-5V9a1 1 0 10-2 0v1H4a2 2 0 110-4h1.17A3 3 0 015 5zm4 1V5a1 1 0 10-1 1h1zm2 0a1 1 0 10-1-1v1h1z" clipRule="evenodd" />
                            <path d="M9 11H3v5a2 2 0 002 2h4v-7zM11 18h4a2 2 0 002-2v-5h-6v7z" />
                          </svg>
                        ) : (
                          <svg viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <div className="activity-info">
                        <span className="activity-title">{customerLabel} • Cartão #{cardId}</span>
                        <span className="activity-meta">{meta}</span>
                      </div>
                      <span className="activity-time">{formatTimestamp(item.timestamp)}</span>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </div>

        <section className="enroll-section">
          <h2>Inscrever Cliente em Promoção</h2>
          <p className="enroll-desc">Escaneie o QR de identificação do cliente ou digite o ID manualmente</p>

          {enrollError && <div className="error-message">{enrollError}</div>}
          {enrollSuccess && <div className="enroll-success">{enrollSuccess}</div>}

          {!enrollScanning && !enrollCustomerId.trim() && enrollPrograms.length === 0 && (
            <div className="enroll-scan-area">
              <div className="scanner-placeholder" onClick={startEnrollScan}>
                <div className="qr-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="3" width="7" height="7" rx="1" />
                    <rect x="3" y="14" width="7" height="7" rx="1" />
                    <rect x="14" y="14" width="3" height="3" />
                    <rect x="18" y="14" width="3" height="3" />
                    <rect x="14" y="18" width="3" height="3" />
                    <rect x="18" y="18" width="3" height="3" />
                  </svg>
                </div>
                <span>Escanear QR do Cliente</span>
              </div>
            </div>
          )}

          {enrollScanning && (
            <div className="enroll-scan-area">
              <div className="scanner-active">
                <div id="enroll-qr-reader"></div>
                <button className="btn-cancel" onClick={stopEnrollScan}>Cancelar</button>
              </div>
            </div>
          )}

          <div className="enroll-form">
            <div className="enroll-divider">
              <span>ou digite manualmente</span>
            </div>
            <div className="enroll-input-group">
              <label>Customer ID:</label>
              <input
                type="number"
                value={enrollCustomerId}
                onChange={e => setEnrollCustomerId(e.target.value)}
                placeholder="Ex: 1"
                min="1"
              />
              <button
                className="btn-search"
                onClick={handleLoadPrograms}
                disabled={enrollLoading || !enrollCustomerId.trim()}
              >
                {enrollLoading ? 'Buscando...' : 'Buscar Promoções'}
              </button>
            </div>
          </div>

          {enrollPrograms.length > 0 && (
            <div className="enroll-programs-list">
              <h3 className="enroll-programs-title">Cliente #{enrollCustomerId} - Escolha a promoção:</h3>
              {enrollPrograms.map(program => (
                <div key={program.id} className="enroll-program-card">
                  <div className="enroll-program-info">
                    <h3>{program.name}</h3>
                    {program.description && <p className="enroll-program-desc">{program.description}</p>}
                    <div className="enroll-program-meta">
                      <span>Carimbos: {program.ruleTotalStamps}</span>
                      <span>Recompensa: {program.rewardName}</span>
                      {program.category && <span>Categoria: {program.category}</span>}
                    </div>
                  </div>
                  <button
                    className="btn-enroll"
                    onClick={() => handleEnrollCustomer(program.id)}
                    disabled={enrollingProgramId !== null}
                  >
                    {enrollingProgramId === program.id ? 'Inscrevendo...' : 'Inscrever'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
