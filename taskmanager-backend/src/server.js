const express = require('express');
const app = express();
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const cors = require('cors');
const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

app.use(cors());
app.use(express.json());
app.use(express.static('public'));


// Swagger setup
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Task Manager API',
      version: '1.0.0',
      description: 'CSIS445 Assignment 1 – Task Manager App',
    },
    servers: [{ url: 'http://localhost:3000' }],
  },
  apis: ['./src/server.js']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @swagger
 * /:
 *   get:
 *     summary: Backend check
 *     description: Check if the backend is running
 *     responses:
 *       200:
 *         description: Backend is running
 */
const path = require('path');
app.use(express.static(path.join(__dirname, 'public')));


/**
 * @swagger
 * /tasks:
 *   get:
 *     summary: Get all tasks
 *     responses:
 *       200:
 *         description: List of tasks
 */
app.get('/tasks', async (req, res) => {
  try{
    const [rows] = await pool.query('SELECT * FROM tasks');
    res.json(rows);
  } catch (err) {
    res.status(500).json({error: 'Failed to fetch tasks'});
  }
});

/**
 * @swagger
 * /tasks:
 *   post:
 *     summary: Create a new task
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               dueDate:
 *                 type: string
 *               priority:
 *                 type: string
 *               completed:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Task created
 */
app.post('/tasks', async (req, res) => {
  try {
    const task = {
      title: req.body.title,
      description: req.body.description,
      dueDate: req.body.dueDate,
      priority: req.body.priority,
      completed: req.body.completed,
      createdAt: new Date().toISOString(),
    };
    const [result] = await pool.query(
      'INSERT INTO tasks (title, description, dueDate, priority, completed, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
      [task.title, task.description, task.dueDate, task.priority, task.completed, task.createdAt]
    );
    task.id = result.insertId;
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({error: 'Failed to create task'});
  }
});

/**
 * @swagger
 * /tasks/{id}:
 *   put:
 *     summary: Update a task
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Task ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               dueDate:
 *                 type: string
 *               priority:
 *                 type: string
 *               completed:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Task updated
 *       404:
 *         description: Task not found
 */
app.put('/tasks/:id', async (req, res) => {
  const taskId = Number(req.params.id);
  try {
    const [rows] = await pool.query('SELECT * FROM tasks WHERE id = ?', [taskId]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Task does not exist'});
    }
    const task = rows[0];
    const updated = {
      title: req.body.title ?? task.title,
      description: req.body.description ?? task.description,
      dueDate: req.body.dueDate ?? task.dueDate,
      priority: req.body.priority ?? task.priority,
      completed: req.body.completed !== undefined ? req.body.completed : task.completed,
    };

    await pool.query(
      'UPDATE tasks SET title = ?, description = ?, dueDate = ?, priority = ?, completed = ? WHERE id = ?',
      [updated.title, updated.description, updated.dueDate, updated.priority, updated.completed, taskId]
    );

    res.json({ id: taskId, createdAt: task.createdAt, ...updated});
  } catch (err) {
    res.status(500).json({ error: 'Failed to update task'});
  }
 
});

/**
 * @swagger
 * /tasks/{id}:
 *   delete:
 *     summary: Delete a task
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Task ID
 *     responses:
 *       204:
 *         description: Task deleted
 *       404:
 *         description: Task not found
 */
app.delete('/tasks/:id', async (req, res) => {
  const taskId = Number(req.params.id);
  try {
    const [result] = await pool.query('DELETE FROM tasks WHERE id = ?', [taskId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Task does not exist'});
    }
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running at http://localhost:${PORT}`);
  console.log(`Swagger UI available at http://localhost:${PORT}/api-docs`);
});
