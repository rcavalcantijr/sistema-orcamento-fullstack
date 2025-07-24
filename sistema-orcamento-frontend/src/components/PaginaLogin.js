import React, { useState } from 'react';
import api from '../api';

const PaginaLogin = ({ onLoginSuccess }) => {
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [erro, setErro] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post('http://localhost:3001/api/auth/login', {
                email,
                senha,
            });
            const { token } = response.data;
            onLoginSuccess(token);
        } catch (error) {
            console.error("Erro no login:", error);
            setErro(error.response?.data || "Erro ao tentar fazer login.")
        }
    };
    return (
        <div className='login-container'>
            <form onSubmit={handleLogin} className='login-form'>
                <h2>Login do Sistema</h2>
                <div className='form-group'>
                    <label htmlFor='email'>Email</label>
                    <input
                        type='email'
                        id='email'
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div className='form-group'>
                    <label htmlFor='senha'>Senha</label>
                    <input
                        type='password'
                        id='senha'
                        value={senha}
                        onChange={(e) => setSenha(e.target.value)}
                        required
                    />
                </div>
                {erro && <p className='error-message'>{erro}</p>}
                <button type='submit'>Entrar</button>
            </form>
        </div>
    );
};

export default PaginaLogin;