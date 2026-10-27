import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const origin = process.env.PRIVACY_TEST_ORIGIN || 'http://127.0.0.1:5176';
const browser = await chromium.launch({ channel: process.env.PRIVACY_TEST_BROWSER || 'msedge', headless: true });
const protocol = '11111111-1111-4111-8111-111111111111';
const notice = { published: false, version: 'draft-test', controllerName: 'Responsavel pendente', controllerDocument: '00.000.000/0000-00 (FICTICIO)',
  contactEmail: 'test@example.test', text: 'RASCUNHO DE TESTE', pendingDecisions: ['RETENTION'] };
let scenarios = 0;
async function setup(mode) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, acceptDownloads: true });
  const calls = [], external = [], requests = [];
  await context.addInitScript(mode => {
    if (mode === 'customer') sessionStorage.setItem('carimbai_customer', JSON.stringify({ customerId: 1, token: 'customer-test-token' }));
    if (mode === 'staff') localStorage.setItem('carimbai_staff_session', JSON.stringify({ staffId: 2, merchantId: 1,
      token: 'staff-test-token', role: 'ADMIN', refreshToken: 'test-only', expiresAt: Date.now() + 60000 }));
  }, mode);
  await context.route('**/*', async route => {
    const req = route.request(), url = new URL(req.url()), path = url.pathname.replace(/^\/api/, '');
    if (url.pathname.startsWith('/api/')) {
      const body = req.postDataJSON();
      calls.push({ path, method: req.method(), body, authorization: req.headers().authorization, search: url.search });
      let data = {}, status = 200;
      if (path === '/privacy/notice') data = notice;
      else if (path === '/privacy/me/profile') data = { subjectType: mode === 'staff' ? 'STAFF' : 'CUSTOMER', id: 1, name: body?.name || 'Cliente de teste',
        phone: body?.phone || '', email: 'test@example.test', privacyOfficer: mode === 'staff' };
      else if (path === '/privacy/me/requests' && req.method() === 'POST') { data = { id: protocol, ...body, status: 'RECEIVED' }; requests.push(data); status = 201; }
      else if (path === '/privacy/me/requests') data = requests;
      else if (path === '/privacy/me/export') data = { section: url.searchParams.get('section'), items: [{ id: 1 }], nextAfterId: url.searchParams.get('after') === '0' ? 1 : null, redactions: ['CREDENTIALS'] };
      else if (path === '/privacy/admin/requests') data = [{ id: protocol, type: 'ERASURE', scope: 'ACCOUNT', status: 'RECEIVED', details: 'Pedido de teste' }];
      else if (path.endsWith('/preview')) data = { protocol, destructiveActionsEnabled: false, dryRun: true };
      else if (path.endsWith('/review')) { if (body.action === 'CLAIM' && body.evidenceRef === '') status = 400; data = { id: protocol, status: 'IN_REVIEW' }; }
      else if (path === '/notifications/subscriptions') status = 204;
      else if (path === '/notifications/preferences') data = { enabled: false };
      else { status = 404; }
      await route.fulfill({ status, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Headers': 'Authorization,Content-Type', 'Access-Control-Allow-Methods': 'GET,POST,PATCH,PUT,DELETE,OPTIONS' },
        ...(status === 204 ? {} : { body: JSON.stringify(data) }) });
    } else if (url.origin === origin) await route.continue();
    else { external.push(req.url()); await route.abort(); }
  });
  return { context, page: await context.newPage(), calls, external };
}
try {
  const anonymous = await setup('anonymous');
  await anonymous.page.goto(origin + '/privacidade');
  await anonymous.page.getByRole('heading', { name: 'Rascunho: nao publicado nem aprovado' }).waitFor();
  assert.equal(await anonymous.page.getByRole('button', { name: 'Registrar pedido' }).count(), 0);
  await anonymous.page.goto(origin + '/');
  await anonymous.page.getByRole('heading', { name: 'Entre para acessar' }).waitFor();
  assert.equal(anonymous.external.some(url => /accounts\.google|facebook|fonts\.google/.test(url)), false);
  await anonymous.context.close(); scenarios++;

  const customer = await setup('customer');
  await customer.page.goto(origin + '/privacidade');
  await customer.page.getByLabel('Nome', { exact: true }).fill('Nome corrigido');
  await customer.page.getByRole('button', { name: 'Corrigir perfil' }).click();
  await customer.page.getByRole('status').filter({ hasText: 'Perfil corrigido' }).waitFor();
  assert.deepEqual(customer.calls.find(c => c.method === 'PATCH').body, { name: 'Nome corrigido', phone: '' });
  await customer.page.getByLabel('Descricao sem senhas ou documentos').fill('Pedido de acesso de teste');
  await customer.page.getByRole('button', { name: 'Registrar pedido' }).click();
  await customer.page.getByRole('status').filter({ hasText: 'Pedido recebido' }).waitFor();
  assert.equal(customer.calls.find(c => c.path === '/privacy/me/requests' && c.method === 'POST').authorization, 'Bearer customer-test-token');
  let download = customer.page.waitForEvent('download');
  await customer.page.getByRole('button', { name: 'Exportar pagina apos 0' }).click();
  assert.equal((await download).suggestedFilename(), 'carimbai-profile-apos-0.json');
  await customer.page.getByRole('button', { name: 'Proxima pagina', exact: true }).click();
  download = customer.page.waitForEvent('download');
  await customer.page.getByRole('button', { name: 'Exportar pagina apos 1' }).click();
  await download;
  await customer.page.getByRole('status').filter({ hasText: 'Ultima pagina' }).waitFor();
  assert.equal(await customer.page.getByRole('button', { name: 'Proxima pagina', exact: true }).isDisabled(), true);
  await customer.page.getByRole('button', { name: 'Retirar escolha e desativar notificacoes' }).click();
  await customer.page.getByRole('status').filter({ hasText: 'todos os dispositivos' }).waitFor();
  assert.equal(customer.calls.some(c => c.path === '/notifications/subscriptions' && c.method === 'DELETE'), true);
  const saved = await customer.page.evaluate(() => ({ persistent: localStorage.getItem('carimbai_customer'), temporary: JSON.parse(sessionStorage.getItem('carimbai_customer')) }));
  assert.equal(saved.persistent, null); assert.deepEqual(Object.keys(saved.temporary).sort(), ['customerId', 'token']);
  if (process.env.PRIVACY_TEST_SCREENSHOT) await customer.page.screenshot({ path: process.env.PRIVACY_TEST_SCREENSHOT, fullPage: true });
  await customer.context.close(); scenarios++;

  const staff = await setup('staff');
  await staff.page.goto(origin + '/staff/privacy');
  await staff.page.getByRole('heading', { name: 'Atendimento Restrito' }).waitFor();
  await staff.page.getByRole('button', { name: protocol, exact: true }).click();
  await staff.page.getByLabel('Acao', { exact: true }).waitFor();
  assert.equal(await staff.page.getByRole('option', { name: 'ERASE', exact: true }).isDisabled(), true);
  await staff.page.getByRole('button', { name: 'Registrar analise' }).click();
  await staff.page.getByRole('status').filter({ hasText: 'Analise registrada' }).waitFor();
  assert.deepEqual(staff.calls.find(c => c.path.endsWith('/review')).body, { action: 'CLAIM' });
  await staff.context.close(); scenarios++;
  console.log('Privacy browser smoke: ' + scenarios + ' scenarios passed (mocked API, no live providers).');
} finally { await browser.close(); }
