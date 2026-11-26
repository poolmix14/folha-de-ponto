// Folha de Ponto — Condomínio do Edifício Annecy
// Tudo roda no navegador: não há servidor nem banco de dados.
// As edições (nomes e horários) ficam salvas neste navegador.

const EMPRESA = 'CONDOMÍNIO DO EDIFÍCIO ANNECY';
const CNPJ = '00356805000172';
const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const FUNCIONARIOS_PADRAO = [
  { nome: 'CARLOS',        entrada: '08:00', saida: '17:00', almocoIni: '12:00', almocoFim: '13:00' },
  { nome: 'PAULO ROBERTO', entrada: '07:00', saida: '19:00', almocoIni: '12:00', almocoFim: '13:00' },
  { nome: 'LEANDRO',       entrada: '07:00', saida: '19:00', almocoIni: '12:00', almocoFim: '13:00' },
  { nome: 'MARCIO',        entrada: '19:00', saida: '07:00', almocoIni: '',      almocoFim: ''      },
  { nome: 'SERGIO',        entrada: '19:00', saida: '07:00', almocoIni: '',      almocoFim: ''      },
];
const MARGEM_COM = '24px 68px 80px 68px';
const MARGEM_SEM = '57px';
const CHAVE = 'folha-de-ponto:v1';

// ---------- Regras ----------

// Período padrão: do dia 26 ao dia 25 do mês seguinte.
// Se hoje for dia 26 ou depois, começa neste mês; senão, no mês anterior.
function periodoPadrao(hoje = new Date()) {
  let anoIni = hoje.getFullYear(), mesIni = hoje.getMonth();
  if (hoje.getDate() < 26) { mesIni -= 1; if (mesIni < 0) { mesIni = 11; anoIni -= 1; } }
  let anoFim = anoIni, mesFim = mesIni + 1;
  if (mesFim > 11) { mesFim = 0; anoFim += 1; }
  const p = (n) => String(n).padStart(2, '0');
  return { inicio: `${anoIni}-${p(mesIni + 1)}-26`, fim: `${anoFim}-${p(mesFim + 1)}-25` };
}

// Lista de dias entre início e fim (inclusive).
function diasDoPeriodo(inicio, fim) {
  if (!inicio || !fim) return [];
  const [a1, m1, d1] = inicio.split('-').map(Number);
  const [a2, m2, d2] = fim.split('-').map(Number);
  const atual = new Date(a1, m1 - 1, d1), ultimo = new Date(a2, m2 - 1, d2);
  const dias = [];
  while (atual <= ultimo && dias.length < 62) {
    dias.push({ dia: atual.getDate(), sem: DIAS_SEMANA[atual.getDay()] });
    atual.setDate(atual.getDate() + 1);
  }
  return dias;
}

function dataBR(iso) {
  if (!iso) return '';
  const [a, m, d] = iso.split('-');
  return `${d}/${m}/${a}`;
}

const semJanta = (f) => !f.almocoIni.trim() && !f.almocoFim.trim();

// ---------- Estado ----------

function carregar() {
  try {
    const s = JSON.parse(localStorage.getItem(CHAVE));
    if (s && Array.isArray(s.funcionarios)) return s;
  } catch (_) { /* sem armazenamento */ }
  return null;
}

const salvo = carregar();
const estado = {
  periodo: periodoPadrao(),                       // período sempre recalculado pela data de hoje
  margens: salvo ? salvo.margens !== false : true,
  funcionarios: salvo ? salvo.funcionarios : structuredClone(FUNCIONARIOS_PADRAO),
};

function salvar() {
  try {
    localStorage.setItem(CHAVE, JSON.stringify({ margens: estado.margens, funcionarios: estado.funcionarios }));
  } catch (_) { /* sem armazenamento */ }
}

// ---------- Desenho ----------

function el(tag, attrs = {}, ...filhos) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') e.className = v;
    else if (k === 'style') e.style.cssText = v;
    else e.setAttribute(k, v);
  }
  for (const f of filhos.flat()) if (f != null) e.append(f);
  return e;
}

// Campo editável que grava ao sair do campo.
function campo(valor, classe, aoMudar) {
  const s = el('span', { class: `ed ${classe}`, contenteditable: 'true', spellcheck: 'false' }, valor);
  s.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') { ev.preventDefault(); s.blur(); } });
  s.addEventListener('blur', () => aoMudar(s.textContent.trim()));
  return s;
}

