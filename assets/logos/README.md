# Convenciones de Nomenclatura para Logos

## Reglas Actuales

### Formato de Nombres
- **Usar minúsculas con guiones bajos**: `nombre_archivo.svg`
- **Evitar espacios en nombres**: Los espacios causan problemas en URLs y referencias
- **Prefiero consistencia**: Si hay múltiples logos similares, usar el mismo prefijo

### Ejemplos Correctos
```
✓ microsoft_office_specialist_badge.svg
✓ adobe_certified_professional_badge.svg
✓ autodesk_certified_user_logo.svg
✓ cisco.svg
✓ ic3.svg
```

### Ejemplos Incorrectos (evitar)
```
✗ Microsoft-Office-Specialist-Logo.svg (mayúsculas y guiones)
✗ Autodesk_certified User_logo.svg (espacios)
✗ IC3_logo.svg (mayúsculas)
```

## Catálogo de Logos Actual

### Archivos Existentes
- `Adobe_Certified_Professional_badge.svg`
- `App_Development_Swift_Associate_Badge.svg`
- `App_Development_Swift_Badge.svg`
- `App_Development_Swift_CU_Badge.svg`
- `Autodesk_certified User_logo.svg` ⚠️ (renombrar a `autodesk_certified_user_logo.svg`)
- `Communication_Skills_for_Business_badge.svg`
- `Entrepreneurship_and_Small_Business_badge.svg`
- `Information_Technology_Specialist_badge.svg`
- `cisco.svg`
- `ic3.svg`
- `intuit.svg`
- `meta.svg`
- `microsoft_certified_educator_badge.svg`
- `microsoft_fundamentals_badge.svg`
- `microsoft_office_specialist_badge.svg`
- `pmi.svg`
- `unity.svg`

## Referencias en el Código

### data/certificaciones.json
Todas las referencias deben coincidir exactamente con el nombre del archivo:
```json
{
  "imagenLogo": "assets/logos/nombre_archivo.svg"
}
```

### certificaciones.html
Referencias en elementos `<img>`:
```html
<img src="assets/logos/nombre_archivo.svg" alt="Descripción">
```

## Validación Automática

Ejecutar el script de validación para verificar consistencia:

```bash
node scripts/validate-logos.js
```

Este script:
1. Verifica que todas las referencias existan
2. Detecta archivos sin referencias
3. Sugiere correcciones para nombres mal escritos

## Proceso para Agregar Nuevos Logos

1. **Guardar el archivo SVG** en `assets/logos/` con nombre en minúsculas y guiones bajos
2. **Actualizar referencias** en `data/certificaciones.json` si es necesario
3. **Validar** ejecutando `node scripts/validate-logos.js`
4. **Probar** en el navegador para verificar que se muestren correctamente

## Plan de Migración

### Archivos que Renombrar
- `Autodesk_certified User_logo.svg` → `autodesk_certified_user_logo.svg`

### Pasos para Renombrar
1. Crear copia del archivo con nuevo nombre
2. Actualizar referencias en JSON y HTML
3. Validar que todo funcione
4. Eliminar archivo antiguo

---

**Última actualización**: 2026-06-26
**Mantenido por**: Desarrollo Frontend