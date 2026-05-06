<?php
/**
 * OUT LED — API Bridge (MySQL & File Upload)
 * =========================================
 * Este script serve como ponte entre o frontend e o banco de dados MySQL,
 * substituindo as funcionalidades do Supabase.
 */

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// Tratar pre-flight OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

// 1. Configurações do Banco de Dados
$host = 'localhost'; // Use 'localhost' ou '177.95.115.5'
$db   = 'exp_test';
$user = 'exp_test';
$pass = 'exp@sollAr26';
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erro de conexão com o banco de dados: ' . $e->getMessage()]);
    exit;
}

// 2. Roteamento de Ações
$action = $_GET['action'] ?? '';

switch ($action) {
    case 'loadAll':
        try {
            $products = $pdo->query("SELECT * FROM products ORDER BY created_at ASC")->fetchAll();
            $categories = $pdo->query("SELECT * FROM categories ORDER BY sort_order ASC")->fetchAll();
            
            // Converter strings JSON para arrays
            foreach ($products as &$p) {
                $p['photos'] = json_decode($p['photos'] ?? '[]', true);
                $p['videos'] = json_decode($p['videos'] ?? '[]', true);
            }
            
            echo json_encode(['products' => $products, 'categories' => $categories]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;

    case 'saveProduct':
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data) {
            echo json_encode(['error' => 'Dados inválidos']);
            exit;
        }

        try {
            $sql = "INSERT INTO products (id, name, codigo, cat, cat_label, old_price, price, img, photos, videos, description, `condition`, icon, color) 
                    VALUES (:id, :name, :codigo, :cat, :cat_label, :old_price, :price, :img, :photos, :videos, :description, :condition, :icon, :color)
                    ON DUPLICATE KEY UPDATE 
                    name=:name, codigo=:codigo, cat=:cat, cat_label=:cat_label, old_price=:old_price, price=:price, img=:img, photos=:photos, videos=:videos, description=:description, `condition`=:condition, icon=:icon, color=:color";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                'id'          => $data['id'],
                'name'        => $data['name'],
                'codigo'      => $data['codigo'] ?? null,
                'cat'         => $data['cat'] ?? null,
                'cat_label'   => $data['catLabel'] ?? null,
                'old_price'   => $data['oldPrice'] ?? 0,
                'price'       => $data['price'] ?? 0,
                'img'         => $data['img'] ?? null,
                'photos'      => json_encode($data['photos'] ?? []),
                'videos'      => json_encode($data['videos'] ?? []),
                'description' => $data['description'] ?? null,
                'condition'   => $data['condition'] ?? null,
                'icon'        => $data['icon'] ?? null,
                'color'       => $data['color'] ?? null
            ]);
            
            echo json_encode(['success' => true]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;

    case 'deleteProduct':
        $data = json_decode(file_get_contents('php://input'), true);
        $id = $data['id'] ?? '';
        try {
            $stmt = $pdo->prepare("DELETE FROM products WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode(['success' => true]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;

    case 'saveCategory':
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data) {
            echo json_encode(['error' => 'Dados inválidos']);
            exit;
        }

        try {
            $sql = "INSERT INTO categories (id, label, icon, sort_order) 
                    VALUES (:id, :label, :icon, :sort_order)
                    ON DUPLICATE KEY UPDATE 
                    label=:label, icon=:icon, sort_order=:sort_order";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                'id'         => $data['id'],
                'label'      => $data['label'],
                'icon'       => $data['icon'] ?? null,
                'sort_order' => $data['sort_order'] ?? 0
            ]);
            
            echo json_encode(['success' => true]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;

    case 'deleteCategory':
        $data = json_decode(file_get_contents('php://input'), true);
        $id = $data['id'] ?? '';
        try {
            $stmt = $pdo->prepare("DELETE FROM categories WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode(['success' => true]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;

    case 'upload':
        if (!isset($_FILES['file'])) {
            echo json_encode(['error' => 'Nenhum arquivo enviado']);
            exit;
        }

        $file = $_FILES['file'];
        $prefix = $_POST['prefix'] ?? 'uploads';
        
        // Criar diretórios se não existirem
        $targetDir = "uploads/" . $prefix . "/";
        if (!file_exists($targetDir)) {
            mkdir($targetDir, 0777, true);
        }

        $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
        $newName = time() . '-' . uniqid() . '.' . $ext;
        $targetFile = $targetDir . $newName;

        if (move_uploaded_file($file['tmp_name'], $targetFile)) {
            // Retorna a URL absoluta (ajuste se necessário)
            $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http";
            $url = $protocol . "://" . $_SERVER['HTTP_HOST'] . dirname($_SERVER['PHP_SELF']) . '/' . $targetFile;
            echo json_encode(['url' => $url]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Falha ao mover arquivo']);
        }
        break;

    default:
        echo json_encode(['error' => 'Ação não encontrada']);
        break;
}
