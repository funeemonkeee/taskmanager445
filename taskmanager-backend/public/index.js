document.addEventListener('DOMContentLoaded', function() {
    const titleInput = document.getElementById('userAnswer');
    const descInput = document.getElementById('userAnswer2');
    const dateInput = document.getElementById('duedate');
    const prioritySelect = document.getElementById('Pri');
    const addBtn = document.getElementById('SubmitB');
    const clearBtn = document.getElementById('RemoveB');
    const taskList = document.getElementById('taskList');

    // ✅ Works locally and on EC2 without editing
    const API_BASE_URL = window.location.hostname === 'localhost'
        ? 'http://localhost:3000'
        : '';

    const apiFetch = (path, options) => fetch(`${API_BASE_URL}${path}`, options);

    let tasks = [];
    let editingTaskId = null;

    fetchTasks();

    addBtn.addEventListener('click', () => {
        if (!titleInput.value.trim()) {
            alert('Please enter a task title');
            return;
        }

        const taskData = {
            title: titleInput.value,
            description: descInput.value,
            dueDate: dateInput.value,
            priority: prioritySelect.value,
            completed: false
        };

        if (editingTaskId !== null) {
            apiFetch(`/tasks/${editingTaskId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(taskData)
            })
            .then(res => res.json())
            .then(updatedTask => {
                const index = tasks.findIndex(t => t.id === editingTaskId);
                tasks[index] = updatedTask;
                editingTaskId = null;
                saveAndRender();
                clearForm();
            });
        } else {
            apiFetch('/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(taskData)
            })
            .then(res => res.json())
            .then(task => {
                tasks.push(task);
                saveAndRender();
                clearForm();
            })
            .catch(error => {
                console.error('There was an error adding the task:', error);
            });
        }
    });

    clearBtn.addEventListener('click', clearForm);

    function fetchTasks() {
        apiFetch('/tasks')
            .then(res => res.json())
            .then(data => {
                console.log("Connected to backend yay!, Tasks: ", data)
                tasks = data;
                renderTasks();
            });
    }

    function renderTasks() {
        taskList.innerHTML = '';
        const sortedTasks = [...tasks].sort((a, b) => {
            if (a.completed !== b.completed) return a.completed ? 1 : -1;
            const priorityOrder = ['GiveUp', 'severe', 'high', 'medium', 'low', 'none'];
            return priorityOrder.indexOf(a.priority) - priorityOrder.indexOf(b.priority);
        });

        sortedTasks.forEach(task => {
            const taskItem = document.createElement('li');
            taskItem.className = `task-item ${task.priority} ${task.completed ? 'completed' : ''}`;
            taskItem.innerHTML = `
                <div class="task-header">
                    <input type="checkbox" ${task.completed ? 'checked' : ''} data-id="${task.id}">
                    <h3>${task.title}</h3>
                    <button class="edit-btn" data-id="${task.id}"><i class="fa-solid fa-pen-to-square"></i></button>
                    <button class="delete-btn" data-id="${task.id}"><i class="fa-solid fa-trash"></i></button>
                </div>
                <p>${task.description || 'No description'}</p>
                <div class="task-footer">
                    <span><i class="fa-regular fa-calendar"></i> ${task.dueDate || 'No date'}</span>
                    <span class="priority-tag"><i class="fa-solid fa-flag"></i> ${task.priority}</span>
                </div>
                <div class="task-meta">Created: ${new Date(task.createdAt).toLocaleString()}</div>
            `;
            taskList.appendChild(taskItem);
        });

        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const taskId = parseInt(e.target.closest('.delete-btn').dataset.id);
                apiFetch(`/tasks/${taskId}`, { method: 'DELETE' })
                    .then(() => {
                        tasks = tasks.filter(t => t.id !== taskId);
                        saveAndRender();
                    });
            });
        });

        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const taskId = parseInt(e.target.closest('.edit-btn').dataset.id);
                const task = tasks.find(t => t.id === taskId);
                if (task) {
                    titleInput.value = task.title;
                    descInput.value = task.description;
                    dateInput.value = task.dueDate;
                    prioritySelect.value = task.priority;
                    editingTaskId = task.id;
                    addBtn.innerHTML = '<i class="fas fa-save"></i> Update Task';
                    titleInput.focus();
                }
            });
        });

        document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const taskId = parseInt(e.target.dataset.id);
                const task = tasks.find(t => t.id === taskId);
                task.completed = e.target.checked;
                apiFetch(`/tasks/${taskId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(task)
                })
                .then(res => res.json())
                .then(updated => {
                    const idx = tasks.findIndex(t => t.id === updated.id);
                    tasks[idx] = updated;
                    saveAndRender();
                });
            });
        });
    }

    function saveAndRender() {
        renderTasks();
    }

    function clearForm() {
        titleInput.value = '';
        descInput.value = '';
        dateInput.value = '';
        prioritySelect.value = 'none';
        editingTaskId = null;
        addBtn.innerHTML = '<i class="fas fa-plus"></i> Add Task';
    }
});
