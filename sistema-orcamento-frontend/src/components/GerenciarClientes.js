// src/components/GerenciarClientes.js
import React, { useState, useEffect } from 'react';
import api from '../api';
import { IMaskInput } from 'react-imask';

const formInicial = { nome_completo: '', cpf_cnpj: '', email: '', telefone: '', cep: '', rua: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '' };

const GerenciarClientes = () => {
  const [clientes, setClientes] = useState([]);
  const [formState, setFormState] = useState(formInicial);
  const [clienteEmEdicao, setClienteEmEdicao] = useState(null);
  const [termoBusca, setTermoBusca] = useState('');

  useEffect(() => {
    const fetchClientes = async () => {
      try {
        const response = await api.get('/clientes', { params: { busca: termoBusca } });
        setClientes(response.data);
      } catch (error) {
        console.error("Erro ao buscar clientes:", error);
      }
    };
    const timer = setTimeout(() => { fetchClientes(); }, 300);
    return () => clearTimeout(timer);
  }, [termoBusca]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormState({ ...formState, [name]: value });
  };
  
  const handleMaskedInputChange = (value, name) => {
    setFormState({ ...formState, [name]: value });
  };

  const handleCepBlur = async (e) => {
    const cep = e.target.value.replace(/\D/g, '');
    if (cep.length !== 8) return;
    try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();
        if (!data.erro) {
            setFormState(prev => ({ ...prev, rua: data.logradouro, bairro: data.bairro, cidade: data.localidade, estado: data.uf }));
        }
    } catch (error) {
        console.error("Erro ao buscar CEP:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const method = clienteEmEdicao ? 'put' : 'post';
    const url = clienteEmEdicao ? `/clientes/${clienteEmEdicao.id}` : '/clientes';
    try {
      await api[method](url, formState);
      setFormState(formInicial);
      setClienteEmEdicao(null);
      const response = await api.get('/clientes', { params: { busca: '' } });
      setClientes(response.data);
      setTermoBusca('');
      alert(clienteEmEdicao ? 'Cliente atualizado com sucesso!' : 'Cliente criado com sucesso!');
    } catch (error) {
      console.error(`Erro ao salvar cliente:`, error);
      alert(error.response?.data?.message || `Erro ao salvar cliente.`);
    }
  };

  const handleEditClick = (cliente) => { setClienteEmEdicao(cliente); setFormState(cliente); };
  const handleCancelEdit = () => { setFormState(formInicial); setClienteEmEdicao(null); };

  const handleDelete = async (clienteId) => {
    if (window.confirm("Tem certeza?")) {
      try {
        await api.delete(`/clientes/${clienteId}`);
        setClientes(clientes.filter(cliente => cliente.id !== clienteId));
        alert("Cliente deletado com sucesso!");
      } catch (error) {
        alert(error.response?.data?.message || 'Ocorreu um erro ao tentar deletar o cliente.');
        console.error("Erro ao deletar cliente:", error);
      }
    }
  };

  // --- LÓGICA DE MÁSCARA CORRIGIDA ---
  const cpfCnpjMask = [
    { mask: '000.000.000-00' },
    { mask: '00.000.000/0000-00' }
  ];

  const phoneMask = [
    { mask: '(00) 0000-0000' },
    { mask: '(00) 00000-0000' }
  ];

  return (
    <div className="container">
      <h2>Gerenciar Clientes</h2>
      <div className="form-container">
        <h3>{clienteEmEdicao ? 'Editar Cliente' : 'Adicionar Novo Cliente'}</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group"><input type="text" name="nome_completo" value={formState.nome_completo} onChange={handleInputChange} placeholder="Nome Completo" required /></div>
          <div className="form-row">
            <div className="form-group">
                <IMaskInput mask={phoneMask} value={formState.telefone || ''} name="telefone" onAccept={(value) => handleMaskedInputChange(value, 'telefone')} placeholder="Telefone" className="input-mascarado"/>
            </div>
            <div className="form-group">
                <IMaskInput mask={cpfCnpjMask} value={formState.cpf_cnpj || ''} name="cpf_cnpj" onAccept={(value) => handleMaskedInputChange(value, 'cpf_cnpj')} placeholder="CPF ou CNPJ" className="input-mascarado"/>
            </div>
          </div>
          <div className="form-group"><input type="email" name="email" value={formState.email || ''} onChange={handleInputChange} placeholder="Email" /></div>
          <hr style={{margin: '2rem 0', border: 'none', borderTop: '1px solid #eee'}} />
          <div className="form-row"><div className="form-group" style={{ flexBasis: '30%', flexGrow: 0 }}><IMaskInput mask="00000-000" value={formState.cep || ''} name="cep" onChange={handleInputChange} onBlur={handleCepBlur} placeholder="CEP" className="input-mascarado"/></div></div>
          <div className="form-group"><input type="text" name="rua" value={formState.rua || ''} onChange={handleInputChange} placeholder="Rua / Logradouro" /></div>
          <div className="form-group"><input type="text" name="bairro" value={formState.bairro || ''} onChange={handleInputChange} placeholder="Bairro" /></div>
          <div className="form-row"><div className="form-group" style={{ flexBasis: '30%', flexGrow: 0 }}><input type="text" name="numero" value={formState.numero || ''} onChange={handleInputChange} placeholder="Número" /></div><div className="form-group"><input type="text" name="complemento" value={formState.complemento || ''} onChange={handleInputChange} placeholder="Complemento (opcional)" /></div></div>
          <div className="form-row"><div className="form-group"><input type="text" name="cidade" value={formState.cidade || ''} onChange={handleInputChange} placeholder="Cidade" /></div><div className="form-group" style={{ flexBasis: '20%', flexGrow: 0 }}><input type="text" name="estado" value={formState.estado || ''} onChange={handleInputChange} placeholder="Estado" /></div></div>
          <div className="form-buttons">
            <button type="submit">{clienteEmEdicao ? 'Salvar Alterações' : 'Adicionar Cliente'}</button>
            {clienteEmEdicao && (<button type="button" className="btn-cancel" onClick={handleCancelEdit}>Cancelar</button>)}
          </div>
        </form>
      </div>
      <div className="list-container">
        <h3>Clientes Cadastrados</h3>
        <div className="search-container"><input type="text" placeholder="Buscar por nome..." value={termoBusca} onChange={(e) => setTermoBusca(e.target.value)}/></div>
        <table className="clients-table">
          <thead><tr><th>Nome</th><th>CPF/CNPJ</th><th>Email</th><th>Telefone</th><th>Ações</th></tr></thead>
          <tbody>
            {clientes.map((cliente) => (
              <tr key={cliente.id}>
                <td>{cliente.nome_completo}</td><td>{cliente.cpf_cnpj}</td><td>{cliente.email}</td><td>{cliente.telefone}</td>
                <td>
                  <button className="btn-edit" onClick={() => handleEditClick(cliente)}>Editar</button>
                  <button className="btn-delete" onClick={() => handleDelete(cliente.id)}>Deletar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default GerenciarClientes;