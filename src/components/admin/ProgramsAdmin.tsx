import { useCallback, useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';
import AdminCard from './AdminCard';
import Modal from './Modal';
import { useStaffSession } from '../../hooks/useStaffSession';
import { apiService } from '../../services/api';
import type { AdminProgramItem, CreateProgramRequest, UpdateProgramRequest } from '../../types';

interface ProgramFormState {
  name: string;
  rewardName: string;
  ruleTotalStamps: string;  // input mantido como string
  description: string;
  category: string;
  imageUrl: string;
}

const EMPTY_FORM: ProgramFormState = {
  name: '',
  rewardName: '',
  ruleTotalStamps: '10',
  description: '',
  category: '',
  imageUrl: '',
};

export default function ProgramsAdmin() {
  const { session, logout } = useStaffSession();
  const [programs, setPrograms] = useState<AdminProgramItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInactive, setShowInactive] = useState(true);
  const [savingId, setSavingId] = useState<number | 'new' | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ProgramFormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchPrograms = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setError(null);
    try {
      const list = await apiService.getAdminPrograms(session.merchantId, session.token);
      setPrograms(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar programas');
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    fetchPrograms();
  }, [fetchPrograms]);

  if (!session) return null;

  const filtered = showInactive ? programs : programs.filter((p) => p.active);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (p: AdminProgramItem) => {
    setEditingId(p.id);
    setForm({
      name: p.name,
      rewardName: p.rewardName ?? '',
      ruleTotalStamps: String(p.ruleTotalStamps ?? 10),
      description: p.description ?? '',
      category: p.category ?? '',
      imageUrl: p.imageUrl ?? '',
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
    const stamps = parseInt(form.ruleTotalStamps, 10);
    if (!Number.isFinite(stamps) || stamps <= 0) {
      setFormError('Carimbos necessários deve ser um número positivo.');
      return;
    }

    setSavingId(editingId ?? 'new');
    setFormError(null);
    try {
      if (editingId == null) {
        const payload: CreateProgramRequest = {
          name: form.name.trim(),
          rewardName: form.rewardName.trim() || undefined,
          ruleTotalStamps: stamps,
          description: form.description.trim() || null,
          category: form.category.trim() || null,
          imageUrl: form.imageUrl.trim() || null,
        };
        await apiService.createProgram(session.merchantId, payload, session.token);
      } else {
        const payload: UpdateProgramRequest = {
          name: form.name.trim(),
          rewardName: form.rewardName.trim() || undefined,
          ruleTotalStamps: stamps,
          description: form.description.trim() || null,
          category: form.category.trim() || null,
          imageUrl: form.imageUrl.trim() || null,
        };
        await apiService.updateProgram(session.merchantId, editingId, payload, session.token);
      }
      closeModal();
      await fetchPrograms();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erro ao salvar.');
    } finally {
      setSavingId(null);
    }
  };

  const toggleActive = async (p: AdminProgramItem) => {
    if (!session) return;
    setSavingId(p.id);
    try {
      await apiService.updateProgram(session.merchantId, p.id, { active: !p.active }, session.token);
      await fetchPrograms();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao alterar status do programa');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <AdminLayout
      title="Programas"
      subtitle="Crie, edite e desative campanhas de fidelidade do merchant ativo."
      role={session.role}
      onLogout={logout}
      headerExtra={
        <>
          <label className="admin-filter-toggle">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
            />
            Mostrar inativos
          </label>
          <button type="button" className="admin-btn admin-btn-primary" onClick={openCreate}>
            + Novo programa
          </button>
        </>
      }
    >
      {error && <div className="admin-error-banner">{error}</div>}

      {loading && <div className="admin-loading">Carregando…</div>}

      {!loading && filtered.length === 0 && (
        <div className="admin-empty">
          {programs.length === 0
            ? 'Nenhum programa cadastrado. Clique em "+ Novo programa" para começar.'
            : 'Nenhum programa ativo. Marque "Mostrar inativos" para ver todos.'}
        </div>
      )}

      {!loading && filtered.map((p) => (
        <AdminCard
          key={p.id}
          dimmed={!p.active}
          title={p.name}
          subtitle={p.description ?? undefined}
          badges={
            <>
              <span className={`admin-card-badge ${p.active ? 'is-active' : 'is-inactive'}`}>
                {p.active ? 'Ativo' : 'Inativo'}
              </span>
              {p.category && <span className="admin-card-badge is-info">{p.category}</span>}
            </>
          }
          meta={
            <>
              <span>🎯 {p.ruleTotalStamps} carimbos</span>
              <span>🎁 {p.rewardName}</span>
            </>
          }
          actions={
            <>
              <button
                type="button"
                className="admin-btn admin-btn-ghost"
                onClick={() => openEdit(p)}
                disabled={savingId === p.id}
              >
                Editar
              </button>
              <button
                type="button"
                className={`admin-btn ${p.active ? 'admin-btn-danger' : 'admin-btn-secondary'}`}
                onClick={() => toggleActive(p)}
                disabled={savingId === p.id}
              >
                {savingId === p.id ? '…' : p.active ? 'Desativar' : 'Ativar'}
              </button>
            </>
          }
        />
      ))}

      <Modal
        open={modalOpen}
        title={editingId == null ? 'Novo programa' : 'Editar programa'}
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
            placeholder="Ex: Café da casa"
            maxLength={120}
          />
        </div>

        <div className="admin-form-row">
          <div className="admin-field">
            <label>Recompensa *</label>
            <input
              type="text"
              value={form.rewardName}
              onChange={(e) => setForm({ ...form, rewardName: e.target.value })}
              placeholder="Ex: Café grátis"
              maxLength={120}
            />
          </div>
          <div className="admin-field">
            <label>Carimbos necessários *</label>
            <input
              type="number"
              min="1"
              value={form.ruleTotalStamps}
              onChange={(e) => setForm({ ...form, ruleTotalStamps: e.target.value })}
            />
          </div>
        </div>

        <div className="admin-field">
          <label>Descrição</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Descrição opcional para o app do cliente"
          />
        </div>

        <div className="admin-form-row">
          <div className="admin-field">
            <label>Categoria</label>
            <input
              type="text"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              placeholder="Ex: bebidas, sobremesas"
              maxLength={50}
            />
          </div>
          <div className="admin-field">
            <label>URL da imagem</label>
            <input
              type="url"
              value={form.imageUrl}
              onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              placeholder="https://…"
            />
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}
