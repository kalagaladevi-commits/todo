326// ==========================================
// STATE MANAGEMENT
// ==========================================
let tasks = [];
let currentFilter = 'all'; // all, active, completed

// ==========================================
// DOM ELEMENTS
// ==========================================
const taskInput = document.getElementById('task-input');
const addBtn = document.getElementById('add-btn');
const taskList = document.getElementById('task-list');
const searchInput = document.getElementById('search-input');
const filterBtns = document.querySelectorAll('.filter-btn');
const totalTasksEl = document.getElementById('total-tasks');
const activeTasksEl = document.getElementById('active-tasks');
const completedTasksEl = document.getElementById('completed-tasks');
const emptyState = document.getElementById('empty-state');
const clearCompletedBtn = document.getElementById('clear-completed-btn');
const deleteAllBtn = document.getElementById('delete-all-btn');

// ==========================================
// INITIALIZATION
// ==========================================
const init = () => {
    loadTasks();
    renderTasks();
    setupEventListeners();
};

// ==========================================
// EVENT LISTENERS
// ==========================================
const setupEventListeners = () => {
    // Add task events
    addBtn.addEventListener('click', addTask);
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTask();
    });

    // Task list event delegation (Edit, Delete, Toggle Complete)
    taskList.addEventListener('click', handleTaskActions);

    // Search event
    searchInput.addEventListener('input', renderTasks);

    // Filter events
    filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            filterBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentFilter = e.target.dataset.filter;
            renderTasks();
        });
    });

    // Bulk actions
    clearCompletedBtn.addEventListener('click', clearCompleted);
    deleteAllBtn.addEventListener('click', deleteAllTasks);
};

// ==========================================
// LOCAL STORAGE
// ==========================================
const saveTasks = () => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
};

const loadTasks = () => {
    const savedTasks = localStorage.getItem('tasks');
    if (savedTasks) {
        tasks = JSON.parse(savedTasks);
    }
};

// ==========================================
// CORE FUNCTIONS
// ==========================================

// Add a new task
const addTask = () => {
    const text = taskInput.value.trim();
    
    // Validation
    if (!text) {
        // Soft error handling using placeholder
        taskInput.placeholder = "Task cannot be empty!";
        taskInput.classList.add('error');
        setTimeout(() => {
            taskInput.placeholder = "What needs to be done?";
            taskInput.classList.remove('error');
        }, 2000);
        return;
    }

    const newTask = {
        id: Date.now().toString(), // Unique ID
        text: text,
        completed: false
    };

    tasks.unshift(newTask); // Add to the top of the list
    saveTasks();
    
    taskInput.value = ''; // Clear input
    renderTasks();
};

// Handle clicks on task items (Event Delegation)
const handleTaskActions = (e) => {
    const target = e.target;
    
    // Find the parent task item
    const taskItem = target.closest('.task-item');
    if (!taskItem) return;
    
    const taskId = taskItem.dataset.id;

    // 1. Toggle completed state
    if (target.classList.contains('task-checkbox')) {
        toggleTaskCompletion(taskId);
    }

    // 2. Delete task
    if (target.closest('.delete-btn')) {
        deleteTask(taskId, taskItem);
    }

    // 3. Edit task
    if (target.closest('.edit-btn')) {
        editTask(taskId, taskItem);
    }
};

// Toggle completion status
const toggleTaskCompletion = (id) => {
    tasks = tasks.map(task => {
        if (task.id === id) {
            return { ...task, completed: !task.completed };
        }
        return task;
    });
    saveTasks();
    renderTasks();
};

// Delete a single task
const deleteTask = (id, taskItem) => {
    // Add fade out animation class
    taskItem.classList.add('fadeOut');
    
    // Wait for animation to finish before updating state and re-rendering
    setTimeout(() => {
        tasks = tasks.filter(task => task.id !== id);
        saveTasks();
        renderTasks();
    }, 300); // 300ms matches the CSS animation duration
};

