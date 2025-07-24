// src/components/GerenciarProdutos.js
import React, { useState, useEffect } from 'react';
import api from '../api';
// --- MUDANÇA 1: Importa o componente de máscara ---
import { IMaskInput } from 'react-imask';

const formInicial = { descricao: '', valor_unitario: '', ncm: '' };

const GerenciarProdutos = () => {
  const [produtos, setProdutos] = useState([]);
  const [formState, setFormState] = useState(formInicial);
  const [produtoEmEdicao, setProdutoEmEdicao] = useState(null);
  const [termoBusca, setTermoBusca] = useState('');

  useEffect(() => {
    const fetchProdutos = async () => {
      try {
        const response = await api.get('/produtos', {
          params: { busca: termoBusca }
        });
        setProdutos(response.data);
      } catch (error) {
        console.error("Erro ao buscar produtos:", error);
      }
    };
    const timer = setTimeout(() => {
        fetchProdutos();
    }, 300);

    return () => clearTimeout(timer);
  }, [termoBusca]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormState({ ...formState, [name]: value });
  };

  // --- MUDANÇA 2: Handler para o campo com máscara ---
  const handleMaskedInputChange = (value, name) => {
    setFormState({ ...formState, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const method = produtoEmEdicao ? 'put' : 'post';
    const url = produtoEmEdicao ? `/produtos/${produtoEmEdicao.id}` : '/produtos';
    try {
      const response = await api[method](url, formState);
      if (produtoEmEdicao) {
        setProdutos(produtos.map(p => (p.id === produtoEmEdicao.id ? response.data.data : p)));
      } else {
        setProdutos([...produtos, response.data]);
      }
      setFormState(formInicial);
      setProdutoEmEdicao(null);
      alert(produtoEmEdicao ? 'Produto/Serviço atualizado com sucesso!' : 'Produto/Serviço criado com sucesso!');
    } catch (error) {
      console.error(`Erro ao ${produtoEmEdicao ? 'atualizar' : 'adicionar'} produto:`, error);
      if (error.response?.data?.message) {
        alert(error.response.data.message);
      } else {
        alert("Erro ao salvar produto/serviço.");
      }
    }
  };

  const handleEditClick = (produto) => {
    setProdutoEmEdicao(produto);
    setFormState(produto);
  };

  const handleCancelEdit = () => {
    setProdutoEmEdicao(null);
    setFormState(formInicial);
  };

  const handleDelete = async (produtoId) => {
    if (window.confirm("Tem certeza de que deseja deletar este item?")) {
      try {
        await api.delete(`/produtos/${produtoId}`);
        setProdutos(produtos.filter(p => p.id !== produtoId));
        alert("Produto/Serviço deletado com sucesso!");
      } catch (error) {
        if (error.response?.data?.message) {
          alert(error.response.data.message);
        } else {
          alert('Ocorreu um erro ao tentar deletar o item.');
        }
        console.error("Erro ao deletar produto:", error);
      }
    }
  };

  return (
    <div className="container">
      <h2>Gerenciar Produtos e Serviços</h2>
      <div className="form-container">
        <h3>{produtoEmEdicao ? 'Editar Item' : 'Adicionar Novo Item'}</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group"><input type="text" name="descricao" value={formState.descricao} onChange={handleInputChange} placeholder="Descrição do Produto/Serviço" required /></div>
          <div className="form-group"><input type="number" step="0.01" name="valor_unitario" value={formState.valor_unitario} onChange={handleInputChange} placeholder="Valor Unitário (ex: 150.00)" required /></div>
          <div className="form-group">
            {/* --- MUDANÇA 3: Substituição do input pelo IMaskInput --- */}
            <IMaskInput
              mask="0000.00.00"
              value={formState.ncm || ''}
              name="ncm"
              onAccept={(value) => handleMaskedInputChange(value, 'ncm')}
              placeholder="NCM (opcional)"
              className="input-mascarado"
            />
          </div>
          <div className="form-buttons">
            <button type="submit">{produtoEmEdicao ? 'Salvar Alterações' : 'Adicionar Item'}</button>
            {produtoEmEdicao && (<button type="button" className="btn-cancel" onClick={handleCancelEdit}>Cancelar</button>)}
          </div>
        </form>
      </div>
      <div className="list-container">
        <h3>Itens Cadastrados</h3>
        <div className="search-container">
          <input
            type="text"
            placeholder="Buscar por descrição..."
            value={termoBusca}
            onChange={(e) => setTermoBusca(e.target.value)}
          />
        </div>
        <table className="clients-table">
          <thead><tr><th>Descrição</th><th>NCM</th><th>Valor Unitário</th><th>Ações</th></tr></thead>
          <tbody>
            {produtos.map((produto) => (
              <tr key={produto.id}>
                <td>{produto.descricao}</td>
                <td>{produto.ncm}</td>
                <td>R$ {Number(produto.valor_unitario).toFixed(2).replace('.', ',')}</td>
                <td>
                  <button className="btn-edit" onClick={() => handleEditClick(produto)}>Editar</button>
                  <button className="btn-delete" onClick={() => handleDelete(produto.id)}>Deletar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default GerenciarProdutos;