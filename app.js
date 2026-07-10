const STORAGE_KEY = 'projetoia_free_v1';
const QUESTIONS = [
  { key: 'problem', question: 'Qual problema ou necessidade motivou este projeto? Conte o que acontece hoje e por que isso precisa mudar.' },
  { key: 'audience', question: 'Quem será beneficiado? Descreva o público, a faixa etária e, se souber, a quantidade aproximada de pessoas.' },
  { key: 'territory', question: 'Onde o projeto acontecerá? Fale sobre a cidade, o bairro, a comunidade ou o território.' },
  { key: 'objective', question: 'Qual é o principal objetivo do projeto? Comece com um verbo, como promover, ampliar, formar, preservar ou fortalecer.' },
  { key: 'activities', question: 'Quais atividades serão realizadas para alcançar esse objetivo? Você pode separar oficinas, encontros, apresentações e outras ações por vírgulas.' },
  { key: 'results', question: 'Quais resultados concretos você espera alcançar? Inclua números ou metas sempre que possível.' },
  { key: 'duration', question: 'Quanto tempo o projeto durará e como as principais etapas serão distribuídas?' },
  { key: 'team', question: 'Quem fará parte da equipe e quais serão as principais responsabilidades?' },
  { key: 'partners', question: 'Existem parceiros, espaços ou instituições que podem apoiar o projeto? Se ainda não houver, responda “não definido”.' }
];

const pages = [...document.querySelectorAll('.page')];
const dialog = document.querySelector('#project-dialog');
const projectForm = document.querySelector('#project-form');
const toast = document.querySelector('#toast');
const chatForm = document.querySelector('#chat-form');
const chatInput = document.querySelector('#chat-input');
const chatSubmit = chatForm.querySelector('button[type="submit"]');
const workspace = document.querySelector('.workspace');
let projectFilter = 'all';
let searchTerm = '';
let state = loadState();

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && Array.isArray(saved.projects)) return saved;
  } catch (error) {}
  return { projects: [], activeId: null };
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    showToast('O navegador não permitiu salvar neste aparelho.');
  }
}

function navigate(route) {
  pages.forEach(page => page.classList.toggle('active', page.id === `page-${route}`));
  document.querySelectorAll('.nav-item,.bottom-nav button').forEach(button => button.classList.toggle('active', button.dataset.route === route));
  window.scrollTo({ top: 0, behavior: 'smooth' });
  history.replaceState(null, '', `#${route}`);
  if (route === 'projetos' || route === 'inicio') renderProjectLists();
  if (route === 'assistente') renderWorkspace();
}

function activeProject() {
  return state.projects.find(project => project.id === state.activeId) || null;
}

function createProject(name, area) {
  const project = {
    id: globalThis.crypto?.randomUUID?.() || `project-${Date.now()}`,
    name: name.trim(),
    area,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    step: 0,
    answers: {},
    notes: [],
    budget: [{ id: `budget-${Date.now()}`, item: '', quantity: 1, unit: 'unidade', unitPrice: 0 }],
    messages: [
      { type: 'user', text: `Quero criar o projeto “${name.trim()}”, na área de ${area}.` },
      { type: 'ai', text: QUESTIONS[0].question }
    ]
  };
  state.projects.unshift(project);
  state.activeId = project.id;
  saveState();
  return project;
}

function openProject(id) {
  const project = state.projects.find(item => item.id === id);
  if (!project) return;
  state.activeId = id;
  saveState();
  navigate('assistente');
  workspace.classList.remove('show-document');
  showToast(`${project.name} aberto`);
}

function deleteProject(id) {
  const project = state.projects.find(item => item.id === id);
  if (!project || !confirm(`Excluir “${project.name}” deste aparelho?`)) return;
  state.projects = state.projects.filter(item => item.id !== id);
  if (state.activeId === id) state.activeId = null;
  saveState();
  renderProjectLists();
  renderWorkspace();
  showToast('Projeto excluído.');
}

