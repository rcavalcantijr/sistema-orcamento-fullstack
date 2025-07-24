// src/utils/formatters.js

/**
 * Formata um número para o padrão de moeda brasileira (BRL).
 * Exemplo: 1234.5 se torna "1.234,50"
 * @param {number | string} value O valor a ser formatado.
 * @returns {string} O valor formatado como moeda.
 */
export const formatCurrency = (value) => {
  const number = Number(value) || 0;
  return number.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};