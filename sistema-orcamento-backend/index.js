const express = require('express');
const cors = require('cors');
const pool = require('./db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const auth = require('./middleware/auth');

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// =======================================================
// ROTAS DE AUTENTICAÇÃO E USUÁRIOS
// =======================================================
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, senha } = req.body;
        const user = await pool.query("SELECT * FROM usuarios WHERE email = $1", [email]);
        if (user.rows.length === 0) {
            return res.status(401).json("Credenciais inválidas.");
        }
        const senhaValida = await bcrypt.compare(senha, user.rows[0].senha_hash);
        if (!senhaValida) {
            return res.status(401).json("Credenciais inválidas.");
        }
        const payload = { usuario: { id: user.rows[0].id, permissao: user.rows[0].permissao } };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' }, (err, token) => {
            if (err) throw err;
            res.json({ token });
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Erro no servidor ao tentar fazer login.");
    }
});

app.post('/api/auth/register', auth, async (req, res) => {
    try {
        const { nome, email, senha, permissao, telefone, cargo } = req.body;
        const telefoneNumeros = telefone ? telefone.replace(/\D/g, '') : null;
        const userCheck = await pool.query("SELECT * FROM usuarios WHERE email = $1", [email]);
        if (userCheck.rows.length > 0) {
            return res.status(400).json({ message: "Usuário já existe com este e-mail." });
        }
        const isFirstUser = (await pool.query("SELECT id FROM usuarios")).rowCount === 0;
        const userRole = isFirstUser ? 'admin' : (permissao || 'usuario');
        const salt = await bcrypt.genSalt(10);
        const senhaHash = await bcrypt.hash(senha, salt);
        const novoUsuario = await pool.query(
            "INSERT INTO usuarios (nome, email, senha_hash, permissao, telefone, cargo) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, nome, email, permissao, telefone, cargo",
            [nome, email, senhaHash, userRole, telefoneNumeros, cargo]
        );
        res.status(201).json(novoUsuario.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Erro no servidor ao registrar usuário.");
    }
});

app.get('/api/usuarios', auth, async (req, res) => {
    try {
        const todosUsuarios = await pool.query("SELECT id, nome, email, permissao, telefone, cargo FROM usuarios ORDER BY nome ASC");
        res.json(todosUsuarios.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Erro no servidor ao buscar usuários.");
    }
});

app.put('/api/usuarios/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, email, telefone, permissao, cargo } = req.body;
        const telefoneNumeros = telefone ? telefone.replace(/\D/g, '') : null;
        const usuarioAtualizado = await pool.query(
            "UPDATE usuarios SET nome = $1, email = $2, telefone = $3, permissao = $4, cargo = $5 WHERE id = $6 RETURNING id, nome, email, telefone, permissao, cargo",
            [nome, email, telefoneNumeros, permissao, cargo, id]
        );
        if (usuarioAtualizado.rows.length === 0) {
            return res.status(404).json("Usuário não encontrado para atualização.");
        }
        res.json({ message: "Usuário atualizado com sucesso!", data: usuarioAtualizado.rows[0] });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Erro no servidor ao atualizar usuário.");
    }
});

app.delete('/api/usuarios/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const deleteOp = await pool.query("DELETE FROM usuarios WHERE id = $1 RETURNING *", [id]);
        if (deleteOp.rows.length === 0) {
            return res.status(404).json("Usuário não encontrado para deletar.");
        }
        res.json("Usuário deletado com sucesso!");
    } catch (err) {
        if (err.code === '23503') {
            return res.status(400).json({ message: "Este usuário não pode ser excluído, pois possui orçamentos vinculados." });
        }
        console.error(err.message);
        res.status(500).send("Erro no servidor ao deletar usuário.");
    }
});


