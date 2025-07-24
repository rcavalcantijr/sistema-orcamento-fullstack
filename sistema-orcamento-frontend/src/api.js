// src/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001/api'
});

// Isso é um "interceptador". Ele intercepta TODAS as requisições
// antes de serem enviadas e anexa o token.
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    // O nome 'x-auth-token' deve ser o mesmo que o middleware espera
    config.headers['x-auth-token'] = token;
  }
  return config;
}, error => {
  return Promise.reject(error);
});

export default api;