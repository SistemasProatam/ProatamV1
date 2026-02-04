<?php
require_once __DIR__ . "/../includes/session_manager.php";
require_once __DIR__ . "/../includes/check_session.php";
checkSession();
preventCaching();

include(__DIR__ . "/../conexion.php");

$id = intval($_GET['id']);

// Obtener datos del usuario
$sql = "SELECT u.*, d.nombre AS departamento
        FROM usuarios u
        LEFT JOIN departamentos d ON u.departamento_id = d.id
        WHERE u.id = ?";

$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $id);
$stmt->execute();
$res = $stmt->get_result();
$user = $res->fetch_assoc();

if (!$user) {
    header("Location: list_users.php?error=Usuario no encontrado");
    exit;
}

// Obtener departamentos para el select
$departamentos = $conn->query("SELECT id, nombre FROM departamentos ORDER BY nombre ASC");
$departamentosOptions = "";
while ($dep = $departamentos->fetch_assoc()) {
    $selected = $user['departamento_id'] == $dep['id'] ? "selected" : "";
    $departamentosOptions .= "<option value='{$dep['id']}' $selected>{$dep['nombre']}</option>";
}

?>

<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8">
    <title>Editar Usuario - <?= htmlspecialchars($user['nombres'] . ' ' . $user['apellidos']) ?></title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css">
    <link rel="stylesheet" href="/PROATAM/assets/styles/list.css">
    <style>
        .form-container-custom {
            background: white;
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            margin-top: 20px;
        }

        .document-section {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            margin: 15px 0;
        }

        .section-title {
            border-bottom: 2px solid #3f7555;
            padding-bottom: 10px;
            margin-bottom: 20px;
            color: #2c3e50;
        }

        .current-file {
            background: #e9ecef;
            padding: 8px 12px;
            border-radius: 4px;
            margin-top: 5px;
            font-size: 0.9em;
        }
    </style>
</head>

