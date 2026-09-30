# Automatización de Procesos Logísticos y Extracción ETL con Python

## Descripción del Proyecto
Desarrollo e implementación de un pipeline modular en Python orientado a la automatización de flujos operativos en centros de distribución. El sistema automatiza la extracción de datos de plataformas web, la reconciliación de órdenes e inventarios y la generación de reportes operativos estandarizados.

## Problema de Negocio
La consolidación manual de pedidos, transferencias internas e inconsistencias operativas implicaba un alto consumo de horas-hombre y riesgos de error de captura en periodos de alto volumen de distribución.

## Tecnologías y Librerías
- **Lenguaje:** Python 3.x
- **Web Automation / Extracción:** Selenium WebDriver, Beautiful Soup
- **Manipulación de Datos y ETL:** Pandas, NumPy
- **Exportación y Formateo:** OpenPyXL / XlsxWriter

## Arquitectura de la Solución
1. **Extracción Automatizada:** Script configurado para autenticación segura y descarga desatendida de reportes transaccionales periódicos.
2. **Transformación y Limpieza (Data Wrangling):** Normalización de esquemas, tratamiento de valores nulos y cruce de balances entre órdenes de surtido.
3. **Generación de Entregables:** Exportación directa a plantillas Excel estructuradas con formato condicional y métricas listas para revisión gerencial.

## Resultados e Impacto
- **Reducción del 80%** en el tiempo de procesamiento y extracción de datos operativos.
- Eliminación de discrepancias por captura manual en la conciliación diaria de inventario.
- Pipeline escalable y adaptable a nuevas fuentes de información operativa.

> *Nota: Por motivos de seguridad y privacidad operativa, los identificadores de acceso, URLs internas y datos sensibles han sido reemplazados por configuraciones genéricas.*


## Tecnologías y Librerías
- **Backend / ETL:** Python 3.x (Requests, Pandas, Selenium WebDriver, OpenPyXL).
- **Frontend / In-Browser Automation:** JavaScript ES6+ (Tampermonkey Userscripts para aceleración UI y bypass de cuellos de botella en ERP).
- **Procesamiento de Texto:** Expresiones Regulares (Regex) para extracción estructurada de identificadores y metadatos.

## Arquitectura de la Solución
1. **Extracción Automatizada (Python):** Ingesta desatendida mediante consumo directo de endpoints con persistencia de tokens de sesión y cookies CSRF.
2. **Optimizador de Flujo Operativo en Navegador (Userscript JS):** Inyección de interfaz flotante que automatiza el filtrado, validación de estados y procesamiento por lotes directamente sobre el DOM del sistema web.
3. **Conciliación y Auditoría Operativa:** Pipelines de detección de faltantes en inventario, cálculo de tasas de surtido (Fill Rate) y exportación a reportes ejecutivos.
