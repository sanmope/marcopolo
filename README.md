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

## Cómo se usa
- **Proponer**: abrir un issue con la plantilla. Se vota con 👍.
- **Decidir**: editar el JSON. En `viajes.json`, marcar `"elegida": true` en una receta o idea de arte la muestra en "Qué comemos" / "Número artístico"; `estado` de la parada: `idea` → `elegida` → `hecha`; `fecha` en formato `AAAA-MM-DD`. `evento.proxima_parada` indica qué parada se muestra arriba.
- **Ver local**: `python3 -m http.server` y abrir http://localhost:8000.

## Próximamente
Interfaz para invitados: invitaciones, promoción, redes y planificación.
