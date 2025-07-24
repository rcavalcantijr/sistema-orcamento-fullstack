// src/components/PreviaOrcamentoModal.js
import React, { useState, useEffect } from 'react';
import api from '../api';
import { formatCurrency } from '../utils/formatters';

const PreviaOrcamentoModal = ({ orcamentoId, onClose, onImprimir }) => {
  const [orcamento, setOrcamento] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orcamentoId) return;
    const fetchOrcamento = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/orcamentos/${orcamentoId}`);
        setOrcamento(response.data);
      } catch (error) {
        console.error("Erro ao buscar dados para a prévia:", error);
        alert("Não foi possível carregar os dados do orçamento.");
        onClose(); // Fecha o modal em caso de erro
      } finally {
        setLoading(false);
      }
    };
    fetchOrcamento();
  }, [orcamentoId, onClose]);

  if (loading || !orcamento) {
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <p>Carregando pré-visualização...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Pré-visualização do Orçamento Nº {String(orcamento.id).padStart(5, '0')}</h2>
          <button onClick={onClose} className="modal-close-btn">&times;</button>
        </div>
        <div className="modal-body">
          <p><strong>Cliente:</strong> {orcamento.nome_completo}</p>
          <p><strong>CPF/CNPJ:</strong> {orcamento.cpf_cnpj}</p>
          <p><strong>Responsável:</strong> {orcamento.nome_contato} {orcamento.email_contato ? `(${orcamento.email_contato})` : ''}</p>
          <hr />
          <h4>Itens do Orçamento:</h4>
          <table className="previa-table">
            <thead>
              <tr>
                <th>Descrição</th>
                <th>Qtde</th>
                <th>Valor Unit.</th>
                <th>Desconto</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {orcamento.itens.map((item, index) => {
                const subtotal = item.quantidade * item.valor_unitario;
                const subtotalComDesconto = subtotal - (subtotal * ((item.desconto_percentual || 0) / 100));
                return (
                  <tr key={index}>
                    <td>{item.descricao}</td>
                    <td className="text-center">{item.quantidade}</td>
                    <td className="text-right">R$ {formatCurrency(item.valor_unitario)}</td>
                    <td className="text-center" style={{color: 'green', fontWeight: 'bold'}}>{item.desconto_percentual || 0}%</td>
                    <td className="text-right">R$ {formatCurrency(subtotalComDesconto)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <div className="total-container">
            <strong>Valor Total: R$ {formatCurrency(orcamento.valor_total)}</strong>
          </div>
        </div>
        <div className="modal-footer">
          <button onClick={onClose} className="btn-cancel">Fechar</button>
          <button onClick={() => onImprimir(orcamento.id)} className="btn-view">Imprimir Documento</button>
        </div>
      </div>
    </div>
  );
};

export default PreviaOrcamentoModal;