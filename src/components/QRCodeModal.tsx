import QRCode from 'react-qr-code';
import { useState, useEffect } from 'react';
import type { QRTokenResponse, RedeemQrTokenResponse } from '../types';
import './QRCodeModal.css';

interface QRCodeModalProps {
  qrToken: QRTokenResponse | null;
  redeemQrToken?: RedeemQrTokenResponse | null;
  onClose: () => void;
}

const QRCodeModal = ({ qrToken, redeemQrToken, onClose }: QRCodeModalProps) => {

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  if (!qrToken && !redeemQrToken) return null;

  const isRedeem = !!redeemQrToken;

  const qrValue = isRedeem
    ? JSON.stringify({
        type: 'REDEEM_QR',
        payload: {
          cardId: redeemQrToken!.cardId,
          nonce: redeemQrToken!.nonce,
          exp: redeemQrToken!.exp,
          sig: redeemQrToken!.sig,
        },
      })
    : JSON.stringify(qrToken);

  const expTimestamp = isRedeem ? redeemQrToken!.exp : qrToken!.exp;
  const expiresAt = new Date(expTimestamp * 1000);
  const totalSeconds = Math.max(0, Math.floor((expiresAt.getTime() - currentTime.getTime()) / 1000));

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return (
    <div className="qr-modal-overlay" onClick={onClose}>
      <div className="qr-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="qr-modal-close" onClick={onClose}>×</button>
        
        <div className="qr-modal-header">
          <h2>{isRedeem ? 'QR de Resgate' : 'QR Code'}</h2>
          <p className="qr-subtitle">
            {isRedeem
              ? 'Mostre este código para resgatar sua recompensa'
              : 'Mostre este código para o estabelecimento'}
          </p>
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
            {isRedeem
              ? 'O estabelecimento irá escanear este código para liberar sua recompensa'
              : 'O estabelecimento irá escanear este código para adicionar um carimbo ao seu cartão'}
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
