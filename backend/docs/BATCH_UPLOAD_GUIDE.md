# Guía de Carga Masiva de Operaciones

## Descripción General

El módulo de carga masiva de operaciones permite importar múltiples operaciones de transporte a través de archivos Excel estructurados, optimizando el tiempo de ingreso manual y reduciendo errores operativos.

## Características Principales

- ✅ Plantilla Excel predefinida con todos los campos necesarios
- ✅ Validación automática de estructura y formato
- ✅ Detección de errores con reportes detallados
- ✅ Asociación automática con entidades existentes (clientes, choferes, vehículos, rutas)
- ✅ Prevención de registros duplicados
- ✅ Procesamiento en lote eficiente

## Endpoints Disponibles

### 1. Descargar Plantilla Excel

```
GET /operations/excel-template
```

**Descripción:** Descarga una plantilla Excel predefinida con ejemplos y instrucciones.

**Respuesta:** Archivo Excel (.xlsx)

**Ejemplo con cURL:**

```bash
curl -X GET "http://localhost:3000/operations/excel-template" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  --output plantilla-operaciones.xlsx
```

---

### 2. Validar Archivo Excel (Preview)

```
POST /operations/batch-upload/parse
```

**Descripción:** Valida un archivo Excel sin crear las operaciones, útil para verificar errores antes de la carga final.

**Body:** `multipart/form-data`

- `file`: Archivo Excel (.xlsx)

**Respuesta:**

```json
{
  "success": true,
  "totalRows": 10,
  "validRows": 9,
  "errors": [
    {
      "row": 5,
      "field": "driverRut",
      "message": "No se encontró un chofer con RUT 12.345.678-9",
      "value": "12.345.678-9"
    }
  ],
  "data": [...]
}
```

**Ejemplo con cURL:**

```bash
curl -X POST "http://localhost:3000/operations/batch-upload/parse" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@operaciones.xlsx"
```

---

### 3. Cargar Operaciones desde JSON

```
POST /operations/batch-upload
```

**Descripción:** Carga operaciones desde un JSON estructurado.

**Body:**

```json
{
  "operatorId": 1,
  "operations": [
    {
      "operationNumber": "OP-001",
      "scheduledStartDate": "2025-11-20 08:00",
      "scheduledEndDate": "2025-11-20 18:00",
      "clientName": "Minera del Norte",
      "driverRut": "12.345.678-9",
      "vehiclePlateNumber": "ABCD12",
      "operationType": "delivery",
      "origin": "Santiago, Región Metropolitana",
      "destination": "Calama, Región de Antofagasta",
      "distance": 1650,
      "cargoDescription": "Equipos mineros",
      "cargoWeight": 15000,
      "notes": "Carga frágil"
    }
  ]
}
```

**Respuesta:**

```json
{
  "success": true,
  "totalRows": 1,
  "successCount": 1,
  "errorCount": 0,
  "errors": [],
  "duplicates": [],
  "createdOperations": [123]
}
```

---

### 4. Cargar Operaciones desde Archivo Excel

```
POST /operations/batch-upload/file
```

**Descripción:** Carga operaciones directamente desde un archivo Excel. Este es el método más común y recomendado.

**Body:** `multipart/form-data`

- `file`: Archivo Excel (.xlsx)
- `operatorId`: ID del operador (number)

**Respuesta:**

```json
{
  "success": true,
  "totalRows": 10,
  "successCount": 10,
  "errorCount": 0,
  "errors": [],
  "duplicates": [],
  "createdOperations": [123, 124, 125, ...]
}
```

**Ejemplo con cURL:**

```bash
curl -X POST "http://localhost:3000/operations/batch-upload/file" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@operaciones.xlsx" \
  -F "operatorId=1"
```

---

## Estructura de la Plantilla Excel

### Campos Obligatorios (\*)

