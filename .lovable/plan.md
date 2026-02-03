
# Plano: Integração Perfeita da Logo sem Duplicação de Fundo

## Diagnóstico do Problema

O container da logo (linhas 102-142) tem seu **próprio fundo com gradiente** que está criando uma área visualmente separada do restante do card, mesmo que os gradientes sejam similares. Isso acontece porque:

1. O card principal já tem um fundo com gradiente + textura de ruído (linhas 93-98)
2. O container da logo adiciona **outro gradiente por cima**, criando uma diferença sutil de tonalidade
3. A transição entre os dois fundos cria o efeito de "quadrante"

## Solução

Remover o fundo duplicado do container da logo e deixar que o **fundo único do card** (com sua textura) apareça por trás. Assim, a logo vai "flutuar" sobre exatamente o mesmo fundo que o resto do formulário.

## Alterações Técnicas

### 1. Atualizar `src/pages/Login.tsx`

**Antes (linha 104):**
```text
<div className="relative bg-gradient-to-b from-[hsl(40,35%,96%)] via-[hsl(40,30%,94%)] to-[hsl(40,25%,90%)] py-8 px-4">
```

**Depois:**
```text
<div className="relative py-8 px-4">
```

Removemos o `bg-gradient-to-b...` do container da logo. Isso faz com que o fundo do card (que já inclui o gradiente E a textura de ruído) seja visível diretamente atrás da logo.

### 2. Manter todos os efeitos decorativos

Os seguintes elementos continuam intactos:
- Borda metálica inferior com shimmer (linhas 105-113)
- Efeito de luz sutil no topo (linhas 115-116)
- Detalhes laterais metálicos com shimmer (linhas 124-141)
- Bordas arredondadas do card (linha 91: `rounded-2xl`)

## Resultado Esperado

- A área da logo terá **exatamente** a mesma cor e textura que a área do formulário
- Nenhuma linha ou diferença de tonalidade visível
- Os efeitos premium (shimmer, bordas metálicas) são preservados
- A logo transparente se integra perfeitamente ao fundo texturizado

## Arquivos a Modificar

- `src/pages/Login.tsx` - Remover gradiente duplicado do container da logo (1 linha)
