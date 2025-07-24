// src/components/GerenciarModelos.js
import React, { useState, useEffect } from 'react';
import api from '../api';
import SearchableDropdown from './SearchableDropdown';

const formInicial = { id: null, nome_modelo: '', descricao: '', itens: [], clausulas: [] };

// ALTERAÇÃO 1: Recebendo a prop 'onUsarModelo'
const GerenciarModelos = ({ onUsarModelo }) => {
  const [modelos, setModelos] = useState([]);
  const [formState, setFormState] = useState(formInicial);
  const [editandoId, setEditandoId] = useState(null);
  const [produtos, setProdutos] = useState([]);
  const [clausulas, setClausulas] = useState([]);

  const fetchData = async () => {
    try {
      const [resModelos, resProdutos, resClausulas] = await Promise.all([
        api.get('/modelos'),
        api.get('/produtos'),
        api.get('/clausulas')
      ]);
      setModelos(resModelos.data);
      setProdutos(resProdutos.data.map(p => ({ id: p.id, label: p.descricao, ...p })));
      setClausulas(resClausulas.data.map(c => ({ id: c.id, label: c.titulo, ...c })));
    } catch (error) { console.error("Erro ao buscar dados:", error); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleEditClick = async (modelo) => {
    try {
        const response = await api.get(`/modelos/${modelo.id}`);
        setEditandoId(modelo.id);
        const dadosCompletos = { ...response.data, itens: response.data.itens || [], clausulas: response.data.clausulas || [] };
        setFormState(dadosCompletos);
        window.scrollTo(0, 0);
    } catch (error) {
        console.error("Erro ao carregar detalhes do modelo:", error);
        alert("Não foi possível carregar os detalhes do modelo.");
    }
  };

  const handleCancelEdit = () => { setEditandoId(null); setFormState(formInicial); };
  
  const handleAddItemAoModelo = (produto) => {
    if (!produto) return;
    if (formState.itens.find(i => i.produto_servico_id === produto.id)) { 
        alert("Este item já foi adicionado."); 
        return; 
    }
    const novoItem = { ...produto, quantidade: 1, produto_servico_id: produto.id };
    setFormState(prev => ({ ...prev, itens: [...prev.itens, novoItem]}));
  };

  const handleRemoveItemDoModelo = (id) => { setFormState(prev => ({...prev, itens: prev.itens.filter(i => i.produto_servico_id !== id)})); };
  
  const handleAddClausulaAoModelo = (clausula) => {
    if (!clausula) return;
    if (formState.clausulas.find(c => c.id === clausula.id)) { alert("Esta cláusula já foi adicionada."); return; }
    setFormState(prev => ({ ...prev, clausulas: [...prev.clausulas, clausula]}));
  };

  const handleRemoveClausulaDoModelo = (id) => { setFormState(prev => ({...prev, clausulas: prev.clausulas.filter(c => c.id !== id)})); };

  const handleDelete = async (modeloId) => {
    if (window.confirm("Tem certeza que deseja deletar este modelo?")) {
      try {
        await api.delete(`/modelos/${modeloId}`);
        fetchData();
        alert("Modelo deletado com sucesso!");
      } catch (error) { console.error("Erro ao deletar modelo:", error); alert("Erro ao deletar modelo."); }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const method = editandoId ? 'put' : 'post';
    const url = editandoId ? `/modelos/${editandoId}` : '/modelos';
    const payload = {
        nome_modelo: formState.nome_modelo,
        descricao: formState.descricao,
        itens: formState.itens.map(i => ({ produto_servico_id: i.produto_servico_id, quantidade: i.quantidade })),
        clausulas_ids: formState.clausulas.map(c => c.id)
    };
    try {
      await api[method](url, payload);
      handleCancelEdit();
      fetchData();
      alert(editandoId ? 'Modelo atualizado com sucesso!' : 'Modelo criado com sucesso!');
    } catch (error) { console.error("Erro ao salvar modelo:", error); alert("Erro ao salvar."); }
  };
  
  // A lógica de renderização unificada que você prefere
  return (
    <div className="container">
      <h2>Gerenciar Modelos de Orçamento</h2>
      
      <div className="form-container">
        <h3>{editandoId ? `Editando Modelo: ${formState.nome_modelo}` : 'Criar Novo Modelo'}</h3>
        <form onSubmit={handleSubmit}>
            <div className="form-group"><label>Nome do Modelo</label><input type="text" name="nome_modelo" value={formState.nome_modelo} onChange={handleInputChange} placeholder="Ex: Modelo para Website Básico" required /></div>
            <div className="form-group"><label>Descrição</label><textarea name="descricao" value={formState.descricao || ''} onChange={handleInputChange} placeholder="Descreva brevemente para que serve este modelo..." /></div>
            
            <div className="form-section">
                <h4>Itens do Modelo</h4>
                <SearchableDropdown options={produtos} onSelect={handleAddItemAoModelo} placeholder="Buscar e selecionar produto para adicionar..."/>
                <ul className="added-items-list">{formState.itens.map(item => <li key={item.produto_servico_id}><span>({item.quantidade}x) {item.descricao}</span><button type="button" className="btn-remove-item" onClick={()=>handleRemoveItemDoModelo(item.produto_servico_id)}>Remover</button></li>)}</ul>
            </div>

            <div className="form-section">
                <h4>Cláusulas do Modelo</h4>
                <SearchableDropdown options={clausulas} onSelect={handleAddClausulaAoModelo} placeholder="Buscar e selecionar cláusula para adicionar..."/>
                <ul className="added-items-list">{formState.clausulas.map(c => <li key={c.id}><span>{c.titulo}</span><button type="button" className="btn-remove-item" onClick={()=>handleRemoveClausulaDoModelo(c.id)}>Remover</button></li>)}</ul>
            </div>

            <div className="form-buttons">
                <button type="submit">{editandoId ? 'Salvar Alterações' : 'Criar Modelo'}</button>
                {editandoId && (<button type="button" className="btn-cancel" onClick={handleCancelEdit}>Cancelar</button>)}
            </div>
        </form>
      </div>
      
      <div className="list-container">
        <h3>Modelos Salvos</h3>
        <table className="clients-table">
          <thead><tr><th>Nome do Modelo</th><th>Descrição</th><th>Ações</th></tr></thead>
          <tbody>
            {modelos.map((modelo) => (
              <tr key={modelo.id}>
                <td>{modelo.nome_modelo}</td><td>{modelo.descricao || ''}</td>
                <td>
                  <button className="btn-edit" onClick={() => handleEditClick(modelo)}>Editar</button>
                  {/* --- ALTERAÇÃO 2: Botão "Usar" adicionado aqui --- */}
                  <button className="btn-view" style={{marginLeft: '5px'}} onClick={() => onUsarModelo(modelo.id)}>Usar</button>
                  <button className="btn-delete" onClick={() => handleDelete(modelo.id)}>Deletar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GerenciarModelos;