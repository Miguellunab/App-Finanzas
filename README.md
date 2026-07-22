# FinanzasAI

App Astro SSR con React islands para registrar gastos, revisar balances por billetera y automatizar gastos fijos.

## Secciones

- Inicio: balance, movimientos recientes y chat con IA para registrar transacciones.
- Historial: movimientos filtrables por tipo.
- Billeteras: cuentas, tarjetas, bolsillos y bovedas con logos y balance.
- Categorias: categorias de ingresos/gastos.
- Estadisticas: resumen visual de ingresos, gastos y distribucion.
- Suscripciones: recordatorios de gastos fijos mensuales para registrar manualmente.

## Pagos semiautomaticos

Las suscripciones se crean desde el menu lateral y funcionan como atajos: cuando llega su fecha aparecen en Inicio para registrar el pago, elegir la billetera de origen y ajustar el valor. `Cancelar` salta ese periodo sin crear un gasto.

En Inicio tambien aparece una tarjeta para pagar tarjetas de credito durante su ventana entre corte y fecha limite. El pago se registra como transferencia desde la billetera elegida hacia la tarjeta y permite incluir tarifas adicionales. Cada periodo se guarda una sola vez en un ledger para evitar duplicados.

Los endpoints GET son de solo lectura y el antiguo `POST /api/subscriptions/process` ya no cobra automaticamente; solo reporta cuantos periodos siguen pendientes.

Eliminar una transaccion vinculada a un pago no regenera el periodo: el ledger conserva que ya fue atendido.

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
