<?php
include_once __DIR__ . "/../conexion.php";

// Headers para JSON
header('Content-Type: application/json');

if (isset($_GET['id'])) {
    $id = intval($_GET['id']);

    try {
        // Verificar dependencias antes de eliminar
        $dependencias = [];

        // 1. Verificar si tiene requisiciones (usando solicitante_id)
        $sql_requisiciones = "SELECT COUNT(*) as count FROM requisiciones WHERE solicitante_id = ?";
        $stmt_requisiciones = $conn->prepare($sql_requisiciones);
        if (!$stmt_requisiciones) {
            throw new Exception("Error preparando consulta de requisiciones: " . $conn->error);
        }
        $stmt_requisiciones->bind_param("i", $id);
        $stmt_requisiciones->execute();
        $result_requisiciones = $stmt_requisiciones->get_result()->fetch_assoc();
        if ($result_requisiciones['count'] > 0) {
            $dependencias[] = "tiene " . $result_requisiciones['count'] . " requisición(es) relacionada(s)";
        }
        $stmt_requisiciones->close();

        // 2. Verificar si tiene órdenes de compra (usando las columnas correctas)
        // Primero verificar qué columnas existen en la tabla ordenes_compra
        $sql_check_columns = "SHOW COLUMNS FROM ordenes_compra";
        $result_columns = $conn->query($sql_check_columns);
        $columnas_ordenes = [];
        while ($col = $result_columns->fetch_assoc()) {
            $columnas_ordenes[] = $col['Field'];
        }

        $sql_ordenes = "";
        // Construir la consulta según las columnas que existan
        if (in_array('solicitante_id', $columnas_ordenes)) {
            $sql_ordenes = "SELECT COUNT(*) as count FROM ordenes_compra WHERE solicitante_id = ?";
        } elseif (in_array('usuario_id', $columnas_ordenes)) {
            $sql_ordenes = "SELECT COUNT(*) as count FROM ordenes_compra WHERE usuario_id = ?";
        } elseif (in_array('creado_por', $columnas_ordenes)) {
            $sql_ordenes = "SELECT COUNT(*) as count FROM ordenes_compra WHERE creado_por = ?";
        }

        if (!empty($sql_ordenes)) {
            $stmt_ordenes = $conn->prepare($sql_ordenes);
            if ($stmt_ordenes) {
                $stmt_ordenes->bind_param("i", $id);
                $stmt_ordenes->execute();
                $result_ordenes = $stmt_ordenes->get_result()->fetch_assoc();
                if ($result_ordenes['count'] > 0) {
                    $dependencias[] = "tiene " . $result_ordenes['count'] . " orden(es) de compra relacionada(s)";
                }
                $stmt_ordenes->close();
            }
        }

        // 3. Verificar si tiene historial de requisiciones (usando usuario_id)
        $sql_historial = "SELECT COUNT(*) as count FROM requisicion_historial WHERE usuario_id = ?";
        $stmt_historial = $conn->prepare($sql_historial);
        if ($stmt_historial) {
            $stmt_historial->bind_param("i", $id);
            $stmt_historial->execute();
            $result_historial = $stmt_historial->get_result()->fetch_assoc();
            if ($result_historial['count'] > 0) {
                $dependencias[] = "tiene " . $result_historial['count'] . " registro(s) en el historial";
            }
            $stmt_historial->close();
        }

        // 4. Verificar otras posibles dependencias según tu estructura
        // Por ejemplo, si tienes una tabla de aprobaciones, comentarios, etc.

        // Si hay dependencias, retornar error con detalles
        if (!empty($dependencias)) {
            echo json_encode([
                'status' => 'error',
                'message' => "No se puede eliminar el usuario porque " . implode(", ", $dependencias) . "."
            ]);
            exit;
        }

        // Si no hay dependencias, proceder con la eliminación
        $sql = "DELETE FROM usuarios WHERE id = ?";
        $stmt = $conn->prepare($sql);

        if (!$stmt) {
            throw new Exception("Error preparando consulta de eliminación: " . $conn->error);
        }

        $stmt->bind_param("i", $id);

        if ($stmt->execute()) {
            echo json_encode([
                'status' => 'success',
                'message' => 'Usuario eliminado correctamente'
            ]);
        } else {
            throw new Exception("Error ejecutando eliminación: " . $stmt->error);
        }

        $stmt->close();
    } catch (Exception $e) {
        echo json_encode([
            'status' => 'error',
            'message' => $e->getMessage()
        ]);
    }
} else {
    echo json_encode([
        'status' => 'error',
        'message' => 'ID no proporcionado'
    ]);
}

$conn->close();
