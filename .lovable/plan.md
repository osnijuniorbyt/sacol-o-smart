
# Plano de Otimizacao UX Mobile - Compras (iPhone 16 Pro Max)

## Problemas Identificados

### 1. Safe Areas Inadequadas
- Header usa `pt-safe` mas o main content nao considera adequadamente o Dynamic Island do iPhone 16 Pro Max
- Botao fixo "Enviar Pedido" usa `bottom-0` sem considerar safe area inferior
- Drawers e modais podem estar cortando conteudo

### 2. Teclado Virtual Acionado Automaticamente
- Inputs `type="number"` focam automaticamente em certas situacoes
- Select dropdowns podem estar focando inputs internamente
- O hook `useDismissKeyboardOnEnter` pode nao estar cobrindo todos os cenarios

### 3. Altura da Tela / Menu Nao Visivel
- Header mobile com altura fixa nao considera Dynamic Island (iPhone 14 Pro+)
- Main content comeca muito abaixo, empurrando menu para fora da tela
- Falta de scroll-to-top ao navegar entre abas

### 4. Botao Fixo no Rodape
- `pb-24` no container pode nao ser suficiente para o botao fixo + safe area
- Botao pode estar sobrepondo conteudo importante

---

## Solucoes Propostas

### Fase 1: Correcao de Safe Areas (Layout.tsx)

**Alteracoes:**
- Adicionar classe `pt-safe` mais robusta no header mobile considerando Dynamic Island
- Aumentar altura do header de `p-4` para incluir safe area adequada
- Aplicar `pb-safe` no main content de forma mais agressiva

```text
Mudancas em Layout.tsx:
- Header: aumentar altura base + pt-safe mais robusto
- Main: adicionar padding-top para compensar header fixo
```

### Fase 2: Correcao do Botao Fixo (Compras.tsx)

**Alteracoes:**
- Adicionar `pb-safe` no container do botao fixo
- Aumentar `pb-24` para `pb-32` para dar mais espaco
- Garantir que o botao nao sobreponha conteudo critico

```text
Mudancas em Compras.tsx (linha 567):
- div fixed: adicionar pb-safe
- Container principal: aumentar pb-24 para pb-32
```

### Fase 3: Prevencao de Foco Automatico em Inputs

**Alteracoes:**
- Adicionar `inputMode="none"` em inputs que usam teclado numerico customizado
- Usar `readOnly` em inputs que abrem modal numerico
- Remover `autoFocus` de selects/inputs em modais

```text
Arquivos afetados:
- SuggestedOrderDialog.tsx: inputs de quantidade
- ReceivingDialog.tsx: inputs de peso/custo
- EditOrderDialog.tsx: inputs de preco
```

### Fase 4: Otimizacao do Header Mobile

**Alteracoes em index.css:**
- Aumentar `pt-safe` para considerar Dynamic Island (min 3rem)
- Adicionar variavel CSS para altura do header
- Criar classe `.header-height` reutilizavel

```css
.pt-safe {
  padding-top: max(0.75rem, env(safe-area-inset-top));
}

.header-safe {
  height: calc(3.5rem + env(safe-area-inset-top));
}
```

### Fase 5: Scroll e Navegacao

**Alteracoes:**
- Adicionar scroll-to-top automatico ao trocar de aba em Compras
- Prevenir scroll lock quando teclado abre
- Melhorar comportamento de swipe para fechar drawers

---

## Detalhamento Tecnico

### Arquivo: src/index.css

Adicionar:
```css
/* Safe area otimizada para Dynamic Island */
.pt-safe {
  padding-top: max(0.75rem, env(safe-area-inset-top));
}

/* Altura minima para header mobile considerando notch/Dynamic Island */
.header-mobile {
  min-height: calc(3.5rem + env(safe-area-inset-top));
}

/* Safe area lateral para bordas curvas */
.pl-safe {
  padding-left: max(0.5rem, env(safe-area-inset-left));
}

.pr-safe {
  padding-right: max(0.5rem, env(safe-area-inset-right));
}
```

### Arquivo: src/components/Layout.tsx

Mudancas no header mobile:
- Adicionar classe `header-mobile` 
- Garantir `min-h-[60px]` + safe area
- Padding lateral com `pl-safe pr-safe`

### Arquivo: src/pages/Compras.tsx

Mudancas:
- Linha 263: Aumentar `pb-24` para `pb-36`
- Linha 567: Adicionar `pb-safe` no container do botao fixo
- Adicionar `useEffect` para scroll-to-top ao mudar aba

### Arquivo: src/components/compras/SuggestedOrderDialog.tsx

Mudancas:
- Inputs de quantidade: adicionar `inputMode="decimal"` em vez de `type="number"`
- Remover qualquer `autoFocus`
- DrawerContent: garantir safe areas

### Arquivo: src/components/compras/ReceivingDialog.tsx

Mudancas:
- Botoes que abrem modal numerico: garantir que nao focam input nativo
- DrawerFooter: adicionar `pb-safe` mais robusto
- Scroll container: melhorar `overscroll-behavior`

### Arquivo: src/components/compras/EditOrderDialog.tsx

Mudancas:
- Converter para usar Drawer em mobile (como outros dialogos)
- Inputs de preco: usar `inputMode="decimal"`
- Adicionar safe areas adequadas

---

## Ordem de Implementacao

1. **index.css** - Classes de safe area otimizadas
2. **Layout.tsx** - Header mobile corrigido
3. **Compras.tsx** - Botao fixo e padding
4. **SuggestedOrderDialog.tsx** - Inputs e Drawer
5. **ReceivingDialog.tsx** - Safe areas no Drawer
6. **EditOrderDialog.tsx** - Converter para Drawer/Dialog hibrido

---

## Testes Necessarios

1. Testar em iPhone 16 Pro Max (ou simulador com Dynamic Island)
2. Verificar se menu e visivel sem scroll
3. Confirmar que teclado nao abre automaticamente ao entrar na tela
4. Testar fluxo completo: Pedido Sugerido -> Selecionar Fornecedor -> Aplicar -> Enviar
5. Verificar que botao "Enviar Pedido" nao sobrepoe ultimo item da lista
6. Testar todos os drawers (Pedido Sugerido, Recebimento)