// Edit a task inline
const editTask = (id, taskItem) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const contentDiv = taskItem.querySelector('.task-content');
    const oldText = task.text;

    // Create an input field dynamically
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'task-text-input';
    input.value = oldText;

    // Replace text span with the input field
    contentDiv.innerHTML = '';
    contentDiv.appendChild(input);
    input.focus();
    
    // Move cursor to end of input
    input.setSelectionRange(input.value.length, input.value.length);

    // Save the edit
    const saveEdit = () => {
        const newText = input.value.trim();
        // Prevent saving empty task (revert to old if empty)
        if (newText) {
            task.text = newText;
            saveTasks();
        }
        renderTasks();
    };

    // Event listeners for saving
    input.addEventListener('blur', saveEdit);
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            input.blur(); // Triggers the blur event which saves
        }
    });
};

// Bulk action: Clear all completed
const clearCompleted = () => {
    const hasCompleted = tasks.some(task => task.completed);
    if (!hasCompleted) return;

    if (confirm("Are you sure you want to clear all completed tasks?")) {
        tasks = tasks.filter(task => !task.completed);
        saveTasks();
        renderTasks();
    }
};

// Bulk action: Delete all
const deleteAllTasks = () => {
    if (tasks.length === 0) return;

    if (confirm("Are you sure you want to delete all tasks? This cannot be undone.")) {
        tasks = [];
        saveTasks();
        renderTasks();
    }
};

// ==========================================
// RENDER & UI UPDATES
// ==========================================

// Main render function
const renderTasks = () => {
    const searchQuery = searchInput.value.toLowerCase().trim();
    
    // Filter tasks based on search and current tab
    let filteredTasks = tasks.filter(task => {
        // Search condition
        const matchesSearch = task.text.toLowerCase().includes(searchQuery);
        
        // Tab filter condition
        let matchesFilter = true;
        if (currentFilter === 'active') {
            matchesFilter = !task.completed;
        } else if (currentFilter === 'completed') {
            matchesFilter = task.completed;
        }
            
        return matchesSearch && matchesFilter;
    });

    // Clear current list
    taskList.innerHTML = '';
    
    // Render each filtered task
    filteredTasks.forEach(task => {
        const li = document.createElement('li');
        li.className = `task-item ${task.completed ? 'completed' : ''}`;
        li.dataset.id = task.id;
        
        li.innerHTML = `
            <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} aria-label="Toggle task completion">
            <div class="task-content">
                <span class="task-text">${escapeHTML(task.text)}</span>
            </div>
            <div class="task-actions">
                <button class="icon-btn edit-btn" title="Edit Task" aria-label="Edit Task">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="icon-btn delete-btn" title="Delete Task" aria-label="Delete Task">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        `;
        
        taskList.appendChild(li);
    });

    // Handle Empty State Visibility
    if (filteredTasks.length === 0) {
        emptyState.classList.remove('hidden');
        // Update empty state text based on context
        const emptyStateText = emptyState.querySelector('p');
        if (searchQuery) {
            emptyStateText.textContent = "No tasks match your search.";
        } else if (currentFilter === 'active') {
            emptyStateText.textContent = "No active tasks. You're all caught up!";
        } else if (currentFilter === 'completed') {
            emptyStateText.textContent = "No completed tasks yet.";
        } else {
            emptyStateText.textContent = "You're all caught up! Add a new task above.";
        }
    } else {
        emptyState.classList.add('hidden');
    }

    updateStats();
};

// Update statistics counters
const updateStats = () => {
    const total = tasks.length;
    const completed = tasks.filter(task => task.completed).length;
    const active = total - completed;

    totalTasksEl.textContent = total;
    activeTasksEl.textContent = active;
    completedTasksEl.textContent = completed;
};

// Utility function to prevent XSS attacks when setting innerHTML
const escapeHTML = (str) => {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
};

// ==========================================
// START APP
// ==========================================
document.addEventListener('DOMContentLoaded', init);
