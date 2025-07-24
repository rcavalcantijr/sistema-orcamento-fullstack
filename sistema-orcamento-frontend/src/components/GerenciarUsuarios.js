// src/components/GerenciarUsuarios.js
import React, { useState, useEffect } from 'react';
import api from '../api';
import { jwtDecode } from 'jwt-decode';
import { IMaskInput } from 'react-imask'; // Importa o componente de máscara

const formInicial = { nome: '', email: '', senha: '', permissao: 'usuario', telefone: '', cargo: '' };

const GerenciarUsuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [formState, setFormState] = useState(formInicial);
  const [editandoId, setEditandoId] = useState(null);
  const [usuarioLogadoId, setUsuarioLogadoId] = useState(null);

  const fetchUsuarios = async () => {
    try {
      const response = await api.get('/usuarios');
      setUsuarios(response.data);
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
        try {
            const decodedToken = jwtDecode(token);
            setUsuarioLogadoId(decodedToken.usuario.id);
        } catch (e) {
            console.error("Token inválido:", e);
        }
    }
    fetchUsuarios();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormState({ ...formState, [name]: value });
  };
  
  // Handler para campos com máscara
  const handleMaskedInputChange = (value, name) => {
    setFormState({ ...formState, [name]: value });
  };

  const handleEditClick = (usuario) => {
    setEditandoId(usuario.id);
    setFormState({ 
        nome: usuario.nome, 
        email: usuario.email, 
        telefone: usuario.telefone || '', 
        permissao: usuario.permissao, 
        cargo: usuario.cargo || '',
        senha: '' 
    });
  };

  const handleCancelEdit = () => {
    setEditandoId(null);
    setFormState(formInicial);
  };

  const handleDeleteClick = async (usuarioId) => {
    if (usuarioId === usuarioLogadoId) {
        alert("Você não pode deletar o seu próprio usuário.");
        return;
    }
    if (window.confirm("Tem certeza que deseja deletar este usuário?")) {
        try {
            await api.delete(`/usuarios/${usuarioId}`);
            fetchUsuarios();
            alert("Usuário deletado com sucesso!");
        } catch (error) {
            console.error("Erro ao deletar usuário:", error);
            alert(error.response?.data?.message || "Erro ao deletar usuário.");
        }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = editandoId 
        ? `/usuarios/${editandoId}` 
        : '/auth/register';
    
    const method = editandoId ? 'put' : 'post';
    
    const dataToSend = { ...formState };
    if (editandoId && !dataToSend.senha) {
        delete dataToSend.senha;
    }

    try {
      await api[method](url, dataToSend);
      setFormState(formInicial);
      setEditandoId(null);
      fetchUsuarios();
      alert(editandoId ? 'Usuário atualizado com sucesso!' : 'Usuário cadastrado com sucesso!');
    } catch (error) {
      console.error("Erro ao salvar usuário:", error);
      alert(error.response?.data?.message || error.response?.data || "Erro ao salvar.");
    }
  };

  // Definição da máscara de telefone
  const phoneMask = [
    { mask: '(00) 0000-0000' },
    { mask: '(00) 00000-0000' }
  ];

  return (
    <div className="container">
      <h2>Gerenciar Usuários</h2>
      <div className="form-container">
        <h3>{editandoId ? 'Editando Usuário' : 'Adicionar Novo Usuário'}</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group"><input type="text" name="nome" value={formState.nome} onChange={handleInputChange} placeholder="Nome Completo" required /></div>
          <div className="form-group"><input type="email" name="email" value={formState.email} onChange={handleInputChange} placeholder="Email" required /></div>
          <div className='form-group'>
            {/* MUDANÇA: Usando o IMaskInput para o telefone */}
            <IMaskInput
              mask={phoneMask}
              value={formState.telefone || ''}
              name="telefone"
              onAccept={(value) => handleMaskedInputChange(value, 'telefone')}
              placeholder="Telefone"
              className="input-mascarado"
            />
          </div>
          <div className='form-group'><input type="text" name="cargo" value={formState.cargo || ''} onChange={handleInputChange} placeholder='Cargo (ex: Vendedor)' /></div>
          <div className="form-group"><input type="password" name="senha" value={formState.senha} onChange={handleInputChange} placeholder={editandoId ? "Deixe em branco para não alterar" : "Senha"} autoComplete="new-password" /></div>
          <div className="form-group">
            <label>Permissão</label>
            <select name="permissao" value={formState.permissao} onChange={handleInputChange}>
              <option value="usuario">Usuário</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="form-buttons">
            <button type="submit">{editandoId ? 'Salvar Alterações' : 'Adicionar Usuário'}</button>
            {editandoId && <button type="button" className="btn-cancel" onClick={handleCancelEdit}>Cancelar</button>}
          </div>
        </form>
      </div>
      <div className="list-container">
        <h3>Usuários Cadastrados</h3>
        <table className="clients-table">
          <thead><tr><th>Nome</th><th>Email</th><th>Telefone</th><th>Cargo</th><th>Permissão</th><th>Ações</th></tr></thead>
          <tbody>
            {usuarios.map((usuario) => (
              <tr key={usuario.id}>
                <td>{usuario.nome}</td>
                <td>{usuario.email}</td>
                <td>{usuario.telefone}</td>
                <td>{usuario.cargo}</td>
                <td>{usuario.permissao}</td>
                <td>
                  <button className="btn-edit" onClick={() => handleEditClick(usuario)}>Editar</button>
                  <button className="btn-delete" onClick={() => handleDeleteClick(usuario.id)} disabled={usuario.id === usuarioLogadoId}>Deletar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default GerenciarUsuarios;