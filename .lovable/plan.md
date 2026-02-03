
# Plano: Corrigir Tonalidade do Fundo da Logo

## Diagnóstico

O fundo atual da logo (`logo-hortii-transparent.png`) está com uma cor bege/creme **mais escura e saturada** do que as cores do card:
- Card: `hsl(40,35%,96%)` = ~95-96% luminosidade (muito claro, quase branco)
- Logo atual: Aparenta ter ~85-88% luminosidade (visivelmente mais amarelada/escura)

## Solução Proposta

Regenerar a logo com as **cores exatas** do gradiente do card.

### Especificações Técnicas

A imagem deve ter um gradiente vertical com estas cores EXATAS:
- **Topo**: `#F9F6F0` (hsl(40,35%,96%))
- **Centro**: `#F3EEE4` (hsl(40,30%,94%))
- **Base**: `#EDE8DD` (hsl(40,25%,90%))

### Arquivo a Modificar

- `src/assets/logo-hortii-transparent.png` - Aplicar gradiente com as cores corretas

## Resultado Esperado

A logo terá **exatamente** a mesma tonalidade que o card, eliminando qualquer diferença visual entre a área da logo e o restante do container.
