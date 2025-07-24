// src/components/CriarOrcamento.js
import React, { useState, useEffect } from 'react';
import api from '../api';
import SearchableDropdown from './SearchableDropdown';
import { formatCurrency } from '../utils/formatters';
// --- MUDANÇA 1: Importa o componente de máscara ---
import { IMaskInput } from 'react-imask';

const CriarOrcamento = ({ modeloIdParaCarregar, onModeloCarregado, orcamentoIdParaEditar, onOrcamentoSalvo }) => {
    const [clientes, setClientes] = useState([]);
    const [produtos, setProdutos] = useState([]);
    const [clausulasDisponiveis, setClausulasDisponiveis] = useState([]);
    const [modelos, setModelos] = useState([]);
    
    const [clienteSelecionadoId, setClienteSelecionadoId] = useState(null);
    const [observacoes, setObservacoes] = useState('');
    const [dataValidade, setDataValidade] = useState('');
    const [itensOrcamento, setItensOrcamento] = useState([]);
    const [valorTotal, setValorTotal] = useState(0);
    const [clausulasDoOrcamento, setClausulasDoOrcamento] = useState([]);
    
    const [produtoSelecionadoId, setProdutoSelecionadoId] = useState(null);
    const [quantidade, setQuantidade] = useState(1);
    const [ncmEditavel, setNcmEditavel] = useState('');
    const [descontoItem, setDescontoItem] = useState(0);
    
    const [editandoItemIndex, setEditandoItemIndex] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);

    const [nomeContato, setNomeContato] = useState('');
    const [emailContato, setEmailContato] = useState('');

    const resetarFormulario = () => {
        setClienteSelecionadoId(null);
        setObservacoes('');
        setDataValidade('');
        setItensOrcamento([]);
        setClausulasDoOrcamento([]);
        setProdutoSelecionadoId(null);
        setQuantidade(1);
        setNcmEditavel('');
        setDescontoItem(0);
        setEditandoItemIndex(null);
        setIsEditMode(false);
        setNomeContato('');
        setEmailContato('');
        
        if (orcamentoIdParaEditar) {
            onOrcamentoSalvo();
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [resClientes, resProdutos, resClausulas, resModelos] = await Promise.all([
                    api.get('/clientes'),
                    api.get('/produtos'),
                    api.get('/clausulas'),
                    api.get('/modelos')
                ]);
                setClientes(resClientes.data);
                setProdutos(resProdutos.data);
                setClausulasDisponiveis(resClausulas.data);
                setModelos(resModelos.data);
            } catch (error) { console.error("Erro ao buscar dados iniciais:", error); }
        };
        fetchData();
    }, []);

    useEffect(() => {
        if (modeloIdParaCarregar) {
            onModeloCarregado();
            const carregarModelo = async () => {
                try {
                    const response = await api.get(`/modelos/${modeloIdParaCarregar}`);
                    const modelo = response.data;
                    setItensOrcamento(modelo.itens.map(item => ({...item, desconto_percentual: 0})) || []);
                    setClausulasDoOrcamento(modelo.clausulas || []);
                    setObservacoes(modelo.descricao || '');
                    alert(`Modelo "${modelo.nome_modelo}" carregado!`);
                } catch (error) { alert("Não foi possível carregar o modelo."); }
            };
            carregarModelo();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [modeloIdParaCarregar]);

    useEffect(() => {
        if (orcamentoIdParaEditar) {
            setIsEditMode(true);
            const carregarOrcamento = async () => {
                try {
                    const response = await api.get(`/orcamentos/${orcamentoIdParaEditar}`);
                    const orc = response.data;
                    setClienteSelecionadoId(orc.cliente_id);
                    setObservacoes(orc.observacoes || '');
                    setDataValidade(orc.data_validade ? new Date(orc.data_validade).toISOString().split('T')[0] : '');
                    setItensOrcamento(orc.itens || []);
                    setClausulasDoOrcamento(orc.clausulas || []);
                    setNomeContato(orc.nome_contato || '');
                    setEmailContato(orc.email_contato || '');
                } catch (error) {
                    alert("Erro ao carregar orçamento para edição.");
                }
            };
            carregarOrcamento();
        } else {
            setIsEditMode(false);
        }
    }, [orcamentoIdParaEditar]);

    useEffect(() => {
        const total = itensOrcamento.reduce((soma, item) => {
            const subtotal = item.quantidade * item.valor_unitario;
            const desconto = subtotal * ((item.desconto_percentual || 0) / 100);
            return soma + (subtotal - desconto);
        }, 0);
        setValorTotal(total);
    }, [itensOrcamento]);

    useEffect(() => { const produtoInfo = produtos.find(p => p.id === produtoSelecionadoId); setNcmEditavel(produtoInfo?.ncm || ''); }, [produtoSelecionadoId, produtos]);

    const handleClienteSelect = (cliente) => { setClienteSelecionadoId(cliente.id); };
    const handleProdutoSelect = (produto) => {
        setProdutoSelecionadoId(produto.id);
        setEditandoItemIndex(null);
        setDescontoItem(0);
    };

    const handleAddItem = () => {
        if (!produtoSelecionadoId) { alert("Selecione um produto."); return; }
        if (quantidade <= 0) { alert("A quantidade deve ser maior que zero."); return;}
        
        const produtoInfo = produtos.find(p => p.id === produtoSelecionadoId);
        const novoOuEditadoItem = { produto_servico_id: produtoInfo.id, descricao: produtoInfo.descricao, quantidade: parseFloat(quantidade), valor_unitario: parseFloat(produtoInfo.valor_unitario), ncm: ncmEditavel, desconto_percentual: parseFloat(descontoItem) || 0 };

        let novosItens = [...itensOrcamento];
        if (editandoItemIndex !== null) {
            novosItens[editandoItemIndex] = novoOuEditadoItem;
        } else {
            novosItens.push(novoOuEditadoItem);
        }
        setItensOrcamento(novosItens);
        
        setProdutoSelecionadoId(null); setQuantidade(1); setNcmEditavel(''); setDescontoItem(0); setEditandoItemIndex(null);
    };
    
    const handleRemoveItem = (indexDoItem) => { setItensOrcamento(itensOrcamento.filter((_, i) => i !== indexDoItem)); };

    const handleEditItem = (indexDoItem) => {
        const itemParaEditar = itensOrcamento[indexDoItem];
        setProdutoSelecionadoId(itemParaEditar.produto_servico_id);
        setQuantidade(itemParaEditar.quantidade);
        setNcmEditavel(itemParaEditar.ncm);
        setDescontoItem(itemParaEditar.desconto_percentual || 0);
        setEditandoItemIndex(indexDoItem);
        window.scrollTo(0, 0);
    };

    const handleAddClausula = (clausula) => { if (clausulasDoOrcamento.find(c => c.id === clausula.id)) { alert("Esta cláusula já foi adicionada."); return; } setClausulasDoOrcamento([...clausulasDoOrcamento, clausula]); };
    const handleRemoveClausula = (clausulaId) => { setClausulasDoOrcamento(clausulasDoOrcamento.filter(c => c.id !== clausulaId)); };
    
    const handleSaveOrcamento = async (e) => {
        e.preventDefault();
        if (!clienteSelecionadoId || itensOrcamento.length === 0) { alert("Selecione um cliente e adicione ao menos um item."); return; }
        
        const payload = {
            cliente_id: clienteSelecionadoId,
            data_validade: dataValidade || null,
            observacoes: observacoes,
            nome_contato: nomeContato,
            email_contato: emailContato,
            itens: itensOrcamento.map(i => ({ produto_servico_id: i.produto_servico_id, quantidade: i.quantidade, valor_unitario: i.valor_unitario, ncm: i.ncm, desconto_percentual: i.desconto_percentual })),
            clausulas_ids: clausulasDoOrcamento.map(c => c.id)
        };

        const method = isEditMode ? 'put' : 'post';
        const url = isEditMode ? `/orcamentos/${orcamentoIdParaEditar}` : '/orcamentos';

        try {
            await api[method](url, payload);
            alert(isEditMode ? 'Orçamento atualizado com sucesso!' : 'Orçamento criado com sucesso!');
            onOrcamentoSalvo();
        } catch (error) { 
            console.error("Erro ao salvar orçamento:", error); 
            alert("Houve um erro ao salvar o orçamento."); 
        }
    };
    
    const opcoesClientes = clientes.map(c => ({ id: c.id, label: c.nome_completo }));
    const opcoesProdutos = produtos.map(p => ({ id: p.id, label: p.descricao }));
    const opcoesModelos = modelos.map(m => ({ id: m.id, label: m.nome_modelo }));
    const opcoesClausulas = clausulasDisponiveis.map(c => ({ id: c.id, label: c.titulo, ...c }));
    const produtoEmPreparacao = produtoSelecionadoId ? produtos.find(p => p.id === produtoSelecionadoId) : null;

    return (
        <div className="container">
          <h2>{isEditMode ? `Editando Orçamento Nº ${orcamentoIdParaEditar}` : 'Criar Novo Orçamento'}</h2>
          
          {!isEditMode && (
              <div className="form-group no-print" style={{borderBottom: '1px solid #eee', paddingBottom: '1rem', marginBottom: '1rem'}}>
                  <label>Carregar a partir de um Modelo</label>
                  <SearchableDropdown options={opcoesModelos} onSelect={(modelo) => onModeloCarregado(modelo.id)} placeholder="Selecione um modelo para começar..."/>
              </div>
          )}

          <form className="form-container" onSubmit={handleSaveOrcamento}>
            <div className="form-section">
              <h3>1. Dados Gerais</h3>
              <div className="form-group">
                  <label>Cliente</label>
                  <SearchableDropdown options={opcoesClientes} onSelect={handleClienteSelect} placeholder="Selecione ou busque um cliente..." />
                  {clienteSelecionadoId && <p style={{marginTop: '10px', fontWeight: 'bold'}}>Cliente selecionado: {clientes.find(c => c.id === clienteSelecionadoId)?.nome_completo}</p>}
              </div>

              <div className="form-row">
                <div className="form-group">
                    <label>Nome do Contato (opcional)</label>
                    <input type="text" value={nomeContato} onChange={e => setNomeContato(e.target.value)} placeholder="Nome do responsável no cliente" />
                </div>
                <div className="form-group">
                    <label>E-mail do Contato (opcional)</label>
                    <input type="email" value={emailContato} onChange={e => setEmailContato(e.target.value)} placeholder="E-mail do responsável" />
                </div>
              </div>

              <div className="form-group"><label>Data de Validade</label><input type="date" value={dataValidade} onChange={e => setDataValidade(e.target.value)} className="input-pequeno"/></div>
              <div className="form-group"><label>Observações</label><textarea value={observacoes} onChange={e => setObservacoes(e.target.value)} placeholder="Adicione observações..."></textarea></div>
            </div>
            
            <div className="form-section">
              <h3>2. Adicionar Itens ao Orçamento</h3>
              <div className="form-group">
                  <label>Selecione um Produto/Serviço</label>
                  <SearchableDropdown options={opcoesProdutos} onSelect={handleProdutoSelect} placeholder="Busque e selecione um item..." />
              </div>
              {produtoEmPreparacao && (
                  <div className="item-staging-area">
                      <h4>{editandoItemIndex !== null ? 'Editando Item:' : 'Item pré-selecionado:'} <span style={{fontStyle: 'italic'}}>{produtoEmPreparacao.descricao}</span></h4>
                      <div className="add-item-form">
                          {/* --- MUDANÇA 2: Substituição do input pelo IMaskInput --- */}
                          <div className='form-group'>
                              <label>NCM (editável)</label>
                              <IMaskInput
                                mask="0000.00.00"
                                value={ncmEditavel}
                                onAccept={(value) => setNcmEditavel(value)}
                                placeholder="NCM"
                                className="input-mascarado"
                              />
                          </div>
                          <div className='form-group'><label>Quantidade</label><input type="number" value={quantidade} onChange={e => setQuantidade(e.target.value)} min="1" /></div>
                          <div className='form-group'><label>Desconto (%)</label><input type="number" value={descontoItem} onChange={e => setDescontoItem(e.target.value)} min="0" max="100" step="0.01" /></div>
                          <div className='form-group'><label>&nbsp;</label><button type="button" className="btn-add-item" onClick={handleAddItem}>{editandoItemIndex !== null ? 'Confirmar Edição' : 'Confirmar e Adicionar'}</button></div>
                      </div>
                  </div>
              )}
            </div>

            <div className="list-container">
              <h3>3. Itens do Orçamento</h3>
              <table className="clients-table">
                  <thead><tr><th>Descrição</th><th>NCM</th><th>Qtde</th><th>Valor Unit.</th><th>Subtotal</th><th>Ação</th></tr></thead>
                  <tbody>
                      {itensOrcamento.map((item, index)=>{
                          const subtotal = item.quantidade * item.valor_unitario;
                          const subtotalComDesconto = subtotal - (subtotal * ((item.desconto_percentual || 0) / 100));
                          return (
                              <tr key={index}>
                                  <td>{item.descricao} {item.desconto_percentual > 0 && <span style={{color: 'green', fontSize: '0.8em', fontWeight: 'bold'}}>({item.desconto_percentual}% OFF)</span>}</td>
                                  <td>{item.ncm}</td>
                                  <td>{item.quantidade}</td>
                                  <td>R$ {formatCurrency(item.valor_unitario)}</td>
                                  <td>R$ {formatCurrency(subtotalComDesconto)}</td>
                                  <td>
                                      <button type="button" className="btn-edit" onClick={()=>handleEditItem(index)}>Editar</button>
                                      <button type="button" className="btn-delete" onClick={()=>handleRemoveItem(index)}>Remover</button>
                                  </td>
                              </tr>
                          )
                      })}
                      {itensOrcamento.length===0&&(<tr><td colSpan="6">Nenhum item adicionado.</td></tr>)}
                  </tbody>
              </table>
              <div className="total-container"><strong>Valor Total: R$ {formatCurrency(valorTotal)}</strong></div>
            </div>
            
            <div className="form-section">
              <h3>4. Cláusulas Adicionais</h3>
              <SearchableDropdown options={opcoesClausulas} onSelect={handleAddClausula} placeholder="Selecione ou busque uma cláusula para adicionar"/>
              {clausulasDoOrcamento.length > 0 && <ul className="added-items-list">{clausulasDoOrcamento.map(c=>(<li key={c.id}><span>{c.titulo}</span><button type="button" className="btn-remove-item" onClick={()=>handleRemoveClausula(c.id)}>Remover</button></li>))}</ul>}
            </div>

            <div className="form-buttons">
                <button type="submit" className="btn-save-orcamento">{isEditMode ? 'Salvar Alterações' : 'Salvar Orçamento'}</button>
                <button type="button" className="btn-cancel" onClick={resetarFormulario}>Cancelar</button>
            </div>
          </form>
        </div>
      );
};
export default CriarOrcamento;