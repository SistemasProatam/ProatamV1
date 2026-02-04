<?php
// Incluir el gestor de sesiones UNA sola vez
require_once __DIR__ . "/includes/session_manager.php"; 
require_once __DIR__ . "/includes/check_session.php";

// Verificar sesión y prevenir caching
checkSession();
preventCaching();

include __DIR__ . "/conexion.php";

// Obtener ID del usuario en sesión
$user_id = $_SESSION['user_id'] ?? null;

// Obtener datos completos del usuario desde la base de datos
$user_data = [
    'nombres' => '',
    'apellidos' => '', 
    'correo_corporativo' => '',
    'departamento' => 'Sin departamento'
];

if ($user_id) {
    $sql = "SELECT u.nombres, u.apellidos, u.correo_corporativo, d.nombre as departamento 
            FROM usuarios u 
            LEFT JOIN departamentos d ON u.departamento_id = d.id 
            WHERE u.id = ?";
    
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        $user_data = $result->fetch_assoc();
        
        // ✅ GUARDAR EN SESIÓN DESPUÉS de obtener los datos
        $_SESSION['user_email'] = $user_data['correo_corporativo'];
        $_SESSION['user_id'] = $user_id;
    }
    $stmt->close();
}

// Obtener departamentos para el dropdown
$departamentos = $conn->query("SELECT id, nombre FROM departamentos ORDER BY nombre ASC");
$departamentosOptions = "<option value=''>Selecciona tu departamento</option>";

while($dep = $departamentos->fetch_assoc()){
    $selected = ($user_data['departamento'] == $dep['nombre']) ? "selected" : "";
    $departamentosOptions .= "<option value='{$dep['nombre']}' $selected>{$dep['nombre']}</option>";
}
?>

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Solicitud de Soporte Técnico</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css">
    <link rel="stylesheet" href="assets/styles/new_order.css">
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
</head>
<body>

    <?php include $_SERVER['DOCUMENT_ROOT'] . "/PROATAM/includes/navbar.php"; ?>

<!-- HERO SECTION -->
<div class="hero-section">
  <div class="container hero-content">
    <div class="breadcrumb-custom">
        <a href="/PROATAM/index.php"><i class="bi bi-house-door"></i> Inicio</a>
      <span>/</span>
      <a href="list_project.php"> Solicitud de Soporte Técnico</a>
    </div>
    
    <div class="row align-items-end">
      <div class="col-lg-8">
        <h1 class="hero-title">Solicitud de Soporte Técnico</h1>
        </div>
      </div>
    </div>
  </div>
</div>

    <!-- MAIN CONTENT -->
<div class="content-wrapper">
    <div class="form-container">
        <div class="form-body">

            <div>
              <p>
                <b>¿Necesitas ayuda?</b> Estamos aquí para apoyarte. <br>
                Completa el formulario y nos pondremos en contacto contigo a través del correo corporativo.
              </p>
            </div>

        <form id="supportForm" enctype="multipart/form-data">
            <div class="form-section">
                <div class="section-title">
                    <i class="bi bi-person-circle"></i> Información del Solicitante
                </div>
                
               <div class="row">
    <div class="col-md-6">
        <div class="mb-3">
            <label for="nombre" class="form-label">Nombre completo <span class="required">*</span></label>
            <input type="text" name="nombres" id="nombres" class="form-control" required 
                   placeholder="Ingresa tus nombres" 
                   value="<?php echo htmlspecialchars($user_data['nombres'] . '' . $user_data['apellidos']); ?>">
        </div>
    </div>
    <div class="col-md-6">
        <div class="mb-3">
            <label for="email" class="form-label">Correo Corporativo <span class="required">*</span></label>
            <input type="email" name="correo_corporativo" id="correo_corporativo" class="form-control" required 
                   placeholder="usuario@proatam.com"
                   value="<?php echo htmlspecialchars($user_data['correo_corporativo']); ?>">
        </div>
    </div>
</div>

