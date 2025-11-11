# Modelo Entidad Relacion

![Modelo ER](./backend/docs/Entidad-Relacion.svg)

Este diagrama representa las entidades y sus relaciones en la base de datos del proyecto. Proporcionando una visión clara de cómo se estructuran los datos y cómo interactúan entre sí.

# Arquitectura del Proyecto

Monorepo con frontend (Next.js) y backend (NestJS). Estilo: API-first, SSR en Next para páginas públicas, backend REST/GraphQL para datos y autenticación.

Estructura de carpetas:

```
RutaLink/
├─ backend/ # NestJS (API)
├─ frontend/ # Next.js (UI + posible BFF)
├─ packages/ # (opcional) shared types / utils
├─ docker-compose.yml
└─ .github/workflows/
```

# Documentación de la API
http://localhost:3030/api-docs
