
# Plano de Execução: Camada 3 - Implementação Final e Geração de Lote Diário

## Resumo Executivo

Este plano corrige o fluxo de compras garantindo que o custo real seja preservado desde o recebimento até os relatórios, criando uma transação atômica no fechamento do protocolo e adicionando um relatório consolidado do dia.

---

## Problema Identificado

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                        FLUXO ATUAL (COM BUGS)                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  RECEBIMENTO                      PROTOCOLO                             │
│  ├─ Cria stock_batches           ├─ Atualiza preço produto             │
│  │  com CUSTO POR VOLUME ❌       │  (NÃO atualiza lotes) ❌            │
│  │  quantity = volumes ❌         │                                     │
│  │                                │  Não redireciona ❌                 │
│                                   │                                     │
│  Resultado: Margem -1500% no Dashboard                                  │
└─────────────────────────────────────────────────────────────────────────┘
```

**Dados críticos perdidos:**
- `cost_per_unit` nos lotes está em R$/volume (ex: R$80/caixa) em vez de R$/kg
- `quantity` nos lotes é número de volumes em vez de peso líquido

---

## Solução Proposta

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                        FLUXO CORRIGIDO                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  RECEBIMENTO                      PROTOCOLO (TRANSAÇÃO ATÔMICA)        │
│  ├─ NÃO cria lotes               ├─ 1. Atualiza purchase_order_items   │
│  ├─ Apenas marca como            ├─ 2. Atualiza products (preço+custo) │
│  │  'recebido' e confere         ├─ 3. CRIA stock_batches com:         │
│  │  quantidades                  │     • custo REAL por kg ✓           │
│                                   │     • peso líquido real ✓          │
│                                   ├─ 4. Status -> 'fechado'            │
│                                   ├─ 5. Redireciona -> Relatórios      │
│                                   │                                     │
│  Resultado: Margem correta no Dashboard                                 │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Tarefas de Implementação

### Tarefa 1: Modificar ReceivingDialog (Remover criação de lotes)

**Arquivo:** `src/components/compras/ReceivingDialog.tsx`

**O que remover (linhas 362-379):**
```typescript
// REMOVER: Criação de stock_batches no recebimento
if (item.quantity_received > 0 && item.quality_status !== 'recusado') {
  // ... todo este bloco de criação de batch
}
```

**O que manter:**
- Atualização dos `purchase_order_items` com `quantity_received` e `unit_cost_actual`
- Atualização do status para `'recebido'`
- Fotos e notas

---

### Tarefa 2: Implementar Transação Atômica no ClosingProtocolDialog

**Arquivo:** `src/components/compras/ClosingProtocolDialog.tsx`

**Nova estrutura do `handleAprovar`:**

```typescript
const handleAprovar = async () => {
  setIsApproving(true);
  try {
    const closingOutput = generateClosingOutput();
    
    // === TRANSAÇÃO ATÔMICA ===
    
    // 1. Atualizar purchase_order_items com custo real
    for (const item of order.items || []) {
      const pricing = itemsPricing[item.id];
      await supabase.from('purchase_order_items').update({
        quantity_received: pricing.qtdVolumes,
        unit_cost_actual: pricing.custoRealKg,
      }).eq('id', item.id);
    }
    
    // 2. Atualizar produtos (preço de venda + custo de compra)
    for (const item of order.items || []) {
      const pricing = itemsPricing[item.id];
      await supabase.from('products').update({
        price: pricing.precoVenda,
        custo_compra: pricing.custoRealKg,
      }).eq('id', item.product_id);
    }
    
    // 3. CRIAR LOTES DE ESTOQUE com custo real
    for (const item of order.items || []) {
      const pricing = itemsPricing[item.id];
      const product = order.items?.find(i => i.id === item.id)?.product;
      const shelfLife = product?.shelf_life || 7;
      
      await supabase.from('stock_batches').insert({
        product_id: item.product_id,
        quantity: pricing.pesoLiquido,      // Peso líquido real (kg)
        cost_per_unit: pricing.custoRealKg, // Custo real (R$/kg)
        expiry_date: addDays(new Date(), shelfLife).toISOString().split('T')[0],
        received_at: new Date().toISOString(),
      });
    }
    
    // 4. Fechar pedido
    await supabase.from('purchase_orders').update({
      status: 'fechado',
      total_received: resumo.valorTotal,
      received_at: new Date().toISOString(),
      notes: notesContent,
    }).eq('id', order.id);
    
    // 5. Salvar output do fechamento (para relatórios)
    // [Opcional: salvar em tabela closing_reports]
    
    // 6. Redirecionar para Relatórios
    toast.success('Pedido fechado! Estoque e preços atualizados.');
    onSuccess();
    onOpenChange(false);
    navigate('/relatorios', { 
      state: { 
        highlightOrder: order.id,
        showClosingReport: true 
      } 
    });
    
  } catch (error) {
    console.error('Erro ao aprovar:', error);
    toast.error('Erro: ' + error.message);
  } finally {
    setIsApproving(false);
  }
};
```

**Props adicionais necessárias:**
```typescript
interface ClosingProtocolDialogProps {
  // ... existentes
  onNavigate?: (path: string, state?: any) => void; // Para redirecionamento
}
```

---

### Tarefa 3: Criar Nova Aba "Fechamento do Dia" nos Relatórios

**Arquivo:** `src/pages/Relatorios.tsx`

**Nova aba após "Vasilhames":**
```typescript
<TabsTrigger value="fechamento" className="flex items-center gap-2">
  <Calendar className="h-4 w-4" />
  <span className="hidden sm:inline">Fechamento</span>
