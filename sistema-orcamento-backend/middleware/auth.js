// middleware/auth.js
const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  // Pega o token do cabeçalho da requisição
  const token = req.header('x-auth-token');

  // Verifica se não há token
  if (!token) {
    return res.status(401).json({ msg: 'Nenhum token, autorização negada' });
  }

  // Verifica se o token é válido
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Adiciona o payload do usuário (que contém id e permissao) ao objeto da requisição
    req.usuario = decoded.usuario;
    next(); // Passa para a próxima etapa (a rota final)
  } catch (err) {
    res.status(401).json({ msg: 'Token não é válido' });
  }
};