// =======================================================
// ROTAS DA EMPRESA
// =======================================================
app.get('/api/empresa', auth, async (req, res) => {
    try {
        const dadosEmpresa = await pool.query('SELECT * FROM empresa WHERE id = 1');
        res.json(dadosEmpresa.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no servidor');
    }
});

app.put('/api/empresa', auth, async (req, res) => {
    try {
        const { nome_fantasia, razao_social, cnpj, endereco_completo, telefone_contato, email_contato, website, logo_url } = req.body;
        const updateQuery = `UPDATE empresa SET nome_fantasia = $1, razao_social = $2, cnpj = $3, endereco_completo = $4, telefone_contato = $5, email_contato = $6, website = $7, logo_url = $8 WHERE id = 1 RETURNING *`;
        const updatedEmpresa = await pool.query(updateQuery, [nome_fantasia, razao_social, cnpj, endereco_completo, telefone_contato, email_contato, website, logo_url]);
        res.json({ message: 'Dados da empresa atualizados com sucesso!', data: updatedEmpresa.rows[0] });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no servidor');
    }
});


// =======================================================
// ROTAS DE CLIENTES
// =======================================================
app.post('/api/clientes', auth, async (req, res) => {
    try {
        const { nome_completo, cpf_cnpj, email, telefone, cep, rua, numero, complemento, bairro, cidade, estado } = req.body;
        const cpfCnpjNumeros = cpf_cnpj ? cpf_cnpj.replace(/\D/g, '') : null;
        const telefoneNumeros = telefone ? telefone.replace(/\D/g, '') : null;
        if (cpfCnpjNumeros) {
            const clienteExistente = await pool.query("SELECT id FROM cliente WHERE cpf_cnpj = $1", [cpfCnpjNumeros]);
            if (clienteExistente.rows.length > 0) {
                return res.status(400).json({ message: 'Já existe um cliente cadastrado com este CPF/CNPJ.' });
            }
        }
        const novoCliente = await pool.query(
            "INSERT INTO cliente (nome_completo, email, telefone, cpf_cnpj, cep, rua, numero, complemento, bairro, cidade, estado) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *",
            [nome_completo, email, telefoneNumeros, cpfCnpjNumeros, cep, rua, numero, complemento, bairro, cidade, estado]
        );
        res.status(201).json(novoCliente.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Erro no servidor ao criar cliente.");
    }
});

app.get('/api/clientes', auth, async (req, res) => {
    try {
        const { busca } = req.query;
        let query = "SELECT * FROM cliente";
        const params = [];
        if (busca) {
            query += " WHERE nome_completo ILIKE $1";
            params.push(`%${busca}%`);
        }
        query += " ORDER BY nome_completo ASC";
        const todosClientes = await pool.query(query, params);
        res.json(todosClientes.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Erro no servidor ao buscar clientes.");
    }
});

app.put('/api/clientes/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const { nome_completo, cpf_cnpj, email, telefone, cep, rua, numero, complemento, bairro, cidade, estado } = req.body;
        const cpfCnpjNumeros = cpf_cnpj ? cpf_cnpj.replace(/\D/g, '') : null;
        const telefoneNumeros = telefone ? telefone.replace(/\D/g, '') : null;
        if (cpfCnpjNumeros) {
            const clienteExistente = await pool.query("SELECT id FROM cliente WHERE cpf_cnpj = $1 AND id != $2", [cpfCnpjNumeros, id]);
            if (clienteExistente.rows.length > 0) {
                return res.status(400).json({ message: 'Já existe outro cliente cadastrado com este CPF/CNPJ.' });
            }
        }
        const clienteAtualizado = await pool.query(
            "UPDATE cliente SET nome_completo = $1, email = $2, telefone = $3, cpf_cnpj = $4, cep = $5, rua = $6, numero = $7, complemento = $8, bairro = $9, cidade = $10, estado = $11 WHERE id = $12 RETURNING *",
            [nome_completo, email, telefoneNumeros, cpfCnpjNumeros, cep, rua, numero, complemento, bairro, cidade, estado, id]
        );
        if (clienteAtualizado.rows.length === 0) {
            return res.status(404).json({ message: "Cliente não encontrado." });
        }
        res.json({ message: "Cliente atualizado com sucesso!", data: clienteAtualizado.rows[0] });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Erro no servidor ao atualizar cliente.");
    }
});

app.delete('/api/clientes/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const deleteOp = await pool.query("DELETE FROM cliente WHERE id = $1 RETURNING *", [id]);
        if (deleteOp.rows.length === 0) {
            return res.status(404).json("Cliente não encontrado para deletar.");
        }
        res.json("Cliente deletado com sucesso!");
    } catch (err) {
        if (err.code === '23503') {
            return res.status(400).json({ message: "Este cliente não pode ser excluído, pois possui orçamentos vinculados." });
        }
        console.error(err.message);
        res.status(500).send("Erro no servidor ao deletar cliente.");
    }
});


