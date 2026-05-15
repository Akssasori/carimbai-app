import { useCallback, useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';
import AdminCard from './AdminCard';
import Modal from './Modal';
import Toggle from './Toggle';
import { useStaffSession } from '../../hooks/useStaffSession';
import { apiService } from '../../services/api';
import type { LocationItem, LocationFlags, CreateLocationRequest, UpdateLocationRequest } from '../../types';

interface LocationFormState {
  name: string;
  address: string;
  active: boolean;
  flags: LocationFlags;
}

const EMPTY_FORM: LocationFormState = {
  name: '',
  address: '',
  active: true,
  flags: { requirePinOnRedeem: false, enableScanA: true, enableScanB: false },
};

export default function LocationsAdmin() {
  const { session, logout } = useStaffSession();
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<number | 'new' | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<LocationFormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchLocations = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setError(null);
    try {
      const list = await apiService.getMerchantLocations(session.merchantId, session.token);
      setLocations(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar lojas');
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  if (!session) return null;

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (loc: LocationItem) => {
    setEditingId(loc.id);
    setForm({
      name: loc.name,
      address: loc.address ?? '',
      active: loc.active,
      flags: { ...loc.flags },
    });
    setFormError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setFormError(null);
  };

  const handleSubmit = async () => {
    if (!session) return;
    if (!form.name.trim()) {
      setFormError('Nome obrigatório.');
      return;
    }
    setSavingId(editingId ?? 'new');
    setFormError(null);
    try {
      if (editingId == null) {
        const payload: CreateLocationRequest = {
          merchantId: session.merchantId,
          name: form.name.trim(),
          address: form.address.trim() || null,
        };
        await apiService.createLocation(session.merchantId, payload, session.token);
        // Apos criar, se o admin definiu flags ou active != true, faz update separado.
        // (POST nao aceita flags hoje — somente PUT.)
        // Para simplificar, criamos com defaults e o admin edita depois se quiser.
      } else {
        const payload: UpdateLocationRequest = {
          name: form.name.trim(),
          address: form.address.trim() || null,
          active: form.active,
          flags: { ...form.flags }, // sempre os 3 juntos
        };
        await apiService.updateLocation(session.merchantId, editingId, payload, session.token);
      }
      closeModal();
      await fetchLocations();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erro ao salvar.');
    } finally {
      setSavingId(null);
    }
  };

  const toggleActive = async (loc: LocationItem) => {
    if (!session) return;
    setSavingId(loc.id);
    try {
      await apiService.updateLocation(
        session.merchantId,
        loc.id,
        { active: !loc.active },
        session.token,
      );
      await fetchLocations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao alterar status da loja');
    } finally {
      setSavingId(null);
    }
  };

  const flagBadges = (loc: LocationItem): React.ReactNode => {
    const labels: string[] = [];
    if (loc.flags.requirePinOnRedeem) labels.push('PIN no resgate');
    if (loc.flags.enableScanA) labels.push('Scan A');
    if (loc.flags.enableScanB) labels.push('Scan B');
    if (labels.length === 0) return null;
    return labels.map((l) => (
      <span key={l} className="admin-card-badge is-info">{l}</span>
    ));
  };

  return (
    <AdminLayout
      title="Lojas"
      subtitle="Cadastre as locations físicas do merchant e configure flags de comportamento."
      role={session.role}
      onLogout={logout}
      headerExtra={
        <button type="button" className="admin-btn admin-btn-primary" onClick={openCreate}>
          + Nova loja
        </button>
      }
    >
      {error && <div className="admin-error-banner">{error}</div>}

      {loading && <div className="admin-loading">Carregando…</div>}

      {!loading && locations.length === 0 && (
        <div className="admin-empty">
          Nenhuma loja cadastrada. Clique em "+ Nova loja" para começar.
        </div>
      )}

      {!loading && locations.map((loc) => (
        <AdminCard
          key={loc.id}
          dimmed={!loc.active}
          title={loc.name}
          subtitle={loc.address ?? undefined}
          badges={
            <>
              <span className={`admin-card-badge ${loc.active ? 'is-active' : 'is-inactive'}`}>
                {loc.active ? 'Ativa' : 'Inativa'}
              </span>
              {flagBadges(loc)}
            </>
          }
          meta={<span>ID: {loc.id}</span>}
          actions={
            <>
              <button
                type="button"
                className="admin-btn admin-btn-ghost"
                onClick={() => openEdit(loc)}
                disabled={savingId === loc.id}
              >
                Editar
              </button>
              <button
                type="button"
                className={`admin-btn ${loc.active ? 'admin-btn-danger' : 'admin-btn-secondary'}`}
                onClick={() => toggleActive(loc)}
                disabled={savingId === loc.id}
              >
                {savingId === loc.id ? '…' : loc.active ? 'Desativar' : 'Ativar'}
              </button>
            </>
          }
        />
      ))}

      <Modal
        open={modalOpen}
        title={editingId == null ? 'Nova loja' : 'Editar loja'}
        onClose={closeModal}
        footer={
          <>
            <button type="button" className="admin-btn admin-btn-ghost" onClick={closeModal}>
              Cancelar
            </button>
            <button
              type="button"
              className="admin-btn admin-btn-primary"
              onClick={handleSubmit}
              disabled={savingId !== null}
            >
              {savingId !== null ? 'Salvando…' : 'Salvar'}
            </button>
          </>
        }
      >
        {formError && <div className="admin-error-banner">{formError}</div>}

        <div className="admin-field">
          <label>Nome *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Ex: Loja Augusta"
            maxLength={120}
          />
        </div>

        <div className="admin-field">
          <label>Endereço</label>
          <input
            type="text"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder="Rua, número, bairro"
            maxLength={255}
          />
        </div>

        {editingId != null && (
          <>
            <Toggle
              checked={form.active}
              onChange={(v) => setForm({ ...form, active: v })}
              label="Loja ativa"
              description="Lojas inativas não aparecem nas operações do staff."
            />

            <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', margin: '12px 0' }} />

            <p style={{ fontSize: 13, color: '#6b7280', marginTop: 0, marginBottom: 4 }}>
              Configurações de comportamento desta loja:
            </p>

            <Toggle
              checked={form.flags.requirePinOnRedeem}
              onChange={(v) =>
                setForm({ ...form, flags: { ...form.flags, requirePinOnRedeem: v } })
              }
              label="Exigir PIN no resgate"
              description="Caixa precisa digitar o próprio PIN para confirmar resgate de prêmio nesta loja."
            />
            <Toggle
              checked={form.flags.enableScanA}
              onChange={(v) => setForm({ ...form, flags: { ...form.flags, enableScanA: v } })}
              label="Habilitar Scan A (QR do cliente)"
              description="Caixa escaneia o QR do app do cliente para carimbar."
            />
            <Toggle
              checked={form.flags.enableScanB}
              onChange={(v) => setForm({ ...form, flags: { ...form.flags, enableScanB: v } })}
              label="Habilitar Scan B (QR da loja)"
              description="Cliente escaneia um QR fixo da loja para carimbar."
            />
          </>
        )}

        {editingId == null && (
          <p style={{ fontSize: 13, color: '#6b7280' }}>
            Após criar a loja, abra a edição para configurar as flags de comportamento.
          </p>
        )}
      </Modal>
    </AdminLayout>
  );
}