function folha(f, i, dias) {
  const atualizar = (chave, valor, redesenhar = false) => {
    f[chave] = valor;
    salvar();
    if (redesenhar) desenhar();
  };

  const horarios = el('div', { class: 'horarios' },
    el('span', { class: 'rotulo' }, 'Entrada:'),
    campo(f.entrada, 'hora', (v) => atualizar('entrada', v)),
    el('span', { class: 'rotulo' }, 'Saída:'),
    campo(f.saida, 'hora', (v) => atualizar('saida', v)),
  );

  if (semJanta(f)) {
    // Apagar o texto "Sem Horário de Janta" volta a mostrar os campos de almoço (00:00).
    horarios.append(campo('Sem Horário de Janta', 'sem-janta', (v) => {
      if (v === '') { f.almocoIni = '00:00'; f.almocoFim = '00:00'; salvar(); desenhar(); }
      else desenhar();
    }));
  } else {
    // Apagar os dois horários de almoço vira "Sem Horário de Janta".
    horarios.append(
      el('span', { class: 'rotulo', style: 'min-width:52px' }, 'Almoço:'),
      campo(f.almocoIni, 'hora', (v) => atualizar('almocoIni', v, semJanta({ ...f, almocoIni: v }))),
      campo(f.almocoFim, 'hora', (v) => atualizar('almocoFim', v, semJanta({ ...f, almocoFim: v }))),
    );
  }

  const linhas = dias.map((d) => el('tr', {},
    el('td', {}, el('span', { class: 'dia' }, el('b', {}, String(d.dia)), el('span', {}, d.sem))),
    ...Array.from({ length: 6 }, () => el('td')),
  ));

  return el('div', { class: 'a4', style: `padding:${estado.margens ? MARGEM_COM : MARGEM_SEM}`, 'data-indice': i },
    el('div', { class: 'cab-titulo' }, el('span', {}, 'Folha de ponto')),
    el('div', { class: 'bloco' },
      el('div', {}, EMPRESA),
      el('div', {}, `CNPJ:${CNPJ}`),
      el('div', {}, `Período: ${dataBR(estado.periodo.inicio)} a ${dataBR(estado.periodo.fim)}`),
    ),
    el('div', { class: 'bloco' },
      el('div', { style: 'display:flex' }, campo(f.nome, 'nome', (v) => atualizar('nome', v.toUpperCase(), true))),
      horarios,
      el('div', { class: 'descanso' }, 'Descanso Semanal: Esc'),
    ),
    el('table', {},
      el('colgroup', {},
        el('col', { style: 'width:72px' }), el('col'), el('col'), el('col'), el('col'),
        el('col', { style: 'width:80px' }), el('col', { style: 'width:130px' })),
      el('thead', {},
        el('tr', {},
          el('th', { rowspan: '2' }, 'DIA'),
          el('th', { rowspan: '2' }, 'ENTRADA'),
          el('th', { colspan: '2', class: 'grupo' }, 'INTERVALO'),
          el('th', { rowspan: '2' }, 'SAÍDA'),
          el('th', { rowspan: '2' }, 'HORAS', el('br'), 'EXTRAS'),
          el('th', { rowspan: '2' }, 'ASSINATURA')),
        el('tr', {}, el('th', { class: 'sub' }, 'SAÍDA'), el('th', { class: 'sub' }, 'RETORNO'))),
      el('tbody', {}, linhas),
    ),
    el('div', { class: 'assinatura' }, el('div', {}, 'RESPONSÁVEL')),
  );
}

function desenhar() {
  const dias = diasDoPeriodo(estado.periodo.inicio, estado.periodo.fim);
  const area = document.getElementById('folhas');
  area.replaceChildren(...estado.funcionarios.map((f, i) => folha(f, i, dias)));
  document.getElementById('btn-margens').classList.toggle('ativo', estado.margens);
}

// ---------- Exportações ----------

