// =====================================================================
// OUT LED — Configuração do Servidor (MySQL + PHP)
// =====================================================================
// Para ATIVAR a sincronização entre admin e catálogo:
//
//   1. Suba o arquivo api.php para o seu servidor.
//   2. Certifique-se de que a URL abaixo aponta para o local correto.
//
// Enquanto API_URL estiver vazio, o site continua funcionando 
// normalmente com localStorage (modo offline).
// =====================================================================

window.OUTLED_SERVER = {
  API_URL: "api.php", // ex: "https://seu-dominio.com.br/api.php"
};
