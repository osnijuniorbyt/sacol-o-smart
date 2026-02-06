
# Plano: Código do Vasilhame como Identificador + Cálculos Derivados

## Resumo Executivo

Alterar o sistema de compras para usar o **CÓDIGO** do vasilhame como identificador principal (ex: PL-18), com todos os dados complementares (nome, tara, peso líquido) derivados automaticamente para cálculos de quantidade e custo unitário.

## Lógica de Negócio

```text
┌─────────────────────────────────────────────────────────────┐
│  CADASTRO VASILHAME (fonte de dados)                        │
│  ─────────────────────────────────────────                  │
│  codigo: "PL-18"                                            │
│  nome: "Caixa Plástica 18kg"                                │
│  material: plastico                                         │
│  tara: 2.5 kg                                               │
│  peso_liquido: 18 kg  ← BASE PARA TODOS OS CÁLCULOS         │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  COMPRAS (NewOrderItemRow)                                  │
│  ─────────────────────────                                  │
│  [PL-18 ▼]  Qtd Vol: [5]  R$/Vol: [R$ 108,00]               │
│                                                             │
│  ═══════════════════════════════════════════════════════    │
│  INFO CALCULADA (texto pequeno):                            │
│  🧊 Plástico | Tara 2.5kg | 5 × 18kg = 90kg                 │
│  Custo: R$ 6,00/kg (R$ 540 ÷ 90kg)                          │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  CONFERENTE (ReceivingDialog)                               │
│  ─────────────────────────────                              │
│  Vasilhame: [PL-18 ▼]                                       │
│  Dropdown:                                                  │
│    ┌──────────────────────────────────┐                     │
│    │ PL-18                            │                     │
│    │   Caixa Plástica | 🧊 | 18kg/vol │                     │
│    ├──────────────────────────────────┤                     │
│    │ MD-20                            │                     │
│    │   Caixa Madeira | 🪵 | 20kg/vol  │                     │
│    └──────────────────────────────────┘                     │
│                                                             │
│  ═══════════════════════════════════════════════════════    │
│  Qtd Total Esperada: 90 kg (5 vol × 18kg)                   │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  PROTOCOLO (output final)                                   │
│  ─────────────────────────                                  │
│  Produto: Alface Crespa                                     │
│  Vasilhame: PL-18 (Caixa Plástica)                          │
│  ─────────────────────────────────                          │
│  5 vol × R$ 108,00 = R$ 540,00                              │
│  Qtd Total: 90 kg                                           │
│  CUSTO UNITÁRIO: R$ 6,00/kg  ← OUTPUT PRINCIPAL             │
└─────────────────────────────────────────────────────────────┘
```

## Fórmulas de Cálculo

| Campo | Fórmula | Exemplo |
|-------|---------|---------|
| Qtd Unitária Total | `qtd_volumes × peso_liquido_vasilhame` | 5 × 18kg = 90kg |
| Custo Unitário | `(qtd_volumes × preco_volume) ÷ qtd_unitaria_total` | R$ 540 ÷ 90kg = R$ 6,00/kg |

## Mudanças por Componente

### 1. NewOrderItemRow.tsx

**Alterações:**
- Expandir interface `Packaging` para incluir `codigo`, `material`, `peso_liquido`
- Select mostra CÓDIGO no trigger (ex: "PL-18")
- Dropdown mostra: código em destaque + nome + material + peso líquido
- Adicionar linha de info calculada abaixo dos campos
- Mostrar custo unitário derivado em texto pequeno

**Antes:**
```text
┌──────────────────────┐
│ Caixa Madeira 20kg   │  ← nome completo
└──────────────────────┘
```

**Depois:**
```text
┌─────────┐
│ PL-18   │  ← código compacto
└─────────┘
🧊 Plástico | 5×18kg=90kg | R$ 6,00/kg
```

### 2. ReceivingDialog.tsx (linhas 585-608)

**Alterações:**
- Select mostra CÓDIGO no trigger
- Dropdown expandido com código + nome + tipo + peso líquido
- Adicionar campo calculado "Qtd Esperada" baseado no peso líquido

**Dropdown Proposto:**
```text
┌────────────────────────────────────┐
│ PL-18                              │
│   🧊 Caixa Plástica | 18kg/vol     │
├────────────────────────────────────┤
│ MD-20                              │
│   🪵 Caixa Madeira | 20kg/vol      │
└────────────────────────────────────┘
```

### 3. Protocolo.tsx

**Alterações:**
- Exibir código do vasilhame ao lado do nome do produto
- Mostrar custo unitário calculado como destaque (output principal)
- Adicionar linha de detalhe: `X vol × Ykg = Zkg total`

## Arquivos a Modificar

| Arquivo | Tipo | Descrição |
|---------|------|-----------|
| `src/components/compras/NewOrderItemRow.tsx` | Modificar | Select por código + info calculada |
| `src/components/compras/ReceivingDialog.tsx` | Modificar | Select por código + qtd esperada |
| `src/pages/Protocolo.tsx` | Modificar | Custo unitário como output |

## Detalhes Técnicos

### Interface Packaging Atualizada (NewOrderItemRow)

```typescript
interface Packaging {
  id: string;
  codigo: string | null;
  name: string;
  tare_weight: number;
  peso_liquido: number;
  material: PackagingMaterial;
}
```

### Lógica de Fallback para Código

```typescript
const displayCode = pkg.codigo || pkg.name.slice(0, 6).toUpperCase();
```

### Cálculo de Info Derivada

```typescript
const selectedPkg = packagings.find(p => p.id === displayPackaging);
const qtdUnitaria = selectedPkg ? item.quantity * selectedPkg.peso_liquido : 0;
const custoUnitario = qtdUnitaria > 0 ? (item.quantity * (item.unit_price || 0)) / qtdUnitaria : 0;
```

### Emoji por Material (consistente com Vasilhames.tsx)

```typescript
const materialIcon = {
  plastico: '🧊',
  madeira: '🪵',
  papelao: '📦',
  isopor: '❄️',
};
```

## Fluxo Visual Completo

```text
COMPRAS                    CONFERENTE                 PROTOCOLO
────────                   ──────────                 ─────────
                           
[PL-18 ▼]                  [PL-18 ▼]                  PL-18 (Caixa Plástica)
Qtd: 5                     Esperado: 90kg             
R$/Vol: 108                Recebido: ___              5 × R$ 108 = R$ 540
                                                      90kg total
─────────────              ─────────────              ─────────────
🧊 Plástico               🧊 Caixa Plástica          CUSTO: R$ 6,00/kg
5×18kg = 90kg             18kg por volume            
R$ 6,00/kg                                           
```

## Validações

- Vasilhames sem código mostrarão nome truncado
- Campos de cálculo são somente leitura (derivados)
- Custo unitário exibe "—" se peso líquido for zero
