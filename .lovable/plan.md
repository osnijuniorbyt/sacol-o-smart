
# Reimplementacao Profissional: Logo + Layout Otimizado

## Visao Geral

Transformacao completa da identidade visual usando as especificacoes tecnicas oficiais do designer, corrigindo problemas de safe-area e otimizando o dashboard para mobile.

---

## 1. Correcao Safe Area (Notch/Dynamic Island)

### Problema
O header mobile esta sendo cortado na area do notch do celular.

### Solucao
Adicionar padding-top seguro no header mobile.

### Arquivo: `src/components/Layout.tsx`

```tsx
// ANTES (linha 114)
<header className="lg:hidden flex items-center justify-between p-3 border-b...">

// DEPOIS
<header className="lg:hidden flex items-center justify-between p-3 pt-safe border-b...">
```

---

## 2. Logo Profissional - Especificacoes do Designer

### Cores Oficiais
- Verde Hortii: `#006837`
- Laranja Campos: `#F39200`
- Branco: `#FFFFFF`

### Fontes Google
- "HORTII" -> Merriweather (900)
- "campos" -> Nunito (700)
- Tagline -> Roboto (500)

### Arquivo: `index.html`
Adicionar import das fontes:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Merriweather:wght@900&family=Nunito:wght@700&family=Roboto:wght@500&display=swap" rel="stylesheet">
```

Atualizar theme-color:
```html
<meta name="theme-color" content="#006837" />
```

### Arquivo: `src/components/BrandLogo.tsx`
Recriar completamente com:

1. **SVG do Icone** - Fruta laranja (#F39200) com H branco e folhas verdes (#006837)
2. **Tipografia HTML** - Usar as fontes importadas
3. **Tamanhos Otimizados**:
   - `sm`: Icone menor para header mobile
   - `md`: Logo completa para sidebar
   - `lg`: Logo grande para login
   - `xl`: Logo extra grande

Estrutura do novo SVG:
```text
     Folhas (#006837)
        /\  /\
       /  \/  \
    +-----------+
    |   Fruta   |
    |  #F39200  |
    |    ___    |
    |   | H |   | (H em branco)
    |   |___|   |
    +-----------+
```

---

## 3. Espaco Maior para Logo no Layout

### Arquivo: `src/components/Layout.tsx`

#### Header Mobile (linha 114-128)
- Aumentar altura do header: `p-3` -> `p-4`
- Logo maior no centro
- Mais destaque visual

#### Sidebar (linha 173-187)
- Aumentar padding da area da logo: `p-4` -> `p-6`
- Logo centralizada com mais espaco
- Separador visual mais definido

---

## 4. Dashboard Compacto

### Arquivo: `src/pages/Dashboard.tsx`

#### Cards Principais (linhas 203-271)
Reduzir tamanho e espacamento:
```tsx
// ANTES
<div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">

// DEPOIS - gap menor
<div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
```

Cards menores:
```tsx
// ANTES
<CardTitle className="text-xs sm:text-sm font-medium">
<div className="text-xl sm:text-2xl font-bold">

// DEPOIS - texto menor
<CardTitle className="text-[10px] sm:text-xs font-medium">
<div className="text-lg sm:text-xl font-bold">
```

#### Graficos (linhas 282, 356)
Reduzir altura:
```tsx
// ANTES
<div className="h-[250px] sm:h-[300px]">

// DEPOIS
<div className="h-[200px] sm:h-[250px]">
```

---

## 5. PWA Manifest - Cores Oficiais

### Arquivo: `vite.config.ts`
Atualizar cores do manifest:
```ts
manifest: {
  theme_color: "#006837",  // Verde oficial
  background_color: "#ffffff",
  // ...
}
```

---

## Resumo dos Arquivos a Modificar

| Arquivo | Alteracoes |
|---------|------------|
| `index.html` | Fontes Google + theme-color |
| `src/components/BrandLogo.tsx` | Reescrita completa com design oficial |
| `src/components/Layout.tsx` | Safe area + espaco logo |
| `src/pages/Dashboard.tsx` | Cards e graficos menores |
| `vite.config.ts` | Cores PWA |

---

## Resultado Esperado

- Header nao cortado pelo notch
- Logo profissional com cores #006837 e #F39200
- Fontes Merriweather, Nunito e Roboto
- Qualidade infinita (SVG escalavel)
- Dashboard mais compacto e confortavel no mobile
- PWA com identidade visual consistente
