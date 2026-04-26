const express = require('express');
const app = express();
const port = 3000;

app.use(express.urlencoded({ extended: true }));

const fluentdUrl = "http://127.0.0.1:8080/app.logs";

let tasks = [];

async function sendLog(level, event, message, extraData = {}) {
    const logData = {
        service: "todo-app",
        level: level,
        event: event,
        message: message,
        timestamp: new Date().toISOString(),
        ...extraData
    };

    try {
        await fetch(fluentdUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(logData)
        });
        console.log(`[LOG] ${level}: ${event}`);
    } catch (error) {
        console.log(`[ERROR] Немає зв'язку з Fluentd`);
    }
}

app.get('/', (req, res) => {
    sendLog("INFO", "PAGE_VIEW", "Перегляд списку завдань");

    let tasksHtml = tasks.length === 0
        ? "<p style='color: #777;'>Список порожній. Додайте щось!</p>"
        : tasks.map(t => `
            <li style="margin: 15px 0; font-size: 18px; padding: 10px; background: #f9f9f9; border-radius: 5px; display: flex; justify-content: space-between; align-items: center;">
                <span>${t}</span>
                <a href="/done?task=${encodeURIComponent(t)}" style="text-decoration:none;">
                    <button style="background: #4CAF50; color: white; border: none; border-radius: 4px; padding: 5px 10px; cursor: pointer;">✅ Виконати</button>
                </a>
            </li>`).join('');

    let errorMsg = req.query.error ? `<p style="color: #f44336; font-weight: bold; padding: 10px; background: #ffebee; border-radius: 4px;">⚠️ ${req.query.error}</p>` : "";

    res.send(`
        <div style="font-family: sans-serif; max-width: 600px; margin: 50px auto; text-align: center; border: 1px solid #ddd; padding: 30px; border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
            <h2>To-Do List</h2>
            
            ${errorMsg}
            
            <form action="/add" method="POST" style="margin-bottom: 30px; display: flex; justify-content: center; gap: 10px;">
                <input type="text" name="taskName" placeholder="Що потрібно зробити?" required style="padding: 10px; width: 60%; border: 1px solid #ccc; border-radius: 4px; font-size: 16px;">
                <button type="submit" style="padding: 10px 20px; background: #2196F3; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px;">➕ Додати</button>
            </form>

            <ul style="list-style: none; padding: 0; text-align: left;">
                ${tasksHtml}
            </ul>
        </div>
    `);
});

app.post('/add', (req, res) => {
    const newTask = req.body.taskName.trim();

    if (tasks.includes(newTask)) {
        sendLog("ERROR", "DUPLICATE_TASK_ERROR", "Спроба додати існуюче завдання", { task_name: newTask });
        return res.redirect('/?error=' + encodeURIComponent('Таке завдання вже є у списку!'));
    }

    tasks.push(newTask);
    sendLog("INFO", "TASK_ADDED", "Додано нове завдання", { task_name: newTask });
    res.redirect('/');
});

app.get('/done', (req, res) => {
    const taskToComplete = req.query.task;
    tasks = tasks.filter(t => t !== taskToComplete);

    sendLog("INFO", "TASK_COMPLETED", "Завдання успішно виконано та видалено", { task_name: taskToComplete });
    res.redirect('/');
});


app.listen(port, () => {
    console.log(`Застосунок працює на http://localhost:${port}`);
    sendLog("INFO", "APP_STARTED", "Сервер успішно запущено");
});