// =======================================================
// ROTAS DE PRODUTOS/SERVIÇOS
// =======================================================
app.post('/api/produtos', auth, async (req, res) => {
    try {
        const { descricao, ncm, valor_unitario } = req.body;
        const produtoExistente = await pool.query("SELECT id FROM produto_servico WHERE descricao ILIKE $1", [descricao]);
        if (produtoExistente.rows.length > 0) {
            return res.status(400).json({ message: 'Já existe um produto/serviço cadastrado com esta descrição.' });
        }
        const novoProduto = await pool.query("INSERT INTO produto_servico (descricao, ncm, valor_unitario) VALUES ($1, $2, $3) RETURNING *", [descricao, ncm, valor_unitario]);
        res.status(201).json(novoProduto.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Erro no servidor ao criar produto/serviço.");
    }
});

app.get('/api/produtos', auth, async (req, res) => {
    try {
        const { busca } = req.query;
        let query = "SELECT * FROM produto_servico";
        const params = [];
        if (busca) {
            query += " WHERE descricao ILIKE $1";
            params.push(`%${busca}%`);
        }
        query += " ORDER BY descricao ASC";
        const todosProdutos = await pool.query(query, params);
        res.json(todosProdutos.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Erro no servidor ao buscar produtos/serviços.");
    }
});

app.put('/api/produtos/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const { descricao, ncm, valor_unitario } = req.body;
        const produtoExistente = await pool.query("SELECT id FROM produto_servico WHERE descricao ILIKE $1 AND id != $2", [descricao, id]);
        if (produtoExistente.rows.length > 0) {
            return res.status(400).json({ message: 'Já existe outro produto/serviço cadastrado com esta descrição.' });
        }
        const produtoAtualizado = await pool.query("UPDATE produto_servico SET descricao = $1, ncm = $2, valor_unitario = $3 WHERE id = $4 RETURNING *", [descricao, ncm, valor_unitario, id]);
        if (produtoAtualizado.rows.length === 0) {
            return res.status(404).json("Produto/serviço não encontrado para atualização.");
        }
        res.json({ message: "Produto/serviço atualizado com sucesso!", data: produtoAtualizado.rows[0] });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Erro no servidor ao atualizar produto/serviço.");
    }
});

app.delete('/api/produtos/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const deleteOp = await pool.query("DELETE FROM produto_servico WHERE id = $1 RETURNING *", [id]);
        if (deleteOp.rows.length === 0) {
            return res.status(404).json("Produto/serviço não encontrado para deletar.");
        }
        res.json("Produto/serviço deletado com sucesso!");
    } catch (err) {
        if (err.code === '23503') {
            return res.status(400).json({ message: "Este produto não pode ser excluído, pois está vinculado a um ou mais orçamentos." });
        }
        console.error(err.message);
        res.status(500).send("Erro no servidor ao deletar produto/serviço.");
    }
});


// =======================================================
// ROTAS DE CLÁUSULAS
// =======================================================
app.get('/api/clausulas', auth, async (req, res) => {
    try {
        const { busca } = req.query;
        let query = "SELECT * FROM clausulas";
        const params = [];
        if (busca) {
            query += " WHERE titulo ILIKE $1";
            params.push(`%${busca}%`);
        }
        query += " ORDER BY titulo ASC";
        const todasClausulas = await pool.query(query, params);
        res.json(todasClausulas.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Erro no servidor ao buscar cláusulas.");
    }
});

app.post('/api/clausulas', auth, async (req, res) => {
    try {
        const { titulo, texto } = req.body;
        const clausulaExistente = await pool.query("SELECT id FROM clausulas WHERE titulo ILIKE $1", [titulo]);
        if (clausulaExistente.rows.length > 0) {
            return res.status(400).json({ message: 'Já existe uma cláusula cadastrada com este título.' });
        }
        const novaClausula = await pool.query("INSERT INTO clausulas (titulo, texto) VALUES ($1, $2) RETURNING *", [titulo, texto]);
        res.status(201).json(novaClausula.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Erro no servidor ao adicionar cláusula.");
    }
});

app.put('/api/clausulas/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const { titulo, texto } = req.body;
        const clausulaExistente = await pool.query("SELECT id FROM clausulas WHERE titulo ILIKE $1 AND id != $2", [titulo, id]);
        if (clausulaExistente.rows.length > 0) {
            return res.status(400).json({ message: 'Já existe outra cláusula cadastrada com este título.' });
        }
        const clausulaAtualizada = await pool.query("UPDATE clausulas SET titulo = $1, texto = $2 WHERE id = $3 RETURNING *", [titulo, texto, id]);
        if (clausulaAtualizada.rows.length === 0) {
            return res.status(404).json({ message: "Cláusula não encontrada." });
        }
        res.json({ message: "Cláusula atualizada com sucesso!", data: clausulaAtualizada.rows[0] });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Erro no servidor ao atualizar cláusula.");
    }
});

