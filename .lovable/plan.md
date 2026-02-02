
# Plano: Fornecedor Principal Calculado Automaticamente

## Problema Atual

O campo `products.supplier_id` assume que cada produto tem UM fornecedor fixo. Na realidade:
- O mesmo produto vem de múltiplos fornecedores
- O "principal" deveria ser quem mais fornece (por volume ou frequência)
- Essa informação já existe no histórico de compras

## Solução

### 1. Criar View de Fornecedor Principal (Calculado)

Uma view no banco que calcula automaticamente o fornecedor principal de cada produto baseado no histórico:

```
┌─────────────────────────────────────────────────────────┐
│ product_supplier_stats (VIEW)                          │
├─────────────────────────────────────────────────────────┤
│ product_id     | supplier_id   | total_qty | rank     │
│ Alface Crespa  | Frutas Vale   | 7         | 1 (MAIN) │
│ Alface Crespa  | Hortaliças    | 2         | 2        │
│ Alface Crespa  | Osni          | 1         | 3        │
└─────────────────────────────────────────────────────────┘
```

### 2. Mostrar Histórico de Fornecedores na Tela de Compras

No grid de produtos, indicar visualmente:
- De quais fornecedores o produto já veio
- Qual é o principal (maior volume)
- Se o produto já veio do fornecedor atualmente selecionado

```
┌──────────────────┐   ┌──────────────────┐
│   🥬 Alface      │   │   🍌 Banana      │
│   Principal:     │   │   Principal:     │
│   Frutas Vale    │   │   CEASA (51 cx)  │
│   ───────────    │   │   ───────────    │
│   Também:        │   │   Também:        │
│   • Hortaliças   │   │   • Frutas Vale  │
│   • Osni         │   │                  │
│      [+]         │   │      [+]         │
└──────────────────┘   └──────────────────┘
```

### 3. Ficha do Fornecedor com Histórico Real

Acessível na tela de Fornecedores, mostra:
- Todos os produtos já comprados daquele fornecedor
- Volume total e frequência
- Estatísticas de compras

---

## Implementação Técnica

### Banco de Dados

**Criar View para calcular fornecedor principal:**

```sql
CREATE VIEW product_supplier_rankings AS
SELECT 
  poi.product_id,
  po.supplier_id,
  s.name as supplier_name,
  COUNT(*) as order_count,
  SUM(poi.quantity) as total_quantity,
  MAX(po.created_at) as last_order,
  ROW_NUMBER() OVER (
    PARTITION BY poi.product_id 
    ORDER BY SUM(poi.quantity) DESC
  ) as rank
FROM purchase_order_items poi
JOIN purchase_orders po ON poi.order_id = po.id
JOIN suppliers s ON po.supplier_id = s.id
WHERE po.status IN ('enviado', 'recebido')
GROUP BY poi.product_id, po.supplier_id, s.name;
```

**Criar View simplificada do fornecedor principal:**

```sql
CREATE VIEW product_main_supplier AS
SELECT 
  product_id,
  supplier_id,
  supplier_name,
  total_quantity
FROM product_supplier_rankings
WHERE rank = 1;
```

### Novos Arquivos

| Arquivo | Descrição |
|---------|-----------|
| `src/hooks/useProductSupplierStats.tsx` | Hook para buscar estatísticas produto/fornecedor |
| `src/components/fornecedores/SupplierHistorySheet.tsx` | Sheet com histórico completo do fornecedor |

### Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/pages/Compras.tsx` | Mostrar indicador de fornecedores no grid de produtos |
| `src/pages/Fornecedores.tsx` | Adicionar botão "Ver Histórico" |

---

## Fluxo de Uso

### Cenário 1: Criar pedido
1. Seleciona fornecedor "Frutas do Vale"
2. Vê no grid que Alface já veio desse fornecedor (indicador visual)
3. Vê que Banana tem CEASA como principal (51 cx) vs Frutas Vale (8 cx)
4. Adiciona produtos normalmente
5. Histórico é registrado automaticamente ao enviar

### Cenário 2: Ver histórico do fornecedor
1. Em Fornecedores, clica "Ver Histórico" de "Frutas do Vale"
2. Vê lista de todos produtos já comprados
3. Vê estatísticas: total gasto, média por pedido, produtos mais comprados

### Cenário 3: Decidir de quem comprar
1. Na tela de compras, ao ver produto mostra os fornecedores disponíveis
2. Pode comparar: "Alface - Frutas Vale (7 cx) vs Hortaliças (2 cx)"
3. Informação ajuda na negociação

---

## Benefícios

- **Dados reais**: Fornecedor principal baseado em histórico, não em cadastro manual
- **Nenhuma manutenção**: Atualiza automaticamente conforme novas compras
- **Histórico intacto**: Relatórios continuam funcionando normalmente
- **Visibilidade**: Operador vê de quem já comprou cada produto
- **Simplicidade**: Sem botões extras de vincular/desvincular

---

## Ordem de Implementação

1. **Migration**: Criar views no banco de dados
2. **Hook**: `useProductSupplierStats` para buscar dados
3. **UI Compras**: Indicador visual no grid de produtos
4. **UI Fornecedores**: Sheet de histórico do fornecedor
