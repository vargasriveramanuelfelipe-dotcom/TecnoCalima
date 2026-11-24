# NOVA TECH

Tienda de tecnología construida con React y Vite. Incluye catálogo con búsqueda, filtros y orden, bolsa persistente, creación de pedidos y un panel de administración para productos y estados de pedidos. Funciona de inmediato con datos de demostración y almacenamiento local; Supabase es opcional.

## Requisitos

- Node.js 18 o posterior
- npm

## Ejecutar localmente

```bash
npm install
npm run dev
```

Abre la URL que muestra Vite (normalmente `http://localhost:5173`). Para generar y previsualizar la versión de producción:

```bash
npm run build
npm run preview
```

## Uso de la tienda

- Usa la búsqueda, categorías y selector de orden para encontrar productos.
- Añade artículos a la bolsa y completa el formulario para crear un pedido de demostración.
- Entra en **Acceso administrador** desde la barra superior para añadir/editar/eliminar productos y cambiar estados de pedidos.
- Sin credenciales de Supabase, el catálogo, la bolsa y los pedidos se guardan en `localStorage` del navegador actual.

## Supabase opcional

1. Crea un proyecto en Supabase.
2. Ejecuta `supabase/schema.sql` en el SQL Editor.
3. Copia `.env.example` a `.env.local` y completa `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` con los valores de tu proyecto.
4. Reinicia `npm run dev`.

La aplicación utiliza la clave publicable/anon desde el navegador; nunca pongas una `service_role` ni otros secretos en variables `VITE_`. El esquema habilita RLS y incluye políticas públicas para que esta demo pueda crear, editar y eliminar productos y pedidos desde el navegador. Para un entorno real, reemplaza esas políticas por autenticación y permisos adecuados. El panel de administración de esta demo no implementa autenticación, así que no lo expongas como una consola pública de producción.

Las imágenes de demostración se sirven desde DummyJSON. Los productos nuevos aceptan URL de imagen accesibles por el navegador; usa un bucket de Storage público solo si has configurado sus políticas de acceso apropiadamente.

## Despliegue

Vite produce los estáticos en `dist/`. El proyecto se puede desplegar en Vercel con el preset de Vite; no requiere configuración adicional. Define las variables de entorno de Supabase en el panel del proveedor únicamente si vas a habilitar esa integración.
