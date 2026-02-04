/**
 * Sistema de gestión de catálogos y conceptos para obras
 */

// ====================================
// CLASE PRINCIPAL - CATALOGOS MANAGER
// ====================================

class CatalogosManager {
    async makeRequest(formData) {
        try {
            const response = await fetch('catalogos_manager.php', {
                method: 'POST',
                body: formData
            });
            
            const text = await response.text();
            
            try {
                return JSON.parse(text);
            } catch (e) {
                console.error('Respuesta no JSON:', text);
                throw new Error('Error del servidor: respuesta no válida');
            }
            
        } catch (error) {
            console.error('Error de red:', error);
            throw new Error('Error de conexión: ' + error.message);
        }
    }

    async obtenerDetalleConcepto(conceptoId) {
        const formData = new FormData();
        formData.append('action', 'obtener_detalle_concepto');
        formData.append('concepto_id', conceptoId);
        return await this.makeRequest(formData);
    }

    async crearCatalogo(obraId, nombre, descripcion = '') {
        const formData = new FormData();
        formData.append('action', 'crear_catalogo');
        formData.append('obra_id', obraId);
        formData.append('nombre_catalogo', nombre);
        formData.append('descripcion', descripcion);
        return await this.makeRequest(formData);
    }
    
    async obtenerCatalogos(obraId) {
        const formData = new FormData();
        formData.append('action', 'obtener_catalogos');
        formData.append('obra_id', obraId);
        return await this.makeRequest(formData);
    }
    
    async crearConcepto(catalogoId, codigo, nombre, descripcion = '', unidadMedida = '', categoria = '', subcategoria = '', numeroOriginal = '') {
        const formData = new FormData();
        formData.append('action', 'crear_concepto');
        formData.append('catalogo_id', catalogoId);
        formData.append('codigo_concepto', codigo);
        formData.append('nombre_concepto', nombre);
        formData.append('descripcion', descripcion);
        formData.append('unidad_medida', unidadMedida);
        formData.append('categoria', categoria);
        formData.append('subcategoria', subcategoria);
        formData.append('numero_original', numeroOriginal);
        formData.append('permitir_duplicados', 'true');
        return await this.makeRequest(formData);
    }
    
    async obtenerConceptos(catalogoId) {
        const formData = new FormData();
        formData.append('action', 'obtener_conceptos');
        formData.append('catalogo_id', catalogoId);
        return await this.makeRequest(formData);
    }

    
    
async importarConceptosDesdeExcel(catalogoId, file) {
    try {
        const datosExcel = await this.procesarArchivoExcel(file);
         
        console.log(`Conceptos originales: ${datosExcel.length}`);
        
        const formData = new FormData();
        formData.append('action', 'importar_conceptos_excel');
        formData.append('catalogo_id', catalogoId);
        formData.append('datos_excel', JSON.stringify(datosExcel));
        formData.append('permitir_duplicados', 'true');
        
        return await this.makeRequest(formData);
    } catch (error) {
        console.error('Error en importarConceptosDesdeExcel:', error);
        throw error;
    }
}

async procesarArchivoExcel(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
                    header: 1,
                    defval: '',
                    blankrows: false
                });
                const conceptos = procesarDatosCatalogoFlexible(jsonData);
                resolve(conceptos);
            } catch (error) {
                reject(new Error('Error procesando archivo Excel: ' + error.message));
            }
        };
        reader.onerror = function() {
            reject(new Error('Error leyendo archivo'));
        };
        reader.readAsArrayBuffer(file);
    });
}
    
    async obtenerItemsConcepto(conceptoId) {
        const formData = new FormData();
        formData.append('action', 'obtener_items_concepto');
        formData.append('concepto_id', conceptoId);
        return await this.makeRequest(formData);
    }
    
    async eliminarCatalogo(catalogoId) {
        const formData = new FormData();
        formData.append('action', 'eliminar_catalogo');
        formData.append('catalogo_id', catalogoId);
        return await this.makeRequest(formData);
    }
    
    async eliminarConcepto(conceptoId) {
        const formData = new FormData();
        formData.append('action', 'eliminar_concepto');
        formData.append('concepto_id', conceptoId);
        return await this.makeRequest(formData);
    }
}

// Instancia global
const catalogosManager = new CatalogosManager();

// ====================================
// GESTIÓN DE CATÁLOGOS
// ====================================
function mostrarFormularioCatalogo(obraId, obraNombre) {
    Swal.fire({
        title: "Nuevo Catálogo",
        html: `
        <form id="formNuevoCatalogo" class="swal-form">
                    <div class="mb-3">
                        <label class="form-label text-start d-block">Nombre del Catálogo <span class="text-danger">*</span></label>
                        <input type="text" name="nombre_catalogo" class="form-control" placeholder="Ej: Catálogo Principal" required>
                    </div>
                    <div class="mb-3">
                        <label class="form-label text-start d-block">Descripción</label>
                        <textarea name="descripcion" class="form-control" rows="3" placeholder="Describe el propósito de este catálogo..."></textarea>
                    </div>
                </form>
        `,
        width: 500,
        showCancelButton: true,
        confirmButtonText: "Crear",
        cancelButtonText: "Cancelar",
        preConfirm: () => {
            const form = document.getElementById("formNuevoCatalogo");
            const nombre = form.nombre_catalogo.value;
            const descripcion = form.descripcion.value;
            
            if (!nombre.trim()) {
                Swal.showValidationMessage('El nombre del catálogo es obligatorio');
                return false;
            }
            
            return catalogosManager.crearCatalogo(obraId, nombre, descripcion);
        }
    }).then((result) => {
        if (result.isConfirmed && result.value) {
            if (result.value.success) {
                Swal.fire({
                    icon: 'success',
                    title: '¡Éxito!',
                    text: result.value.message,
                    timer: 1500,
                    showConfirmButton: false
                }).then(() => {
                    // Recargar la página para ver la lista actualizada
                    location.reload();
                });
            } else {
                Swal.fire('Error', result.value.error, 'error');
            }
        }
    });
}

