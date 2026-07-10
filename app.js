const pages = [...document.querySelectorAll('.page')];
const routeButtons = [...document.querySelectorAll('[data-route]')];
const dialog = document.querySelector('#project-dialog');
const projectForm = document.querySelector('#project-form');
const toast = document.querySelector('#toast');

function navigate(route) {
  pages.forEach(page => page.classList.toggle('active', page.id === `page-${route}`));
  document.querySelectorAll('.nav-item,.bottom-nav button').forEach(button => button.classList.toggle('active', button.dataset.route === route));
  window.scrollTo({ top: 0, behavior: 'smooth' });
  history.replaceState(null, '', `#${route}`);
}

routeButtons.forEach(button => button.addEventListener('click', event => {
  event.preventDefault();
  navigate(button.dataset.route);
}));

document.querySelectorAll('[data-action="new-project"]').forEach(button => button.addEventListener('click', () => dialog.showModal()));
document.querySelectorAll('[data-dialog-close]').forEach(button => button.addEventListener('click', () => dialog.close()));

projectForm.addEventListener('submit', event => {
  event.preventDefault();
  const data = new FormData(projectForm);
  const name = data.get('name');
  if (!name) return;
  dialog.close();
  navigate('assistente');
  addMessage(`Quero criar o projeto “${name}”, na área de ${data.get('area')}.`, 'user');
  setTimeout(() => {
    addMessage(`Ótimo começo! “${name}” já está criado. Agora me conte: quem são as pessoas que esse projeto quer alcançar e o que muda na vida delas?`, 'ai');
    updateDocument(name, data.get('area'));
  }, 550);
  projectForm.reset();
});

document.querySelectorAll('[data-project]').forEach(card => card.addEventListener('click', () => {
  const name = card.dataset.project;
  navigate('assistente');
  updateDocument(name, name.includes('Vozes') ? 'Cultura' : 'Economia criativa');
  showToast(`${name} aberto no espaço de trabalho`);
}));

const chatForm = document.querySelector('#chat-form');
const chatInput = document.querySelector('#chat-input');
document.querySelectorAll('.suggestions button').forEach(button => button.addEventListener('click', () => {
  chatInput.value = button.textContent;
  chatForm.requestSubmit();
}));

chatForm.addEventListener('submit', event => {
  event.preventDefault();
  const value = chatInput.value.trim();
  if (!value) return;
  addMessage(value, 'user');
  chatInput.value = '';
  setTimeout(() => addMessage('Entendi. Vou organizar isso com cuidado e linguagem humana. Para deixar o projeto mais forte, qual resultado concreto você espera alcançar nos primeiros seis meses?', 'ai'), 650);
});

function addMessage(text, type) {
  const messages = document.querySelector('#messages');
  const suggestions = messages.querySelector('.suggestions');
  if (suggestions) suggestions.remove();
  const message = document.createElement('div');
  message.className = `message ${type}`;
  message.innerHTML = `${type === 'ai' ? '<span>✦</span>' : ''}<div><p></p></div>`;
  message.querySelector('p').textContent = text;
  messages.appendChild(message);
  messages.scrollTop = messages.scrollHeight;
}

function updateDocument(name, area) {
  const preview = document.querySelector('#document-preview');
  preview.className = 'document-content';
  preview.innerHTML = `<span class="eyebrow">RASCUNHO GERADO COM VOCÊ</span><h2>${escapeHtml(name)}</h2><p><strong>Área:</strong> ${escapeHtml(area)}</p><h3>Resumo do projeto</h3><p>Este projeto nasce do território e será construído a partir da escuta ativa das pessoas envolvidas. Durante a conversa, a ProjetoIA vai organizar propósito, público, objetivos, atividades, metas e recursos necessários.</p><h3>Próximas seções</h3><p>○ Justificativa<br>○ Objetivos e metas<br>○ Metodologia<br>○ Cronograma<br>○ Orçamento editável</p>`;
}

function escapeHtml(value) {
  const div = document.createElement('div');
  div.textContent = value;
  return div.innerHTML;
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2600);
}

document.querySelectorAll('.chip').forEach(chip => chip.addEventListener('click', () => {
  document.querySelectorAll('.chip').forEach(item => item.classList.remove('active'));
  chip.classList.add('active');
}));

navigate(location.hash.slice(1) || 'inicio');

if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('./service-worker.js');
