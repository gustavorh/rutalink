# Módulo de Gestión de Choferes - Frontend

## Descripción General

Este módulo frontend implementa una interfaz completa para la gestión centralizada de choferes (conductores) en el sistema de transporte. Permite administrar información personal, licencias, documentación, asignaciones de vehículos y seguimiento de operaciones.

## Características Implementadas

### ✅ 1. Gestión Completa de Choferes

- **Registro de Datos Personales**

  - RUT (identificación única)
  - Nombre y apellido
  - Email y teléfono
  - Fecha de nacimiento
  - Dirección completa (calle, ciudad, región)
  - Contacto de emergencia

- **Información de Licencia**

  - Tipo de licencia (A1, A2, A3, A4, A5, B, C, D, E, F)
  - Número de licencia
  - Fecha de vencimiento con alertas visuales
  - Validación automática de vigencia

- **Clasificación**
  - Chofer interno/externo
  - Empresa externa (si aplica)
  - Estado activo/inactivo
  - Notas adicionales

### ✅ 2. Interfaz de Lista con Filtros Avanzados

- **Búsqueda**

  - Por nombre, RUT o email
  - Búsqueda en tiempo real

- **Filtros**

  - Estado (activo/inactivo)
  - Tipo (interno/externo)
  - Tipo de licencia
  - Combinación de múltiples filtros

- **Visualización**
  - Tabla paginada con 10 registros por página
  - Badges de estado visual
  - Alertas de licencias vencidas
  - Información de empresa para choferes externos

### ✅ 3. Vista Detallada del Chofer

La página de detalle incluye **5 pestañas principales**:

#### a) Información General

- Datos personales completos
- Información de licencia con estado de vigencia
- Contacto de emergencia
- Clasificación y notas

#### b) Documentos

- Lista de documentación asociada
- Tipos de documentos:
  - Licencia de conducir
  - Certificados
  - Certificado médico
  - Examen psicotécnico
  - Certificados de capacitación
  - Seguros
  - Otros
- Estado de vigencia por documento
- Fechas de emisión y vencimiento

#### c) Asignaciones de Vehículos

- Historial completo de asignaciones
- Información del vehículo (marca, modelo, patente)
- Fechas de asignación y desasignación
- Estado actual (activa/finalizada)

#### d) Historial de Operaciones

- Últimas 10 operaciones del chofer
- Número de operación
- Tipo de operación
- Origen y destino
- Fechas programadas
- Estado visual con badges de color

#### e) Estadísticas

- Total de operaciones
- Operaciones completadas (verde)
- Operaciones en progreso (amarillo)
- Operaciones programadas (azul)
- Operaciones canceladas (rojo)
- Distancia total recorrida (km)

### ✅ 4. Formularios de Creación y Edición

- **Formulario Dividido en Secciones**:

  1. Información Personal
  2. Información de Licencia
  3. Contacto de Emergencia
  4. Información Adicional

- **Validaciones**:

  - Campos requeridos marcados con \*
  - RUT único por operador
  - Validación de formato de email
  - Validación de fechas
  - RUT no editable en modo de edición

- **Interfaz Intuitiva**:
  - Selectores con opciones predefinidas
  - Campos de fecha con date picker
  - Áreas de texto para notas
  - Mensajes de error claros
  - Estados de carga durante el guardado

### ✅ 5. Integración con Backend

Todas las operaciones están completamente integradas con los endpoints del backend:

```typescript
// Endpoints implementados
GET    /api/drivers                     // Lista con filtros y paginación
GET    /api/drivers/:id                 // Detalle del chofer
POST   /api/drivers                     // Crear chofer
PUT    /api/drivers/:id                 // Actualizar chofer
DELETE /api/drivers/:id                 // Eliminar chofer
GET    /api/drivers/:id/documents       // Documentos del chofer
GET    /api/drivers/:id/assignments     // Asignaciones del chofer
GET    /api/drivers/:id/operations      // Operaciones del chofer
GET    /api/drivers/:id/statistics      // Estadísticas del chofer
```

## Estructura de Archivos

```
frontend/
├── types/
│   └── drivers.ts                      # Interfaces TypeScript
├── lib/
│   └── api.ts                          # Funciones API para drivers
├── components/
│   └── ui/                             # Componentes UI reutilizables
│       ├── dialog.tsx
│       ├── table.tsx
│       ├── badge.tsx
│       ├── select.tsx
│       └── textarea.tsx
└── app/
    └── dashboard/
        ├── page.tsx                    # Dashboard con navegación
        └── drivers/
            ├── page.tsx                # Lista de choferes
            ├── new/
            │   └── page.tsx            # Crear chofer
            └── [id]/
                ├── page.tsx            # Detalle del chofer
                └── edit/
                    └── page.tsx        # Editar chofer
```

## Tipos de Datos

### Driver (Chofer)

```typescript
interface Driver {
  id: number;
  operatorId: number;
  rut: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  licenseType: "A1" | "A2" | "A3" | "A4" | "A5" | "B" | "C" | "D" | "E" | "F";
  licenseNumber: string;
  licenseExpirationDate: string;
  dateOfBirth?: string;
  address?: string;
  city?: string;
  region?: string;
  status: boolean;
  isExternal: boolean;
  externalCompany?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
```

