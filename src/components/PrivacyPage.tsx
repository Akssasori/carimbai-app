import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../services/api';
import { readStaffSession } from '../services/staffSession';
import './PrivacyPage.css';

interface Notice { published: boolean; version: string; controllerName: string; controllerDocument: string; contactEmail: string; text: string; pendingDecisions: string[] }
interface Profile { name?: string; phone?: string; email?: string; privacyOfficer: boolean }
interface RequestItem { id: string; type: string; scope: string; status: string; response?: string; details?: string; dueAt?: string }
interface ExportPage { section: string; items: Record<string, unknown>[]; nextAfterId: number | null; redactions: string[] }
const rights = { ACCESS: 'Acesso', CORRECTION: 'Correcao', RESTRICTION: 'Restricao', ERASURE: 'Eliminacao',
  ANONYMIZATION: 'Anonimizacao', PORTABILITY: 'Portabilidade', SHARING_INFORMATION: 'Compartilhamentos',
  CONSENT_WITHDRAWAL: 'Revogacao de consentimento', OTHER: 'Outro direito' };
const sections = ['profile', 'cards', 'stamps', 'rewards', 'sessions', 'recovery', 'push', 'preferences', 'requests', 'audit', 'privacy-events'];

export default function PrivacyPage({ token, staff = false }: { token?: string; staff?: boolean }) {
  const credential = staff ? readStaffSession()?.token : token;
  const kind = staff ? 'staff' : 'customer';
  const [notice, setNotice] = useState<Notice | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [queue, setQueue] = useState<RequestItem[]>([]);
  const [page, setPage] = useState(0);
  const [queuePage, setQueuePage] = useState(0);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [type, setType] = useState('ACCESS');
  const [merchant, setMerchant] = useState('');
  const [scope, setScope] = useState('ACCOUNT');
  const [details, setDetails] = useState('');
  const [section, setSection] = useState('profile');
  const [after, setAfter] = useState(0);
  const [next, setNext] = useState<number | null>(null);
  const [selected, setSelected] = useState('');
  const [action, setAction] = useState('CLAIM');
  const [response, setResponse] = useState('');
  const [evidence, setEvidence] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [preview, setPreview] = useState<Record<string, unknown> | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    apiService.privacy<Notice>('/privacy/notice').then(n => { if (!cancelled) setNotice(n); })
      .catch(() => { if (!cancelled) setError('Aviso indisponivel. Contato: diniz3003@gmail.com'); });
    return () => { cancelled = true; };
  }, []);
  useEffect(() => {
    let cancelled = false;
    if (credential) {
      apiService.privacy<Profile>('/privacy/me/profile', credential, kind).then(p => {
        if (!cancelled) { setProfile(p); setName(p.name ?? ''); setPhone(p.phone ?? ''); }
      }).catch(() => { if (!cancelled) setError('Nao foi possivel carregar seu perfil.'); });
    }
    return () => { cancelled = true; };
  }, [credential, kind]);
  useEffect(() => {
    let cancelled = false;
    if (credential) apiService.privacy<RequestItem[]>(`/privacy/me/requests?page=${page}&size=20`, credential, kind)
      .then(r => { if (!cancelled) setRequests(r); }).catch(() => { if (!cancelled) setError('Nao foi possivel consultar os protocolos.'); });
    return () => { cancelled = true; };
  }, [credential, kind, page]);
  useEffect(() => {
    let cancelled = false;
    if (credential && profile?.privacyOfficer) apiService.privacy<RequestItem[]>(`/privacy/admin/requests?page=${queuePage}&size=20`, credential, kind)
      .then(r => { if (!cancelled) setQueue(r); }).catch(() => { if (!cancelled) setError('Fila de atendimento indisponivel.'); });
    return () => { cancelled = true; };
  }, [credential, kind, profile?.privacyOfficer, queuePage]);

  async function run(operation: () => Promise<void>) {
    if (busy) return;
    setBusy(true); setError(''); setMessage('');
    try { await operation(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Operacao indisponivel.'); }
    finally { setBusy(false); }
  }
  async function refreshRequests() {
    setRequests(await apiService.privacy<RequestItem[]>(`/privacy/me/requests?page=${page}&size=20`, credential, kind));
  }
  async function download() {
    const data = await apiService.privacy<ExportPage>(`/privacy/me/export?section=${section}&after=${after}&limit=100`, credential, kind);
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = `carimbai-${section}-apos-${after}.json`; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNext(data.nextAfterId);
    setMessage(data.nextAfterId === null ? 'Ultima pagina desta secao exportada.' : 'Esta secao tem mais registros. Exporte a proxima pagina.');
  }
  return <main className="privacy-page">
    <h1>Privacidade e Meus Dados</h1>
    <nav><Link to="/">Inicio</Link> | <Link to={staff ? '/privacidade' : '/staff/privacy'}>{staff ? 'Area do cliente' : 'Area do lojista'}</Link></nav>
    {error && <p role="alert">{error}</p>}
    {message && <p role="status">{message}</p>}
    {notice && <section>
      <h2>{notice.published ? 'Aviso de privacidade' : 'Rascunho: nao publicado nem aprovado'}</h2>
      <p>{notice.controllerName} | {notice.controllerDocument} | Versao: {notice.version}</p>
      <p>Canal de atendimento: <a href={`mailto:${notice.contactEmail}`}>{notice.contactEmail}</a></p>
      <pre>{notice.text}</pre>
      {!notice.published && <ul>{notice.pendingDecisions.map(item => <li key={item}>{item}</li>)}</ul>}
    </section>}
    {!credential && <p>Entre na sua conta para consultar seus dados e protocolos. Se nao conseguir acessar, use o canal de atendimento acima.</p>}
    {credential && profile && <>
      <section><h2>Seu Perfil</h2><p>{profile.email}</p>
        {!staff && <form onSubmit={event => { event.preventDefault(); void run(async () => {
          const updated = await apiService.privacy<Profile>('/privacy/me/profile', credential, kind, 'PATCH', { name, phone });
          setProfile(updated); setMessage('Perfil corrigido. A nova informacao sera usada no proximo acesso.');
        }); }}>
          <label>Nome<input value={name} onChange={e => setName(e.target.value)} required maxLength={120} /></label>
          <label>Telefone (opcional)<input value={phone} onChange={e => setPhone(e.target.value)} maxLength={30} /></label>
          <button disabled={busy}>Corrigir perfil</button>
        </form>}
        <p>Alteracao de e-mail, vinculo social ou identidade de funcionario exige pedido verificado. Nao envie senhas ou documentos neste formulario.</p>
      </section>
      <section><h2>Exportacao Segura</h2>
        <p>Baixe cada secao em paginas de ate 100 registros. Credenciais, dados de terceiros e arquivos externos nao sao incluidos. Para acesso complementar, abra um protocolo. O arquivo pode conter dados pessoais: proteja-o em dispositivos compartilhados.</p>
        <label htmlFor="privacy-section">Secao</label><select id="privacy-section" value={section} onChange={e => { setSection(e.target.value); setAfter(0); setNext(null); }}>{sections.map(s => <option key={s}>{s}</option>)}</select>
        <button disabled={busy} onClick={() => void run(download)}>Exportar pagina apos {after}</button>
        <button disabled={busy || next === null} onClick={() => { if (next !== null) { setAfter(next); setNext(null); } }}>Proxima pagina</button>
        <button disabled={busy} onClick={() => { setAfter(0); setNext(null); }}>Reiniciar secao</button>
      </section>
      {!staff && <section><h2>Notificacoes Opcionais</h2><p>Avisos de atualizacao dos cartoes, sem publicidade. Desativar nao impede o uso dos cartoes.</p>
        <button disabled={busy} onClick={() => void run(async () => {
          await apiService.privacy('/notifications/subscriptions', credential, kind, 'DELETE');
          const registration = 'serviceWorker' in navigator ? await navigator.serviceWorker.getRegistration() : undefined;
          const subscription = await registration?.pushManager.getSubscription(); await subscription?.unsubscribe();
          setMessage('Notificacoes desativadas para sua conta em todos os dispositivos.');
        })}>Retirar escolha e desativar notificacoes</button>
      </section>}
      <section><h2>Solicitar Um Direito</h2>
        <form onSubmit={event => { event.preventDefault(); void run(async () => {
          const created = await apiService.privacy<RequestItem>('/privacy/me/requests', credential, kind, 'POST',
            { type, scope, ...(scope === 'MERCHANT' ? { merchantId: Number(merchant) } : {}), details });
          setMessage(`Pedido recebido. Protocolo: ${created.id}. O atendimento pode exigir verificacao proporcional e analise de conservacao.`);
          setDetails(''); await refreshRequests();
        }); }}>
          <label htmlFor="privacy-right">Direito</label><select id="privacy-right" value={type} onChange={e => setType(e.target.value)}>{Object.entries(rights).map(([key, label]) => <option value={key} key={key}>{label}</option>)}</select>
          <label htmlFor="privacy-scope">Alcance</label><select id="privacy-scope" value={scope} onChange={e => setScope(e.target.value)}><option value="ACCOUNT">Conta inteira</option><option value="MERCHANT">Uma loja com vinculo</option></select>
          {scope === 'MERCHANT' && <label>Numero da loja<input type="number" min="1" step="1" value={merchant} onChange={e => setMerchant(e.target.value)} required /></label>}
          <label>Descricao sem senhas ou documentos<textarea maxLength={1000} value={details} onChange={e => setDetails(e.target.value)} /></label>
          <button disabled={busy}>Registrar pedido</button>
        </form>
        <p>Restricao ou eliminacao nao e imediata. A conta inteira e os dados de uma loja tem alcances diferentes. Conservacao obrigatoria pode limitar a medida, com justificativa. A medida sobre a conta inteira encerra o acesso; nesse caso, acompanhe o pedido pelo canal de atendimento.</p>
        <h3>Seus Protocolos</h3>
        <ul>{requests.map(r => <li key={r.id}><code>{r.id}</code> | {r.type} | {r.scope} | {r.status}{r.dueAt && <p>Prazo informado: {new Date(r.dueAt).toLocaleString()}</p>}{r.response && <p>{r.response}</p>}</li>)}</ul>
        <button disabled={busy || page === 0} onClick={() => setPage(page - 1)}>Anteriores</button>
        <button disabled={busy || requests.length < 20} onClick={() => setPage(page + 1)}>Proximos</button>
        <button disabled={busy} onClick={() => void run(refreshRequests)}>Atualizar</button>
      </section>
      {staff && profile.privacyOfficer && <section><h2>Atendimento Restrito</h2>
        <p>Acesso exclusivo a pessoa designada. Referencias de evidencia devem apontar para repositorio restrito, sem dados pessoais no identificador.</p>
        <ul>{queue.map(r => <li key={r.id}><button disabled={busy} onClick={() => void run(async () => {
          setSelected(r.id); setPreview(await apiService.privacy<Record<string, unknown>>(`/privacy/admin/requests/${r.id}/preview`, credential, kind));
        })}>{r.id}</button> {r.type} | {r.scope} | {r.status}<p>{r.details}</p></li>)}</ul>
        <button disabled={busy || queuePage === 0} onClick={() => setQueuePage(queuePage - 1)}>Anteriores</button>
        <button disabled={busy || queue.length < 20} onClick={() => setQueuePage(queuePage + 1)}>Proximos</button>
        {preview && <pre>{JSON.stringify(preview, null, 2)}</pre>}
        {selected && <form onSubmit={event => { event.preventDefault(); void run(async () => {
          await apiService.privacy(`/privacy/admin/requests/${selected}/review`, credential, kind, 'POST',
            action === 'CLAIM' ? { action, ...(dueAt ? { dueAt: new Date(dueAt).toISOString() } : {}) }
              : { action, response, evidenceRef: evidence, confirmation });
          setQueue(await apiService.privacy<RequestItem[]>(`/privacy/admin/requests?page=${queuePage}&size=20`, credential, kind));
          setMessage('Analise registrada. APPLIED_LOCALLY nao comprova conclusao em backups ou fornecedores.');
        }); }}>
          <label htmlFor="privacy-review-action">Acao</label><select id="privacy-review-action" value={action} onChange={e => setAction(e.target.value)}>{['CLAIM', 'RESPOND', 'REJECT', 'RESTRICT', 'ERASE', 'COMPLETE'].map(a => <option key={a} disabled={['ERASE', 'RESTRICT'].includes(a) && preview?.destructiveActionsEnabled !== true}>{a}</option>)}</select>
          <label>Resposta ao titular<textarea maxLength={2000} value={response} onChange={e => setResponse(e.target.value)} required={action !== 'CLAIM'} /></label>
          {action === 'CLAIM' && <label>Prazo avaliado para o pedido<input type="datetime-local" value={dueAt} onChange={e => setDueAt(e.target.value)} /></label>}
          <label>Referencia de evidencia<input maxLength={200} value={evidence} onChange={e => setEvidence(e.target.value)} required={action !== 'CLAIM'} /></label>
          <label>Confirmacao de alcance para medida destrutiva<input maxLength={60} value={confirmation} onChange={e => setConfirmation(e.target.value)} /></label>
          <button disabled={busy}>Registrar analise</button>
        </form>}
      </section>}
    </>}
  </main>;
}
