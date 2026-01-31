

# Sistema de Gestão para Sacolão/Hortifruti

## Visão Geral
Sistema completo de gestão para hortifruti com controle de estoque por lote, PDV integrado com balança (código EAN-13), e gestão de quebras com custo dinâmico.

---

## Páginas e Funcionalidades

### 1. **Login**
- Autenticação via Supabase Auth
- Interface simples e responsiva
- Redirecionamento automático após login

### 2. **Dashboard**
- Visão geral do negócio com cards de métricas
- Vendas do dia, estoque baixo, quebras recentes
- Gráficos de desempenho (vendas por período)
- Alertas de lotes próximos do vencimento

### 3. **PDV (Ponto de Venda)**
- Interface touch-first otimizada para tablets
- Leitor de código de barras EAN-13 (extrai PLU e peso)
- Lista de itens do carrinho com edição rápida
- Cálculo automático de totais
- Finalização de venda com baixa automática no estoque (FIFO)
- Botões grandes (h-14) para facilitar uso em tela touch

### 4. **Estoque**
- Listagem de produtos com quantidade por lote
- Entrada de mercadorias com data de validade e custo
- Visualização de lotes (FIFO) com cores indicando proximidade do vencimento
- Histórico de movimentações
- Alertas de estoque mínimo

### 5. **Quebras**
- Registro de perdas (produtos estragados, danificados)
- Vinculação ao lote específico para custo real
- Cálculo automático do prejuízo (custo do lote × quantidade perdida)
- Relatório de quebras por período e categoria
- Motivos pré-definidos (vencido, danificado, furto, etc.)

### 6. **Produtos**
- Cadastro de produtos (nome, PLU, unidade de medida)
- Categorias (frutas, verduras, legumes, etc.)
- Configuração de estoque mínimo
- Preço de venda atual

### 7. **Relatórios** (incorporado no Dashboard ou página dedicada)
- Vendas por período
- Produtos mais vendidos
- Histórico de quebras
- Análise de custos e margens

---

## Arquitetura Técnica

### Frontend (React + TypeScript)
- **Custom Hooks**: `useProducts`, `useStock`, `useSales`, `useBreakages`, `useBarcode`
- **Componentes modulares**: ProductCard, StockEntry, SaleItem, BreakageForm
- **Design touch-first**: Botões h-14, espaçamento generoso, áreas de toque amplas

### Backend (Supabase)
- **Tabelas**: products, stock_batches, sales, sale_items, breakages
- **RLS**: Políticas de segurança por usuário/estabelecimento
- **Edge Functions**: Processamento de código de barras, cálculos de custo

### Fluxo do Código de Barras (EAN-13)
- Estrutura: `2PPPPP WWWWW C` (2 = prefixo, P = PLU produto, W = peso em gramas)
- Parser automático para extrair produto e quantidade
- Busca do produto pelo PLU e cálculo do preço

---

## Design e UX
- Interface limpa e funcional
- Cores para indicar status (verde=ok, amarelo=atenção, vermelho=urgente)
- Feedback visual e sonoro nas operações
- Sidebar navegável com ícones claros
- Totalmente responsivo (desktop e tablet)