function processAnswer(value) {
  const project = activeProject();
  if (!project) return;
  project.messages.push({ type: 'user', text: value });

  if (project.step < QUESTIONS.length) {
    const current = QUESTIONS[project.step];
    project.answers[current.key] = value;
    project.step += 1;
    if (project.step < QUESTIONS.length) {
      project.messages.push({ type: 'ai', text: responseForStep(project.step) });
    } else {
      project.messages.push({ type: 'ai', text: 'Entrevista concluída! Organizei seu projeto ao lado. Agora revise o texto e preencha o orçamento. Você também pode continuar escrevendo observações aqui.' });
    }
  } else {
    project.notes.push(value);
    project.messages.push({ type: 'ai', text: 'Observação adicionada ao projeto. Ela aparecerá na seção de notas para sua revisão.' });
  }

  project.updatedAt = new Date().toISOString();
  saveState();
  renderWorkspace();
  renderProjectLists();
}

function responseForStep(step) {
  const bridges = [
    'Entendi o contexto. Agora vamos definir as pessoas no centro do projeto.',
    'Ótimo. Conhecer o território ajuda a tornar a proposta mais concreta.',
    'Perfeito. Agora vamos transformar essa necessidade em um objetivo claro.',
    'Objetivo registrado. Vamos mostrar como ele será colocado em prática.',
    'As atividades já dão forma ao projeto. Agora precisamos definir os resultados.',
    'Metas registradas. Vamos organizar o tempo de execução.',
    'Cronograma encaminhado. Agora precisamos apresentar quem realizará o trabalho.',
    'Equipe registrada. Falta apenas mapear os apoios e parcerias.'
  ];
  return `${bridges[Math.max(0, step - 1)] || 'Vamos continuar.'}\n\n${QUESTIONS[step].question}`;
}

function renderWorkspace() {
  const project = activeProject();
  const messages = document.querySelector('#messages');
  const preview = document.querySelector('#document-preview');
  const title = document.querySelector('#document-title');
  const exportButton = document.querySelector('#export-project');

  if (!project) {
    messages.innerHTML = '<div class="message ai"><span>✦</span><div><p>O modo gratuito está pronto. Crie ou abra um projeto e eu conduzirei uma entrevista passo a passo.</p></div></div><div class="suggestions"><button data-action="new-project">Criar meu primeiro projeto</button></div>';
    preview.className = 'empty-document';
    preview.innerHTML = '<span>✦</span><h3>A ideia ganha forma enquanto conversamos</h3><p>Suas respostas serão organizadas em resumo, justificativa, objetivos, metodologia, cronograma e orçamento.</p>';
    title.textContent = 'Seu projeto aparece aqui';
    chatInput.disabled = true;
    chatSubmit.disabled = true;
    exportButton.disabled = true;
    return;
  }

  messages.innerHTML = project.messages.map(message => messageMarkup(message)).join('');
  if (project.step < QUESTIONS.length) {
    messages.insertAdjacentHTML('beforeend', `<div class="interview-progress"><span style="width:${Math.round((project.step / QUESTIONS.length) * 100)}%"></span></div><small class="step-label">Etapa ${project.step + 1} de ${QUESTIONS.length}</small>`);
  }
  messages.scrollTop = messages.scrollHeight;
  chatInput.disabled = false;
  chatSubmit.disabled = false;
  chatInput.placeholder = project.step < QUESTIONS.length ? 'Responda com suas palavras...' : 'Adicione uma observação ao projeto...';
  title.textContent = project.name;
  exportButton.disabled = false;
  renderDocument(project);
}

function messageMarkup(message) {
  const text = escapeHtml(message.text).replace(/\n/g, '<br>');
  return `<div class="message ${message.type}">${message.type === 'ai' ? '<span>✦</span>' : ''}<div><p>${text}</p></div></div>`;
}

