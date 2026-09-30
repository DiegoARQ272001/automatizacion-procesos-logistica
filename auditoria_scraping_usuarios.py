"""
MÓDULO: Automatización de Extracción de Datos Operativos y Auditoría de Cuentas
DESCRIPCIÓN: Script para navegación automatizada, extracción de metadatos de red,
             expresiones regulares y control de sesiones seguras.
TECNOLOGÍAS: Python, Selenium WebDriver, Regular Expressions, OpenPyXL
AUTOR: Angel Riveros
"""

import os
import re
import time
import openpyxl
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# ==============================================================================
# VARIABLES Y CREDENCIALES PARAMETRIZADAS (Evita credenciales fijas en el código)
# ==============================================================================
URL_LOGIN = os.getenv("PORTAL_LOGIN_URL", "https://portal-ejemplo.com/admin")
URL_USUARIOS = os.getenv("PORTAL_USERS_URL", "https://portal-ejemplo.com/backend/user/index/")
ADMIN_USER = os.getenv("PORTAL_ADMIN_USER", "admin_demo@empresa.com")
ADMIN_PASS = os.getenv("PORTAL_ADMIN_PASS", "********")
ARCHIVO_DESTINO = "reporte_auditoria_usuarios.xlsx"

def inicializar_navegador():
    opciones = Options()
    opciones.add_argument("--incognito")
    opciones.add_argument("--disable-gpu")
    opciones.add_argument("--no-sandbox")
    return webdriver.Chrome(options=opciones)

def ejecutar_auditoria():
    driver = inicializar_navegador()
    espera = WebDriverWait(driver, 12)
    
    try:
        # 1. Autenticación en plataforma
        print("Iniciando sesión segura en el sistema...")
        driver.get(URL_LOGIN)
        
        campo_email = espera.until(EC.presence_of_element_located((By.NAME, "email")))
        campo_email.send_keys(ADMIN_USER)
        driver.find_element(By.NAME, "password").send_keys(ADMIN_PASS)
        driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
        time.sleep(3)

        # 2. Navegación al módulo de red
        print("Navegando a la tabla consolidada de usuarios...")
        driver.get(URL_USUARIOS)
        
        espera.until(EC.presence_of_element_located((By.CSS_SELECTOR, "table tbody tr")))
        filas = driver.find_elements(By.CSS_SELECTOR, "table tbody tr")
        print(f"Registros encontrados en el cuadrante: {len(filas)}")

        # 3. Inicialización del libro de trabajo
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = "Auditoria_Usuarios"
        ws.append([
            "Índice", "ID Distribuidor", "ID Patrocinador", "Nombre Distribuidor",
            "Correo Contacto", "Teléfono", "Estatus Bloqueo", "Rango Actual",
            "Puntos Volumen Mes", "IP Registro", "Fecha Registro"
        ])

        # 4. Procesamiento de registros y parsing
        for idx, fila in enumerate(filas, start=1):
            try:
                celdas = fila.find_elements(By.TAG_NAME, "td")
                if len(celdas) < 10:
                    continue

                id_distribuidor = celdas[1].text.strip()
                patrocinador    = celdas[2].text.strip()
                nombre          = celdas[3].text.strip()
                correo          = celdas[4].text.strip()
                telefono        = celdas[5].text.strip()
                estatus_bloqueo = celdas[6].text.strip()
                rango           = celdas[7].text.strip()
                puntos          = celdas[10].text.strip() if len(celdas) > 10 else "0"

                # Extracción de metadatos adicionales de texto (Regex)
                texto_fila = fila.text
                match_ip = re.search(r"\b\d{1,3}(?:\.\d{1,3}){3}\b", texto_fila)
                match_fecha = re.search(r"\b\d{4}-\d{2}-\d{2}\b", texto_fila)

                ip_registro = match_ip.group(0) if match_ip else "N/A"
                fecha_registro = match_fecha.group(0) if match_fecha else "N/A"

                ws.append([
                    idx, id_distribuidor, patrocinador, nombre,
                    correo, telefono, estatus_bloqueo, rango,
                    puntos, ip_registro, fecha_registro
                ])

            except Exception as error_fila:
                print(f"[Aviso] Salto en fila {idx}: {error_fila}")
                continue

        # 5. Persistencia del reporte
        wb.save(ARCHIVO_DESTINO)
        print(f"\n[Auditoría Finalizada] Reporte generado exitosamente en: {ARCHIVO_DESTINO}")

    finally:
        driver.quit()

if __name__ == "__main__":
    ejecutar_auditoria()
