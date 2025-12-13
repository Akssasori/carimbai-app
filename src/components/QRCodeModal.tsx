import QRCode from 'react-qr-code';
import { useState, useEffect } from 'react';
import type { QRTokenResponse } from '../types';
import './QRCodeModal.css';

interface QRCodeModalProps {
  qrToken: QRTokenResponse | null;
  onClose: () => void;
}

const QRCodeModal = ({ qrToken, onClose }: QRCodeModalProps) => {

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  if (!qrToken) return null;

  const qrValue = JSON.stringify(qrToken);
  const expiresAt = new Date(qrToken.exp * 1000);
  const totalSeconds = Math.max(0, Math.floor((expiresAt.getTime() - currentTime.getTime()) / 1000));

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return (
    <div className="qr-modal-overlay" onClick={onClose}>
      <div className="qr-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="qr-modal-close" onClick={onClose}>×</button>
        
        <div className="qr-modal-header">
          <h2>QR Code</h2>
          <p className="qr-subtitle">Mostre este código para o estabelecimento</p>
        </div>

        <div className="qr-code-container">
          <div className="qr-code-wrapper">
            <QRCode 
              value={qrValue}
              size={256}
              level="H"
              style={{ maxWidth: '100%', height: 'auto' }}
            />
          </div>
        </div>

        <div className="qr-info">
          <div className="qr-timer">
            <span className="timer-icon">⏱️</span>
            <span className="timer-text">
              {totalSeconds > 0 
                ? `Válido por ${minutes}:${seconds.toString().padStart(2, '0')}`
                : 'Código expirado'}
            </span>
          </div>
          <p className="qr-hint">
            O estabelecimento irá escanear este código para adicionar um carimbo ao seu cartão
          </p>
        </div>

        <button className="btn-close-modal" onClick={onClose}>
          Fechar
        </button>
      </div>
    </div>
  );
};

export default QRCodeModal;
