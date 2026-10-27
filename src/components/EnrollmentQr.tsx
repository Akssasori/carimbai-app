import { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';
import { apiService } from '../services/api';
import type { CustomerEnrollmentQr } from '../types';

export default function EnrollmentQr({ token }: { token?: string }) {
  const [qr, setQr] = useState<CustomerEnrollmentQr | null>(null);
  const [error, setError] = useState('');
  const [now, setNow] = useState(() => Date.now());
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const value = await apiService.getEnrollmentQr(token);
        if (!cancelled) {
          setQr(value);
          setError('');
        }
      } catch {
        if (!cancelled) {
          setQr(null);
          setError('Nao foi possivel gerar o QR. Tente novamente.');
        }
      }
    };
    void load();
    const refresh = setInterval(() => void load(), 60000);
    const clock = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      cancelled = true;
      clearInterval(refresh);
      clearInterval(clock);
    };
  }, [token, retry]);

  const remaining = qr ? Math.max(0, Math.ceil(qr.exp - now / 1000)) : 0;
  return (
    <section className="empty-cards-state" aria-label="Inscricao em promocao">
      <p>Mostre este QR temporario ao atendente para participar de uma promocao.</p>
      {qr && remaining > 0 ? (
        <>
          <div className="id-qr-wrapper">
            <QRCode value={JSON.stringify(qr)} size={200} level="H" />
          </div>
          <p className="id-qr-hint">Uso unico. Expira em {remaining}s.</p>
        </>
      ) : <p role="status">{error || 'Gerando um QR atualizado...'}</p>}
      <button type="button" onClick={() => setRetry(value => value + 1)}>
        Gerar novo QR
      </button>
    </section>
  );
}
