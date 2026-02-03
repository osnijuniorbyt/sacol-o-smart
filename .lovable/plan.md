
# Correcao: Logo Profissional 3D Metalica

## Problema Identificado

O SVG criado e amador e nao representa a qualidade profissional da marca "Horti Campos". A logo real (IMG_8196.jpeg) possui:
- Efeito 3D metalico dourado/bronze
- Textura profissional com sombreamento
- Folhas verdes realistas
- Acabamento premium

## Solucao

Substituir o SVG simplista pela imagem real da logo em todos os lugares.

---

## Arquivos a Modificar

### 1. Copiar Logo para o Projeto
- Copiar `user-uploads://IMG_8196.jpeg` para `src/assets/logo-hortii-3d.png`

### 2. Gerar Icones PWA
- Criar versao 192x192 para `public/pwa-192x192.png`
- Criar versao 512x512 para `public/pwa-512x512.png`
- Fundo branco com a logo centralizada (formato quadrado para icone de app)

### 3. Atualizar BrandLogo.tsx
Substituir o SVG amador por um componente que usa a imagem real:

```tsx
// Usar a imagem 3D profissional
import logoHortii from '@/assets/logo-hortii-3d.png';

function LogoIcon({ size }: { size: number }) {
  return (
    <img 
      src={logoHortii} 
      alt="Horti Campos" 
      width={size} 
      height={size}
      className="object-contain"
    />
  );
}
```

### 4. Ajustes Visuais
- Remover o codigo SVG complexo e substituir pelo uso da imagem
- Manter os tamanhos configurados (sm, md, lg, xl)
- Garantir que a imagem escale bem em todos os contextos

---

## Resultado Esperado

- Header mobile: Logo 3D metalica profissional
- Sidebar: Logo 3D com texto "HORTII campos"
- PWA icons: Logo 3D no icone do app
- Aparencia digna de uma empresa profissional

---

## Secao Tecnica

| Arquivo | Alteracao |
|---------|-----------|
| `src/assets/logo-hortii-3d.png` | Nova imagem da logo |
| `public/pwa-192x192.png` | Icone PWA pequeno |
| `public/pwa-512x512.png` | Icone PWA grande |
| `src/components/BrandLogo.tsx` | Usar imagem ao inves de SVG |
