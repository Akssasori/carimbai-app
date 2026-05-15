import { useCallback, useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';
import AdminCard from './AdminCard';
import Modal from './Modal';
import { useStaffSession } from '../../hooks/useStaffSession';
import { apiService } from '../../services/api';
import type { StaffItem, StaffRole, CreateStaffRequest } from '../../types';

interface CreateFormState {
  email: string;
  password: string;
  role: StaffRole;
}

interface PinFormState {
  pin: string;
  confirm: string;
}

const EMPTY_CREATE: CreateFormState = { email: '', password: '', role: 'CASHIER' };
const EMPTY_PIN: PinFormState = { pin: '', confirm: '' };

export default function StaffAdmin() {
  const { session, logout } = useStaffSession();
  const [staff, setStaff] = useState<StaffItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<number | 'new' | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateFormState>(EMPTY_CREATE);
  const [createError, setCreateError] = useState<string | null>(null);

  const [pinTarget, setPinTarget] = useState<StaffItem | null>(null);
  const [pinForm, setPinForm] = useState<PinFormState>(EMPTY_PIN);
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinSaving, setPinSaving] = useState(false);

  const fetchStaff = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setError(null);
    try {
      const list = await apiService.getMerchantStaff(session.merchantId, session.token);
      setStaff(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar equipe');
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  if (!session) return null;

  const openCreate = () => {
    setCreateForm(EMPTY_CREATE);
    setCreateError(null);
    setCreateOpen(true);
  };

  const handleCreate = async () => {
    if (!session) return;
    if (!createForm.email.trim() || !createForm.password.trim()) {
      setCreateError('Email e senha são obrigatórios.');
      return;
    }
    if (createForm.password.length < 6) {
      setCreateError('Senha precisa ter pelo menos 6 caracteres.');
      return;
    }
    setSavingId('new');
    setCreateError(null);
    try {
      const payload: CreateStaffRequest = {
        merchantId: session.merchantId,
        email: createForm.email.trim(),
        password: createForm.password,
        role: createForm.role,
      };
      await apiService.createStaff(payload, session.token);
      setCreateOpen(false);
      await fetchStaff();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Erro ao criar staff.');
    } finally {
      setSavingId(null);
    }
  };

  const handleRoleChange = async (item: StaffItem, role: StaffRole) => {
    if (!session) return;
    if (role === item.role) return;
    setSavingId(item.staffId);
    setError(null);
    try {
      await apiService.updateStaffInMerchant(
        session.merchantId,
        item.staffId,
        { role },
        session.token,
      );
      await fetchStaff();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao alterar role');
    } finally {
      setSavingId(null);
    }
  };

  const handleToggleActive = async (item: StaffItem) => {
    if (!session) return;
    setSavingId(item.staffId);
    setError(null);
    try {
      await apiService.updateStaffInMerchant(
        session.merchantId,
        item.staffId,
        { active: !item.active },
        session.token,
      );
      await fetchStaff();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao alterar status');
    } finally {
      setSavingId(null);
    }
  };

  const openPinModal = (item: StaffItem) => {
    setPinTarget(item);
    setPinForm(EMPTY_PIN);
    setPinError(null);
  };

  const closePinModal = () => {
    setPinTarget(null);
    setPinForm(EMPTY_PIN);
    setPinError(null);
  };

  const handlePinSubmit = async () => {
    if (!session || !pinTarget) return;
    if (pinForm.pin.length < 4 || pinForm.pin.length > 10) {
      setPinError('PIN deve ter entre 4 e 10 caracteres.');
      return;
    }
    if (pinForm.pin !== pinForm.confirm) {
      setPinError('PINs não conferem.');
      return;
    }
    setPinSaving(true);
    setPinError(null);
    try {
      await apiService.setStaffPin(pinTarget.staffId, pinForm.pin, session.token);
      closePinModal();
    } catch (err) {
      setPinError(err instanceof Error ? err.message : 'Erro ao definir PIN.');
    } finally {
      setPinSaving(false);
    }
  };

  return (
    <AdminLayout
      title="Equipe"
      subtitle="Gerencie staff do merchant ativo: criar, promover, desativar, definir PIN."
      role={session.role}
      onLogout={logout}
      headerExtra={
        <button type="button" className="admin-btn admin-btn-primary" onClick={openCreate}>
          + Novo staff
        </button>
      }
    >
      {error && <div className="admin-error-banner">{error}</div>}

      {loading && <div className="admin-loading">Carregando…</div>}

      {!loading && staff.length === 0 && (
        <div className="admin-empty">
          Nenhum staff cadastrado. Clique em "+ Novo staff" para criar o primeiro.
        </div>
      )}

      {!loading && staff.map((item) => {
        const isSelf = item.staffId === session.staffId;
        const disabled = savingId === item.staffId || isSelf;
        return (
          <AdminCard
            key={item.staffId}
            dimmed={!item.active}
            title={item.email}
            badges={
              <>
                <span className={`admin-card-badge ${item.active ? 'is-active' : 'is-inactive'}`}>
                  {item.active ? 'Ativo' : 'Inativo'}
                </span>
                {item.isDefault && <span className="admin-card-badge is-info">Padrão</span>}
                {isSelf && <span className="admin-card-badge is-info">Você</span>}
              </>
            }
            meta={<span>ID: {item.staffId}</span>}
            actions={
              <>
                <select
                  value={item.role}
                  onChange={(e) => handleRoleChange(item, e.target.value as StaffRole)}
                  disabled={disabled}
                  title={isSelf ? 'Você não pode mudar seu próprio role' : 'Alterar role'}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    background: 'white',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: disabled ? 'not-allowed' : 'pointer',
                  }}
                >
                  <option value="CASHIER">CASHIER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
                <button
                  type="button"
                  className="admin-btn admin-btn-secondary"
                  onClick={() => openPinModal(item)}
                  disabled={savingId === item.staffId}
                >
                  PIN
                </button>
                <button
                  type="button"
                  className={`admin-btn ${item.active ? 'admin-btn-danger' : 'admin-btn-secondary'}`}
                  onClick={() => handleToggleActive(item)}
                  disabled={disabled}
                  title={isSelf ? 'Você não pode se desativar' : ''}
                >
                  {savingId === item.staffId ? '…' : item.active ? 'Desativar' : 'Ativar'}
                </button>
              </>
            }
          />
        );
      })}

      {/* Modal de criar novo staff */}
      <Modal
        open={createOpen}
        title="Novo staff"
        onClose={() => setCreateOpen(false)}
        footer={
          <>
            <button type="button" className="admin-btn admin-btn-ghost" onClick={() => setCreateOpen(false)}>
              Cancelar
            </button>
            <button
              type="button"
              className="admin-btn admin-btn-primary"
              onClick={handleCreate}
              disabled={savingId === 'new'}
            >
              {savingId === 'new' ? 'Criando…' : 'Criar'}
            </button>
          </>
        }
      >
        {createError && <div className="admin-error-banner">{createError}</div>}

        <div className="admin-field">
          <label>Email *</label>
          <input
            type="email"
            value={createForm.email}
            onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
            placeholder="email@empresa.com"
            autoComplete="off"
          />
        </div>

        <div className="admin-field">
          <label>Senha inicial *</label>
          <input
            type="password"
            value={createForm.password}
            onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
            placeholder="Mínimo 6 caracteres"
            autoComplete="new-password"
          />
        </div>

        <div className="admin-field">
          <label>Role *</label>
          <select
            value={createForm.role}
            onChange={(e) => setCreateForm({ ...createForm, role: e.target.value as StaffRole })}
          >
            <option value="CASHIER">CASHIER — opera carimbo/resgate</option>
            <option value="ADMIN">ADMIN — pode gerenciar tudo</option>
          </select>
        </div>

        <p style={{ fontSize: 13, color: '#6b7280' }}>
          A senha será definida em texto puro nesta tela. Repasse ao staff por canal seguro;
          ele pode ser orientado a alterá-la no primeiro login (fluxo de reset de senha ainda não está
          implementado — Tier 3).
        </p>
      </Modal>

      {/* Modal de PIN */}
      <Modal
        open={pinTarget !== null}
        title={pinTarget ? `Definir PIN de ${pinTarget.email}` : 'Definir PIN'}
        onClose={closePinModal}
        footer={
          <>
            <button type="button" className="admin-btn admin-btn-ghost" onClick={closePinModal}>
              Cancelar
            </button>
            <button
              type="button"
              className="admin-btn admin-btn-primary"
              onClick={handlePinSubmit}
              disabled={pinSaving}
            >
              {pinSaving ? 'Salvando…' : 'Salvar PIN'}
            </button>
          </>
        }
      >
        {pinError && <div className="admin-error-banner">{pinError}</div>}

        <p style={{ fontSize: 13, color: '#6b7280', marginTop: 0 }}>
          O PIN é solicitado no resgate de prêmios em lojas que tenham "Exigir PIN no resgate"
          ativado. Use 4 a 10 dígitos.
        </p>

        <div className="admin-field">
          <label>Novo PIN *</label>
          <input
            type="password"
            inputMode="numeric"
            value={pinForm.pin}
            onChange={(e) => setPinForm({ ...pinForm, pin: e.target.value })}
            placeholder="••••"
            maxLength={10}
            autoComplete="new-password"
          />
        </div>

        <div className="admin-field">
          <label>Confirmar PIN *</label>
          <input
            type="password"
            inputMode="numeric"
            value={pinForm.confirm}
            onChange={(e) => setPinForm({ ...pinForm, confirm: e.target.value })}
            placeholder="••••"
            maxLength={10}
            autoComplete="new-password"
          />
        </div>
      </Modal>
    </AdminLayout>
  );
}