<div class="row">
    <div class="col-md-6">
        <div class="mb-3">
            <label for="departamento" class="form-label">Departamento/Área</label>
            <input type="text" name="departamento" id="departamento" class="form-control" required
               value="<?php echo htmlspecialchars($user_data['departamento']); ?>">
        </div>
    </div>
</div>
            </div>
            
            <div class="form-section">
                <div class="section-title">
                    <i class="bi bi-exclamation-triangle"></i> Detalles del Problema
                </div>
                
                <div class="mb-3">
                    <label for="asunto" class="form-label">Asunto <span class="required">*</span></label>
                    <input type="text" name="asunto" id="asunto" class="form-control" required 
                           placeholder="Breve descripción del problema">
                </div>
                
                <div class="mb-3">
                    <label for="sistema_afectado" class="form-label">Sistema Afectado <span class="required">*</span></label>
                    <select name="sistema_afectado" id="sistema_afectado" class="form-select" required>
                        <option value="">Selecciona el sistema afectado</option>
                        <option value="Sistema">Sistema PROATAM</option>
                        <option value="Correo Electrónico">Correo Electrónico</option>
                        <option value="Software">Software</option>
                        <option value="Base de Datos">Base de Datos</option>
                        <option value="Otro">Otro</option>
                    </select>
                </div>
                
                <div class="mb-3">
                    <label for="urgencia" class="form-label">Nivel de Urgencia <span class="required">*</span></label>
                    <select name="urgencia" id="urgencia" class="form-select" required>
                        <option value="">Selecciona el nivel de urgencia</option>
                        <option value="Baja"><span class="priority-indicator priority-low"></span> Baja - No afecta operaciones</option>
                        <option value="Media"><span class="priority-indicator priority-medium"></span> Media - Afecta parcialmente</option>
                        <option value="Alta"><span class="priority-indicator priority-high"></span> Alta - Afecta significativamente</option>
                        <option value="Urgente"><span class="priority-indicator priority-urgent"></span> Urgente - Bloquea operaciones críticas</option>
                    </select>
                </div>
                
                <div class="mb-3">
                    <label for="descripcion" class="form-label">Descripción Detallada <span class="required">*</span></label>
                    <textarea name="descripcion" id="descripcion" class="form-control" required 
                              placeholder="Describe el problema con el mayor detalle posible..."></textarea>
                </div>
                
            </div>
            
            <div class="form-section">
                <div class="section-title">
                    <i class="bi bi-paperclip"></i> Archivos Adjuntos
                </div>
                
                <div class="mb-3">
                    <label for="adjuntos" class="form-label">Adjuntar Archivos</label>
                    <input type="file" name="adjuntos[]" id="adjuntos" class="form-control" multiple 
                           accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.xls,.xlsx,.txt">
                    <div class="form-text">Puedes adjuntar imágenes, documentos o archivos de texto (Máx. 5 archivos, 5MB cada uno)</div>
                </div>
            </div>

            <!-- Enviar -->
        <div class="form-actions mt-3">
          <div class="send-otxt">La respuesta a esta solicitud será enviada por medio del correo corporativo.
          </div>
          <button type="submit" class="button-57" id="submitBtn"><i class="bi bi-floppy"></i> Enviar solicitud</button>
        </div>
        
        </form>
        </div>
    </div>