// ====================================
// GESTIÓN DE CONCEPTOS
// ====================================

function mostrarFormularioConcepto(catalogoId, catalogoNombre, obraId = null, obraNombre = null) {
    Swal.fire({
        title: "Nuevo Concepto",
        html: `
            <form id="formNuevoConcepto" class="swal-form text-start">
                <div class="row">
                    <div class="col-6 mb-2">
                        <label class="form-label">Código <span class="text-danger">*</span></label>
                        <input type="text" name="codigo_concepto" class="form-control" placeholder="Ej: CONC-001" required>
                    </div>
                    <div class="col-6 mb-2">
                        <label class="form-label">Unidad de Medida</label>
                        <input type="text" name="unidad_medida" class="form-control" placeholder="Ej: m³, kg, pza">
                    </div>
                </div>
                <div class="row">
                    <div class="col-6 mb-2">
                        <label class="form-label">Categoría</label>
                        <input type="text" name="categoria" class="form-control" placeholder="Ej: Cimentación">
                    </div>
                    <div class="col-6 mb-2">
                        <label class="form-label">Subcategoría</label>
                        <input type="text" name="subcategoria" class="form-control" placeholder="Ej: Zapata Aislada">
                    </div>
                </div>
                <div class="mb-2">
                    <label class="form-label">Nombre <span class="text-danger">*</span></label>
                    <input type="text" name="nombre_concepto" class="form-control" placeholder="Ej: Excavación manual" required>
                </div>
                <div class="mb-2">
                    <label class="form-label">Descripción</label>
                    <textarea name="descripcion" class="form-control" rows="2" placeholder="Descripción del concepto..."></textarea>
                </div>
                <div class="mb-2">
                    <label class="form-label">Número Original</label>
                    <input type="text" name="numero_original" class="form-control" placeholder="Ej: 1, 2, 3">
                </div>
            </form>
        `,
        width: 700,
        showCancelButton: true,
        confirmButtonText: "Crear",
        cancelButtonText: "Cancelar",
        preConfirm: () => {
            const form = document.getElementById("formNuevoConcepto");
            return catalogosManager.crearConcepto(
                catalogoId,
                form.codigo_concepto.value.trim(),
                form.nombre_concepto.value.trim(),
                form.descripcion.value.trim(),
                form.unidad_medida.value.trim(),
                form.categoria.value.trim(),
                form.subcategoria.value.trim(),
                form.numero_original.value.trim()
            );
        }
    }).then((result) => {
        if (result.isConfirmed && result.value) {
            if (result.value.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Concepto creado',
                    text: 'El concepto se ha creado correctamente',
                    timer: 2000,
                    showConfirmButton: false
                }).then(() => {
                    // Recargar la página para ver la lista actualizada
                    location.reload();
                });
            } else {
                Swal.fire('Error', result.value.error, 'error');
            }
        }
    });
}

// ====================================
// IMPORTACIÓN DE EXCEL
// ====================================

function mostrarImportarExcelConceptos(catalogoId, catalogoNombre, obraId = null, obraNombre = null) {
    Swal.fire({
        title: "Importar Conceptos desde Excel",
        html: `
            <div class="alert alert-info text-start">
                <small><i class="bi bi-info-circle"></i> 
                Columnas esperadas: NUMERO, CLAVE, DESCRIPCIÓN, UNIDAD</small>
            </div>
            <div class="mb-3">
                <label class="form-label">Archivo Excel</label>
                <input type="file" id="archivoExcelConceptos" class="form-control" accept=".xlsx, .xls" required>
            </div>
            <div id="vistaPrevia" style="display: none;">
                <h6>Vista previa:</h6>
                <div id="listaPrevia" class="small" style="max-height: 200px; overflow-y: auto;"></div>
            </div>
        `,
        width: 800,
        showCancelButton: true,
        confirmButtonText: "Importar",
        cancelButtonText: "Cancelar",
        didOpen: () => {
            const fileInput = document.getElementById('archivoExcelConceptos');
            fileInput.addEventListener('change', function(e) {
                const file = e.target.files[0];
                if (file) mostrarVistaPrevia(file);
            });
        },
        preConfirm: () => {
            const fileInput = document.getElementById('archivoExcelConceptos');
            if (!fileInput.files[0]) {
                Swal.showValidationMessage('Selecciona un archivo');
                return false;
            }
            return catalogosManager.importarConceptosDesdeExcel(catalogoId, fileInput.files[0]);
        }
    }).then((result) => {
        if (result.isConfirmed && result.value && result.value.success) {
            let mensaje = `
                <div class="alert alert-success">
                    <h5><i class="bi bi-check-circle"></i> Importación completada</h5>
                    <p class="mb-0"><strong>${result.value.conceptos_importados}</strong> conceptos importados</p>
                </div>
            `;
            
            if (result.value.errores && result.value.errores.length > 0) {
                mensaje += `
                    <div class="alert alert-warning">
                        <h6><i class="bi bi-exclamation-triangle"></i> Errores (${result.value.errores.length})</h6>
                        <div class="text-start small" style="max-height: 200px; overflow-y: auto;">
                            <ul class="mb-0">${result.value.errores.map(e => `<li>${e}</li>`).join('')}</ul>
                        </div>
                    </div>
                `;
            }
            
            Swal.fire({
                title: 'Resultado',
                html: mensaje,
                icon: result.value.errores.length > 0 ? 'warning' : 'success',
                confirmButtonText: 'Cerrar'
            }).then(() => {
                // Recargar la página para ver la lista actualizada
                location.reload();
            });
        }
    });
}

function esCategoria(clave) {
    if (!clave) return false;

    const valor = clave.toString().trim().toUpperCase();

    // I, II, III, IV, V, VI, etc.
    return /^[IVXLCDM]+$/.test(valor);
}

function esSubcategoria(clave) {
    if (!clave) return false;

    const valor = clave.toString().trim().toUpperCase();

    // I.1, I.2, II.1, III.4, etc.
    return /^[IVXLCDM]+\.\d+$/.test(valor);
}