app.delete('/api/clausulas/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const deleteOp = await pool.query("DELETE FROM clausulas WHERE id = $1 RETURNING *", [id]);
        if (deleteOp.rows.length === 0) {
            return res.status(404).json("Cláusula não encontrada para deletar.");
        }
        res.json("Cláusula deletada com sucesso!");
    } catch (err) {
        if (err.code === '23503') {
            return res.status(400).json({ message: "Esta cláusula não pode ser excluída, pois está vinculada a um ou mais orçamentos." });
        }
        console.error(err.message);
        res.status(500).send("Erro no servidor ao deletar cláusula.");
    }
});


// =======================================================
// ROTAS PARA MODELOS DE ORÇAMENTO
// =======================================================
app.get('/api/modelos', auth, async (req, res) => {
    try {
        const todosModelos = await pool.query("SELECT * FROM modelos_orcamento ORDER BY nome_modelo ASC");
        res.json(todosModelos.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Erro no servidor ao buscar modelos.");
    }
});

app.post('/api/modelos', auth, async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const { nome_modelo, descricao, itens, clausulas_ids } = req.body;
        const modeloResult = await client.query("INSERT INTO modelos_orcamento (nome_modelo, descricao) VALUES ($1, $2) RETURNING id", [nome_modelo, descricao]);
        const modeloId = modeloResult.rows[0].id;
        if (itens && itens.length > 0) {
            for (const item of itens) {
                await client.query("INSERT INTO modelo_orcamento_itens (modelo_id, produto_servico_id, quantidade) VALUES ($1, $2, $3)", [modeloId, item.produto_servico_id, item.quantidade]);
            }
        }
        if (clausulas_ids && clausulas_ids.length > 0) {
            for (const clausulaId of clausulas_ids) {
                await client.query("INSERT INTO modelo_orcamento_clausulas (modelo_id, clausula_id) VALUES ($1, $2)", [modeloId, clausulaId]);
            }
        }
        await client.query('COMMIT');
        res.status(201).json({ id: modeloId, message: "Modelo criado com sucesso!" });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Erro detalhado do backend:", err);
        res.status(500).send("Erro no servidor ao criar modelo.");
    } finally {
        client.release();
    }
});

app.get('/api/modelos/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const modeloResult = await pool.query("SELECT * FROM modelos_orcamento WHERE id = $1", [id]);
        if (modeloResult.rows.length === 0) {
            return res.status(404).json("Modelo não encontrado.");
        }
        const itensResult = await pool.query(`SELECT mi.quantidade, p.id as produto_servico_id, p.descricao, p.valor_unitario, p.ncm FROM modelo_orcamento_itens mi JOIN produto_servico p ON mi.produto_servico_id = p.id WHERE mi.modelo_id = $1`, [id]);
        const clausulasResult = await pool.query(`SELECT c.* FROM clausulas c JOIN modelo_orcamento_clausulas mc ON c.id = mc.clausula_id WHERE mc.modelo_id = $1`, [id]);
        const modeloCompleto = modeloResult.rows[0];
        modeloCompleto.itens = itensResult.rows;
        modeloCompleto.clausulas = clausulasResult.rows;
        res.json(modeloCompleto);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Erro ao buscar detalhes do modelo.");
    }
});

