// ==UserScript==
// @name         Inyector UI: Checklist de Picking y Conformidad de Entrega (1 Hoja)
// @namespace    http://tampermonkey.net/logistica-picking
// @version      2.5
// @description  Ajusta dinámicamente estilos de impresión (@media print) e inyecta grilla de verificación de almacén
// @author       Angel Riveros
// @match        https://sistema-erp-ejemplo.com/backend/product/view_invoice_order/*
// @grant        none
// ==/UserScript==

/**
 * PROYECTO: Control de Calidad en Almacén y Optimización de Impresión de Facturas
 * OBJETIVO: Compactar layouts para evitar generación de segundas hojas innecesarias
 *           e integrar checklist de verificación física (picking) antes del embalaje.
 * TECNOLOGÍAS: JavaScript ES6, CSS Paged Media (@media print, @page), DOM Manipulation
 */

(function () {
    'use strict';

    function inyectarChecklistConformidad() {
        if (document.getElementById("bloque-conformidad-picking")) return;

        // Búsqueda de anclaje contextual en la factura
        const elementos = document.querySelectorAll('div, p, span, h4, h5, h6');
        let nodoAnclaje = null;

        for (const el of elementos) {
            if (el.textContent && el.textContent.includes('THANK YOU FOR YOUR ORDER') && el.children.length === 0) {
                nodoAnclaje = el;
                break;
            }
        }

        const contenedorTabla = document.querySelector('table')?.closest('div');
        const elementoDestino = nodoAnclaje || contenedorTabla;

        if (!elementoDestino || !elementoDestino.parentNode) return;

        const bloque = document.createElement("div");
        bloque.id = "bloque-conformidad-picking";

        bloque.innerHTML = `
            <style>
                #bloque-conformidad-picking {
                    margin: 6px 0;
                    width: 100%;
                    box-sizing: border-box;
                    color: #000;
                    display: block !important;
                }
                .caja-unificada {
                    border: 1px solid #000;
                    padding: 5px 10px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background-color: transparent;
                    box-sizing: border-box;
                }
                .grid-catalogo-print {
                    display: grid;
                    grid-template-columns: repeat(3, max-content);
                    column-gap: 80px;
                    font-size: 13pt;
                    line-height: 1.12;
                }
                .box-check {
                    font-family: monospace;
                    font-size: 11.5pt;
                    font-weight: bold;
                    letter-spacing: 12px;
                    display: inline-block;
                }
                .caja-firma {
                    border: 1px solid #000;
                    padding: 5px 10px;
                    width: 185px;
                    min-width: 175px;
                    text-align: center;
                    background-color: transparent;
                    box-sizing: border-box;
                }

                /* REGLAS ESTRICTAS DE IMPRESIÓN (FORZAR REPORTE EN UNA SOLA HOJA) */
                @media print {
                    @page {
                        margin: 4mm 6mm !important;
                        size: letter portrait;
                    }
                    html, body {
                        margin: 0 !important;
                        padding: 0 !important;
                        height: auto !important;
                    }
                    table {
                        margin-top: 5px !important;
                        margin-bottom: 5px !important;
                    }
                    table th, table td {
                        padding: 4px 6px !important;
                        font-size: 8.5pt !important;
                        line-height: 1.25 !important;
                    }
                    img {
                        max-height: 38px !important;
                    }
                    button, .btn, a.btn, footer {
                        display: none !important;
                    }
                    #bloque-conformidad-picking {
                        page-break-inside: avoid !important;
                        page-break-after: avoid !important;
                    }
                }
            </style>

            <div class="caja-unificada">
                <!-- GRID DE VERIFICACIÓN FÍSICA -->
                <div class="grid-catalogo-print">
                    <div>
                        <span class="box-check">[&nbsp;]</span> Suplemento A<br>
                        <span class="box-check">[&nbsp;]</span> Suplemento B<br>
                        <span class="box-check">[&nbsp;]</span> Proteína Vainilla<br>
                        <span class="box-check">[&nbsp;]</span> Proteína Chocolate<br>
                        <span class="box-check">[&nbsp;]</span> Complejo Multivitamínico
                    </div>
                    <div>
                        <span class="box-check">[&nbsp;]</span> Extracto Verde<br>
                        <span class="box-check">[&nbsp;]</span> Colágeno Hidrolizado<br>
                        <span class="box-check">[&nbsp;]</span> Fórmulas Digestivas<br>
                        <span class="box-check">[&nbsp;]</span> Antioxidante Concentrado<br>
                        <span class="box-check">[&nbsp;]</span> Microalgas Nutricionales
                    </div>
                    <div>
                        <span class="box-check">[&nbsp;]</span> Ácidos Grasos Omega 3<br>
                        <span class="box-check">[&nbsp;]</span> Regenerador Articular<br>
                        <span class="box-check">[&nbsp;]</span> Complejo Adaptógeno<br>
                        <span class="box-check">[&nbsp;]</span> Enzimas Metabólicas<br>
                        <span class="box-check">[&nbsp;]</span> Línea Inmune
                    </div>
                </div>

                <!-- CONTROL Y RECIBO DE CONFORMIDAD -->
                <div class="caja-firma">
                    <p style="font-size: 7.2pt; margin: 0 0 16px 0; line-height: 1.15;">
                        <strong>Control de Calidad:</strong><br>Verificación física y sello de empaque.
                    </p>
                    <div style="width: 85%; border-top: 1px solid #000; margin: 0 auto; padding-top: 2px; font-size: 9.8pt;">
                        Firma Responsable
                    </div>
                </div>
            </div>
        `;

        if (nodoAnclaje) {
            nodoAnclaje.parentNode.insertBefore(bloque, nodoAnclaje);
        } else {
            elementoDestino.parentNode.insertBefore(bloque, elementoDestino.nextSibling);
        }
    }

    setInterval(inyectarChecklistConformidad, 500);
})();
