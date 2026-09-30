"""
MÓDULO: Extracción y Consolidación de Pedidos vía API / DataTables
DESCRIPCIÓN: Pipeline automatizado para extraer transacciones paginadas
             mediante consumo directo de endpoints con persistencia de sesión.
TECNOLOGÍAS: Python, Requests, OpenPyXL
AUTOR: Angel Riveros
"""

import os
import time
import requests
import openpyxl

# ==============================================================================
# CONFIGURACIÓN (Variables de entorno o configuración parametrizada)
# ==============================================================================
BASE_URL = os.getenv("API_ENDPOINT_URL", "https://api.empresa-ejemplo.com/backend/product/ajax_order_list")
CSRF_COOKIE = os.getenv("SESSION_CSRF", "demo_csrf_token_placeholder")
SESSION_TOKEN = os.getenv("SESSION_TOKEN", "demo_session_token_placeholder")

LENGTH_PER_PAGE = 100
OUTPUT_FILE = "reporte_pedidos_consolidado.xlsx"

def construir_payload_datatables(longitud_pagina: int, inicio: int, ciclo: int, csrf_token: str) -> dict:
    """
    Construye la estructura de parámetros requerida por DataTables para paginación del servidor.
    """
    payload = {
        "draw": ciclo,
        "start": inicio,
        "length": longitud_pagina,
        "search[value]": "",
        "search[regex]": "false",
        "csrf_test_name": csrf_token,
    }
    for i in range(11):
        payload[f"columns[{i}][data]"] = i
        payload[f"columns[{i}][name]"] = ""
        payload[f"columns[{i}][searchable]"] = "true"
        payload[f"columns[{i}][orderable]"] = "false" if i == 0 else "true"
        payload[f"columns[{i}][search][value]"] = ""
        payload[f"columns[{i}][search][regex]"] = "false"
    return payload

def ejecutar_extraccion_pedidos():
    sesion = requests.Session()
    sesion.cookies.set("csrf_cookie_name", CSRF_COOKIE)
    sesion.cookies.set("ci_sessions", SESSION_TOKEN)

    headers = {
        "accept": "application/json, text/javascript, */*; q=0.01",
        "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "x-requested-with": "XMLHttpRequest",
    }

    inicio = 0
    ciclo = 1
    filas_totales = []
    total_registros = None

    print("Iniciando pipeline de extracción masiva...")

    while True:
        payload = construir_payload_datatables(LENGTH_PER_PAGE, inicio, ciclo, CSRF_COOKIE)
        
        try:
            respuesta = sesion.post(BASE_URL, headers=headers, data=payload, timeout=15)
            if respuesta.status_code != 200:
                print(f"[Aviso] Petición terminada o denegada en offset={inicio}. Estatus: {respuesta.status_code}")
                break

            datos = respuesta.json()
            if total_registros is None:
                total_registros = datos.get("recordsTotal", 0)
                print(f"Total de registros a consolidar: {total_registros}")

            filas = datos.get("data", [])
            if not filas:
                break

            filas_totales.extend(filas)
            print(f"Progreso: {len(filas_totales)} / {total_registros} registros procesados.")

            inicio += LENGTH_PER_PAGE
            ciclo += 1

            if inicio >= total_registros:
                break

            time.sleep(0.3)  # Control de tasa para evitar saturación de red

        except requests.exceptions.RequestException as e:
            print(f"[Error de Conexión]: {e}")
            break

    # Consolidación y persistencia en Excel
    if filas_totales:
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = "Consolidado_Pedidos"
        
        encabezados = [
            "Fila", "ID Pedido", "ID Cliente", "Importe Total",
            "Costo Logístico", "Monto Neto Liquidado", "Puntos Volumen",
            "Método de Pago", "Fecha Registro", "Estatus Entrega"
        ]
        ws.append(encabezados)

        for fila in filas_totales:
            ws.append(fila[:len(encabezados)])

        wb.save(OUTPUT_FILE)
        print(f"\n[Éxito] Proceso finalizado. Archivo generado: {OUTPUT_FILE}")
    else:
        print("[Alerta] No se extrajeron datos en esta sesión.")

if __name__ == "__main__":
    ejecutar_extraccion_pedidos()
