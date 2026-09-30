// ==UserScript==
// @name         Gestor Integral de Auditoría y Despacho Operativo
// @namespace    http://tampermonkey.net/logistica-shared
// @version      3.0
// @description  Acelerador UI para conciliación de pedidos, validación por estados y precargado transaccional.
// @author       Angel Riveros
// @match        https://sistema-erp-ejemplo.com/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_openInTab
// ==/UserScript==

/**
 * PROYECTO: Optimización de Conciliación de Envíos y Auditoría de Facturación
 * ARQUITECTURA: Userscript en JavaScript modular para automatización en navegador
 * IMPACTO: Eliminación de tiempos muertos en navegación y captura de guías de despacho
 */

(function () {
    'use strict';

    // Evitar renderizado de controles en sub-rutas específicas
    if (window.location.href.includes('view_invoice') || window.location.href.includes('update_shipment')) {
        return;
    }

    let cancelarProceso = false;

    // 1. COMPONENTE UI: Contenedor flotante para acciones operativas rápidas
    const contenedor = document.createElement('div');
    contenedor.id = 'contenedor-operativo-flotante';
    contenedor.style = 'position:fixed;bottom:80px;right:20px;z-index:999998;display:flex;gap:8px;align-items:center;';

    const btnEscanearHoy = document.createElement('button');
    btnEscanearHoy.id = 'btn-escanear-pedidos';
    btnEscanearHoy.innerHTML = '⚡ Facturas Pendientes de Hoy';
    btnEscanearHoy.style = 'padding:11px 18px;background:#065f46;color:#6ee7b7;border:2px solid #10b981;border-radius:8px;font-weight:bold;font-size:13px;cursor:pointer;box-shadow:0 4px 15px rgba(0,0,0,0.35);transition:all 0.2s;';

    const btnCancelar = document.createElement('button');
    btnCancelar.id = 'btn-cancelar-operacion';
    btnCancelar.innerHTML = '🛑 Cancelar';
    btnCancelar.style = 'display:none;padding:11px 14px;background:#991b1b;color:#fecaca;border:2px solid #ef4444;border-radius:8px;font-weight:bold;font-size:13px;cursor:pointer;box-shadow:0 4px 15px rgba(0,0,0,0.35);';

    btnEscanearHoy.onmouseover = () => { if (!btnEscanearHoy.disabled) btnEscanearHoy.style.background = '#047857'; };
    btnEscanearHoy.onmouseout = () => { if (!btnEscanearHoy.disabled) btnEscanearHoy.style.background = '#065f46'; };

    contenedor.appendChild(btnEscanearHoy);
    contenedor.appendChild(btnCancelar);
    document.body.appendChild(contenedor);

    function obtenerFechaActualISO() {
        const ahora = new Date();
        const yyyy = ahora.getFullYear();
        const mm = String(ahora.getMonth() + 1).padStart(2, '0');
        const dd = String(ahora.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    }

    async function retardoAsincrono(ms) {
        const pasos = Math.ceil(ms / 200);
        for (let i = 0; i < pasos; i++) {
            if (cancelarProceso) return false;
            await new Promise(r => setTimeout(r, 200));
        }
        return true;
    }

    // 2. CONTROL DEL DOM EN TABLAS DINÁMICAS (DataTables)
    async function ajustarPaginacion(longitud) {
        const selectPaginacion = document.querySelector('select[name*="length"], .dataTables_length select');
        if (selectPaginacion && selectPaginacion.value !== String(longitud)) {
            selectPaginacion.focus();
            selectPaginacion.value = String(longitud);
            selectPaginacion.dispatchEvent(new Event('input', { bubbles: true }));
            selectPaginacion.dispatchEvent(new Event('change', { bubbles: true }));
            selectPaginacion.blur();

            if (window.$ || window.jQuery) {
                try {
                    const jq = window.$ || window.jQuery;
                    jq(selectPaginacion).val(String(longitud)).trigger('change');
                } catch (err) {}
            }
            await retardoAsincrono(4000);
        }
    }

    async function restaurarVistaTabla() {
        const btnPrimeraPagina = Array.from(document.querySelectorAll('.paginate_button a, .paginate_button')).find(el => el.innerText.trim() === '1');
        if (btnPrimeraPagina) btnPrimeraPagina.click();
        await ajustarPaginacion(10);
    }

    btnCancelar.onclick = async () => {
        cancelarProceso = true;
        btnCancelar.style.display = 'none';
        btnEscanearHoy.innerHTML = '🛑 Restaurando cuadrante original...';
        await restaurarVistaTabla();
        btnEscanearHoy.disabled = false;
        btnEscanearHoy.innerHTML = '⚡ Facturas Pendientes de Hoy';
    };

    // 3. PIPELINE DE AUDITORÍA Y APERTURA DE DESPACHO
    btnEscanearHoy.onclick = async () => {
        cancelarProceso = false;
        const fechaFiltro = obtenerFechaActualISO();

        btnEscanearHoy.disabled = true;
        btnCancelar.style.display = 'inline-block';
        btnEscanearHoy.innerHTML = '⚙️ Expandiendo cuadrante (100 filas)...';

        await ajustarPaginacion(100);
        if (cancelarProceso) return;

        const colaDespacho = [];
        let pagina = 1;
        let continuarEscaneo = true;

        while (continuarEscaneo && !cancelarProceso) {
            btnEscanearHoy.innerHTML = `🔍 Analizando cuadrante pág. ${pagina}...`;

            const filas = Array.from(document.querySelectorAll('table tbody tr'));
            if (filas.length === 0) break;

            let detectadaFechaPrevia = false;

            for (const tr of filas) {
                if (cancelarProceso) break;
                const texto = tr.innerText;

                if (texto.includes(fechaFiltro)) {
                    const btnActualizar = Array.from(tr.querySelectorAll('a, button')).find(el =>
                        el.innerText.trim().toLowerCase().includes('update') || el.innerText.trim().toLowerCase().includes('actualizar')
                    );
                    const btnVisualizado = Array.from(tr.querySelectorAll('a, button')).find(el =>
                        el.innerText.trim().toLowerCase() === 'view' || el.innerText.trim().toLowerCase() === 'ver'
                    );

                    // Aísla órdenes pendientes sin actualizar
                    if (btnActualizar && !btnVisualizado) {
                        const linkFactura = Array.from(tr.querySelectorAll('a')).find(el =>
                            el.href && el.href.includes('view_invoice')
                        );
                        if (linkFactura) {
                            colaDespacho.push(linkFactura.href);
                        }
                    }
                } else if (texto.match(/\d{4}-\d{2}-\d{2}/)) {
                    detectadaFechaPrevia = true;
                }
            }

            if (cancelarProceso || detectadaFechaPrevia) break;

            const btnSiguiente = document.querySelector('.paginate_button.next:not(.disabled)');
            if (btnSiguiente) {
                btnSiguiente.click();
                pagina++;
                const exito = await retardoAsincrono(4000);
                if (!exito || cancelarProceso) break;
            } else {
                continuarEscaneo = false;
            }
        }

        btnCancelar.style.display = 'none';
        if (cancelarProceso) return;

        if (colaDespacho.length === 0) {
            alert(`No se detectaron transacciones pendientes para el ciclo actual (${fechaFiltro}).`);
            await restaurarVistaTabla();
            btnEscanearHoy.disabled = false;
            btnEscanearHoy.innerHTML = '⚡ Facturas Pendientes de Hoy';
            return;
        }

        // Despliegue controlado con apertura en pestañas paralelas
        let procesadas = 0;
        for (const ruta of colaDespacho) {
            GM_openInTab(ruta, { active: false, insert: true });
            procesadas++;
            btnEscanearHoy.innerHTML = `🚀 Procesando ${procesadas}/${colaDespacho.length}...`;
            await new Promise(r => setTimeout(r, 400));
        }

        await restaurarVistaTabla();
        btnEscanearHoy.innerHTML = `✅ ${procesadas} órdenes procesadas`;
        setTimeout(() => {
            btnEscanearHoy.disabled = false;
            btnEscanearHoy.innerHTML = '⚡ Facturas Pendientes de Hoy';
        }, 3000);
    };
})();
