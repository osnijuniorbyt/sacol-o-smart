
# Plano: Fotos de Produtos com Auto-Ajuste por Contexto

## Resumo da Solução

A melhor abordagem é gerar **uma única imagem de qualidade** (512x512 pixels) usando Gemini e deixar o **CSS/Tailwind redimensionar automaticamente** conforme o contexto. Isso é mais eficiente que manter múltiplas versões da mesma imagem.

---

## Por que uma imagem com auto-ajuste?

| Abordagem | Vantagens | Desvantagens |
|-----------|-----------|--------------|
| **Múltiplos tamanhos** | Carregamento otimizado | Mais complexo, mais armazenamento |
| **Uma imagem + CSS** ✅ | Simples, uma fonte de verdade | Imagem um pouco maior que necessário |

Para o uso em hortifruti (poucos produtos), a diferença de performance é insignificante. O CSS moderno redimensiona imagens de forma eficiente.

---

## Tamanhos por Contexto

```text
┌────────────────────────────────────────────────────────┐
│               TAMANHOS DE EXIBIÇÃO                     │
├────────────────────────────────────────────────────────┤
│                                                        │
│   PDV (CartItemRow)     →  48x48 px  (miniatura)      │
│   Compras (grid)        →  40x40 px  (miniatura)      │
│   Pedido Sugerido       →  32x32 px  (compacto)       │
│   Cadastro de Produtos  →  200x200 px (edição)        │
│   Detalhes do Produto   →  300x300 px (visualização)  │
│                                                        │
│   Imagem Original (Storage)  →  512x512 px            │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

## Padrão de Geração Gemini

Para garantir consistência visual, o prompt para o Gemini seguirá um padrão fixo:

```
"Create a simple, clean illustration of a [PRODUTO] on a white background. 
Style: flat design, minimalist, vibrant colors. 
The item should be centered and fill 80% of the frame. 
No text, no shadows, no decorations."
```

Isso garante:
- Fundo branco (funciona em light/dark mode)
- Estilo consistente entre todos os produtos
- Centralizado (funciona bem em qualquer tamanho)
- Cores vibrantes (identificação rápida)

---

## Alterações Necessárias

### 1. Banco de Dados

Adicionar coluna `image_url` na tabela `products`:

```sql
ALTER TABLE products 
ADD COLUMN image_url TEXT DEFAULT NULL;
```

### 2. Storage Bucket

Criar bucket para armazenar as imagens:

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true);

-- Política de leitura pública
CREATE POLICY "Public read product images" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'product-images');

-- Política de escrita (usuários autenticados ou público para teste)
CREATE POLICY "Public write product images" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'product-images');
```

### 3. Componente de Imagem Reutilizável

Criar `src/components/ui/product-image.tsx`:

```typescript
// Componente que auto-ajusta tamanho via props
interface ProductImageProps {
  src: string | null;
  alt: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

// Tamanhos pré-definidos
const sizes = {
  xs: 'h-8 w-8',    // 32px - Pedido Sugerido
  sm: 'h-10 w-10',  // 40px - Compras grid
  md: 'h-12 w-12',  // 48px - PDV
  lg: 'h-24 w-24',  // 96px - Listagens
  xl: 'h-48 w-48',  // 192px - Cadastro/Edição
};
```

### 4. Edge Function para Gerar Imagem

Criar `supabase/functions/generate-product-image/index.ts`:

- Recebe nome do produto
- Chama Gemini com prompt padronizado
- Faz upload para Storage
- Retorna URL da imagem

### 5. Atualizar Componentes Existentes

**CartItemRow.tsx (PDV)**:
```tsx
<ProductImage 
  src={item.product.image_url} 
  alt={item.product.name}
  size="md"  // 48px
/>
```

**Compras.tsx (Grid de produtos)**:
```tsx
<ProductImage 
  src={product.image_url} 
  alt={product.name}
  size="sm"  // 40px
/>
```

**SuggestedOrderDialog.tsx**:
```tsx
<ProductImage 
  src={item.product_image} 
  alt={item.product_name}
  size="xs"  // 32px
/>
```

### 6. Tela de Cadastro de Produtos

Adicionar seção para:
- Upload manual de foto
- Botão "Gerar Ilustração com IA"
- Preview da imagem atual

---

## Fluxo de Geração de Imagem

```text
┌─────────────────────────────────────────────────────────┐
│              FLUXO: GERAR IMAGEM DO PRODUTO             │
├─────────────────────────────────────────────────────────┤
│                                                         │
│   [Usuário clica "Gerar Ilustração"]                   │
│               │                                         │
│               ▼                                         │
│   [Frontend chama Edge Function]                       │
│               │                                         │
│               ▼                                         │
│   [Edge Function monta prompt padrão]                  │
│   "Create illustration of BANANA..."                   │
│               │                                         │
│               ▼                                         │
│   [Chama Gemini Image Generation]                      │
│               │                                         │
│               ▼                                         │
│   [Recebe imagem Base64]                               │
│               │                                         │
│               ▼                                         │
│   [Upload para Storage Bucket]                         │
│   bucket: product-images/banana-abc123.webp            │
│               │                                         │
│               ▼                                         │
│   [Retorna URL pública]                                │
│               │                                         │
│               ▼                                         │
│   [Atualiza products.image_url no banco]               │
│               │                                         │
│               ▼                                         │
│   [Frontend exibe imagem no cadastro]                  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Placeholder para Produtos sem Foto

Quando `image_url` for null, exibir:
- Ícone da categoria (🍎 frutas, 🥬 verduras, etc.)
- Ou primeira letra do produto em círculo colorido
- Estilo consistente com o design atual

---

## Estimativa de Implementação

| Etapa | Complexidade |
|-------|--------------|
| Migration + Storage | Simples |
| Componente ProductImage | Simples |
| Edge Function Gemini | Média |
| Integração nos componentes | Simples |
| Tela de upload/geração | Média |

**Ordem sugerida**:
1. Migration e Storage
2. Componente ProductImage com placeholder
3. Integrar nos componentes (PDV, Compras)
4. Edge Function de geração
5. Tela de upload/edição

---

## Impacto no Sistema

| Aspecto | Impacto |
|---------|---------|
| Performance | Mínimo (imagens pequenas, lazy loading) |
| Armazenamento | ~50KB por produto (512x512 WebP) |
| Custo | Baixo (Gemini é econômico para imagens) |
| UX | Melhora significativa na identificação visual |

---

## Nota sobre Fotos de Recebimento

Este plano foca **apenas nas fotos de produtos** (ilustrações). As fotos de comprovante de recebimento são um recurso separado que pode ser implementado posteriormente seguindo a mesma arquitetura de Storage.