</TabsTrigger>
```

**Conteúdo da aba:**
```text
┌────────────────────────────────────────────────────────────────┐
│           RELATÓRIO DE FECHAMENTO DO DIA                       │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Filtro: [Selecionar Data: ____/____/____]                    │
│                                                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │ R$ 2.450,00 │  │   3         │  │  62,5%      │            │
│  │ Custo Total │  │  Pedidos    │  │ Margem Méd. │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
│                                                                │
│  PEDIDOS FECHADOS HOJE:                                        │
│  ┌──────────────────────────────────────────────────┐         │
│  │ Fornecedor A       │ 5 itens │ R$ 800,00 │ 60%   │ [PDF]   │
│  │ Fornecedor B       │ 3 itens │ R$ 450,00 │ 65%   │ [PDF]   │
│  └──────────────────────────────────────────────────┘         │
│                                                                │
│  [Exportar Relatório Consolidado PDF]                         │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

**Dados calculados:**
```typescript
const dailyClosingData = useMemo(() => {
  const today = format(new Date(selectedDate), 'yyyy-MM-dd');
  
  const todaysOrders = closedOrders.filter(order => {
    const closedDate = order.received_at 
      ? format(new Date(order.received_at), 'yyyy-MM-dd')
      : null;
    return closedDate === today;
  });
  
  const totalCusto = todaysOrders.reduce((sum, o) => 
    sum + (o.total_received || o.total_estimated), 0
  );
  
  // Calcular margem ponderada dos produtos fechados
  const itemsWithMargin = todaysOrders.flatMap(o => o.items || []).map(item => {
    const product = products.find(p => p.id === item.product_id);
    const custo = product?.custo_compra || 0;
    const preco = product?.price || 0;
    const margem = custo > 0 ? (1 - custo / preco) * 100 : 0;
    return { margem, peso: item.estimated_kg || 1 };
  });
  
  const margemPonderada = itemsWithMargin.reduce((sum, i) => 
    sum + (i.margem * i.peso), 0
  ) / itemsWithMargin.reduce((sum, i) => sum + i.peso, 1);
  
  return {
    orders: todaysOrders,
    totalCusto,
    margemPonderada,
    count: todaysOrders.length,
  };
}, [closedOrders, selectedDate, products]);
```

---

### Tarefa 4: Criar Componente de Relatório Individual

**Novo arquivo:** `src/components/relatorios/ClosingReportCard.tsx`