### Tipos de Licencia

- **A1**: Motocicletas hasta 125cc
- **A2**: Motocicletas hasta 400cc
- **A3**: Motocicletas sin restricción
- **A4**: Vehículos motorizados de carga
- **A5**: Vehículos motorizados de transporte
- **B**: Automóviles y vehículos ligeros
- **C**: Vehículos pesados
- **D**: Transporte de pasajeros
- **E**: Tractores y maquinaria agrícola
- **F**: Vehículos de emergencia

## Flujo de Usuario

### 1. Ver Lista de Choferes

1. Acceder a Dashboard → Choferes
2. Ver lista completa con información resumida
3. Usar filtros para búsqueda específica
4. Navegar entre páginas si hay muchos registros

### 2. Crear Nuevo Chofer

1. Click en "Nuevo Chofer"
2. Completar formulario en 4 secciones
3. Guardar información
4. Redirección a lista con nuevo chofer

### 3. Ver Detalles del Chofer

1. Click en icono de ojo en la lista
2. Ver información completa en 5 pestañas
3. Revisar documentos, asignaciones y operaciones
4. Ver estadísticas de desempeño

### 4. Editar Chofer

1. Click en icono de edición (desde lista o detalle)
2. Modificar información necesaria
3. Guardar cambios
4. Redirección a vista de detalle

### 5. Eliminar Chofer

1. Click en icono de eliminación
2. Confirmar en diálogo de confirmación
3. El sistema valida que no tenga operaciones activas
4. Eliminación exitosa con actualización de lista

## Componentes UI Utilizados

### Componentes Principales

- **Card**: Contenedor visual para secciones
- **Table**: Tablas de datos con filas y columnas
- **Button**: Botones de acción con variantes
- **Input**: Campos de entrada de texto
- **Select**: Selectores desplegables
- **Textarea**: Áreas de texto multilínea
- **Badge**: Etiquetas de estado con colores
- **Dialog**: Diálogos modales de confirmación
- **Label**: Etiquetas para campos de formulario

### Variantes de Badge

- **success**: Verde - Estados positivos (activo, vigente, completado)
- **warning**: Amarillo - Estados de alerta (externo, en progreso)
- **info**: Azul - Estados informativos (interno, programado)
- **destructive**: Rojo - Estados negativos (vencido, cancelado, error)
- **secondary**: Gris - Estados neutros (inactivo)

## Características de Seguridad

1. **Autenticación Requerida**

   - Todas las páginas verifican token JWT
   - Redirección automática a login si no autenticado

2. **Autorización por Operador**

   - Filtrado automático por operatorId del usuario
   - Solo se muestran choferes del mismo operador

3. **Validaciones Frontend**

   - Campos requeridos
   - Formatos de datos
   - Fechas válidas

4. **Validaciones Backend**
   - RUT único por operador
   - Permisos de módulo (drivers.create, drivers.read, etc.)
   - Validación de integridad de datos

## Mejoras Futuras Sugeridas

### Funcionalidades Pendientes

1. **Gestión de Documentos**

   - Upload de archivos
   - Visualización de documentos
   - Descarga de documentos
   - Alertas de vencimiento próximo

2. **Asignación de Vehículos**

   - Interfaz para asignar vehículo desde UI
   - Desasignación con razones
   - Visualización de vehículo actual

3. **Dashboard de Choferes**

   - KPIs principales
   - Gráficos de operaciones
   - Alertas de licencias por vencer
   - Choferes disponibles vs ocupados

4. **Exportación de Datos**

   - Exportar lista a Excel/PDF
   - Reporte individual del chofer
   - Historial completo de operaciones

5. **Notificaciones**
   - Email al vencer licencia
   - SMS para operaciones asignadas
   - Alertas push en app móvil

### Mejoras de UX

1. Ordenamiento de columnas en tabla
2. Selección múltiple para operaciones en lote
3. Vista en tarjetas además de tabla
4. Filtros guardados por usuario
5. Búsqueda avanzada con más criterios

## Integración con Otros Módulos

Este módulo se integra con:

- **Módulo de Vehículos**: Asignación de choferes a vehículos
- **Módulo de Operaciones**: Asignación de choferes a operaciones
- **Módulo de Autenticación**: Control de acceso por permisos
- **Módulo de Auditoría**: Registro de todas las operaciones

## Testing

Para probar el módulo:

1. **Iniciar Backend**:

   ```bash
   cd backend
   npm run start:dev
   ```

2. **Iniciar Frontend**:

   ```bash
   cd frontend
   npm run dev
   ```

3. **Acceder**:
   - URL: http://localhost:3001
   - Login con usuario válido
   - Navegar a Dashboard → Choferes

## Tecnologías Utilizadas

- **Next.js 14**: Framework React con App Router
- **TypeScript**: Tipado estático
- **Tailwind CSS**: Estilos utility-first
- **Radix UI**: Componentes UI accesibles
- **Lucide React**: Iconos
- **Class Variance Authority**: Variantes de componentes

## Soporte

Para problemas o consultas sobre el módulo de choferes:

- Revisar logs del backend para errores de API
- Verificar permisos del usuario en la base de datos
- Consultar documentación del backend en `/backend/docs/DRIVERS_MODULE.md`
