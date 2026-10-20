# Marcopolo 🧭🍲

Evento recurrente: en cada edición seguimos una parada del viaje de Marco Polo (1271–1295), cocinamos recetas inspiradas en ese lugar y hacemos un número artístico alusivo.

**Página:** https://sanmope.github.io/marcopolo/

## Estructura
| Qué | Dónde |
|---|---|
| Página (cuándo, qué, ruta, acciones) | `index.html` |
| Paradas, recetas, arte, fechas | `data/viajes.json` |
| Lista de acciones | `data/acciones.json` |
| Notas de brainstorming | `brainstorming/` |
| Propuestas y discusión | [Issues](https://github.com/sanmope/marcopolo/issues) (plantillas: receta, número artístico, acción) |

## El rompecabezas
El mapa es un rompecabezas: cada parada es una pieza. En cada evento los invitados reciben la pieza de ese lugar y lo van completando. Los eventos **no** siguen el orden del viaje (arrancamos en China, donde termina el primer viaje de Niccolò y Maffeo y empieza la historia de Marco).

- Las ediciones se cargan en `evento.ediciones` de `data/viajes.json` (`parada`, `fecha`, `hora`, `sede`).
- Cuando un evento ya se hizo, poner `"estado": "hecha"` en su parada: la pieza se destapa en el mapa.
- `?mapa=completo` en la URL abre el mapa sin tapar.

## Cómo se usa
- **Proponer**: abrir un issue con la plantilla. Se vota con 👍.
- **Decidir**: editar el JSON. En `viajes.json`, marcar `"elegida": true` en una receta o idea de arte la muestra en "Qué comemos" / "Número artístico"; `estado` de la parada: `idea` → `elegida` → `hecha`; `fecha` en formato `AAAA-MM-DD`. La próxima edición sin hacer es la que se muestra arriba.
- **Ver local**: `python3 -m http.server` y abrir http://localhost:8000.

## Próximamente
Interfaz para invitados: invitaciones, promoción, redes y planificación.