app.put('/api/modelos/:id', auth, async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const { id } = req.params;
        const { nome_modelo, descricao, itens, clausulas_ids } = req.body;
        await client.query("UPDATE modelos_orcamento SET nome_modelo = $1, descricao = $2 WHERE id = $3", [nome_modelo, descricao, id]);
        await client.query("DELETE FROM modelo_orcamento_itens WHERE modelo_id = $1", [id]);
        await client.query("DELETE FROM modelo_orcamento_clausulas WHERE modelo_id = $1", [id]);
        if (itens && itens.length > 0) {
            for (const item of itens) {
                await client.query("INSERT INTO modelo_orcamento_itens (modelo_id, produto_servico_id, quantidade) VALUES ($1, $2, $3)", [id, item.produto_servico_id, item.quantidade]);
            }
        }
        if (clausulas_ids && clausulas_ids.length > 0) {
            for (const clausulaId of clausulas_ids) {
                await client.query("INSERT INTO modelo_orcamento_clausulas (modelo_id, clausula_id) VALUES ($1, $2)", [id, clausulaId]);
            }
        }
        await client.query('COMMIT');
        res.json({ message: "Modelo atualizado com sucesso!" });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err.message);
        res.status(500).send("Erro no servidor ao atualizar modelo.");
    } finally {
        client.release();
    }
});

app.delete('/api/modelos/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query("DELETE FROM modelos_orcamento WHERE id = $1", [id]);
        res.json("Modelo deletado com sucesso!");
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Erro no servidor ao deletar modelo.");
    }
});


// =======================================================
// ROTAS DE ORÇAMENTOS
// =======================================================
app.post('/api/orcamentos', auth, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const usuarioId = req.usuario.id;
    // Recebe os novos campos do body
    const { cliente_id, data_validade, observacoes, itens, clausulas_ids, nome_contato, email_contato } = req.body;

    const valor_total = itens.reduce((total, item) => {
      const subtotal = item.quantidade * item.valor_unitario;
      const valorDoDesconto = subtotal * ((parseFloat(item.desconto_percentual) || 0) / 100);
      return total + (subtotal - valorDoDesconto);
    }, 0);

    // MUDANÇA: Adiciona os novos campos ao INSERT
    const orcamentoResult = await client.query(
        'INSERT INTO orcamentos (cliente_id, valor_total, data_validade, observacoes, status, usuario_id, nome_contato, email_contato) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id', 
        [cliente_id, valor_total, data_validade, observacoes, 'Rascunho', usuarioId, nome_contato, email_contato]
    );
    const orcamentoId = orcamentoResult.rows[0].id;

    for (const item of itens) {
      await client.query(
        'INSERT INTO orcamento_itens (orcamento_id, produto_servico_id, quantidade, valor_unitario, ncm, desconto_percentual) VALUES ($1, $2, $3, $4, $5, $6)',
        [orcamentoId, item.produto_servico_id, item.quantidade, item.valor_unitario, item.ncm, item.desconto_percentual || 0]
      );
    }

    if (clausulas_ids && clausulas_ids.length > 0) {
      for (const clausulaId of clausulas_ids) {
        await client.query('INSERT INTO orcamento_clausulas (orcamento_id, clausula_id) VALUES ($1, $2)', [orcamentoId, clausulaId]);
      }
    }
    
    await client.query('COMMIT');
    res.status(201).json({ id: orcamentoId, message: 'Orçamento criado com sucesso!' });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error("Erro detalhado do backend:", err);
    res.status(500).send("Erro no servidor ao criar orçamento.");
  } finally {
    client.release();
  }
});

app.put('/api/orcamentos/:id', auth, async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const { id } = req.params;
        // Recebe os novos campos do body
        const { cliente_id, data_validade, observacoes, itens, clausulas_ids, nome_contato, email_contato } = req.body;
        
        const valor_total = itens.reduce((total, item) => {
            const subtotal = item.quantidade * item.valor_unitario;
            const desconto = subtotal * ((item.desconto_percentual || 0) / 100);
            return total + (subtotal - desconto);
        }, 0);

        // MUDANÇA: Adiciona os novos campos ao UPDATE
        await client.query(
            "UPDATE orcamentos SET cliente_id = $1, valor_total = $2, data_validade = $3, observacoes = $4, revisao = revisao + 1, nome_contato = $5, email_contato = $6 WHERE id = $7",
            [cliente_id, valor_total, data_validade, observacoes, nome_contato, email_contato, id]
        );

        await client.query("DELETE FROM orcamento_itens WHERE orcamento_id = $1", [id]);
        await client.query("DELETE FROM orcamento_clausulas WHERE orcamento_id = $1", [id]);

        for (const item of itens) {
            await client.query(
                'INSERT INTO orcamento_itens (orcamento_id, produto_servico_id, quantidade, valor_unitario, ncm, desconto_percentual) VALUES ($1, $2, $3, $4, $5, $6)',
                [id, item.produto_servico_id, item.quantidade, item.valor_unitario, item.ncm, item.desconto_percentual || 0]
            );
        }
        if (clausulas_ids && clausulas_ids.length > 0) {
            for (const clausulaId of clausulas_ids) {
                await client.query('INSERT INTO orcamento_clausulas (orcamento_id, clausula_id) VALUES ($1, $2)', [id, clausulaId]);
            }
        }
        await client.query('COMMIT');
        res.json({ message: "Orçamento atualizado com sucesso!" });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Erro detalhado do backend:", err);
        res.status(500).send("Erro no servidor ao atualizar orçamento.");
    } finally {
        client.release();
    }
});