**Estrutura:**
```typescript
interface ClosingReportCardProps {
  order: PurchaseOrder;
  onExportPdf: () => void;
  isHighlighted?: boolean;
}

export function ClosingReportCard({ order, onExportPdf, isHighlighted }: Props) {
  const items = order.items || [];
  
  // Calcular totais
  const totalPesoLiquido = items.reduce((sum, i) => {
    const pesoBruto = i.estimated_kg || 1;
    const tara = i.tare_total || 0;
    return sum + Math.max(0, pesoBruto - tara);
  }, 0);
  
  const totalCusto = order.total_received || order.total_estimated;
  
  // Calcular margem média do pedido
  const margemMedia = items.reduce((sum, i) => {
    const product = i.product;
    if (!product) return sum;
    const custo = product.custo_compra || 0;
    const preco = product.price || 0;
    return sum + (custo > 0 ? (1 - custo / preco) * 100 : 60);
  }, 0) / Math.max(items.length, 1);
  
  return (
    <Card className={isHighlighted ? 'ring-2 ring-primary' : ''}>
      {/* ... UI do card */}
    </Card>
  );
}
```

---

### Tarefa 5: Gerar PDF do Relatório Individual

**Adicionar em:** `src/lib/generateClosingReportPdf.ts`

**Estrutura do PDF:**
```typescript
export async function generateClosingReportPdf(order: PurchaseOrder) {
  const doc = new jsPDF();
  
  // Header
  doc.text('RELATÓRIO DE FECHAMENTO DE COMPRA', 14, 20);
  doc.text(`Fornecedor: ${order.supplier?.name}`, 14, 30);
  doc.text(`Data: ${format(new Date(), 'dd/MM/yyyy')}`, 14, 38);
  
  // Tabela de itens
  const tableData = order.items?.map(item => [
    item.product?.name || 'Produto',
    `${(item.quantity_received || item.quantity)} vol`,
    `${item.estimated_kg?.toFixed(1)} kg`,
    `R$ ${(item.unit_cost_actual || 0).toFixed(2)}/kg`,
    `R$ ${item.product?.price?.toFixed(2)}/kg`,
  ]) || [];
  
  autoTable(doc, {
    head: [['Produto', 'Volumes', 'Peso Líq.', 'Custo/kg', 'Venda/kg']],
    body: tableData,
    startY: 48,
  });
  
  // Totais
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.text(`Total Custo: R$ ${order.total_received?.toFixed(2)}`, 14, finalY);
  
  doc.save(`fechamento-${order.id.slice(0,8)}.pdf`);
}
```

---

## Sequência de Implementação

| # | Tarefa | Arquivos | Prioridade |
|---|--------|----------|------------|
| 1 | Remover criação de lotes do ReceivingDialog | `ReceivingDialog.tsx` | Alta |
| 2 | Implementar transação atômica no handleAprovar | `ClosingProtocolDialog.tsx` | Alta |
| 3 | Adicionar redirecionamento para Relatórios | `ClosingProtocolDialog.tsx` | Média |
| 4 | Criar aba "Fechamento do Dia" | `Relatorios.tsx` | Média |
| 5 | Criar componente ClosingReportCard | Novo arquivo | Média |
| 6 | Criar gerador de PDF individual | Novo arquivo | Baixa |

---

## Seção Técnica

### Estrutura de Dados do Lote Criado

```typescript
// stock_batches - dados corretos
{
  product_id: uuid,
  quantity: 15.5,           // Peso líquido em kg (não volumes)
  cost_per_unit: 5.87,      // Custo real R$/kg (com rateio de frete)
  expiry_date: '2026-02-13',
  received_at: timestamp,
}
```

### Fórmulas Utilizadas

```text
Peso Líquido = (Qtd Volumes × Peso Bruto / Qtd Pedida) - Tara Total

Custo Base (R$/kg) = Custo Total Volumes / Peso Líquido

Rateio (R$/kg) = (Frete + Outros Custos) / Peso Líquido Total do Pedido

Custo Real (R$/kg) = Custo Base + Rateio

Preço Venda = Custo Real / (1 - Margem/100)

Margem = (1 - Custo/Preço) × 100
```

### Validações Necessárias

1. **Peso líquido > 0**: Impedir divisão por zero
2. **Custo > 0**: Não criar lotes com custo zero
3. **Margem entre 0.1% e 99.9%**: Evitar preços infinitos ou negativos

---

## Resultado Esperado

Após a implementação:

1. **Dashboard**: Margem Real calculada corretamente (baseada em custo R$/kg)
2. **Estoque**: Lotes com peso líquido e custo unitário corretos
3. **Relatórios**: Visão consolidada do dia com métricas de fechamento
4. **Rastreabilidade**: Custo real preservado em toda a cadeia