function renderDocument(project) {
  const preview = document.querySelector('#document-preview');
  const score = qualityScore(project);
  const answers = project.answers;
  const activities = splitItems(answers.activities);
  const budgetRows = project.budget.map((row, index) => budgetRowMarkup(row, index)).join('');
  const total = budgetTotal(project);

  preview.className = 'document-content';
  preview.innerHTML = `
    <div class="document-summary">
      <div><span class="eyebrow">PROJETO EM CONSTRUÇÃO</span><h2>${escapeHtml(project.name)}</h2><p><strong>Área:</strong> ${escapeHtml(project.area)}</p></div>
      <div class="score-card"><strong id="quality-score">${score}</strong><span>qualidade</span></div>
    </div>
    <div class="quality-check"><span style="width:${score}%"></span></div>
    <p class="quality-hint">${qualityHint(project)}</p>
    ${documentSection('Resumo do projeto', buildSummary(project))}
    ${documentSection('Justificativa', answers.problem ? `O projeto surge diante de ${escapeHtml(sentence(answers.problem))} A iniciativa será desenvolvida ${escapeHtml(clause(locationPhrase(answers.territory) || 'em território ainda não definido'))} e terá como público prioritário ${escapeHtml(clause(cleanAudience(answers.audience) || 'público ainda não definido'))}.` : '')}
    ${documentSection('Objetivo geral', escapeHtml(answers.objective || ''))}
    ${documentSection('Atividades e metodologia', activities.length ? `A execução será participativa e organizada nas seguintes ações:<ul>${activities.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>${answers.team ? `<p><strong>Equipe:</strong> ${escapeHtml(answers.team)}</p>` : ''}` : '')}
    ${documentSection('Resultados e metas', escapeHtml(answers.results || ''))}
    ${documentSection('Cronograma', escapeHtml(answers.duration || ''))}
    ${documentSection('Parcerias', escapeHtml(answers.partners || ''))}
    <section class="generated-section budget-section">
      <div class="section-edit-heading"><h3>Orçamento editável</h3><button class="small-button" data-action="add-budget">＋ Adicionar item</button></div>
      <div class="budget-scroll"><table class="budget-table"><thead><tr><th>Item</th><th>Qtd.</th><th>Unidade</th><th>Valor unitário</th><th>Total</th><th></th></tr></thead><tbody>${budgetRows}</tbody></table></div>
      <div class="budget-total">Total estimado <strong id="budget-total">${formatCurrency(total)}</strong></div>
      <small>Use valores da sua região. Os cálculos são feitos automaticamente.</small>
    </section>
    ${project.notes.length ? documentSection('Observações', `<ul>${project.notes.map(note => `<li>${escapeHtml(note)}</li>`).join('')}</ul>`) : ''}
    <section class="privacy-note"><strong>Modo gratuito:</strong> este conteúdo foi organizado por regras e modelos de escrita. Revise as informações antes de enviar a um edital.</section>`;
}

function documentSection(title, content) {
  const filled = Boolean(content);
  return `<section class="generated-section ${filled ? 'filled' : 'pending'}"><h3>${title}</h3>${filled ? `<div>${content}</div>` : '<p>Será preenchido durante a entrevista.</p>'}</section>`;
}

function buildSummary(project) {
  const a = project.answers;
  if (!a.objective && !a.audience) return '';
  return `${escapeHtml(project.name)} é uma iniciativa na área de ${escapeHtml(project.area.toLowerCase())} que pretende ${escapeHtml(lowerFirst(sentence(a.objective || 'desenvolver ações de impacto social')))} O projeto será direcionado a ${escapeHtml(clause(cleanAudience(a.audience) || 'público a ser definido'))} e realizado ${escapeHtml(clause(locationPhrase(a.territory) || 'em território a ser definido'))}.`;
}

function budgetRowMarkup(row, index) {
  const total = numberValue(row.quantity) * numberValue(row.unitPrice);
  return `<tr data-budget-row="${row.id}">
    <td><input aria-label="Item ${index + 1}" data-budget-field="item" value="${escapeAttribute(row.item)}" placeholder="Ex.: Educador" /></td>
    <td><input aria-label="Quantidade ${index + 1}" data-budget-field="quantity" type="number" min="0" step="1" value="${numberValue(row.quantity)}" /></td>
    <td><input aria-label="Unidade ${index + 1}" data-budget-field="unit" value="${escapeAttribute(row.unit)}" /></td>
    <td><input aria-label="Valor unitário ${index + 1}" data-budget-field="unitPrice" type="number" min="0" step="0.01" value="${numberValue(row.unitPrice)}" /></td>
    <td class="row-total">${formatCurrency(total)}</td>
    <td><button aria-label="Remover item ${index + 1}" class="remove-budget" data-remove-budget="${row.id}">×</button></td>
  </tr>`;
}

function renderProjectLists() {
  const dashboard = document.querySelector('#dashboard-projects');
  const list = document.querySelector('#project-list');
  const projects = [...state.projects].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  if (dashboard) {
    dashboard.innerHTML = projects.slice(0, 2).map(projectCardMarkup).join('') + '<button class="new-card" data-action="new-project"><span>＋</span><strong>Novo projeto</strong><small>Comece por uma ideia</small></button>';
  }

  if (list) {
    const visible = projects.filter(project => {
      const ready = project.step >= QUESTIONS.length;
      const matchesFilter = projectFilter === 'all' || (projectFilter === 'ready' ? ready : !ready);
      const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesFilter && matchesSearch;
    });
    list.innerHTML = visible.length ? visible.map(projectListMarkup).join('') : '<div class="empty-projects"><span>✦</span><h3>Nenhum projeto por aqui</h3><p>Crie uma ideia e responda à entrevista guiada.</p><button class="primary-button" data-action="new-project">Criar projeto</button></div>';
  }

  const readyCount = projects.filter(project => project.step >= QUESTIONS.length).length;
  setText('#count-all', projects.length);
  setText('#count-draft', projects.length - readyCount);
  setText('#count-ready', readyCount);
}

function projectCardMarkup(project) {
  const score = qualityScore(project);
  const summary = project.answers.objective || 'Continue a entrevista para desenvolver esta ideia.';
  return `<article class="project-card" data-project-id="${project.id}">
    <div class="project-top"><span class="tag coral">${escapeHtml(project.area)}</span><span>${project.step >= QUESTIONS.length ? '✓' : `${project.step}/${QUESTIONS.length}`}</span></div>
    <h3>${escapeHtml(project.name)}</h3><p>${escapeHtml(summary)}</p>
    <div class="quality"><span>Qualidade do projeto</span><strong>${score}</strong></div>
    <div class="progress"><span style="width:${score}%"></span></div>
    <div class="project-footer"><span>${relativeDate(project.updatedAt)}</span><span class="people"><i>JB</i></span></div>
  </article>`;
}

function projectListMarkup(project) {
  const score = qualityScore(project);
  return `<div class="list-project">
    <button class="project-open" data-project-id="${project.id}"><span class="project-glyph green">${escapeHtml(project.name.charAt(0).toUpperCase())}</span><span><strong>${escapeHtml(project.name)}</strong><small>${escapeHtml(project.area)} · ${project.step >= QUESTIONS.length ? 'Entrevista concluída' : `Etapa ${project.step + 1} de ${QUESTIONS.length}`}</small></span><span class="list-score"><b>${score}%</b><small>qualidade</small></span><span>→</span></button>
    <button class="delete-project" data-delete-project="${project.id}" aria-label="Excluir ${escapeAttribute(project.name)}">×</button>
  </div>`;
}

function qualityScore(project) {
  const completed = QUESTIONS.filter(question => String(project.answers[question.key] || '').trim().length >= 3).length;
  const hasBudget = project.budget.some(row => row.item.trim() && numberValue(row.unitPrice) > 0);
  return Math.min(100, Math.round((completed / QUESTIONS.length) * 90) + (hasBudget ? 10 : 0));
}

function qualityHint(project) {
  const missing = QUESTIONS.find(question => !String(project.answers[question.key] || '').trim());
  if (missing) return `Próximo passo: ${missing.question}`;
  if (!project.budget.some(row => row.item.trim() && numberValue(row.unitPrice) > 0)) return 'Entrevista concluída. Preencha pelo menos um item do orçamento para chegar a 100 pontos.';
  return 'Projeto completo no modo gratuito. Faça uma revisão final antes de enviar.';
}

function addBudgetRow() {
  const project = activeProject();
  if (!project) return;
  project.budget.push({ id: `budget-${Date.now()}`, item: '', quantity: 1, unit: 'unidade', unitPrice: 0 });
  project.updatedAt = new Date().toISOString();
  saveState();
  renderDocument(project);
}

function removeBudgetRow(id) {
  const project = activeProject();
  if (!project) return;
  project.budget = project.budget.filter(row => row.id !== id);
  if (!project.budget.length) project.budget.push({ id: `budget-${Date.now()}`, item: '', quantity: 1, unit: 'unidade', unitPrice: 0 });
  project.updatedAt = new Date().toISOString();
  saveState();
  renderDocument(project);
}

function updateBudgetInput(input) {
  const project = activeProject();
  const rowElement = input.closest('[data-budget-row]');
  const row = project?.budget.find(item => item.id === rowElement?.dataset.budgetRow);
  if (!row) return;
  const field = input.dataset.budgetField;
  row[field] = field === 'quantity' || field === 'unitPrice' ? numberValue(input.value) : input.value;
  project.updatedAt = new Date().toISOString();
  saveState();
  const rowTotal = rowElement.querySelector('.row-total');
  if (rowTotal) rowTotal.textContent = formatCurrency(numberValue(row.quantity) * numberValue(row.unitPrice));
  setText('#budget-total', formatCurrency(budgetTotal(project)));
  setText('#quality-score', qualityScore(project));
}

function budgetTotal(project) {
  return project.budget.reduce((sum, row) => sum + numberValue(row.quantity) * numberValue(row.unitPrice), 0);
}

function exportProject() {
  const project = activeProject();
  if (!project) return;
  const a = project.answers;
  const budgetRows = project.budget.filter(row => row.item.trim()).map(row => `<tr><td>${escapeHtml(row.item)}</td><td>${row.quantity}</td><td>${escapeHtml(row.unit)}</td><td>${formatCurrency(row.unitPrice)}</td><td>${formatCurrency(numberValue(row.quantity) * numberValue(row.unitPrice))}</td></tr>`).join('');
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(project.name)}</title><style>body{font-family:Arial,sans-serif;line-height:1.55;color:#173b34;max-width:800px;margin:40px auto}h1{color:#165c4a}h2{margin-top:28px;border-bottom:1px solid #ddd;padding-bottom:6px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ccc;padding:8px;text-align:left}.note{background:#f3f5f1;padding:12px}</style></head><body><h1>${escapeHtml(project.name)}</h1><p><strong>Área:</strong> ${escapeHtml(project.area)}</p><h2>Resumo</h2><p>${buildSummary(project)}</p><h2>Justificativa</h2><p>${escapeHtml(a.problem || '')}</p><p><strong>Público:</strong> ${escapeHtml(a.audience || '')}</p><p><strong>Território:</strong> ${escapeHtml(a.territory || '')}</p><h2>Objetivo geral</h2><p>${escapeHtml(a.objective || '')}</p><h2>Atividades e metodologia</h2><p>${escapeHtml(a.activities || '')}</p><p><strong>Equipe:</strong> ${escapeHtml(a.team || '')}</p><h2>Resultados e metas</h2><p>${escapeHtml(a.results || '')}</p><h2>Cronograma</h2><p>${escapeHtml(a.duration || '')}</p><h2>Parcerias</h2><p>${escapeHtml(a.partners || '')}</p><h2>Orçamento</h2><table><thead><tr><th>Item</th><th>Quantidade</th><th>Unidade</th><th>Valor unitário</th><th>Total</th></tr></thead><tbody>${budgetRows}</tbody></table><p><strong>Total: ${formatCurrency(budgetTotal(project))}</strong></p><p class="note">Documento organizado pelo modo gratuito do ProjetoIA. Revise antes de enviar.</p></body></html>`;
  const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${slug(project.name)}.doc`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  showToast('Documento exportado.');
}

function splitItems(value = '') {
  return value.split(/[,;\n]+/).map(item => item.trim()).filter(Boolean);
}

function sentence(value = '') {
  const text = String(value).trim();
  if (!text) return '';
  return /[.!?]$/.test(text) ? text : `${text}.`;
}

function cleanAudience(value = '') {
  return String(value).trim().replace(/^(serão beneficiad[oa]s?|o projeto beneficiará|beneficiará)\s*/i, '');
}

function cleanTerritory(value = '') {
  return String(value).trim().replace(/^(o projeto acontecerá|o projeto será realizado|acontecerá|será realizado)\s*/i, '').replace(/^no\s+/i, 'no ');
}

function locationPhrase(value = '') {
  const location = cleanTerritory(value);
  if (!location) return '';
  return /^(em|no|na|nos|nas)\b/i.test(location) ? location : `em ${location}`;
}

function lowerFirst(value = '') {
  return value ? value.charAt(0).toLowerCase() + value.slice(1) : value;
}

function clause(value = '') {
  return String(value).trim().replace(/[.!?]+$/, '');
}

function numberValue(value) {
  const number = Number(String(value ?? 0).replace(',', '.'));
  return Number.isFinite(number) ? number : 0;
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(numberValue(value));
}

function relativeDate(date) {
  const days = Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
  return days <= 0 ? 'Atualizado hoje' : days === 1 ? 'Atualizado ontem' : `Atualizado há ${days} dias`;
}

function slug(value) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'projeto';
}

function escapeHtml(value = '') {
  const div = document.createElement('div');
  div.textContent = String(value);
  return div.innerHTML;
}

function escapeAttribute(value = '') {
  return escapeHtml(value).replace(/"/g, '&quot;');
}

function setText(selector, value) {
  const element = document.querySelector(selector);
  if (element) element.textContent = value;
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2600);
}

async function loadEditais() {
  const grid = document.querySelector('#opportunity-grid');
  const status = document.querySelector('#editais-status');
  if (!grid || !status) return;
  try {
    const response = await fetch('./data/editais.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('Falha ao carregar editais');
    const data = await response.json();
    const editais = [...(data.editais || [])].filter(item => item.status === 'aberto').sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
    status.innerHTML = `<span class="online"></span> Atualização diária · Última verificação: <strong>${escapeHtml(formatDate(data.last_verified))}</strong> · ${editais.length} oportunidades abertas`;
    grid.innerHTML = editais.length ? editais.map(item => opportunityMarkup(item)).join('') : '<div class="empty-editais"><span>◎</span><h3>Nenhum edital aberto encontrado hoje</h3><p>A busca será realizada novamente amanhã às 8h.</p></div>';
    updateHomeDeadline(editais[0]);
  } catch (error) {
    status.textContent = 'Não foi possível atualizar os editais agora.';
    grid.innerHTML = '<div class="empty-editais"><span>↻</span><h3>Tentaremos novamente em instantes</h3><p>As demais áreas do aplicativo continuam disponíveis.</p></div>';
  }
}

function opportunityMarkup(item) {
  const days = daysUntil(item.deadline);
  const label = days === 0 ? 'ENCERRA HOJE' : days === 1 ? 'ENCERRA AMANHÃ' : `ENCERRA EM ${days} DIAS`;
  const tags = (item.categories || []).slice(0, 3).map(tag => `<span>${escapeHtml(tag)}</span>`).join('');
  return `<article class="opportunity ${days <= 7 ? 'closing' : ''}"><span class="match-badge">${days <= 7 ? 'Encerrando' : 'Inscrições abertas'}</span><small>${label}</small><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.organization)} · ${escapeHtml(item.value || 'Consulte o edital')}</p><p class="opportunity-summary">${escapeHtml(item.summary || '')}</p><div class="tags">${tags}</div><a class="outline-button opportunity-link" href="${safeUrl(item.url)}" target="_blank" rel="noopener noreferrer">Ver edital oficial →</a></article>`;
}

function updateHomeDeadline(item) {
  const card = document.querySelector('#next-deadline-card');
  if (!card || !item) return;
  const days = daysUntil(item.deadline);
  card.querySelector('h3').textContent = item.title;
  card.querySelector('p').textContent = item.organization;
  card.querySelector('.countdown strong').textContent = days;
  card.querySelector('.countdown span').textContent = days === 1 ? 'dia para encerrar' : 'dias para encerrar';
}

function daysUntil(date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.max(0, Math.ceil((new Date(`${date}T23:59:59`) - today) / 86400000));
}

function formatDate(date) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeZone: 'America/Sao_Paulo' }).format(new Date(`${date}T12:00:00`));
}

function safeUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.href : '#';
  } catch (error) { return '#'; }
}

document.addEventListener('click', event => {
  const route = event.target.closest('[data-route]');
  if (route) { event.preventDefault(); navigate(route.dataset.route); return; }
  const action = event.target.closest('[data-action]');
  if (action?.dataset.action === 'new-project') { dialog.showModal(); return; }
  if (action?.dataset.action === 'add-budget') { addBudgetRow(); return; }
  const open = event.target.closest('[data-project-id]');
  if (open) { openProject(open.dataset.projectId); return; }
  const remove = event.target.closest('[data-remove-budget]');
  if (remove) { removeBudgetRow(remove.dataset.removeBudget); return; }
  const removeProject = event.target.closest('[data-delete-project]');
  if (removeProject) { deleteProject(removeProject.dataset.deleteProject); return; }
  if (event.target.closest('[data-dialog-close]')) dialog.close();
});

projectForm.addEventListener('submit', event => {
  event.preventDefault();
  const data = new FormData(projectForm);
  const name = String(data.get('name') || '').trim();
  if (!name) return;
  createProject(name, String(data.get('area') || 'Impacto social'));
  projectForm.reset();
  dialog.close();
  navigate('assistente');
  chatInput.focus();
});

chatForm.addEventListener('submit', event => {
  event.preventDefault();
  const value = chatInput.value.trim();
  if (!value || !activeProject()) return;
  chatInput.value = '';
  processAnswer(value);
});

document.querySelector('#project-search').addEventListener('input', event => {
  searchTerm = event.target.value;
  renderProjectLists();
});

document.querySelectorAll('[data-filter]').forEach(chip => chip.addEventListener('click', () => {
  projectFilter = chip.dataset.filter;
  document.querySelectorAll('[data-filter]').forEach(item => item.classList.toggle('active', item === chip));
  renderProjectLists();
}));

document.querySelector('#document-preview').addEventListener('input', event => {
  if (event.target.matches('[data-budget-field]')) updateBudgetInput(event.target);
});

document.querySelector('#export-project').addEventListener('click', exportProject);
document.querySelector('#toggle-document').addEventListener('click', () => workspace.classList.add('show-document'));
document.querySelector('#back-to-chat').addEventListener('click', () => workspace.classList.remove('show-document'));

renderProjectLists();
renderWorkspace();
navigate(location.hash.slice(1) || 'inicio');
loadEditais();

if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('./service-worker.js?v=6');
