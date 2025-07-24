// src/components/GerenciarClausulas.js
import React, { useState, useEffect } from 'react';
import api from '../api';

const formInicial = {
  titulo: '',
  texto: ''
};

const GerenciarClausulas = () => {
  const [clausulas, setClausulas] = useState([]);
  const [formState, setFormState] = useState(formInicial);
  const [clausulaEmEdicao, setClausulaEmEdicao] = useState(null);
  // NOVO: Estado para o termo de busca
  const [termoBusca, setTermoBusca] = useState('');

  // MODIFICADO: useEffect agora depende do termoBusca para refazer a pesquisa
  useEffect(() => {
    const fetchClausulas = async () => {
      try {
        const response = await api.get('/clausulas', {
          params: { busca: termoBusca }
        });
        setClausulas(response.data);
      } catch (error) {
        console.error("Erro ao buscar cláusulas:", error);
      }
    };
    
    const timer = setTimeout(() => {
      fetchClausulas();
    }, 500);

    return () => clearTimeout(timer);
  }, [termoBusca]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormState({ ...formState, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const method = clausulaEmEdicao ? 'put' : 'post';
    const url = clausulaEmEdicao
      ? `/clausulas/${clausulaEmEdicao.id}`
      : '/clausulas';

    try {
      // A resposta da API será usada para atualizar a tela
      const response = await api[method](url, formState);

      if (clausulaEmEdicao) {
        // Se estava editando, atualiza o item específico na lista
        setClausulas(clausulas.map(c => 
          (c.id === clausulaEmEdicao.id ? response.data.data : c)
        ));
      } else {
        // Se estava criando, adiciona o novo item à lista
        setClausulas([...clausulas, response.data]);
      }

      setFormState(formInicial);
      setClausulaEmEdicao(null);
      alert(clausulaEmEdicao ? 'Cláusula atualizada com sucesso!' : 'Cláusula criada com sucesso!');
      
    } catch (error) {
      console.error(`Erro ao ${clausulaEmEdicao ? 'atualizar' : 'adicionar'} cláusula:`, error);
      if (error.response?.data?.message) {
        alert(error.response.data.message);
      } else {
        alert("Erro ao salvar cláusula.");
      }
    }
  };

  const handleEditClick = (clausula) => {
    setClausulaEmEdicao(clausula);
    setFormState(clausula);
  };

  const handleCancelEdit = () => {
    setFormState(formInicial);
    setClausulaEmEdicao(null);
  };

  const handleDelete = async (clausulaId) => {
    if (window.confirm("Tem certeza de que deseja deletar esta cláusula?")) {
      try {
        await api.delete(`/clausulas/${clausulaId}`);
        setClausulas(clausulas.filter(c => c.id !== clausulaId));
        alert("Cláusula deletada com sucesso!");
      } catch (error) {
         if (error.response?.data?.message) {
            alert(error.response.data.message);
         } else {
            alert('Ocorreu um erro ao tentar deletar a cláusula.');
         }
        console.error("Erro ao deletar cláusula:", error);
      }
    }
  };

  return (
    <div className="container">
      <h2>Gerenciar Cláusulas Contratuais</h2>
      <div className="form-container">
        <h3>{clausulaEmEdicao ? 'Editar Cláusula' : 'Adicionar Nova Cláusula'}</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input type="text" name="titulo" value={formState.titulo} onChange={handleInputChange} placeholder="Título da Cláusula (ex: Garantia)" required />
          </div>
          <div className="form-group">
            <textarea name="texto" value={formState.texto} onChange={handleInputChange} placeholder="Texto completo da cláusula..." required />
          </div>
          <div className="form-buttons">
            <button type="submit">{clausulaEmEdicao ? 'Salvar Alterações' : 'Adicionar Cláusula'}</button>
            {clausulaEmEdicao && (
              <button type="button" className="btn-cancel" onClick={handleCancelEdit}>Cancelar</button>
            )}
          </div>
        </form>
      </div>
      <div className="list-container">
        <h3>Cláusulas Cadastradas</h3>

        {/* NOVO: Caixa de busca adicionada */}
        <div className="search-container">
            <input
              type="text"
              placeholder="Buscar por título..."
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
            />
        </div>

        <table className="clients-table">
          <thead>
            <tr>
              <th>Título</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {clausulas.map((clausula) => (
              <tr key={clausula.id}>
                <td>{clausula.titulo}</td>
                <td>
                  <button className="btn-edit" onClick={() => handleEditClick(clausula)}>Editar</button>
                  <button className="btn-delete" onClick={() => handleDelete(clausula.id)}>Deletar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GerenciarClausulas;