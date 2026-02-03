# Memory: guidelines/mandatory-rules
Updated: 2026-02-03

## Regras Obrigatórias do Projeto

1. **NUNCA remover funcionalidades existentes** ao adicionar novas features

2. **NUNCA alterar estrutura de tabelas** existentes sem perguntar antes ao usuário

3. **NUNCA usar margem fixa (60%)** - sempre calcular com dados reais do banco

4. **NUNCA deletar dados sem confirmação** - sempre exibir modal de confirmação

5. **SEMPRE manter componentes < 300 linhas** - quebrar em componentes menores se necessário

6. **SEMPRE adicionar toast de feedback** em todas as ações (sucesso/erro)

7. **SEMPRE manter responsividade mobile-first** - botões mínimo h-12 para touch

8. **SEMPRE usar try/catch** em operações async com tratamento de erro adequado

9. **SEMPRE manter tipagem TypeScript** - nunca usar 'any' sem necessidade absoluta

10. **SEMPRE testar no mobile** antes de considerar uma feature pronta
