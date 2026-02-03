# Memory: design/iphone-dynamic-island-fixes
Updated: now

Otimizações de UX para iPhone 16 Pro Max e dispositivos com Dynamic Island:

## Safe Areas Implementadas
- `.header-mobile`: min-height calculada com safe-area-inset-top para Dynamic Island
- `.fixed-bottom-safe`: padding-bottom com safe-area-inset-bottom para botões fixos
- `.pl-safe` / `.pr-safe`: safe areas laterais para bordas curvas

## Prevenção de Teclado Virtual Automático
- Inputs de preço/quantidade usam `inputMode="decimal"` ou `inputMode="numeric"` em vez de `type="number"`
- Evita que o teclado virtual abra automaticamente ao navegar
- Permite melhor controle do formato numérico sem forçar teclado

## Componentes Atualizados
- Layout.tsx: Header mobile com `header-mobile pl-safe pr-safe`
- Compras.tsx: Botão fixo com `fixed-bottom-safe pl-safe pr-safe`, container com `pb-36`
- SuggestedOrderDialog.tsx: DrawerFooter com `fixed-bottom-safe`, inputs sem type=number
- ReceivingDialog.tsx: DrawerFooter com `fixed-bottom-safe`, inputs com inputMode
- EditOrderDialog.tsx: Convertido para híbrido Drawer/Dialog com safe areas

## Resultado
- Menu visível sem scroll em iPhone 16 Pro Max
- Teclado não abre automaticamente ao entrar nas telas
- Botão "Enviar Pedido" não sobrepõe conteúdo
- Drawers respeitam safe areas em todos os dispositivos
