require('dotenv').config();
const express = require('express');
const app = express();
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const cors = require('cors');

let tasks = []; // In-memory database

app.use(cors());
app.use(express.json());

// Swagger setup
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Task Manager API',
      version: '1.0.0',
      description: 'CSIS445 Assignment 1 – Task Manager App',
    },
    servers: [
      {
        url: process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 3000}`,
      }
    ],
  },
  apis: ['./src/server.js'] // path to your API docs
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
app.get('/', (req, res) => {
  res.send('Hello, backend is working for CSIS445 assignment 1');
});

/**
 * @swagger
 * /tasks:
 *   get:
 *     summary: Get all tasks
 *     responses:
 *       200:
 *         description: List of tasks
 */
app.get('/tasks', (req, res) => {
  res.json(tasks);
});

/**
 * @swagger
 * /tasks:
 *   post:
 *     summary: Create a new task
 *     responses:
 *       201:
 *         description: Task created
 */
app.post('/tasks', (req, res) => {
  const newTask = {
    id: tasks.length + 1,
    title: req.body.title,
    description: req.body.description,
    dueDate: req.body.dueDate,
    priority: req.body.priority,
    completed: req.body.completed || false,
    createdAt: new Date()
  };
  tasks.push(newTask);
  res.status(201).json(newTask);
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
 *     responses:
 *       200:
 *         description: Task updated
 *       404:
 *         description: Task not found
 */
app.put('/tasks/:id', (req, res) => {
  const taskId = Number(req.params.id);
  const task = tasks.find(t => t.id === taskId);

  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  Object.assign(task, req.body);
  res.json(task);
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
app.delete('/tasks/:id', (req, res) => {
  const taskId = Number(req.params.id);
  const index = tasks.findIndex(t => t.id === taskId);

  if (index === -1) {
    return res.status(404).json({ error: 'Task does not exist' });
  }

  tasks.splice(index, 1);
  res.status(204).send();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
  console.log(`Swagger UI available at http://localhost:${PORT}/api-docs`);
});
