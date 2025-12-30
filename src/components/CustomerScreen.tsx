import { useState, useEffect } from "react";
import "./CustomerScreen.css";
import type { Card, QRTokenResponse } from "../types";
import { apiService } from "../services/api";
import QRCodeModal from "./QRCodeModal";

interface HomeScreenProps {
  customerId: number;
  customerName?: string;
}

const HomeScreen = ({
  customerId,
  customerName = "Cliente",
}: HomeScreenProps) => {
  const [card, setCard] = useState<Card | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qrToken, setQrToken] = useState<QRTokenResponse | null>(null);
  const [loadingQR, setLoadingQR] = useState(false);

  useEffect(() => {
    const fetchCard = async () => {
      try {
        setLoading(true);
        const response = await apiService.getCustomerCards(customerId);

        if (response.cards && response.cards.length > 0) {
          setCard(response.cards[0]);
        }
      } catch (err) {
        setError("Erro ao carregar cartão de fidelidade");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCard();
  }, [customerId]);

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

  const handleCloseQR = () => {
    setQrToken(null);
  };

  if (loading) {
    return (
      <div className="home-screen">
        <div className="loading">Carregando...</div>
      </div>
    );
  }

  if (error || !card) {
    return (
      <div className="home-screen">
        <div className="error">{error || "Nenhum cartão encontrado"}</div>
      </div>
    );
  }

  const progress = (card.stampsCount / card.stampsNeeded) * 100;

  return (
    <div className="home-screen">
      <header className="home-header">
        <h1 className="greeting">Olá, {customerName}!</h1>
        <p className="subtitle">Bem-vindo ao seu cartão de fidelidade</p>
      </header>

      <main className="home-content">
        <div className="card-container">
          <div className="loyalty-card">
            <div className="card-header">
              <h2>{card.programName}</h2>
              <p className="merchant-name">{card.merchantName}</p>
              <p className="reward-info">Recompensa: {card.rewardName}</p>
            </div>

            <div className="stamps-grid">
              {[...Array(card.stampsNeeded)].map((_, index) => (
                <div
                  key={index}
                  className={`stamp ${
                    index < card.stampsCount ? "filled" : ""
                  }`}
                >
                  {index < card.stampsCount ? "✓" : index + 1}
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
                <span className="reward-badge">🎉</span>
                <p>Você tem uma recompensa disponível!</p>
              </div>
            )}
          </div>
        </div>

        <div className="actions">
          <button
            className="btn-primary"
            onClick={handleShowQR}
            disabled={loadingQR}
          >
            <svg
              className="btn-icon"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ marginRight: "8px" }}
            >
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
              <path d="M14 14h.01M14 17h.01M17 14h.01M17 17h.01M20 14h.01M20 17h.01M20 20h.01M17 20h.01M14 20h.01" />
            </svg>

            {loadingQR ? "Gerando..." : "Mostrar QR Code"}
          </button>
        </div>
      </main>

      <QRCodeModal qrToken={qrToken} onClose={handleCloseQR} />
    </div>
  );
};

export default HomeScreen;
