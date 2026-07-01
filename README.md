# FinanzasAI

App Astro SSR con React islands para registrar gastos, revisar balances por billetera y automatizar gastos fijos.

## Secciones

- Inicio: balance, movimientos recientes y chat con IA para registrar transacciones.
- Historial: movimientos filtrables por tipo.
- Billeteras: cuentas, tarjetas, bolsillos y bovedas con logos y balance.
- Categorias: categorias de ingresos/gastos.
- Estadisticas: resumen visual de ingresos, gastos y distribucion.
- Suscripciones: gastos fijos mensuales cobrados a una billetera por dia del mes.

## Suscripciones

Las suscripciones se crean desde el menu lateral. Cada una guarda nombre, dia de cobro del 1 al 31, valor y billetera. Al consultar `/api/subscriptions`, la app registra los cobros vencidos como gastos y actualiza la proxima fecha mensual.

## Comandos

```sh
npm install
npm run dev
npm run build
npm run preview
npm run seed
npm run db:studio
```

No hay suite de tests configurada. Usa `npm run build` como verificacion minima.

## Estructura

- `src/pages/`: rutas Astro y endpoints API.
- `src/components/`: pantallas y componentes React.
- `src/lib/`: Drizzle, schema y utilidades compartidas.
- `public/`: favicons y logos estaticos.
- `scripts/seed.ts`: datos locales/demo.
