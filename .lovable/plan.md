
# Plano: Integração Perfeita da Logo com o Container Premium

## Diagnóstico do Problema

A logo foi gerada com um fundo creme sólido (`#F5F0E6`), mas o container usa um gradiente diferente. Isso cria uma "caixa" visível ao redor da logo porque as cores não coincidem exatamente.

## Solução

Alinhar o fundo do container da logo com a cor exata do fundo da imagem (`#F5F0E6`), removendo o gradiente na área da logo.

## Alterações Técnicas

### 1. Atualizar `src/pages/Login.tsx`

Modificar o container da logo (linhas 104) para usar cor sólida que corresponda exatamente ao fundo da imagem:

```text
Antes:
bg-gradient-to-b from-[hsl(40,30%,96%)] via-[hsl(40,25%,93%)] to-[hsl(40,20%,90%)]

Depois:
bg-[#F5F0E6]
```

Isso garante que o fundo do container seja **idêntico** ao fundo da imagem PNG, criando integração invisível.

### 2. Ajustar transição para o resto do card

Para manter a transição suave entre a área da logo (cor sólida) e o resto do card (gradiente), adicionar um degradê sutil na borda inferior do container da logo.

## Resultado Esperado

- Logo aparecerá perfeitamente integrada ao container
- Nenhuma "caixa" ou bordas visíveis ao redor da imagem
- Transição suave para o resto do formulário

## Arquivos a Modificar

- `src/pages/Login.tsx` (1 arquivo)
