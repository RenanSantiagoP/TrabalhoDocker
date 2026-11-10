const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME || 'tarefas_db',
  user: process.env.DB_USER || 'tarefas_user',
  password: process.env.DB_PASSWORD || 'tarefas_pass'
});

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API de Gerenciamento de Tarefas',
      version: '1.0.0',
      description: 'API RESTful conteinerizada em Docker, persistida em PostgreSQL e documentada com Swagger UI'
    },
    servers: [{ url: '/', description: 'Servidor Local / Contêiner Docker' }]
  },
  apis: [__filename]
};
const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

/**
 * @openapi
 * components:
 *   schemas:
 *     TarefaDTO:
 *       type: object
 *       required: [titulo]
 *       properties:
 *         titulo:
 *           type: string
 *           example: "Configurar Docker"
 *         descricao:
 *           type: string
 *           example: "Subir contêineres da API e do Banco"
 *         prioridade:
 *           type: string
 *           enum: [BAIXA, MEDIA, ALTA]
 *           example: "ALTA"
 *     TarefaResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         titulo:
 *           type: string
 *           example: "Configurar Docker"
 *         descricao:
 *           type: string
 *           example: "Subir contêineres da API e do Banco"
 *         prioridade:
 *           type: string
 *           example: "ALTA"
 *         criado_em:
 *           type: string
 *           format: date-time
 */

/**
 * @openapi
 * /api/v1/tarefas:
 *   get:
 *     summary: Listar todas as tarefas
 *     tags: [Tarefas]
 *     responses:
 *       200:
 *         description: Lista de tarefas retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TarefaResponse'
 */
app.get('/api/v1/tarefas', async (req, res) => {
  try {
    const resultado = await pool.query(
      'SELECT id, titulo, descricao, prioridade, criado_em FROM tarefas ORDER BY id'
    );
    return res.status(200).json(resultado.rows);
  } catch (erro) {
    console.error('Erro ao listar tarefas:', erro);
    return res.status(500).json({ erro: 'Não foi possível listar as tarefas.' });
  }
});

/**
 * @openapi
 * /api/v1/tarefas:
 *   post:
 *     summary: Cadastrar uma nova tarefa
 *     tags: [Tarefas]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TarefaDTO'
 *     responses:
 *       201:
 *         description: Tarefa criada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TarefaResponse'
 *       400:
 *         description: Dados inválidos
 */
app.post('/api/v1/tarefas', async (req, res) => {
  const { titulo, descricao, prioridade } = req.body || {};
  if (typeof titulo !== 'string' || !titulo.trim()) {
    return res.status(400).json({ erro: 'Título é obrigatório.' });
  }

  const prioridadeFinal = prioridade || 'MEDIA';
  if (!['BAIXA', 'MEDIA', 'ALTA'].includes(prioridadeFinal)) {
    return res.status(400).json({ erro: 'Prioridade deve ser BAIXA, MEDIA ou ALTA.' });
  }

  try {
    const resultado = await pool.query(
      `INSERT INTO tarefas (titulo, descricao, prioridade)
       VALUES ($1, $2, $3)
       RETURNING id, titulo, descricao, prioridade, criado_em`,
      [titulo.trim(), descricao || '', prioridadeFinal]
    );
    return res.status(201).json(resultado.rows[0]);
  } catch (erro) {
    console.error('Erro ao cadastrar tarefa:', erro);
    return res.status(500).json({ erro: 'Não foi possível cadastrar a tarefa.' });
  }
});

async function iniciarServidor() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tarefas (
        id SERIAL PRIMARY KEY,
        titulo VARCHAR(200) NOT NULL,
        descricao TEXT,
        prioridade VARCHAR(10) NOT NULL DEFAULT 'MEDIA',
        criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`API Node.js rodando na porta ${PORT}`);
      console.log(`Swagger UI: http://localhost:${PORT}/docs`);
    });
  } catch (erro) {
    console.error('Não foi possível conectar/criar a tabela no PostgreSQL:', erro);
    process.exit(1);
  }
}

iniciarServidor();