<body>
    <?php include __DIR__ . "/../includes/navbar.php"; ?>

    <!-- HERO SECTION -->
    <div class="hero-section">
        <div class="container hero-content">
            <div class="breadcrumb-custom">
                <a href="/PROATAM/index.php"><i class="bi bi-house-door"></i> Inicio</a>
                <span>/</span>
                <a href="list_users.php"> Registro de Usuarios</a>
                <span>/</span>
                <a href="details_user.php?id=<?= $user['id'] ?>">Detalles del Usuario</a>
                <span>/</span>
                <span>Editar Usuario</span>
            </div>

            <div class="row align-items-end">
                <div class="col-lg-8">
                    <h1 class="hero-title">Editar Usuario: <?= htmlspecialchars($user['nombres'] . ' ' . $user['apellidos']) ?></h1>
                </div>
                <div class="col-lg-4 text-end">
                    <a href="details_user.php?id=<?= $user['id'] ?>" class="btn btn-secondary">
                        <i class="bi bi-arrow-left"></i> Volver a Detalles
                    </a>
                </div>
            </div>
        </div>
    </div>

    <!-- MAIN CONTENT -->
    <div class="content-wrapper">
        <div class="container">
            <div class="form-container-custom">
                <form id="formEditarUsuario" method="POST" action="update_user.php" enctype="multipart/form-data">
                    <input type="hidden" name="id" value="<?= $user['id'] ?>">

                    <!-- Información Básica -->
                    <div class="section-title">
                        <h4><i class="bi bi-person"></i> Información Básica</h4>
                    </div>

                    <div class="row">
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label class="form-label">Nombres <span class="required">*</span></label>
                                <input type="text" name="nombres" class="form-control"
                                    value="<?= htmlspecialchars($user['nombres']) ?>" required>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label class="form-label">Apellidos <span class="required">*</span></label>
                                <input type="text" name="apellidos" class="form-control"
                                    value="<?= htmlspecialchars($user['apellidos']) ?>" required>
                            </div>
                        </div>
                    </div>

                    <div class="row">
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label class="form-label">Correo Corporativo <span class="required">*</span></label>
                                <input type="email" name="correo_corporativo" class="form-control"
                                    value="<?= htmlspecialchars($user['correo_corporativo']) ?>" required>
                                <small class="text-muted">Debe terminar en @proatam.com</small>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label class="form-label">Correo Personal</label>
                                <input type="email" name="correo_personal" class="form-control"
                                    value="<?= htmlspecialchars($user['correo_personal'] ?? '') ?>">
                            </div>
                        </div>
                    </div>

                    <div class="row">
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label class="form-label">Número de Celular Particular</label>
                                <input type="text" name="telefono_personal" class="form-control"
                                    value="<?= htmlspecialchars($user['telefono_personal'] ?? '') ?>">
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label class="form-label">Departamento <span class="required">*</span></label>
                                <select name="departamento_id" class="form-select" required>
                                    <option value="">-- Seleccionar Departamento --</option>
                                    <?= $departamentosOptions ?>
                                </select>
                            </div>
                        </div>
                    </div>

                    <!-- Funciones y Actividades -->
                    <div class="mb-3">
                        <label class="form-label">Lista de Funciones y Actividades a Cargo</label>
                        <textarea name="funciones_actividades" class="form-control" rows="4"><?= htmlspecialchars($user['funciones_actividades'] ?? '') ?></textarea>
                    </div>

                    <div class="row">
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label class="form-label">Fecha de Ingreso </label>
                                <input type="date" name="fecha_ingreso" class="form-control"
                                    value="<?= htmlspecialchars($user['fecha_ingreso'] ?? '') ?>">
                            </div>
                        </div>
                    </div>

                    <!-- Contacto de Emergencia -->
                    <div class="section-title">
                        <h4><i class="bi bi-telephone"></i> Contacto de Emergencia</h4>
                    </div>

                    <div class="row">
                        <div class="col-md-4">
                            <div class="mb-3">
                                <label class="form-label">Nombre Completo</label>
                                <input type="text" name="contacto_emergencia_nombre" class="form-control"
                                    value="<?= htmlspecialchars($user['contacto_emergencia_nombre'] ?? '') ?>">
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="mb-3">
                                <label class="form-label">Parentesco</label>
                                <input type="text" name="contacto_emergencia_parentesco" class="form-control"
                                    value="<?= htmlspecialchars($user['contacto_emergencia_parentesco'] ?? '') ?>">
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="mb-3">
                                <label class="form-label">Número de Celular</label>
                                <input type="text" name="contacto_emergencia_telefono" class="form-control"
                                    value="<?= htmlspecialchars($user['contacto_emergencia_telefono'] ?? '') ?>">
                            </div>
                        </div>
                    </div>

                    <!-- Documentos del Expediente -->
                    <div class="section-title">
                        <h4><i class="bi bi-folder"></i> Documentos del Expediente</h4>
                        <small class="text-muted">Solo selecciona un archivo si deseas reemplazar el actual</small>
                    </div>

                    <div class="document-section">
                        <div class="row">
                            <div class="col-md-6">
                                <?php mostrarCampoArchivo('curriculum_pdf', 'Curriculum Vitae (PDF)', $user); ?>
                                <?php mostrarCampoArchivo('identificacion_pdf', 'Identificación Oficial (PDF)', $user); ?>
                                <?php mostrarCampoArchivo('acta_nacimiento_pdf', 'Acta de Nacimiento (PDF)', $user); ?>
                                <?php mostrarCampoArchivo('curp_pdf', 'CURP (PDF)', $user); ?>
                                <?php mostrarCampoArchivo('situacion_fiscal_pdf', 'Constancia de Situación Fiscal 2025 (PDF)', $user); ?>
                            </div>

                            <div class="col-md-6">
                                <?php mostrarCampoArchivo('nss_pdf', 'Número de Seguro Social (PDF)', $user); ?>
                                <?php mostrarCampoArchivo('comprobante_domicilio_pdf', 'Comprobante de Domicilio (PDF)', $user); ?>
                                <?php mostrarCampoArchivo('foto_jpg', 'Foto (JPG, fondo blanco)', $user); ?>
                                <?php mostrarCampoArchivo('comprobante_estudios_pdf', 'Último Comprobante de Estudios (PDF)', $user); ?>
                                <?php mostrarCampoArchivo('credencial_pdf', 'Credencial Corporativa (PDF)', $user); ?>
                            </div>

                            <div class="col-md-6">
                                <?php mostrarSeccionContratos($id, $conn); ?>
                            </div>

                        </div>
                    </div>

                    <!-- Botones de acción -->
                    <div class="d-flex justify-content-between mt-4">
                        <a href="details_user.php?id=<?= $user['id'] ?>" class="btn btn-secondary">
                            <i class="bi bi-arrow-left"></i> Cancelar
                        </a>
                        <button type="submit" class="btn btn-success">
                            <i class="bi bi-check-circle"></i> Actualizar Usuario
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <?php include __DIR__ . "/../includes/footer.php"; ?>

    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    <script>
        // Manejar el envío del formulario
        document.getElementById('formEditarUsuario').addEventListener('submit', function(e) {
            e.preventDefault();

            const formData = new FormData(this);

            fetch('update_user.php', {
                    method: 'POST',
                    body: formData
                })
                .then(res => res.json())
                .then(data => {
                    if (data.status === 'success') {
                        Swal.fire({
                            icon: 'success',
                            title: '¡Éxito!',
                            html: data.message,
                            confirmButtonText: 'Aceptar'
                        }).then(() => {
                            window.location.href = 'details_user.php?id=<?= $user['id'] ?>';
                        });
                    } else {
                        Swal.fire({
                            icon: 'error',
                            title: 'Error',
                            text: data.message,
                            confirmButtonText: 'Aceptar'
                        });
                    }
                })
                .catch(error => {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error de conexión',
                        text: 'No se pudo conectar con el servidor',
                        confirmButtonText: 'Aceptar'
                    });
                });
        });
    </script>

    <script>
        // Manejar agregar nuevos contratos
        document.getElementById('agregar-contrato').addEventListener('click', function() {
            const container = document.getElementById('nuevos-contratos');
            const newItem = document.createElement('div');
            newItem.className = 'contrato-item mb-2';
            const index = container.children.length;
            newItem.innerHTML = `
        <div class="input-group">
            <input type="file" name="nuevos_contratos[]" class="form-control" accept=".pdf" required>
            <select name="nuevos_tipos_contrato[]" class="form-select">
                <option value="">-- Tipo --</option>
                <option value="Indeterminado">Tiempo Indeterminado</option>
                <option value="Determinado">Tiempo Determinado</option>
                <option value="Prueba">Periodo de Prueba</option>
                <option value="Obra">Obra Determinada</option>
                <option value="Otro">Otro</option>
            </select>
            <button type="button" class="btn btn-danger btn-remove-contrato">
                <i class="bi bi-trash"></i>
            </button>
        </div>
        `;
            container.appendChild(newItem);
        });

        // Delegar evento para eliminar contratos nuevos
        document.addEventListener('click', function(e) {
            if (e.target.closest('.btn-remove-contrato')) {
                const item = e.target.closest('.contrato-item');
                item.remove();
            }
        });
    </script>