| Campo                  | Descripción                         | Formato                | Ejemplo          |
| ---------------------- | ----------------------------------- | ---------------------- | ---------------- |
| N° Operación (\*)      | Número único de operación           | Texto (máx. 50 chars)  | OP-001           |
| Fecha/Hora Inicio (\*) | Fecha/hora programada de inicio     | YYYY-MM-DD HH:MM       | 2025-11-20 08:00 |
| RUT Chofer (\*)        | RUT del chofer (debe existir)       | 12.345.678-9           | 12.345.678-9     |
| Patente Camión (\*)    | Patente del vehículo (debe existir) | Texto                  | ABCD12           |
| Tipo Operación (\*)    | Tipo de operación                   | Texto (máx. 50 chars)  | delivery         |
| Origen (\*)            | Lugar de origen                     | Texto (máx. 500 chars) | Santiago         |
| Destino (\*)           | Lugar de destino                    | Texto (máx. 500 chars) | Calama           |

### Campos Opcionales

| Campo             | Descripción                         | Formato                 | Ejemplo             |
| ----------------- | ----------------------------------- | ----------------------- | ------------------- |
| Fecha/Hora Fin    | Fecha/hora estimada de fin          | YYYY-MM-DD HH:MM        | 2025-11-20 18:00    |
| Cliente           | Nombre del cliente (debe existir)   | Texto                   | Minera del Norte    |
| Proveedor         | Nombre del proveedor (debe existir) | Texto                   | Transportes del Sur |
| Tramo/Ruta        | Nombre del tramo (debe existir)     | Texto                   | Santiago - Calama   |
| Distancia (km)    | Distancia en kilómetros             | Número                  | 1650                |
| Descripción Carga | Descripción de la carga             | Texto (máx. 1000 chars) | Equipos mineros     |
| Peso Carga (kg)   | Peso en kilogramos                  | Número                  | 15000               |
| Observaciones     | Notas adicionales                   | Texto (máx. 1000 chars) | Carga frágil        |

---

## Validaciones Automáticas

El sistema realiza las siguientes validaciones:

### 1. Validaciones de Formato

- ✅ Campos obligatorios presentes
- ✅ Longitud máxima de campos de texto
- ✅ Formato de fecha correcto (YYYY-MM-DD HH:MM)
- ✅ Valores numéricos positivos

### 2. Validaciones de Existencia

- ✅ El chofer existe y pertenece al operador
- ✅ El vehículo existe y pertenece al operador
- ✅ El cliente existe (si se especifica)
- ✅ El proveedor existe (si se especifica)
- ✅ El tramo/ruta existe (si se especifica)

### 3. Validaciones de Estado

- ✅ El chofer está activo
- ✅ El vehículo está activo
- ✅ No existe duplicado del número de operación

### 4. Validaciones de Negocio

- ✅ El chofer y vehículo pertenecen al mismo operador
- ✅ Asignación automática de chofer a vehículo

---

## Manejo de Errores

Cuando se detectan errores, el sistema devuelve un reporte detallado:

```json
{
  "success": false,
  "totalRows": 10,
  "successCount": 8,
  "errorCount": 2,
  "errors": [
    {
      "row": 3,
      "field": "driverRut",
      "message": "No se encontró un chofer con RUT 12.345.678-9",
      "value": "12.345.678-9"
    },
    {
      "row": 5,
      "field": "operationNumber",
      "message": "El número de operación OP-003 ya existe",
      "value": "OP-003"
    }
  ],
  "duplicates": ["OP-003"],
  "createdOperations": [123, 124, 125, 126, 127, 128, 129, 130]
}
```

### Tipos de Errores Comunes

1. **Campo obligatorio faltante**
   - Mensaje: "El [campo] es obligatorio"
   - Solución: Completar el campo requerido

2. **Entidad no encontrada**
   - Mensaje: "No se encontró un [chofer/vehículo/cliente] con [identificador]"
   - Solución: Verificar que la entidad exista en el sistema

