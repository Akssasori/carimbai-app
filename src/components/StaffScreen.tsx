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

export default function StaffScreen() {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<StampResult | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [scanner, setScanner] = useState<Html5QrcodeScanner | null>(null);
  const processingRef = useRef(false);

  useEffect(() => {
    if (scanning && !scanner) {
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

        qrScanner.render(onScanSuccess, onScanError);
        setScanner(qrScanner);
      }, 100);
    }

    // Cleanup quando o componente desmonta ou scanning muda
    return () => {
      if (scanner) {
        scanner.clear().catch(console.error);
      }
    };
  }, [scanning]);

  const startScanning = () => {
    setScanning(true);
    setError(null);
    setResult(null);
    processingRef.current = false;
  };

  const onScanSuccess = async (decodedText: string) => {
    if (processingRef.current) return;
    processingRef.current = true;

    try {
      const qrData = JSON.parse(decodedText);
      
      // Limpa o scanner
      if (scanner) {
        await scanner.clear();
        setScanner(null);
      }
      setScanning(false);

      await applyStamp(qrData);
    } catch (err) {
      setError('QR Code inválido. Não foi possível ler os dados.');
      if (scanner) {
        await scanner.clear();
        setScanner(null);
      }
      setScanning(false);
    } finally {
      processingRef.current = false;
    }
  };

  const onScanError = (errorMessage: string) => {
    // Ignora erros de scan contínuo
    console.warn(errorMessage);
  };

  const applyStamp = async (qrData: any) => {
    try {
    const idempotencyKey = `${qrData.idRef}-${Date.now()}-${crypto.randomUUID()}`;
    
    const response = await apiService.applyStamp(
      {
        type: 'CUSTOMER_QR',
        payload: {
          cardId: qrData.idRef,
          nonce: qrData.nonce,
          exp: qrData.exp,
          sig: qrData.sig
        }
      },
      idempotencyKey
    );

      setResult({
        cardId: response.cardId.toString(),
        stampsCount: response.stamps,
        maxStamps: response.needed,
        rewardEarned: response.rewardIssued,
        timestamp: new Date().toISOString()
      });

      const historyItem: HistoryItem = {
        cardId: response.cardId.toString(),
        stampsCount: response.stamps,
        maxStamps: response.needed,
        rewardEarned: response.rewardIssued,
        timestamp: new Date().toISOString(),
        id: `${response.cardId}-${Date.now()}`,
      };
      setHistory((prev) => [historyItem, ...prev]);
    } catch (err: any) {
      setError(err.message || 'Erro ao processar carimbo');
    }
  };

  const stopScanning = async () => {
    if (scanner) {
      await scanner.clear();
      setScanner(null);
    }
    setScanning(false);
    processingRef.current = false;
  };

  const clearHistory = () => {
    setHistory([]);
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('pt-BR');
  };

  return (
    <div className="staff-screen">
      <div className="staff-header">
        <h1 className="greeting">Painel do Comerciante</h1>
        <p className="subtitle">Escaneie o QR Code do cliente para aplicar carimbos</p>
      </div>

      <div className="staff-content">
        <div className="scanner-section">
          <h2>Scanner de QR Code</h2>

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