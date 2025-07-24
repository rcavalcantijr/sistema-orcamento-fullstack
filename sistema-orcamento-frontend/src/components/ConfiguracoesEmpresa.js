import React, { useState, useEffect } from "react";
import api from "../api";

const ConfiguracoesEmpresa = () => {
    const [empresa, setEmpresa] = useState({
        nome_fantasia: '',
        razao_social: '',
        cnpj: '',
        endereco_completo: '',
        telefone_contato: '',
        email_contato: '',
        website: '',
        logo_url: '',
    });
    const [mensagem, setMensagem] = useState('');


    // Buscar os dados quando o componente carregar
    useEffect(() => {
        const fetchEmpresaData = async () => {
            try {
                const reponse = await api.get('http://localhost:3001/api/empresa');
                if (reponse.data) {
                    setEmpresa(reponse.data);
                }
            } catch (error) {
                console.error('Erro ao buscar dados da empresa:', error);
                setMensagem('Erro ao carregar dados da empresa');
            }
        };
        fetchEmpresaData();
        
    }, []);


    // Função para lidar com mudanças nos inputs
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setEmpresa({ ...empresa, [name]: value});
    };


    // Função para salvar os dados
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await api.put('http://localhost:3001/api/empresa', empresa);
            setMensagem(response.data.message);
        } catch (error) {
            console.error('Erro ao salvar os dados:', error);
            setMensagem('Erro ao salvar os dados. Tente novamente.');
        }
    };

    return (
        <div className="form-container">
            <h2>Configurações da minha empresa</h2>
            <form onSubmit={handleSubmit}>
                {Object.keys(empresa).filter(key => key !== 'id').map((key) => (
                    <div className="form-group" key={key}>
                        <label htmlFor={key}>{key.replace(/_/g, ' ').toUpperCase()}</label>
                        <input
                            type="text"
                            id={key}
                            name={key}
                            value={empresa[key] || ''}
                            onChange={handleInputChange}
                        />
                    </div>
                ))}
                <button type="submit">Salvar Alterações</button>
            </form>
            {mensagem && <p className="message">{mensagem}</p>}
        </div>
    );
};

export default ConfiguracoesEmpresa;