async function mostrarVistaPrevia(file) {
    try {
        console.log('Iniciando vista previa del archivo:', file.name);
        
        const conceptos = await catalogosManager.procesarArchivoExcel(file);
        
        console.log('Total conceptos procesados:', conceptos.length);
        console.log('Muestra de conceptos:', conceptos.slice(0, 5));
        
        // Analizar categorías
        const categorias = {};
        conceptos.forEach(c => {
            const cat = c.categoria || 'Sin categoría';
            if (!categorias[cat]) categorias[cat] = 0;
            categorias[cat]++;
        });
        
        console.log('Distribución por categorías:', categorias);
        
        const vistaPrevia = document.getElementById('vistaPrevia');
        const listaPrevia = document.getElementById('listaPrevia');
        
        vistaPrevia.style.display = 'block';
        
        if (conceptos.length > 0) {
            let html = `
                <div class="alert alert-success mb-3">
                    <strong>${conceptos.length} conceptos encontrados</strong>
                </div>
                
                <!-- Resumen por categorías -->
                <div class="card mb-3">
                    <div class="card-header bg-primary text-white">
                        <strong>Distribución por Categorías</strong>
                    </div>
                    <div class="card-body">
                        ${Object.entries(categorias).map(([cat, count]) => `
                            <div class="d-flex justify-content-between mb-1">
                                <span>${cat}</span>
                                <span class="badge bg-info">${count} conceptos</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <!-- Lista de conceptos -->
                <div class="card">
                    <div class="card-header">
                        <strong>Vista Previa (primeros 10)</strong>
                    </div>
                    <div class="list-group list-group-flush">
            `;
            
            conceptos.slice(0, 10).forEach((concepto, idx) => {
                html += `
                    <div class="list-group-item">
                        <div class="d-flex justify-content-between align-items-start">
                            <div class="flex-grow-1">
                                <h6 class="mb-1">
                                    <span class="badge bg-info">${concepto.codigo_concepto}</span>
                                    ${concepto.nombre_concepto}
                                </h6>
                                <small class="text-muted">
                                    ${concepto.categoria ? `📁 ${concepto.categoria}` : ''}
                                    ${concepto.subcategoria ? ` › 📂 ${concepto.subcategoria}` : ''}
                                    ${concepto.unidad_medida ? ` | ${concepto.unidad_medida}` : ''}
                                    ${concepto.numero_original ? ` | #${concepto.numero_original}` : ''}
                                </small>
                            </div>
                        </div>
                    </div>
                `;
            });
            
            if (conceptos.length > 10) {
                html += `
                    <div class="list-group-item text-center text-muted">
                        ... y ${conceptos.length - 10} más
                    </div>
                `;
            }
            
            html += `
                    </div>
                </div>
            `;
            
            listaPrevia.innerHTML = html;
        } else {
            listaPrevia.innerHTML = `
                <div class="alert alert-warning">
                    <strong>⚠️ No se encontraron conceptos válidos</strong><br>
                    Verifica que el archivo tenga columnas CLAVE y DESCRIPCIÓN con datos.
                </div>
            `;
        }
    } catch (error) {
        console.error('Error en vista previa:', error);
        document.getElementById('listaPrevia').innerHTML = 
            `<div class="alert alert-danger">
                <strong>Error:</strong> ${error.message}
                <br><small>Revisa la consola (F12) para más detalles</small>
            </div>`;
    }
}

// ====================================
// FUNCIONES DE DETALLE Y ELIMINACIÓN
// ====================================

function verDetalleConcepto(conceptoId, codigoClave, catalogoId, catalogoNombre, obraId = null, obraNombre = null) {
    catalogosManager.obtenerDetalleConcepto(conceptoId)
        .then(resp => {
            // Normalizar respuesta: el backend puede devolver { success:true, concepto: { ... } }
            let concepto = resp;
            if (resp && typeof resp === 'object' && ('success' in resp)) {
                if (resp.success === false) {
                    Swal.fire('Error', resp.error || resp.message || 'Error al cargar concepto', 'error');
                    return;
                }
                if (resp.concepto) {
                    concepto = resp.concepto;
                }
            }

            const montoTotal = parseFloat(concepto.monto_total) || 0;
            const totalItems = parseInt(concepto.total_items) || 0;
            
            // Escapar correctamente los valores que pueden ser null/undefined
            const nombreConcepto = String(concepto.nombre_concepto || '').replace(/'/g, "\\'");
            const catalogoNombreEscaped = String(catalogoNombre || '').replace(/'/g, "\\'");
            
            let detalleHtml = `
                <div class="concepto-simple">
                    <!-- Información principal -->
                    <div class="mb-3 text-center">
                        <h5 class="text-primary">${concepto.codigo_concepto || 'N/A'}</h5>
                    </div>

                    <!-- Datos básicos -->
                    <div class="mb-3">
                        <div class="d-flex justify-content-between border-bottom py-1">
                            <span>Unidad:</span>
                            <strong>${concepto.unidad_medida || 'N/A'}</strong>
                        </div>
                        <div class="d-flex justify-content-between border-bottom py-1">
                            <span>Categoría:</span>
                            <strong>${concepto.categoria || 'N/A'}</strong>
                        </div>
                        <div class="d-flex justify-content-between border-bottom py-1">
                            <span>Subcategoría:</span>
                            <strong>${concepto.subcategoria || 'N/A'}</strong>
                        </div>
                        ${concepto.numero_original ? `
                        <div class="d-flex justify-content-between border-bottom py-1">
                            <span>Número:</span>
                            <strong>${concepto.numero_original}</strong>
                        </div>
                        ` : ''}
                    </div>

                    <!-- Descripción si existe -->
                    ${concepto.descripcion ? `
                    <div class="mb-3">
                        <strong class="text-muted d-block">Descripción:</strong>
                        <div class="bg-light p-2 rounded small">${concepto.descripcion}</div>
                    </div>
                    ` : ''}

                    <!-- Estadísticas -->
                    <div class="row text-center mb-3">
                        <div class="col-6">
                            <div class="border rounded p-2">
                                <div class="text-primary fw-bold">${totalItems}</div>
                                <small class="text-muted">Items</small>
                            </div>
                        </div>
                        <div class="col-6">
                            <div class="border rounded p-2">
                                <div class="text-success fw-bold">$${montoTotal.toLocaleString('es-MX', {minimumFractionDigits: 0})}</div>
                                <small class="text-muted">Total</small>
                            </div>
                        </div>
                    </div>

                    <!-- Botones -->
                    <div class="gap-2">
                        <button class="btn btn-primary btn-sm" 
                            onclick="verItemsConcepto(${conceptoId}, '${nombreConcepto}', ${catalogoId}, '${catalogoNombreEscaped}')">
                            Ver Items
                        </button>
                        <button class="btn btn-outline-secondary btn-sm" onclick="Swal.close()">
                            Cerrar
                        </button>
                    </div>
                </div>
            `;
            
            Swal.fire({
                title: 'Detalle',
                html: detalleHtml,
                width: '90%',
                maxWidth: '400px',
                showCloseButton: true,
                showConfirmButton: false
            });
        })
        .catch(error => {
            console.error('Error:', error);
            Swal.fire('Error', 'No se pudo cargar', 'error');
        });
}

// Función para eliminar catálogo con confirmación
function eliminarCatalogo(catalogoId, obraId, obraNombre) {
    Swal.fire({
        title: '¿Eliminar catálogo?',
        html: `
            <div class="alert alert-warning">
                <i class="bi bi-exclamation-triangle"></i>
                <strong>Esta acción no se puede deshacer</strong><br>
                Se eliminarán todos los conceptos y items asociados a este catálogo.
            </div>
            <p class="text-muted small">¿Estás seguro de que deseas continuar?</p>
        `,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6'
    }).then((result) => {
        if (result.isConfirmed) {
            // Mostrar loading
            Swal.fire({
                title: 'Eliminando catálogo...',
                text: 'Por favor espere',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });
            
            catalogosManager.eliminarCatalogo(catalogoId)
                .then(result => {
                    if (result.success) {
                        Swal.fire({
                            icon: 'success',
                            title: 'Catálogo eliminado',
                            text: result.message,
                            timer: 2000,
                            showConfirmButton: false
                        }).then(() => {
                            // Recargar la página para ver la lista actualizada
                            location.reload();
                        });
                    } else {
                        Swal.fire('Error', result.error, 'error');
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    Swal.fire('Error', 'Error al eliminar el catálogo: ' + error.message, 'error');
                });
        }
    });
}

// Función para eliminar concepto con confirmación
function eliminarConcepto(conceptoId, catalogoId, catalogoNombre, obraId = null, obraNombre = null) {
    // Primero obtener información del concepto para mostrar en la confirmación
    catalogosManager.obtenerDetalleConcepto(conceptoId)
        .then(resp => {
            // Normalizar respuesta: manejar { success, concepto } o el objeto directamente
            let concepto = resp;
            if (resp && typeof resp === 'object' && ('success' in resp)) {
                if (resp.success === false) {
                    Swal.fire('Error', resp.error || resp.message || 'Error al cargar concepto', 'error');
                    return;
                }
                if (resp.concepto) concepto = resp.concepto;
            }

            const totalItems = parseInt(concepto.total_items) || 0;
            const tieneItems = totalItems > 0;
            
            Swal.fire({
                title: '¿Eliminar concepto?',
                html: `
                    <div class="text-start">
                        <p><strong>${concepto.codigo_concepto}</strong> - ${concepto.nombre_concepto}</p>
                        ${tieneItems ? `
                        <div class="alert alert-danger">
                            <i class="bi bi-exclamation-triangle"></i>
                            <strong>Este concepto tiene ${totalItems} items vinculados</strong><br>
                            Todos los items asociados también serán eliminados.
                        </div>
                        ` : `
                        <div class="alert alert-warning">
                            <i class="bi bi-info-circle"></i>
                            Este concepto no tiene items vinculados.
                        </div>
                        `}
                        <p class="text-muted small">¿Estás seguro de que deseas continuar?</p>
                    </div>
                `,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Sí, eliminar',
                cancelButtonText: 'Cancelar',
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6'
            }).then((result) => {
                if (result.isConfirmed) {
                    // Mostrar loading
                    Swal.fire({
                        title: 'Eliminando concepto...',
                        text: 'Por favor espere',
                        allowOutsideClick: false,
                        didOpen: () => {
                            Swal.showLoading();
                        }
                    });
                    
                    catalogosManager.eliminarConcepto(conceptoId)
                        .then(result => {
                            if (result.success) {
                                Swal.fire({
                                    icon: 'success',
                                    title: 'Concepto eliminado',
                                    text: result.message,
                                    timer: 2000,
                                    showConfirmButton: false
                                }).then(() => {
                                    // Recargar la página para ver la lista actualizada
                                    location.reload();
                                });
                            } else {
                                Swal.fire('Error', result.error, 'error');
                            }
                        })
                        .catch(error => {
                            console.error('Error:', error);
                            Swal.fire('Error', 'Error al eliminar el concepto: ' + error.message, 'error');
                        });
                }
            });
        })
        .catch(error => {
            console.error('Error:', error);
            Swal.fire('Error', 'No se pudo cargar la información del concepto', 'error');
        });
}

// Función para ver items de un concepto con mejoras
async function verItemsConcepto(conceptoId, conceptoNombre, catalogoId = null, catalogoNombre = null) {
    try {
        // Mostrar loading simple
        Swal.fire({
            title: 'Cargando...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
        
        const items = await catalogosManager.obtenerItemsConcepto(conceptoId);
        
        Swal.close();
        
        let itemsHtml = `
            <div class="items-simple">
                <!-- Header simple -->
                <div class="mb-3">
                    <h6 class="text-primary mb-1">${conceptoNombre}</h6>
                    <small class="text-muted">Items vinculados desde órdenes de compra</small>
                </div>
        `;

        if (items && items.length > 0) {
            let totalGeneral = 0;
            let totalCantidad = 0;
            
            // Lista simple de items
            itemsHtml += `<div class="list-group">`;
            
            items.forEach(item => {
                const cantidad = parseFloat(item.cantidad) || 0;
                const precioUnitario = parseFloat(item.precio_unitario) || 0;
                const subtotal = cantidad * precioUnitario;
                
                totalGeneral += subtotal;
                totalCantidad += cantidad;
                
                itemsHtml += `
                    <div class="list-group-item border-0">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <div class="flex-grow-1">
                                <strong class="d-block">${item.descripcion}</strong>
                                ${item.observaciones ? `<small class="text-muted">${item.observaciones}</small>` : ''}
                            </div>
                            <div class="text-end">
                                <div class="fw-bold text-success">$${subtotal.toLocaleString('es-MX', {minimumFractionDigits: 2})}</div>
                                <small class="text-muted">${cantidad} ${item.unidad_nombre || ''}</small>
                            </div>
                        </div>
                        <div class="d-flex justify-content-between small text-muted">
                            <span>Precio: $${precioUnitario.toLocaleString('es-MX', {minimumFractionDigits: 2})}</span>
                            <span>Orden: ${item.orden_folio || 'N/A'}</span>
                        </div>
                    </div>
                `;
            });
            
            itemsHtml += `</div>`;
            
            // Totales simples
            itemsHtml += `
                <div class="mt-3 p-3 bg-light rounded">
                    <div class="row text-center">
                        <div class="col-6 border-end">
                            <div class="fw-bold text-primary">${items.length}</div>
                            <small class="text-muted">Items</small>
                        </div>
                        <div class="col-6">
                            <div class="fw-bold text-success">$${totalGeneral.toLocaleString('es-MX', {minimumFractionDigits: 2})}</div>
                            <small class="text-muted">Total</small>
                        </div>
                    </div>
                </div>
            `;
        } else {
            itemsHtml += `
                <div class="text-center text-muted py-4">
                    <p class="mb-2">No hay items vinculados</p>
                    <small>Los items aparecerán cuando se aprueben órdenes de compra</small>
                </div>
            `;
        }

        // Botón simple
        itemsHtml += `
            <div class="mt-3">
                <button class="btn btn-outline-secondary w-50" onclick="Swal.close()">
                    Cerrar
                </button>
            </div>
        `;

        Swal.fire({
            title: 'Items',
            html: itemsHtml,
            width: '95%',
            maxWidth: '500px',
            showCloseButton: true,
            showConfirmButton: false
        });
        
    } catch (error) {
        console.error('Error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudieron cargar los items',
            width: '90%',
            maxWidth: '400px'
        });
    }
}

// Función para editar concepto (placeholder)
function editarConcepto(conceptoId) {
    Swal.fire({
        title: 'Editar Concepto',
        html: `
            <div class="alert alert-info">
                <i class="bi bi-info-circle"></i>
                La funcionalidad de edición de conceptos estará disponible en la próxima actualización.
            </div>
            <p class="text-muted">Mientras tanto, puedes eliminar y crear nuevamente el concepto con la información correcta.</p>
        `,
        icon: 'info',
        confirmButtonText: 'Entendido'
    });
}

// Función para editar catálogo (placeholder)
function editarCatalogo(catalogoId) {
    Swal.fire({
        title: 'Editar Catálogo',
        html: `
            <div class="alert alert-info">
                <i class="bi bi-info-circle"></i>
                La funcionalidad de edición de catálogos estará disponible en la próxima actualización.
            </div>
            <p class="text-muted">Actualmente solo puedes eliminar y crear nuevamente el catálogo.</p>
        `,
        icon: 'info',
        confirmButtonText: 'Entendido'
    });
}

// Función para abrir vista completa de conceptos
function abrirVistaConceptos(catalogoId, catalogoNombre, obraId = null, obraNombre = null) {
    let url = `conceptos_view.php?catalogo_id=${catalogoId}&catalogo_nombre=${encodeURIComponent(catalogoNombre)}`;
    
    if (obraId) {
        url += `&obra_id=${obraId}&obra_nombre=${encodeURIComponent(obraNombre)}`;
    }
    
    window.location.href = url;
}

// ====================================
// PROCESAMIENTO DE DATOS EXCEL
// ====================================

function procesarDatosCatalogoFlexible(jsonData) {
    const conceptos = [];
    
    // Paso 1: Buscar la fila de encabezados
    let filaEncabezados = -1;
    let mapeoColumnas = {};
    
    for (let i = 0; i < Math.min(jsonData.length, 20); i++) {
        const fila = jsonData[i];
        if (!fila || fila.length === 0) continue;
        
        const encabezadosEncontrados = detectarEncabezados(fila);
        
        if (encabezadosEncontrados.valido) {
            filaEncabezados = i;
            mapeoColumnas = encabezadosEncontrados.mapeo;
            console.log('Encabezados encontrados en fila', i, mapeoColumnas);
            break;
        }
    }
    
    if (filaEncabezados === -1) {
        throw new Error('No se encontraron los encabezados requeridos. Mínimo necesario: CLAVE y DESCRIPCIÓN');
    }
    
    // Paso 2: Procesar los datos
    let categoriaActual = '';
    let subcategoriaActual = '';
    let numeroSecuencial = 1;

    const categoriasDetectadas = [];
    const subcategoriasDetectadas = [];
    
    for (let i = filaEncabezados + 1; i < jsonData.length; i++) {
        const fila = jsonData[i];
        if (!fila || fila.length === 0) continue;
        
        // Extraer valores según el mapeo de columnas
        const numero = obtenerValorColumna(fila, mapeoColumnas.numero);
        const clave = obtenerValorColumna(fila, mapeoColumnas.clave);
        const descripcion = obtenerValorColumna(fila, mapeoColumnas.descripcion);
        const unidad = obtenerValorColumna(fila, mapeoColumnas.unidad);
        
        // Saltar filas completamente vacías
        if (!numero && !clave && !descripcion) continue;
        
        // Saltar filas de totales
        const descripcionUpper = descripcion.toUpperCase();
        if (descripcionUpper.includes('IMPORTE TOTAL') || 
            descripcionUpper.includes('TOTAL GENERAL') ||
            descripcionUpper.includes('SUBTOTAL') ||
            descripcionUpper === 'TOTAL') continue;
        
        const claveNormalizada = clave
        .toString()
        .trim()
        .toUpperCase()
        .replace(/[^IVXLCDM.]/g, '');

        // 1. CATEGORÍA (I, II, III...)
if (esCategoria(claveNormalizada) && descripcion) {

    categoriaActual = descripcion.trim();
    subcategoriaActual = null;

    categoriasDetectadas.push({
        clave: claveNormalizada,
        descripcion: categoriaActual
    });

    console.log(`📁 CATEGORÍA DETECTADA: ${claveNormalizada} - ${categoriaActual}`);
    continue;
}

// 2. SUBCATEGORÍA (I.1, I.2...)
if (esSubcategoria(claveNormalizada) && descripcion) {

    subcategoriaActual = descripcion.trim();

    subcategoriasDetectadas.push({
        clave: claveNormalizada,
        descripcion: subcategoriaActual,
        categoria: categoriaActual
    });

    console.log(`📂 SUBCATEGORÍA DETECTADA: ${claveNormalizada} - ${subcategoriaActual}`);
    continue;
}
        
        // 3. Si la fila tiene CLAVE y DESCRIPCIÓN, es un concepto válido
        if (clave && descripcion) {
            const concepto = {
                codigo_concepto: clave.trim(),
                nombre_concepto: generarNombreConcepto(descripcion),
                descripcion: descripcion.trim(),
                unidad_medida: unidad || obtenerUnidadDesdeDescripcion(descripcion),
                categoria: categoriaActual || '',
                subcategoria: subcategoriaActual || '',
                numero_original: numero || String(numeroSecuencial)
            };
            
            conceptos.push(concepto);
            numeroSecuencial++;
            
            console.log(`📋 Concepto ${conceptos.length} agregado:`, {
                clave: concepto.codigo_concepto,
                nombre: concepto.nombre_concepto.substring(0, 50),
                categoria: concepto.categoria,
                subcategoria: concepto.subcategoria
            });
        }
    }
    
    console.log(`✅ Total de conceptos procesados: ${conceptos.length}`);
    
    if (conceptos.length === 0) {
        throw new Error('No se encontraron conceptos válidos. Verifica que las columnas CLAVE y DESCRIPCIÓN tengan datos.');
    }
    
    return conceptos;
}

function detectarEncabezados(fila) {
    const mapeo = {
        numero: -1,
        clave: -1,
        descripcion: -1,
        unidad: -1
    };
    
    fila.forEach((celda, index) => {
        if (!celda) return;
        
        const valorNormalizado = String(celda).toUpperCase().trim().toString()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // Remover acentos
        
        // Detectar NUMERO (OPCIONAL)
        if (valorNormalizado.includes('NUMERO') || 
            valorNormalizado === 'NO.' ||
            valorNormalizado === 'NUM' ||
            valorNormalizado === '#') {
            mapeo.numero = index;
        }
        
        // Detectar CLAVE (REQUERIDO)
        if (valorNormalizado.includes('CLAVE') ||
            valorNormalizado.includes('CODIGO') ||
            valorNormalizado === 'CVE' ||
            valorNormalizado === 'COD' ||
            valorNormalizado === 'KEY') {
            mapeo.clave = index;
        }
        
        // Detectar DESCRIPCIÓN (REQUERIDO)
        if (valorNormalizado.includes('DESCRIPCION') ||
            valorNormalizado.includes('CONCEPTO') ||
            valorNormalizado.includes('NOMBRE') ||
            valorNormalizado === 'DESC') {
            mapeo.descripcion = index;
        }
        
        // Detectar UNIDAD (OPCIONAL)
        if (valorNormalizado.includes('UNIDAD') ||
            valorNormalizado.includes('U.M') ||
            valorNormalizado === 'UM' ||
            valorNormalizado === 'UNI' ||
            valorNormalizado === 'MEDIDA') {
            mapeo.unidad = index;
        }
    });
    
    // SOLO requiere CLAVE y DESCRIPCIÓN
    // NUMERO y UNIDAD son opcionales
    const valido = mapeo.clave !== -1 && mapeo.descripcion !== -1;
    
    if (valido) {
        console.log('Encabezados detectados:', {
            NUMERO: mapeo.numero !== -1 ? `Columna ${mapeo.numero}` : 'No encontrado (opcional)',
            CLAVE: `Columna ${mapeo.clave} ✓`,
            DESCRIPCION: `Columna ${mapeo.descripcion} ✓`,
            UNIDAD: mapeo.unidad !== -1 ? `Columna ${mapeo.unidad}` : 'No encontrado (opcional)'
        });
    }
    
    return {
        valido: valido,
        mapeo: mapeo
    };
}

function obtenerValorColumna(fila, indice) {
    if (indice === -1 || indice >= fila.length) return '';
    const valor = fila[indice];
    return valor ? String(valor).trim() : '';
}

function generarNombreConcepto(descripcion) {
    // Extraer el nombre principal de la descripción
    if (!descripcion) return 'Concepto sin nombre';
    
    // Limitar a 200 caracteres máximo
    let nombre = descripcion.substring(0, 200);
    
    // Si es muy largo, tomar solo la primera parte
    if (nombre.length > 100) {
        const primeraOracion = nombre.split('.')[0];
        if (primeraOracion.length > 50) {
            nombre = primeraOracion.substring(0, 100) + '...';
        } else {
            nombre = primeraOracion;
        }
    }
    
    return nombre.trim();
}

function obtenerUnidadDesdeDescripcion(descripcion) {
    // Intentar extraer unidad de la descripción
    if (!descripcion) return '';
    
    const unidades = ['m³', 'm2', 'kg', 'pza', 'm', 'lts', 'hr', 'día', 'mes'];
    for (const unidad of unidades) {
        if (descripcion.toLowerCase().includes(unidad.toLowerCase())) {
            return unidad;
        }
    }
    
    return '';
}

// ====================================
// FUNCIONES PARA VER DETALLES, ITEMS Y ELIMINAR CONCEPTOS
// ====================================

function verDetalleConcepto(conceptoId, codigoClave, catalogoId, catalogoNombre, obraId, obraNombre) {
    const manager = new CatalogosManager();
    
    manager.obtenerDetalleConcepto(conceptoId).then(data => {
        if (data.success && data.concepto) {
            const concepto = data.concepto;
            
            let html = `
                <div class="detail-container">
                    <div class="row mb-4">
                        <div class="col-md-6">
                            <div class="detail-section">
                                <h6 class="detail-label">Código</h6>
                                <p class="detail-value">${escapeHtml(concepto.codigo_concepto || 'N/A')}</p>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="detail-section">
                                <h6 class="detail-label">Número Original</h6>
                                <p class="detail-value">${escapeHtml(concepto.numero_original || 'N/A')}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="row mb-4">
                        <div class="col-12">
                            <div class="detail-section">
                                <h6 class="detail-label">Nombre del Concepto</h6>
                                <p class="detail-value">${escapeHtml(concepto.nombre_concepto || 'N/A')}</p>
                            </div>
                        </div>
                    </div>
                    
                    ${concepto.descripcion ? `
                    <div class="row mb-4">
                        <div class="col-12">
                            <div class="detail-section">
                                <h6 class="detail-label">Descripción</h6>
                                <p class="detail-value">${escapeHtml(concepto.descripcion)}</p>
                            </div>
                        </div>
                    </div>
                    ` : ''}
                    
                    <div class="row mb-4">
                        <div class="col-md-4">
                            <div class="detail-section">
                                <h6 class="detail-label">Categoría</h6>
                                <p class="detail-value">${escapeHtml(concepto.categoria || 'Sin Categoría')}</p>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="detail-section">
                                <h6 class="detail-label">Subcategoría</h6>
                                <p class="detail-value">${escapeHtml(concepto.subcategoria || 'General')}</p>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="detail-section">
                                <h6 class="detail-label">Unidad de Medida</h6>
                                <p class="detail-value">${escapeHtml(concepto.unidad_medida || 'N/A')}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="row">
                        <div class="col-12">
                            <div class="detail-section">
                                <h6 class="detail-label">Información Adicional</h6>
                                <ul class="list-unstyled">
                                    <li><strong>ID:</strong> ${concepto.id}</li>
                                    <li><strong>Catálogo:</strong> ${escapeHtml(catalogoNombre)}</li>
                                    ${obraNombre ? `<li><strong>Obra:</strong> ${escapeHtml(obraNombre)}</li>` : ''}
                                    <li><strong>Fecha de Creación:</strong> ${concepto.fecha_creacion ? new Date(concepto.fecha_creacion).toLocaleDateString('es-MX') : 'N/A'}</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            Swal.fire({
                title: 'Detalles del Concepto',
                html: html,
                icon: 'info',
                width: '600px',
                confirmButtonText: 'Cerrar',
                confirmButtonColor: '#0d6efd'
            });
        } else {
            Swal.fire('Error', 'No se pudo cargar los detalles del concepto', 'error');
        }
    }).catch(error => {
        console.error('Error:', error);
        Swal.fire('Error', 'Error al cargar los detalles: ' + error.message, 'error');
    });
}