app.get('/api/orcamentos', auth, async (req, res) => {
    try {
        const { busca } = req.query;
        let query = `
          SELECT 
            o.id, o.revisao,
            CASE 
              WHEN o.status = 'Rascunho' AND o.data_validade < CURRENT_DATE THEN 'Vencido'
              ELSE o.status 
            END as status, 
            o.valor_total, o.data_criacao, c.nome_completo AS cliente_nome, u.nome AS autor_nome
          FROM orcamentos o 
          JOIN cliente c ON o.cliente_id = c.id
          LEFT JOIN usuarios u ON o.usuario_id = u.id
        `;
        const params = [];
        if (busca) {
            query += " WHERE c.nome_completo ILIKE $1 OR CAST(o.id AS TEXT) ILIKE $1";
            params.push(`%${busca}%`);
        }
        query += " ORDER BY o.id DESC";
        const todosOrcamentos = await pool.query(query, params);
        res.json(todosOrcamentos.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Erro no servidor ao buscar orçamentos.");
    }
});

app.get('/api/orcamentos/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const orcamentoResult = await pool.query(`
            SELECT o.*, c.nome_completo, c.email, c.telefone, c.cep, c.rua, c.numero, c.complemento, c.bairro, c.cidade, c.estado, 
            u.nome as usuario_nome, u.email as usuario_email, u.telefone as usuario_telefone, u.cargo as usuario_cargo
            FROM orcamentos o 
            JOIN cliente c ON o.cliente_id = c.id
            LEFT JOIN usuarios u ON o.usuario_id = u.id
            WHERE o.id = $1
        `, [id]);
        if (orcamentoResult.rows.length === 0) {
            return res.status(404).json("Orçamento não encontrado.");
        }
        const itensResult = await pool.query(`SELECT oi.*, p.descricao, oi.ncm FROM orcamento_itens oi JOIN produto_servico p ON oi.produto_servico_id = p.id WHERE oi.orcamento_id = $1`, [id]);
        const clausulasResult = await pool.query(`SELECT c.* FROM clausulas c JOIN orcamento_clausulas oc ON c.id = oc.clausula_id WHERE oc.orcamento_id = $1`, [id]);
        const orcamentoCompleto = orcamentoResult.rows[0];
        orcamentoCompleto.itens = itensResult.rows;
        orcamentoCompleto.clausulas = clausulasResult.rows;
        res.json(orcamentoCompleto);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Erro no servidor ao buscar detalhes do orçamento.");
    }
});

app.delete('/api/orcamentos/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const deleteOp = await pool.query("DELETE FROM orcamentos WHERE id = $1 RETURNING *", [id]);
        if (deleteOp.rows.length === 0) {
            return res.status(404).json("Orçamento não encontrado para deletar.");
        }
        res.json({ message: "Orçamento deletado com sucesso!" });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Erro no servidor ao deletar orçamento.");
    }
});

app.patch('/api/orcamentos/:id/status', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const orcamentoAtualizado = await pool.query(
            "UPDATE orcamentos SET status = $1 WHERE id = $2 RETURNING *",
            [status, id]
        );
        if (orcamentoAtualizado.rows.length === 0) {
            return res.status(404).json("Orçamento não encontrado para atualização.");
        }
        res.json(orcamentoAtualizado.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Erro no servidor ao atualizar status do orçamento.");
    }
});


// =======================================================
// INICIALIZAÇÃO DO SERVIDOR
// =======================================================
app.listen(port, () => {
    console.log(`Servidor backend rodando em http://localhost:${port}`);
});