function planilha(f, dias) {
  const almoco = semJanta(f) ? 'Sem Horário de Janta' : `Almoço: ${f.almocoIni} ${f.almocoFim}`;
  const topo = [
    ['FOLHA DE PONTO'], [],
    [EMPRESA], [`CNPJ: ${CNPJ}`],
    [`Período: ${dataBR(estado.periodo.inicio)} a ${dataBR(estado.periodo.fim)}`], [],
    [f.nome], [`Entrada: ${f.entrada}   Saída: ${f.saida}   ${almoco}`], ['Descanso Semanal: Esc'], [],
    ['DIA', 'ENTRADA', 'INTERVALO', '', 'SAÍDA', 'HORAS EXTRAS', 'ASSINATURA'],
    ['', '', 'SAÍDA', 'RETORNO', '', '', ''],
  ];
  const corpo = dias.map((d) => [`${d.dia} ${d.sem}`, '', '', '', '', '', '']);
  const rodape = [[], ['', '', '', '', '', '', 'RESPONSÁVEL']];
  const linhas = [...topo, ...corpo, ...rodape];
  const ws = XLSX.utils.aoa_to_sheet(linhas);

  ws['!cols'] = [12, 12, 12, 12, 12, 14, 22].map((wch) => ({ wch }));
  ws['!merges'] = [0, 2, 3, 4, 6, 7, 8].map((r) => ({ s: { r, c: 0 }, e: { r, c: 6 } }))
    .concat([{ s: { r: 10, c: 2 }, e: { r: 10, c: 3 } }]);

  const borda = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
  const ini = 10, fim = ini + 1 + dias.length;
  for (let r = ini; r <= fim; r++) {
    for (let c = 0; c <= 6; c++) {
      const ref = XLSX.utils.encode_cell({ r, c });
      if (!ws[ref]) ws[ref] = { v: '', t: 's' };
      ws[ref].s = {
        border: borda,
        alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
        font: { bold: r === ini || r === ini + 1 },
      };
    }
  }
  if (ws.A1) ws.A1.s = { font: { bold: true, sz: 14 }, alignment: { horizontal: 'center' } };
  ws['!rows'] = linhas.map((_, r) => (r >= ini + 2 && r < ini + 2 + dias.length ? { hpt: 18 } : undefined));
  ws['!pageSetup'] = { paperSize: 9, orientation: 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 1 };
  return ws;
}

function exportarExcel() {
  if (typeof XLSX === 'undefined') { alert('Não foi possível carregar o gerador de Excel. Verifique a internet.'); return; }
  const dias = diasDoPeriodo(estado.periodo.inicio, estado.periodo.fim);
  const wb = XLSX.utils.book_new();
  const usados = new Set();
  estado.funcionarios.forEach((f, i) => {
    let nomeAba = (f.nome || `Folha ${i + 1}`).replace(/[\\/?*[\]:]/g, '').slice(0, 31) || `Folha ${i + 1}`;
    while (usados.has(nomeAba)) nomeAba = `${nomeAba.slice(0, 28)} ${i + 1}`;
    usados.add(nomeAba);
    XLSX.utils.book_append_sheet(wb, planilha(f, dias), nomeAba);
  });
  XLSX.writeFile(wb, 'folhas-de-ponto.xlsx');
}

async function exportarJPG() {
  if (typeof html2canvas === 'undefined') { alert('Não foi possível carregar o gerador de imagem. Verifique a internet.'); return; }
  const botao = document.getElementById('btn-jpg');
  botao.disabled = true;
  document.body.classList.add('sem-borda');
  try {
    const folhas = document.querySelectorAll('.a4');
    for (let i = 0; i < folhas.length; i++) {
      const canvas = await html2canvas(folhas[i], { scale: 2, backgroundColor: '#ffffff', logging: false, width: 794, height: 1123 });
      const nome = (estado.funcionarios[i].nome || `folha-${i + 1}`).replace(/\s+/g, '-').toLowerCase();
      const a = document.createElement('a');
      a.download = `folha-${nome}.jpg`;
      a.href = canvas.toDataURL('image/jpeg', 0.95);
      a.click();
      await new Promise((r) => setTimeout(r, 400));
    }
  } finally {
    document.body.classList.remove('sem-borda');
    botao.disabled = false;
  }
}

// ---------- Início ----------

const inpInicio = document.getElementById('inicio');
const inpFim = document.getElementById('fim');
inpInicio.value = estado.periodo.inicio;
inpFim.value = estado.periodo.fim;
inpInicio.addEventListener('change', () => { estado.periodo.inicio = inpInicio.value; desenhar(); });
inpFim.addEventListener('change', () => { estado.periodo.fim = inpFim.value; desenhar(); });

document.getElementById('btn-imprimir').addEventListener('click', () => window.print());
document.getElementById('btn-excel').addEventListener('click', exportarExcel);
document.getElementById('btn-jpg').addEventListener('click', exportarJPG);
document.getElementById('btn-margens').addEventListener('click', () => { estado.margens = !estado.margens; salvar(); desenhar(); });
document.getElementById('btn-padrao').addEventListener('click', () => {
  if (!confirm('Voltar nomes e horários para o padrão?')) return;
  estado.funcionarios = structuredClone(FUNCIONARIOS_PADRAO);
  estado.margens = true;
  salvar();
  desenhar();
});

desenhar();