</body>

</html>

<?php
// Función para mostrar campos de archivo
function mostrarCampoArchivo($campo, $label, $user)
{
    $archivo = $user[$campo] ?? '';
    $accept = $campo === 'foto_jpg' ? '.jpg,.jpeg' : '.pdf';
?>
    <div class="mb-3">
        <label class="form-label"><?= $label ?></label>
        <input type="file" name="<?= $campo ?>" class="form-control" accept="<?= $accept ?>">
        <?php if ($archivo): ?>
            <div class="current-file">
                <i class="bi bi-file-earmark"></i> Archivo actual:
                <a href="../uploads/usuarios/<?= htmlspecialchars($archivo) ?>" target="_blank">
                    <?= htmlspecialchars($archivo) ?>
                </a>
            </div>
        <?php else: ?>
            <div class="current-file text-muted">
                <i class="bi bi-file-earmark"></i> No hay archivo subido
            </div>
        <?php endif; ?>
    </div>
<?php
}
?>

<?php
// Función para mostrar la sección de contratos
function mostrarSeccionContratos($id, $conn)
{
?>
    <div class="mb-3">
        <label class="form-label">Contratos (PDF)</label>
        <div id="contratos-container">
            <?php
            // Mostrar contratos existentes
            $sql_contratos = "SELECT * FROM contratos_usuario WHERE usuario_id = ? ORDER BY tipo_contrato DESC";
            $stmt_contratos = $conn->prepare($sql_contratos);
            $stmt_contratos->bind_param("i", $id);
            $stmt_contratos->execute();
            $contratos_existentes = $stmt_contratos->get_result();

            if ($contratos_existentes->num_rows > 0):
                while ($contrato = $contratos_existentes->fetch_assoc()):
            ?>
                    <div class="contrato-item mb-2">
                        <?php if (!empty($contrato['nombre_archivo'])): ?>
                            <div class="current-file mt-1">
                                <div class="d-flex justify-content-between align-items-center">
                                    <div class="flex-grow-1">
                                        <i class="bi bi-file-earmark-pdf"></i>
                                        Archivo actual:
                                        <a href="../uploads/usuarios/<?= htmlspecialchars($contrato['nombre_archivo']) ?>" target="_blank">
                                            <?= htmlspecialchars($contrato['nombre_archivo']) ?>
                                        </a>
                                    </div>
                                    <div class="ms-3">
                                        <span>Tipo: <?= htmlspecialchars($contrato['tipo_contrato']) ?></span>
                                    </div>
                                    <div class="ms-2">
                                        <button type="button" class="btn btn-sm btn-danger btn-remove-contrato">
                                            <i class="bi bi-trash"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        <?php else: ?>
                            <div class="current-file text-muted mt-1">
                                <i class="bi bi-file-earmark"></i> No hay archivo subido
                            </div>
                        <?php endif; ?>
                    </div>
                <?php
                endwhile;
            else:
                ?>
                <p class="text-muted">No hay contratos registrados.</p>
            <?php endif; ?>
            <?php $stmt_contratos->close(); ?>

            <!-- Nuevos contratos -->
            <div id="nuevos-contratos"></div>
        </div>

        <button type="button" class="btn btn-sm btn-secondary mt-2" id="agregar-contrato">
            <i class="bi bi-plus"></i> Agregar nuevo contrato
        </button>
        <small class="text-muted d-block mt-1">Puedes agregar múltiples contratos</small>
    </div>
<?php
}
?>