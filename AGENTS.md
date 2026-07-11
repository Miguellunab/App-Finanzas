# Guía para agentes

## Antes de cambiar código

- Lee `README.md`, este archivo y las skills locales aplicables en `.agents/skills/`.
- El proyecto usa Astro SSR, React 19, Tailwind CSS 4, Drizzle ORM, Neon PostgreSQL y Groq.
- Conserva la interfaz orientada a móvil y el diseño oscuro existente.
- Revisa todos los usos de un campo o helper antes de modificarlo; los balances son lógica sensible.

## Skills locales

Las skills del stack están versionadas en `.agents/skills/`. Selecciona solo las relevantes para la tarea y lee su `SKILL.md` completo antes de actuar. Las más habituales son:

- `astro`: rutas, páginas, endpoints y configuración Astro.
- `react-best-practices` y `composition-patterns`: componentes e islas React.
- `frontend-design`, `accessibility` y `tailwind-css-patterns`: cambios de interfaz móvil.
- `drizzle` y `neon-postgres`: esquema, consultas y persistencia.
- `nodejs-backend-patterns` y `nodejs-best-practices`: endpoints y lógica de servidor.
- `deploy-to-vercel`: despliegues o configuración del adaptador.

Los enlaces de `.claude/skills/` apuntan a las mismas skills. Para volver a detectar o actualizar la selección local, ejecuta:

```sh
npx autoskills -y
```

## Ponytail

El plugin global `ponytail@ponytail` estaba instalado al escribir esta guía. Si está disponible en la sesión, úsalo en tareas de código con intensidad `full` por defecto y lee primero su `SKILL.md`. Su criterio principal es implementar la solución mínima correcta: reutilizar patrones existentes, evitar dependencias y abstracciones innecesarias, eliminar código muerto y validar el resultado. No debe simplificar validación, seguridad, accesibilidad ni lógica que pueda causar pérdida de datos.

Si el plugin no aparece después de abrir una sesión nueva, reinicia Codex o comprueba la instalación; no bloquees el trabajo por ello y aplica los mismos principios manualmente.

## Entorno y validación

Crea `.env` a partir de `.env.example`; nunca lo versiones. Se requieren:

- `DATABASE_URL` para Neon PostgreSQL.
- `GROQ_API_KEY` para interpretación y transcripción con IA.

Comandos principales:

```sh
npm install
npm run dev
npm run build
```

No hay suite de tests configurada. La verificación mínima requerida es `npm run build`. `astro check` requiere `@astrojs/check`, que actualmente no es dependencia del proyecto. El Node local puede mostrar advertencias con Node 26 porque Vercel utiliza Node 24; esas advertencias no equivalen a un fallo del build.

## Decisiones actuales del producto

- El Home debe mantener este orden: balance, registro con IA y últimos movimientos.
- Las gráficas viven en Estadísticas, están pensadas para consulta móvil y no deben capturar clics, hover ni gestos de scroll.
- La leyenda del donut debe permanecer visible sin interacción.
- `transactions.expenseKind` también guarda la clasificación especial de ingresos por compatibilidad con el esquema actual:
  - `fixed`: gasto fijo.
  - `variable`: gasto variable.
  - `mismatch`: ajuste por faltante (gasto).
  - `surplus`: ajuste por sobrante (ingreso).
- Faltantes y sobrantes deben mostrarse por separado en Estadísticas.
- Las suscripciones vencidas se cobran al consultar ciertos endpoints; revisa `src/lib/subscriptions.ts` antes de tocar ese flujo.
- Los cambios de transacciones deben conservar la reversión y aplicación correcta de balances, incluidas transferencias y tarjetas de crédito.

## Git

- No versiones `.env`, secretos, `dist/` ni dependencias instaladas.
- Conserva cambios ajenos presentes en el worktree.
- Ejecuta `git diff --check` y `npm run build` antes de entregar cambios de código.
