// src/components/DetalheOrcamento.js
import React, { useState, useEffect } from 'react';
import api from '../api';
// --- MUDANÇA 1: Importa a nova função de formatação ---
import { formatCurrency } from '../utils/formatters';

const DetalheOrcamento = ({ orcamentoId, onVoltarClick }) => {
  const [orcamento, setOrcamento] = useState(null);
  const [empresa, setEmpresa] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!orcamentoId) return;
    const fetchData = async () => {
      try {
        setLoading(true);
        const [resOrcamento, resEmpresa] = await Promise.all([
          api.get(`/orcamentos/${orcamentoId}`),
          api.get('/empresa')
        ]);
        setOrcamento(resOrcamento.data);
        setEmpresa(resEmpresa.data);
      } catch (err) {
        setError("Não foi possível carregar os dados do orçamento.");
        console.error("Erro ao buscar detalhes:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [orcamentoId]);

  if (loading) return <div className="container"><p>Carregando...</p></div>;
  if (error) return <div className="container"><p style={{ color: 'red' }}>{error}</p></div>;
  if (!orcamento || !empresa) return null;

  const handlePrint = () => window.print();

  const formatarEnderecoCliente = () => {
    const parts = [
        orcamento.rua,
        orcamento.numero,
        orcamento.bairro,
        orcamento.cidade,
        orcamento.estado,
        orcamento.cep,
        orcamento.complemento
    ].filter(Boolean); // Remove partes vazias
    return parts.join(', ').replace(/ ,/g, ',');
  };

  return (
    <div className="container">
      <div className="form-buttons no-print">
        <button type="button" onClick={onVoltarClick} className="btn-cancel">Voltar</button>
        <button type="button" onClick={handlePrint} className="btn-view">Imprimir / Salvar PDF</button>
      </div>

      <div className="proposta-container">
        
        <div className="print-page">
          <header className="orcamento-header">
            <div className="empresa-info">
                <h1>{empresa.nome_fantasia || 'Nome da Empresa'}</h1>
                <p>{empresa.endereco_completo}</p>
                <p>Telefone: {empresa.telefone_contato} | Email: {empresa.email_contato}</p>
                <p>CNPJ: {empresa.cnpj}</p>
            </div>
            <div className="orcamento-details">
                <h2>ORÇAMENTO Nº {String(orcamento.id).padStart(5, '0')}</h2>
                <p><strong>Revisão:</strong> {orcamento.revisao}</p>
                <p><strong>Data de Emissão:</strong> {new Date(orcamento.data_criacao).toLocaleDateString('pt-BR')}</p>
                {orcamento.data_validade && <p><strong>Válido até:</strong> {new Date(orcamento.data_validade).toLocaleDateString('pt-BR')}</p>}
            </div>
          </header>

          <main className="orcamento-body">
            <section className="cliente-info">
              <h3>CLIENTE</h3>
              <p><strong>CPF/CNPJ:</strong> {orcamento.cpf_cnpj}</p>
              <p><strong>Cliente:</strong> {orcamento.nome_completo}</p>
              {orcamento.nome_contato && (
                <p><strong>Responsável:</strong> {orcamento.nome_contato} {orcamento.email_contato ? `(${orcamento.email_contato})` : ''}</p>
              )}
              <p><strong>Endereço:</strong> {formatarEnderecoCliente()}</p>
              <p><strong>Telefone:</strong> {orcamento.telefone}</p>
              <p><strong>Email:</strong> {orcamento.email}</p>
            </section>
            
            <section className="itens-info">
              <h3>ITENS DO ORÇAMENTO</h3>
              <table className="itens-table">
                <thead>
                  <tr>
                    <th className="col-item">Item</th>
                    <th className="col-desc">Descrição</th>
                    <th className="col-ncm">NCM</th>
                    <th className="col-qtde">Qtde.</th>
                    <th className="col-valor">Valor Unit.</th>
                    <th className="col-subtotal">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {orcamento.itens.map((item, index) => {
                    const valorUnitarioComDesconto = Number(item.valor_unitario) - (Number(item.valor_unitario) * (Number(item.desconto_percentual || 0) / 100));
                    const subtotalComDesconto = valorUnitarioComDesconto * Number(item.quantidade);
                    return (
                      <tr key={item.id || index}>
                        <td>{index + 1}</td>
                        <td>{item.descricao}</td>
                        <td>{item.ncm}</td>
                        <td>{item.quantidade}</td>
                        {/* --- MUDANÇA 2: Usando a função de formatação --- */}
                        <td>R$ {formatCurrency(valorUnitarioComDesconto)}</td>
                        <td>R$ {formatCurrency(subtotalComDesconto)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="total-value-box">
                  <h4>VALOR TOTAL</h4>
                  {/* --- MUDANÇA 3: Usando a função de formatação --- */}
                  <h3>R$ {formatCurrency(orcamento.valor_total)}</h3>
              </div>
            </section>

            <section className="payment-details-grid">
              <div className="payment-info-box">
                  <h4>DADOS DE PAGAMENTO</h4>
                  <p>Banco Itaú-341</p>
                  <p>Agência - 5396</p>
                  <p>Conta – 982984</p>
                  <p><strong>PIX:</strong> 43.037.584/0001-82</p>
              </div>
              <div className="qr-code-box">
                  <h4><strong>QR CODE de depósito:</strong></h4>
                  <img 
                    src="/QRCode.png" 
                    alt="QR Code para pagamento" 
                    style={{ width: '70px', height: '70px' }} 
                  />
              </div>
            </section>
          </main>
        </div>

        {(orcamento.observacoes || (orcamento.clausulas && orcamento.clausulas.length > 0)) && (
            <div className="print-page subsequent-page">
              <main className="orcamento-body">
                  {orcamento.observacoes && (
                  <section className="observacoes-info">
                      <h3>Observações</h3>
                      <p>{orcamento.observacoes}</p>
                  </section>
                  )}

                  {orcamento.clausulas && orcamento.clausulas.length > 0 && (
                  <section className="clausulas-finais">
                      <h3>CLÁUSULAS CONTRATUAIS</h3>
                      {orcamento.clausulas.map(clausula => (
                      <div key={clausula.titulo} className="clausula-final-item">
                          <h4>{clausula.titulo}</h4>
                          <p>{clausula.texto}</p>
                      </div>
                      ))}
                  </section>
                  )}
              </main>
            </div>
        )}
      </div>
    </div>
  );
};
export default DetalheOrcamento;