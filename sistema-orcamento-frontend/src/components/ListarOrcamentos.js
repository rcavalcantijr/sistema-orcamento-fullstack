// src/components/ListarOrcamentos.js
import React, { useState, useEffect } from 'react';
import api from '../api';

// --- MUDANÇA 1: A prop 'onVerDetalhes' foi trocada por 'onAbrirPrevia' ---
const ListarOrcamentos = ({ onAbrirPrevia, onEditarOrcamento }) => {
  const [orcamentos, setOrcamentos] = useState([]);
  const [termoBusca, setTermoBusca] = useState('');

  useEffect(() => {
    const fetchOrcamentos = async () => {
      try {
        const response = await api.get('/orcamentos', {
          params: { busca: termoBusca }
        });
        setOrcamentos(response.data);
      } catch (error) {
        console.error("Erro ao buscar orçamentos:", error);
      }
    };

    const timer = setTimeout(() => {
        fetchOrcamentos();
    }, 500); 
    
    return () => clearTimeout(timer);
  }, [termoBusca]);

  const handleStatusChange = async (orcamentoId, novoStatus) => {
    setOrcamentos(orcamentos.map(o => 
        o.id === orcamentoId ? { ...o, status: novoStatus } : o
    ));
    try {
        await api.patch(`/orcamentos/${orcamentoId}/status`, { status: novoStatus });
        const response = await api.get('/orcamentos', { params: { busca: termoBusca } });
        setOrcamentos(response.data);
    } catch (error) {
        console.error("Erro ao atualizar status:", error);
        alert("Não foi possível atualizar o status. A página será atualizada.");
        const response = await api.get('/orcamentos', { params: { busca: termoBusca } });
        setOrcamentos(response.data);
    }
  };

  const handleDelete = async (orcamentoId) => {
    if (window.confirm("Tem certeza de que deseja deletar este orçamento? Esta ação não pode ser desfeita.")) {
      try {
        await api.delete(`/orcamentos/${orcamentoId}`);
        setOrcamentos(orcamentos.filter(orcamento => orcamento.id !== orcamentoId));
        alert("Orçamento deletado com sucesso!");
      } catch (error) {
        console.error("Erro ao deletar orçamento:", error);
        alert("Ocorreu um erro ao tentar deletar o orçamento.");
      }
    }
  };

  return (
    <div className="container">
      <h2>Orçamentos Salvos</h2>
      <div className="search-container">
        <input
          type="text"
          placeholder="Buscar por nº do orçamento ou nome do cliente..."
          value={termoBusca}
          onChange={(e) => setTermoBusca(e.target.value)}
        />
      </div>
      <div className="list-container">
        <table className="clients-table">
          <thead>
            <tr>
              <th>Nº Orçamento</th>
              <th>Revisão</th>
              <th>Cliente</th>
              <th>Autor</th>
              <th>Data de Criação</th>
              <th>Valor Total</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {orcamentos.map((orcamento) => (
              <tr key={orcamento.id}>
                <td>{String(orcamento.id).padStart(5, '0')}</td>
                <td>{orcamento.revisao}</td>
                <td>{orcamento.cliente_nome}</td>
                <td>{orcamento.autor_nome}</td>
                <td>{new Date(orcamento.data_criacao).toLocaleDateString('pt-BR')}</td>
                <td>R$ {Number(orcamento.valor_total).toFixed(2).replace('.', ',')}</td>
                <td><span className={`status status-${orcamento.status?.toLowerCase().replace('ç', 'c').replace('ã', 'a')}`}>{orcamento.status}</span></td>
                <td>
                  <div className='actions-group'>
                    {/* --- MUDANÇA 2: O botão "Ver" agora chama a nova função 'onAbrirPrevia' --- */}
                    <button className="btn-view" title="Ver Detalhes" onClick={() => onAbrirPrevia(orcamento.id)}>Ver</button>
                    <button className="btn-edit" title="Editar Orçamento" onClick={() => onEditarOrcamento(orcamento.id)}>Editar</button>
                    <select 
                      className="status-select" 
                      value={orcamento.status} 
                      onChange={(e) => handleStatusChange(orcamento.id, e.target.value)}
                      disabled={['Aprovado', 'Cancelado', 'Vencido'].includes(orcamento.status)}
                      title="Mudar Status"
                    >
                      <option value={orcamento.status} disabled>{orcamento.status}</option>
                      {!['Aprovado', 'Cancelado', 'Vencido'].includes(orcamento.status) && (
                        <>
                          <option value="Aprovado">Aprovar</option>
                          <option value="Cancelado">Cancelar</option>
                        </>
                      )}
                    </select>
                    <button className="btn-delete" title="Deletar Orçamento" onClick={() => handleDelete(orcamento.id)}>Deletar</button>
                  </div>
                </td>
              </tr>
            ))}
            {orcamentos.length === 0 && (<tr><td colSpan="8">Nenhum orçamento encontrado.</td></tr>)}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ListarOrcamentos;