3. **Duplicado de operación**
   - Mensaje: "El número de operación [número] ya existe"
   - Solución: Cambiar el número de operación por uno único

4. **Formato de fecha inválido**
   - Mensaje: "La fecha/hora tiene un formato inválido"
   - Solución: Usar formato YYYY-MM-DD HH:MM

5. **Entidad inactiva**
   - Mensaje: "El [chofer/vehículo] está inactivo"
   - Solución: Activar la entidad o usar una activa

---

## Proceso Recomendado

### Paso 1: Descargar Plantilla

```bash
GET /operations/excel-template
```

### Paso 2: Completar Plantilla

- Eliminar las filas de ejemplo
- Completar con los datos reales
- Verificar que todas las entidades referenciadas existan

### Paso 3: Validar (Opcional pero Recomendado)

```bash
POST /operations/batch-upload/parse
```

- Revisar los errores reportados
- Corregir el archivo Excel

### Paso 4: Cargar Definitivamente

```bash
POST /operations/batch-upload/file
```

- Verificar el resultado
- Revisar las operaciones creadas

---

## Consideraciones de Rendimiento

- **Límite recomendado:** 100-500 operaciones por archivo
- **Tiempo estimado:** ~1-2 segundos por cada 10 operaciones
- **Procesamiento:** Secuencial para mantener integridad de datos

---

## Ejemplos de Integración

### JavaScript/TypeScript (Frontend)

```typescript
// Descargar plantilla
async function downloadTemplate() {
  const response = await fetch('/operations/excel-template', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'plantilla-operaciones.xlsx';
  a.click();
}

// Cargar archivo
async function uploadOperations(file: File, operatorId: number) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('operatorId', operatorId.toString());

  const response = await fetch('/operations/batch-upload/file', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const result = await response.json();

  if (result.success) {
    console.log(`✅ ${result.successCount} operaciones creadas`);
  } else {
    console.error(`❌ ${result.errorCount} errores detectados`);
    result.errors.forEach((error) => {
      console.error(`Fila ${error.row}: ${error.message}`);
    });
  }
}
```

### Python

```python
import requests

# Descargar plantilla
def download_template(token):
    headers = {'Authorization': f'Bearer {token}'}
    response = requests.get(
        'http://localhost:3000/operations/excel-template',
        headers=headers
    )

    with open('plantilla-operaciones.xlsx', 'wb') as f:
        f.write(response.content)

# Cargar operaciones
def upload_operations(file_path, operator_id, token):
    headers = {'Authorization': f'Bearer {token}'}

    with open(file_path, 'rb') as f:
        files = {'file': f}
        data = {'operatorId': operator_id}

        response = requests.post(
            'http://localhost:3000/operations/batch-upload/file',
            headers=headers,
            files=files,
            data=data
        )

    result = response.json()

    if result['success']:
        print(f"✅ {result['successCount']} operaciones creadas")
    else:
        print(f"❌ {result['errorCount']} errores detectados")
        for error in result['errors']:
            print(f"Fila {error['row']}: {error['message']}")
```

---

## Preguntas Frecuentes

**Q: ¿Puedo editar la plantilla?**
A: Sí, pero no modifiques los nombres de las columnas ni su orden. Solo completa los datos.

**Q: ¿Qué pasa si una operación falla?**
A: Las operaciones válidas se crean, las inválidas se reportan en el campo `errors`.

**Q: ¿Puedo cargar el mismo archivo dos veces?**
A: No, si las operaciones ya existen, se detectarán como duplicados.

**Q: ¿Cómo sé qué choferes/vehículos existen?**
A: Consulta los endpoints `/drivers` y `/vehicles` antes de completar la plantilla.

**Q: ¿Puedo cargar operaciones de diferentes operadores?**
A: No, cada carga es para un solo operador especificado en `operatorId`.

---

## Soporte

Para reportar problemas o solicitar mejoras, contacta al equipo de desarrollo.
