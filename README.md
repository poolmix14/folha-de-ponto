# Folha de Ponto

Gera as folhas de ponto mensais (A4) dos funcionários do **Condomínio do Edifício Annecy**, prontas para imprimir, baixar em Excel ou em JPG.

O app roda inteiro no navegador. Não tem servidor, login nem banco de dados.

## Como usar

1. Abra o site.
2. Confira o **período**. Ele já vem do dia 26 até o dia 25 do mês seguinte, mas dá para mudar em **Início** e **Fim**.
3. Clique no **nome** ou nos **horários** de qualquer folha para editar. O que você muda fica salvo neste navegador.
4. Escolha a saída:
   - **Imprimir**: uma folha por página A4, sem as linhas tracejadas de edição.
   - **Excel**: um arquivo `folhas-de-ponto.xlsx` com uma aba por funcionário.
   - **JPG**: uma imagem por funcionário (`folha-<nome>.jpg`).
5. **Margens** alterna entre margem para encadernar e margem igual nos quatro lados.
6. **Restaurar padrão** volta os nomes e horários originais.

## Regras

- Período padrão: se hoje for dia 26 ou depois, vai do dia 26 deste mês ao dia 25 do próximo. Se for antes do dia 26, vai do dia 26 do mês passado ao dia 25 deste mês.
- O título mostra o **mês de referência**, que é o mês em que o período termina: de 26/11 a 25/12 sai "FOLHA DE PONTO - DEZEMBRO 2026".
- Cada folha lista todos os dias do período, com o dia da semana, e tem colunas para Entrada, Intervalo (Saída/Retorno), Saída, Horas Extras e Assinatura, além do campo RESPONSÁVEL no final.
- Funcionário sem horário de almoço (os dois campos vazios) mostra **"Sem Horário de Janta"**. Para voltar a ter almoço, apague esse texto: os campos aparecem com 00:00.
- O nome é sempre salvo em MAIÚSCULAS.
- Descanso semanal: Esc (escala).

## Funcionários padrão

| Nome | Entrada | Saída | Almoço |
|---|---|---|---|
| CARLOS | 08:00 | 17:00 | 12:00–13:00 |
| PAULO | 07:00 | 19:00 | 12:00–13:00 |
| MAURICIO | 07:00 | 19:00 | 12:00–13:00 |
| MARCIO | 19:00 | 07:00 | SEM JANTA |
| SERGIO | 19:00 | 07:00 | SEM JANTA |

Para mudar a lista fixa, edite `FUNCIONARIOS_PADRAO` em `app.js`.

## Publicar no GitHub Pages

No repositório, abra **Settings → Pages**, escolha **Deploy from a branch**, branch `main` e pasta `/ (root)`. O site fica em `https://<seu-usuario>.github.io/folha-de-ponto/`.

## Arquivos

- `index.html`: a página
- `style.css`: o visual da tela e da impressão
- `app.js`: as regras, as folhas e as exportações (Excel via [xlsx-js-style](https://github.com/gitbrent/xlsx-js-style), JPG via [html2canvas](https://html2canvas.hertzen.com/))