/**
 * Mostrar items del concepto desde orden_compra_items
 */
function verItemsConcepto(conceptoId, conceptoNombre, catalogoId, catalogoNombre) {
    // Construir la URL para obtener los items
    const url = `PROATAM/orders/see_oc.php?concepto_id=${conceptoId}`;
    
    // Crear modal personalizado para mostrar items
    let html = `
        <div class="items-loader">
            <div class="text-center">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Cargando items...</span>
                </div>
                <p class="mt-2">Cargando items del concepto...</p>
            </div>
        </div>
    `;
    
    const modalHtml = Swal.fire({
        title: 'Items del Concepto',
        subtitle: escapeHtml(conceptoNombre),
        html: html,
        icon: 'info',
        width: '900px',
        confirmButtonText: 'Cerrar',
        confirmButtonColor: '#0d6efd',
        didOpen: () => {
            // Cargar items via AJAX
            fetch(`PROATAM/api/get_concepto_items.php?concepto_id=${conceptoId}`)
                .then(response => response.json())
                .then(data => {
                    let itemsHtml = '';
                    
                    if (data.success && data.items && data.items.length > 0) {
                        itemsHtml = `
                            <div class="table-responsive">
                                <table class="table table-hover table-sm">
                                    <thead class="table-light">
                                        <tr>
                                            <th>Descripción</th>
                                            <th class="text-center">Cantidad</th>
                                            <th class="text-center">Unidad</th>
                                            <th class="text-end">Precio Unitario</th>
                                            <th class="text-end">Subtotal</th>
                                            <th class="text-center">Orden Compra</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${data.items.map(item => `
                                            <tr>
                                                <td>${escapeHtml(item.descripcion || '')}</td>
                                                <td class="text-center">${parseFloat(item.cantidad).toFixed(3)}</td>
                                                <td class="text-center">${escapeHtml(item.unidad_medida || 'N/A')}</td>
                                                <td class="text-end">$${parseFloat(item.precio_unitario).toFixed(2)}</td>
                                                <td class="text-end fw-bold">$${parseFloat(item.subtotal).toFixed(2)}</td>
                                                <td class="text-center">
                                                    <span class="badge bg-success">${item.folio_oc || 'OC-' + item.orden_compra_id}</span>
                                                </td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                    <tfoot class="table-light fw-bold">
                                        <tr>
                                            <td colspan="4" class="text-end">Total:</td>
                                            <td class="text-end">$${data.items.reduce((sum, item) => sum + parseFloat(item.subtotal), 0).toFixed(2)}</td>
                                            <td></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        `;
                    } else {
                        itemsHtml = `
                            <div class="alert alert-info text-center">
                                <i class="bi bi-inbox display-1"></i>
                                <p class="mt-2">No hay items asignados a este concepto</p>
                            </div>
                        `;
                    }
                    
                    // Actualizar el contenido del modal
                    document.querySelector('.swal2-html-container').innerHTML = itemsHtml;
                })
                .catch(error => {
                    console.error('Error:', error);
                    document.querySelector('.swal2-html-container').innerHTML = `
                        <div class="alert alert-danger">
                            <i class="bi bi-exclamation-triangle me-2"></i>
                            Error al cargar los items: ${error.message}
                        </div>
                    `;
                });
        }
    });
}

/**
 * Eliminar concepto de forma permanente
 */
function eliminarConcepto(conceptoId, catalogoId, catalogoNombre, obraId, obraNombre) {
    Swal.fire({
        title: '¿Eliminar concepto?',
        text: 'Esta acción eliminará el concepto de forma permanente. Esta acción no se puede deshacer.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            // Mostrar loading
            Swal.fire({
                title: 'Eliminando...',
                html: 'Por favor espere mientras se elimina el concepto',
                didOpen: () => {
                    Swal.showLoading();
                }
            });
            
            // Enviar solicitud de eliminación
            fetch('PROATAM/projects/catalogos_manager.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    action: 'eliminar_concepto',
                    concepto_id: conceptoId
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    Swal.fire({
                        title: 'Eliminado',
                        text: 'El concepto ha sido eliminado correctamente',
                        icon: 'success',
                        confirmButtonColor: '#0d6efd'
                    }).then(() => {
                        // Recargar la página para reflejar los cambios
                        location.reload();
                    });
                } else {
                    Swal.fire('Error', data.message || 'No se pudo eliminar el concepto', 'error');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                Swal.fire('Error', 'Error al eliminar: ' + error.message, 'error');
            });
        }
    });
}

/**
 * Función helper para escapar HTML
 */
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return String(text || '').replace(/[&<>"']/g, m => map[m]);
}

function renderizarConceptosAgrupados(conceptos, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Agrupar por categoría y subcategoría
    const grupos = {};
    let sinCategoria = [];
    
    conceptos.forEach(c => {
        const cat = c.categoria?.trim() || '';
        const sub = c.subcategoria?.trim() || '';
        
        if (!cat) {
            sinCategoria.push(c);
            return;
        }
        
        if (!grupos[cat]) grupos[cat] = { nombre: cat, subs: {}, directos: [] };
        
        if (sub) {
            if (!grupos[cat].subs[sub]) grupos[cat].subs[sub] = [];
            grupos[cat].subs[sub].push(c);
        } else {
            grupos[cat].directos.push(c);
        }
    });
    
    // Renderizar HTML
    let html = '';
    
    // Ordenar categorías (I, II, III, etc.)
    const ordenRomano = {'I':1,'II':2,'III':3,'IV':4,'V':5,'VI':6,'VII':7,'VIII':8,'IX':9,'X':10};
    const catsOrdenadas = Object.keys(grupos).sort((a,b) => (ordenRomano[a]||999) - (ordenRomano[b]||999));
    
    catsOrdenadas.forEach(catKey => {
        const cat = grupos[catKey];
        html += `
            <div class="mb-4 border rounded">
                <div class="bg-primary text-white p-3 fw-bold">
                    📁 ${cat.nombre}
                </div>
                <div class="p-3">
        `;
        
        // Subcategorías
        const subsOrdenadas = Object.keys(cat.subs).sort((a,b) => {
            const [,numA] = a.split('.');
            const [,numB] = b.split('.');
            return (parseInt(numA)||0) - (parseInt(numB)||0);
        });
        
        subsOrdenadas.forEach(subKey => {
            html += `
                <div class="mb-3 ms-3">
                    <div class="bg-light p-2 rounded border-start border-3 border-secondary">
                        📂 <strong>${subKey}</strong>
                    </div>
                    <div class="ms-4 mt-2">
                        ${renderConceptosList(cat.subs[subKey])}
                    </div>
                </div>
            `;
        });
        
        // Conceptos directos
        if (cat.directos.length > 0) {
            html += renderConceptosList(cat.directos);
        }
        
        html += '</div></div>';
    });
    
    // Sin categoría
    if (sinCategoria.length > 0) {
        html += `
            <div class="mb-4 border rounded">
                <div class="bg-secondary text-white p-3 fw-bold">
                    Sin Categoría
                </div>
                <div class="p-3">
                    ${renderConceptosList(sinCategoria)}
                </div>
            </div>
        `;
    }
    
    container.innerHTML = html;
}

function renderConceptosList(conceptos) {
    if (!conceptos || conceptos.length === 0) return '<p class="text-muted">Sin conceptos</p>';
    
    return conceptos.map(c => {
        const monto = parseFloat(c.monto_total || 0);
        const items = parseInt(c.total_items || 0);
        
        return `
            <div class="card mb-2 shadow-sm">
                <div class="card-body p-3">
                    <div class="d-flex justify-content-between align-items-start">
                        <div class="flex-grow-1">
                            <h6 class="mb-1">
                                <span class="badge bg-info">${c.codigo_concepto}</span>
                                ${c.nombre_concepto}
                            </h6>
                            ${c.descripcion ? `<p class="mb-1 small text-muted">${c.descripcion.substring(0,80)}...</p>` : ''}
                            <small class="text-muted">
                                ${c.unidad_medida ? ` ${c.unidad_medida}` : ''}
                                ${c.numero_original ? ` | #${c.numero_original}` : ''}
                            </small>
                        </div>
                        <div class="text-end">
                            <div class="badge bg-success mb-2">$${monto.toLocaleString('es-MX')}</div>
                            <br>
                            <small class="text-muted">${items} items</small>
                            <div class="btn-group btn-group-sm mt-2">
                                <button class="btn btn-sm btn-outline-primary" 
                                    onclick="verDetalleConcepto(${c.id}, '${c.codigo_concepto}', ${c.catalogo_id}, '')">
                                    
                                </button>
                                <button class="btn btn-sm btn-outline-danger" 
                                    onclick="eliminarConcepto(${c.id}, ${c.catalogo_id}, '')">
                                    
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}