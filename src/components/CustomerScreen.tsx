import { useState, useEffect, useRef } from "react";
import QRCode from "react-qr-code";
import "./CustomerScreen.css";
import type { Card, QRTokenResponse, RedeemQrTokenResponse } from "../types";
import { apiService } from "../services/api";
import QRCodeModal from "./QRCodeModal";
import { usePushNotifications } from "../hooks/usePushNotifications";

interface HomeScreenProps {
  customerId: number;
  customerName?: string;
  customerEmail?: string;
}

const StampCheckSvg = () => (
  <svg className="stamp-check" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const BrandIcon = () => (
  <svg className="nav-brand-icon" viewBox="0 0 32 32" fill="none">
    <rect width="32" height="32" rx="8" fill="rgba(255,255,255,0.15)" />
    <path d="M16 6C10.48 6 6 10.48 6 16s4.48 10 10 10 10-4.48 10-10S21.52 6 16 6zm-1 15l-4-4 1.41-1.41L15 18.17l5.59-5.59L22 14l-7 7z" fill="white" />
  </svg>
);

const QrIcon = () => (
  <svg className="btn-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
    <path d="M14 14h.01M14 17h.01M17 14h.01M17 17h.01M20 14h.01M20 17h.01M20 20h.01M17 20h.01M14 20h.01" />
  </svg>
);

const HomeScreen = ({
  customerId,
  customerName = "Cliente",
  customerEmail,
}: HomeScreenProps) => {
  const [cards, setCards] = useState<Card[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qrToken, setQrToken] = useState<QRTokenResponse | null>(null);
  const [redeemQrToken, setRedeemQrToken] = useState<RedeemQrTokenResponse | null>(null);
  const [loadingQR, setLoadingQR] = useState(false);
  const [loadingRedeemQR, setLoadingRedeemQR] = useState(false);
  const previousStampsCountRef = useRef<number>(0);
  const { permission, supported, subscribed, loading: pushLoading, subscribe: subscribePush } = usePushNotifications(customerId);

  const card = cards.length > 0 ? cards[selectedIndex] ?? null : null;

  const avatarInitial = customerEmail
    ? customerEmail.charAt(0).toUpperCase()
    : customerName.charAt(0).toUpperCase();

  const fetchCards = async (isPolling = false) => {
    try {
      if (!isPolling) setLoading(true);
      const response = await apiService.getCustomerCards(customerId);

      if (response.cards && response.cards.length > 0) {
        const updatedCards = response.cards;

        if (isPolling && card) {
          const updatedCurrent = updatedCards.find(c => c.cardId === card.cardId);
          if (updatedCurrent) {
            if (qrToken && previousStampsCountRef.current > 0 && updatedCurrent.stampsCount > previousStampsCountRef.current) {
              setQrToken(null);
            }
            if (redeemQrToken && updatedCurrent.status === 'ACTIVE' && updatedCurrent.stampsCount === 0) {
              setRedeemQrToken(null);
            }
            previousStampsCountRef.current = updatedCurrent.stampsCount;
          }
        } else if (!isPolling && updatedCards.length > 0) {
          previousStampsCountRef.current = updatedCards[0].stampsCount;
        }

        setCards(updatedCards);

        if (selectedIndex >= updatedCards.length) {
          setSelectedIndex(0);
        }
      } else {
        setCards([]);
      }
    } catch (err) {
      if (!isPolling) {
        setError("Erro ao carregar cartões de fidelidade");
        console.error(err);
      }
    } finally {
      if (!isPolling) setLoading(false);
    }
  };

  useEffect(() => {
    fetchCards();
  }, [customerId]);

  useEffect(() => {
    if (!qrToken) return;
    const intervalId = setInterval(() => fetchCards(true), 2000);
    return () => clearInterval(intervalId);
  }, [qrToken, customerId]);

  useEffect(() => {
    if (!redeemQrToken) return;
    const intervalId = setInterval(() => fetchCards(true), 2000);
    return () => clearInterval(intervalId);
  }, [redeemQrToken, customerId]);

  const handleSelectCard = (index: number) => {
    setSelectedIndex(index);
    setQrToken(null);
    setRedeemQrToken(null);
    const selected = cards[index];
    if (selected) {
      previousStampsCountRef.current = selected.stampsCount;
    }
  };

  const handleShowQR = async () => {
    if (!card) return;
    try {
      setLoadingQR(true);
      const token = await apiService.getCardQR(card.cardId);
      setQrToken(token);
    } catch (err) {
      console.error("Erro ao gerar QR Code:", err);
      alert("Erro ao gerar QR Code. Tente novamente.");
    } finally {
      setLoadingQR(false);
    }
  };

  const handleShowRedeemQR = async () => {
    if (!card) return;
    try {
      setLoadingRedeemQR(true);
      const token = await apiService.getRedeemQR(card.cardId);
      setRedeemQrToken(token);
    } catch (err) {
      console.error("Erro ao gerar QR de resgate:", err);
      alert("Erro ao gerar QR de resgate. Tente novamente.");
    } finally {
      setLoadingRedeemQR(false);
    }
  };

  const handleCloseQR = () => {
    setQrToken(null);
    setRedeemQrToken(null);
  };

  if (loading) {
    return (
      <div className="home-screen">
        <div className="loading">Carregando...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="home-screen">
        <div className="error">{error}</div>
      </div>
    );
  }

  const renderNavBar = () => (
    <nav className="nav-bar">
      <div className="nav-brand">
        <BrandIcon />
        <span className="nav-brand-text">Carimbaí</span>
      </div>
      <div className="nav-avatar">{avatarInitial}</div>
    </nav>
  );

  const renderWelcomeHeader = () => (
    <div className="welcome-header">
      <div className="welcome-info">
        <h1 className="greeting">Olá, {customerName}!</h1>
        <p className="subtitle">Bem-vindo ao seu cartão de fidelidade</p>
      </div>
      {supported && permission !== 'granted' && (
        <button
          className="btn-push-toggle"
          onClick={subscribePush}
          disabled={pushLoading || permission === 'denied'}
          title={permission === 'denied' ? 'Notificações bloqueadas no navegador' : 'Ativar notificações'}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          {pushLoading ? '' : permission === 'denied' ? 'Bloqueado' : 'Ativar'}
        </button>
      )}
      {supported && permission === 'granted' && subscribed && (
        <span className="push-active-badge" title="Notificações ativas">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </span>
      )}
    </div>
  );

  if (cards.length === 0) {
    const idQrValue = JSON.stringify({ type: "CUSTOMER_ID", customerId });

    return (
      <div className="home-screen">
        {renderNavBar()}
        <main className="home-content">
          {renderWelcomeHeader()}
          <div className="empty-cards-state">
            <h2>Nenhuma promoção ativa</h2>
            <p>Mostre este código ao estabelecimento para se inscrever em uma promoção</p>
            <div className="id-qr-wrapper">
              <QRCode
                value={idQrValue}
                size={200}
                level="H"
                style={{ maxWidth: "100%", height: "auto" }}
              />
            </div>
            <p className="id-qr-hint">Peça ao atendente para escanear seu QR code</p>
          </div>
        </main>
      </div>
    );
  }

  const progress = card ? (card.stampsCount / card.stampsNeeded) * 100 : 0;

  return (
    <div className="home-screen">
      {renderNavBar()}

      <main className="home-content">
        {renderWelcomeHeader()}

        {cards.length > 1 && (
          <div className="card-tabs">
            {cards.map((c, i) => (
              <button
                key={c.cardId}
                className={`card-tab ${i === selectedIndex ? 'active' : ''}`}
                onClick={() => handleSelectCard(i)}
              >
                {c.programName}
              </button>
            ))}
          </div>
        )}

        {card && (
          <>
            <div className="card-container">
              <div className="loyalty-card">
                <div className="card-gradient-bar" />
                <div className="card-inner">
                  <div className="card-header">
                    <h2>{card.programName}</h2>
                    <p className="merchant-name">{card.merchantName}</p>
                    <div className="reward-badge">
                      <svg className="reward-badge-icon" viewBox="0 0 20 20" fill="none">
                        <path d="M10 2L12.09 7.26L18 8.27L14 12.14L14.82 18.02L10 15.77L5.18 18.02L6 12.14L2 8.27L7.91 7.26L10 2Z" fill="#4b3bff" />
                      </svg>
                      Recompensa: {card.rewardName}
                    </div>
                  </div>

                  <div className="stamps-grid">
                    {[...Array(card.stampsNeeded)].map((_, index) => (
                      <div
                        key={index}
                        className={`stamp ${index < card.stampsCount ? "filled" : ""}`}
                      >
                        {index < card.stampsCount ? <StampCheckSvg /> : index + 1}
                      </div>
                    ))}
                  </div>

                  <div className="progress-info">
                    <p className="stamps-count">
                      {card.stampsCount} de {card.stampsNeeded} carimbos
                    </p>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>

                  {card.hasReward && (
                    <div className="reward-available">
                      <span className="reward-available-icon">🎉</span>
                      <p>Você tem uma recompensa disponível!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="actions">
              {card.status === 'READY_TO_REDEEM' ? (
                <button
                  className="btn-primary"
                  onClick={handleShowRedeemQR}
                  disabled={loadingRedeemQR}
                >
                  🎁 {loadingRedeemQR ? "Gerando..." : "Gerar QR de Resgate"}
                </button>
              ) : (
                <button
                  className="btn-primary"
                  onClick={handleShowQR}
                  disabled={loadingQR}
                >
                  <QrIcon />
                  {loadingQR ? "Gerando..." : "Mostrar QR Code"}
                </button>
              )}
            </div>
          </>
        )}
      </main>

      <QRCodeModal qrToken={qrToken} redeemQrToken={redeemQrToken} onClose={handleCloseQR} />
    </div>
  );
};

export default HomeScreen;
