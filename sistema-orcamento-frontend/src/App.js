// src/App.js
import React, { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import './App.css';
import PaginaLogin from './components/PaginaLogin';
import GerenciarUsuarios from './components/GerenciarUsuarios';
import CriarOrcamento from './components/CriarOrcamento';
import ListarOrcamentos from './components/ListarOrcamentos';
import GerenciarClientes from './components/GerenciarClientes';
import GerenciarProdutos from './components/GerenciarProdutos';
import DetalheOrcamento from './components/DetalheOrcamento';
import GerenciarClausulas from './components/GerenciarClausulas';
import GerenciarModelos from './components/GerenciarModelos';
// --- MUDANÇA 1: Importa o novo componente de modal ---
import PreviaOrcamentoModal from './components/PreviaOrcamentoModal';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [usuario, setUsuario] = useState(null);
  const [paginaAtiva, setPaginaAtiva] = useState('criarOrcamento');
  const [idOrcamentoAtivo, setIdOrcamentoAtivo] = useState(null);
  const [idModeloParaCarregar, setIdModeloParaCarregar] = useState(null);
  const [idOrcamentoParaEditar, setIdOrcamentoParaEditar] = useState(null);
  // --- MUDANÇA 2: Novo estado para controlar o modal de pré-visualização ---
  const [idOrcamentoPrevia, setIdOrcamentoPrevia] = useState(null);

  useEffect(() => {
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        setUsuario(decodedToken.usuario);
      } catch (error) {
        console.error("Token inválido:", error);
        handleLogout();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);
  
  const handleLoginSuccess = (newToken) => { localStorage.setItem('token', newToken); setToken(newToken); };
  const handleLogout = () => { localStorage.removeItem('token'); setToken(null); setUsuario(null); };

  if (!token) { return <PaginaLogin onLoginSuccess={handleLoginSuccess} />; }
  
  const handleVerDetalhes = (id) => { setIdOrcamentoAtivo(id); setPaginaAtiva('detalheOrcamento'); };
  const handleVoltarParaLista = () => { setIdOrcamentoAtivo(null); setPaginaAtiva('listarOrcamentos'); };
  const handleUsarModelo = (modeloId) => { setIdModeloParaCarregar(modeloId); setPaginaAtiva('criarOrcamento'); };
  const handleModeloCarregado = () => { setIdModeloParaCarregar(null); };
  const handleEditarOrcamento = (id) => { setIdOrcamentoParaEditar(id); setPaginaAtiva('criarOrcamento'); };
  const onOrcamentoSalvo = () => { setIdOrcamentoParaEditar(null); setPaginaAtiva('listarOrcamentos'); };

  // --- MUDANÇA 3: Novas funções para abrir, fechar e imprimir a partir do modal ---
  const handleAbrirPrevia = (id) => {
    setIdOrcamentoPrevia(id);
  };
  const handleFecharPrevia = () => {
    setIdOrcamentoPrevia(null);
  };
  const handleImprimirDaPrevia = (id) => {
    handleFecharPrevia();
    handleVerDetalhes(id); // Reutiliza a função de ver detalhes para ir para a página de impressão
  };

  const renderizarPagina = () => {
     switch (paginaAtiva) {
         case 'clientes': return <GerenciarClientes />;
         case 'produtos': return <GerenciarProdutos />;
         case 'clausulas': return <GerenciarClausulas />;
         case 'gerenciarUsuarios': return <GerenciarUsuarios />;
         case 'modelos': return <GerenciarModelos onUsarModelo={handleUsarModelo} />;
         // --- MUDANÇA 4: Passa a nova função para a lista de orçamentos ---
         case 'listarOrcamentos': 
            return <ListarOrcamentos onAbrirPrevia={handleAbrirPrevia} onEditarOrcamento={handleEditarOrcamento} />;
         case 'detalheOrcamento': 
            return <DetalheOrcamento orcamentoId={idOrcamentoAtivo} onVoltarClick={handleVoltarParaLista} />;
         case 'criarOrcamento':
         default:
            return <CriarOrcamento 
                        modeloIdParaCarregar={idModeloParaCarregar} 
                        onModeloCarregado={handleModeloCarregado}
                        orcamentoIdParaEditar={idOrcamentoParaEditar}
                        onOrcamentoSalvo={onOrcamentoSalvo}
                    />;
     }
  };

  return (
    <div className="App">
      <header className="App-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '0 2rem'}}>
            <h1>Sistema de Orçamento</h1>
            <button onClick={handleLogout} style={{width: 'auto', backgroundColor: '#dc3545'}}>Sair</button>
        </div>
        <nav className="main-nav">
          <button onClick={() => { handleModeloCarregado(); setIdOrcamentoParaEditar(null); setPaginaAtiva('criarOrcamento'); }}>Novo Orçamento</button>
          <button onClick={() => setPaginaAtiva('listarOrcamentos')}>Listar Orçamentos</button>
          <button onClick={() => setPaginaAtiva('modelos')}>Modelos</button>
          <button onClick={() => setPaginaAtiva('clientes')}>Clientes</button>
          <button onClick={() => setPaginaAtiva('produtos')}>Produtos</button>
          <button onClick={() => setPaginaAtiva('clausulas')}>Cláusulas</button>
          {usuario && usuario.permissao === 'admin' && (
            <button onClick={() => setPaginaAtiva('gerenciarUsuarios')}>Usuários</button>
          )}
        </nav>
      </header>
      <main>{renderizarPagina()}</main>
      
      {/* --- MUDANÇA 5: Renderiza o modal condicionalmente --- */}
      {idOrcamentoPrevia && (
        <PreviaOrcamentoModal 
          orcamentoId={idOrcamentoPrevia}
          onClose={handleFecharPrevia}
          onImprimir={handleImprimirDaPrevia}
        />
      )}
    </div>
  );
}

export default App;