</div>

   <script>
    // Contador de caracteres
    document.getElementById('descripcion').addEventListener('input', function() {
        document.getElementById('descripcionCount').textContent = this.value.length;
    });
    
    // Mostrar archivos seleccionados
    document.getElementById('adjuntos').addEventListener('change', function() {
        const fileList = document.getElementById('fileList');
        fileList.innerHTML = '';
        
        if (this.files.length > 0) {
            const list = document.createElement('ul');
            list.className = 'list-group';
            
            for (let i = 0; i < this.files.length; i++) {
                const listItem = document.createElement('li');
                listItem.className = 'list-group-item d-flex justify-content-between align-items-center';
                listItem.innerHTML = `
                    <span>${this.files[i].name}</span>
                    <small class="text-muted">${(this.files[i].size / 1024 / 1024).toFixed(2)} MB</small>
                `;
                list.appendChild(listItem);
            }
            
            fileList.appendChild(list);
        }
    });
    
    // Envío del formulario
    document.getElementById('supportForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const submitBtn = document.getElementById('submitBtn');
        const formData = new FormData(this);
        
        // Validaciones básicas - CORREGIDO
        const requiredFields = ['nombres', 'correo_corporativo', 'asunto', 'sistema_afectado', 'urgencia', 'descripcion'];
        let isValid = true;
        
        for (const field of requiredFields) {
            const element = document.getElementById(field);
            if (!element || !element.value.trim()) {
                if (element) element.classList.add('is-invalid');
                isValid = false;
            } else {
                element.classList.remove('is-invalid');
            }
        }
        
        // Validar email - CORREGIDO
        const email = document.getElementById('correo_corporativo').value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            document.getElementById('correo_corporativo').classList.add('is-invalid');
            Swal.fire({ 
                icon: 'error', 
                title: 'Email inválido', 
                text: 'Ingresa un correo electrónico válido.' 
            });
            return;
        }
        
        if (!isValid) {
            Swal.fire({ 
                icon: 'warning', 
                title: 'Campos requeridos', 
                text: 'Por favor, completa todos los campos obligatorios.' 
            });
            return;
        }
        
        // Validar archivos adjuntos
        const files = document.getElementById('adjuntos').files;
        if (files.length > 5) {
            Swal.fire({ 
                icon: 'warning', 
                title: 'Demasiados archivos', 
                text: 'Solo puedes adjuntar hasta 5 archivos.' 
            });
            return;
        }
        
        for (let i = 0; i < files.length; i++) {
            if (files[i].size > 5 * 1024 * 1024) {
                Swal.fire({ 
                    icon: 'warning', 
                    title: 'Archivo muy grande', 
                    text: `El archivo "${files[i].name}" excede el límite de 5MB.` 
                });
                return;
            }
        }
        
        // Cambiar estado del botón - SIMPLIFICADO
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> Enviando...';
        
        try {
    const response = await fetch('enviar_soporte.php', {
        method: 'POST',
        body: formData
    });

    // Verificar si la respuesta es JSON válido
    const responseText = await response.text();
    console.log('Respuesta cruda:', responseText);
    
    let result;
    try {
        result = JSON.parse(responseText);
    } catch (e) {
        console.error('No es JSON válido:', responseText);
        throw new Error('Respuesta inválida del servidor');
    }
            if (result.success) {
                Swal.fire({
                    icon: 'success',
                    title: '¡Solicitud Enviada!',
                    html: `
                        <div style="text-align: left;">
                            <p><strong>${result.message}</strong></p>
                            ${result.ticket ? `<p><strong>Ticket:</strong> ${result.ticket}</p>` : ''}
                            <p>Hemos enviado una confirmación a tu correo corporativo.</p>
                        </div>
                    `,
                    confirmButtonText: 'Aceptar',
                    confirmButtonColor: '#3085d6'
                }).then(() => {
                    // Redirigir al inicio después de enviar
                    window.location.href = 'index.php';
                });
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error al enviar',
                    html: `
                        <div style="text-align: left;">
                            <p><strong>No se pudo enviar la solicitud:</strong></p>
                            <p>${result.message}</p>
                            <small>Por favor, intenta nuevamente.</small>
                        </div>
                    `,
                    confirmButtonText: 'Intentar nuevamente',
                    confirmButtonColor: '#d33'
                });
            }

        } catch (error) {
            console.error('Error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error de conexión',
                text: 'No se pudo conectar con el servidor. Verifica tu conexión a internet.',
                confirmButtonText: 'Entendido'
            });
        } finally {
            // Restaurar botón
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    });
    
    // Quitar clase de error al escribir en campos
    const inputs = document.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
        input.addEventListener('input', function() {
            if (this.value.trim()) {
                this.classList.remove('is-invalid');
            }
        });
    });
</script>

<?php include 'includes/footer.php'; ?>

<script src="/PROATAM/assets/scripts/session_timeout.js"></script>

</body>
</html>