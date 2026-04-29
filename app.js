// Quotes Data with AI Explanations
const quotes = [
    { 
        text: "A vida é o que acontece enquanto você faz outros planos.", 
        author: "John Lennon",
        explanation: "Esta frase nos lembra que a obsessão pelo futuro pode nos roubar a beleza do presente. Na sua lista de tarefas, foque na execução de hoje, não apenas na meta final."
    },
    { 
        text: "Conhece-te a ti mesmo.", 
        author: "Sócrates",
        explanation: "Saber seus limites e horários de maior produtividade é a chave. Se você tem muitas tarefas 'Alta', priorize-as quando sua energia estiver no topo."
    },
    { 
        text: "O que não nos mata, nos torna mais fortes.", 
        author: "Friedrich Nietzsche",
        explanation: "Cada tarefa concluída, por mais difícil que seja, é um treino para sua disciplina. Não fuja dos desafios 'Trabalho' complexos."
    },
    { 
        text: "A persistência é o caminho do êxito.", 
        author: "Charles Chaplin",
        explanation: "O sucesso não é um grande salto, mas uma série de pequenos passos. Marcar uma tarefa como feita é um desses passos."
    },
    { 
        text: "Só sei que nada sei.", 
        author: "Sócrates",
        explanation: "Mantenha a mente aberta ao aprendizado. Se houver tarefas de 'Estudos' hoje, aborde-as com curiosidade, não apenas como obrigação."
    },
    { 
        text: "Penso, logo existo.", 
        author: "René Descartes",
        explanation: "A clareza de pensamento vem da organização. Ao listar suas tarefas, você está materializando sua existência e seus objetivos."
    },
    { 
        text: "O homem é a medida de todas as coisas.", 
        author: "Protágoras",
        explanation: "Sua lista de tarefas reflete quem você quer ser. Você define o valor de cada prioridade."
    },
    { 
        text: "A felicidade não é algo pronto. Ela vem de suas próprias ações.", 
        author: "Dalai Lama",
        explanation: "A sensação de dever cumprido ao final do dia é um dos maiores pilares da felicidade cotidiana."
    },
    { 
        text: "Comece onde você está. Use o que você tem. Faça o que você pode.", 
        author: "Arthur Ashe",
        explanation: "Não espere as condições perfeitas para começar aquela tarefa difícil. O momento ideal é agora, com as ferramentas que você possui."
    },
    { 
        text: "A melhor maneira de prever o futuro é criá-lo.", 
        author: "Peter Drucker",
        explanation: "Cada item que você risca da sua lista é um tijolo na construção do seu futuro planejado."
    }
];

let currentQuoteIndex = 0;

// Supabase Configuration (Isolada em config.js)
const supabaseClient = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);

// State
let tasks = [];
let currentFilter = 'all'; // all, pending, completed
let analyticsChart = null;
let isLoginMode = true;

// DOM Elements
const authView = document.getElementById('auth-view');
const appView = document.getElementById('app-view');
const authForm = document.getElementById('auth-form');
const authEmail = document.getElementById('auth-email');
const authPassword = document.getElementById('auth-password');
const authError = document.getElementById('auth-error');
const authSubmitBtn = document.getElementById('auth-submit-btn');
const toggleAuthModeBtn = document.getElementById('toggle-auth-mode');
const authSubtitle = document.getElementById('auth-subtitle');
const logoutBtn = document.getElementById('logout-btn');

const taskForm = document.getElementById('task-form');
const taskTitleInput = document.getElementById('task-title');
const taskCategoryInput = document.getElementById('task-category');
const taskPriorityInput = document.getElementById('task-priority');
const taskDateInput = document.getElementById('task-date');
const taskStatusInput = document.getElementById('task-status');
const taskListContainer = document.getElementById('task-list');
const emptyState = document.getElementById('empty-state');
const filterBtns = document.querySelectorAll('.filter-btn');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');
const taskCountText = document.getElementById('task-count');
const progressCard = document.getElementById('progress-card');
const quoteText = document.getElementById('quote-text');
const navBtns = document.querySelectorAll('.nav-btn');
const viewSections = document.querySelectorAll('.view-section');

// Init
async function init() {
    // Auth Listeners
    toggleAuthModeBtn.addEventListener('click', toggleAuthMode);
    authForm.addEventListener('submit', handleAuth);
    logoutBtn.addEventListener('click', handleLogout);

    // Check Current Session
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
        showApp();
    } else {
        showAuth();
    }

    // Default Date
    const today = new Date().toISOString().split('T')[0];
    taskDateInput.value = today;

    // Standard Listeners
    taskForm.addEventListener('submit', handleAddTask);
    filterBtns.forEach(btn => btn.addEventListener('click', handleFilterChange));
    navBtns.forEach(btn => btn.addEventListener('click', handleNavChange));
    progressCard.addEventListener('click', updateQuote);
    document.getElementById('close-day-detail').addEventListener('click', () => {
        document.getElementById('day-detail').classList.add('hidden');
    });

    // Subscriptions (Realtime optional, but let's stick to state for now)
    supabaseClient.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN') showApp();
        if (event === 'SIGNED_OUT') showAuth();
    });

    // Initial Quote
    updateQuote();
}

async function showApp() {
    authView.classList.add('hidden');
    appView.classList.remove('hidden');
    await fetchTasks();
    renderTasks();
    renderCalendar();
    lucide.createIcons();
}

function showAuth() {
    appView.classList.add('hidden');
    authView.classList.remove('hidden');
}

async function handleAuth(e) {
    e.preventDefault();
    const email = authEmail.value;
    const password = authPassword.value;
    authError.classList.add('hidden');
    authSubmitBtn.disabled = true;
    authSubmitBtn.textContent = isLoginMode ? 'Entrando...' : 'Criando conta...';

    try {
        if (isLoginMode) {
            const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
            if (error) throw error;
        } else {
            const { error } = await supabaseClient.auth.signUp({ email, password });
            if (error) throw error;
            alert('Conta criada! Verifique seu email para confirmar (se habilitado) ou faça login.');
            toggleAuthMode();
        }
    } catch (err) {
        authError.textContent = err.message;
        authError.classList.remove('hidden');
    } finally {
        authSubmitBtn.disabled = false;
        authSubmitBtn.textContent = isLoginMode ? 'Entrar' : 'Cadastrar';
    }
}

async function handleLogout() {
    await supabaseClient.auth.signOut();
}

function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    authSubmitBtn.textContent = isLoginMode ? 'Entrar' : 'Cadastrar';
    authSubtitle.textContent = isLoginMode ? 'Bem-vindo de volta!' : 'Comece sua jornada hoje.';
    toggleAuthModeBtn.innerHTML = isLoginMode 
        ? 'Não tem uma conta? <span class="font-bold text-gray-300">Criar agora</span>'
        : 'Já tem uma conta? <span class="font-bold text-gray-300">Fazer login</span>';
}

async function fetchTasks() {
    const { data, error } = await supabaseClient
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Erro ao buscar tarefas:', error);
        return;
    }

    tasks = data.map(t => ({
        ...t,
        createdAt: t.created_at
    }));
}

function updateAnalytics() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const pending = total - completed;
    const rate = total === 0 ? 0 : Math.round((completed / total) * 100);

    document.getElementById('stats-total').textContent = total;
    document.getElementById('stats-pending').textContent = pending;
    document.getElementById('stats-completed').textContent = completed;
    document.getElementById('stats-rate').textContent = `${rate}%`;

    renderAnalyticsChart();
}

function renderAnalyticsChart() {
    const ctx = document.getElementById('analytics-chart');
    if (!ctx) return;

    const categories = {
        'Trabalho': tasks.filter(t => t.category === 'Trabalho').length,
        'Pessoal': tasks.filter(t => t.category === 'Pessoal').length,
        'Estudos': tasks.filter(t => t.category === 'Estudos').length
    };

    const data = {
        labels: Object.keys(categories),
        datasets: [{
            data: Object.values(categories),
            backgroundColor: [
                '#00f0ff', // neon-blue
                '#ff007f', // neon-pink
                '#39ff14'  // neon-green
            ],
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 2,
            hoverOffset: 10
        }]
    };

    if (analyticsChart) {
        analyticsChart.data = data;
        analyticsChart.update();
    } else {
        analyticsChart = new Chart(ctx, {
            type: 'doughnut',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#94a3b8',
                            font: { family: 'Inter', size: 12 },
                            padding: 20
                        }
                    }
                },
                cutout: '70%'
            }
        });
    }
}

function renderCalendar() {
    const calendarGrid = document.getElementById('calendar-grid');
    if (!calendarGrid) return;
    calendarGrid.innerHTML = '';

    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth();

    const firstDay = new Date(year, month, 1).getDay();
    const lastDay = new Date(year, month + 1, 0).getDate();

    // Fill blanks
    for (let i = 0; i < firstDay; i++) {
        calendarGrid.innerHTML += '<div></div>';
    }

    // Fill days
    for (let day = 1; day <= lastDay; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const hasTasks = tasks.some(t => t.date === dateStr);
        const isToday = day === new Date().getDate();

        const dayEl = document.createElement('button');
        dayEl.className = `aspect-square rounded-xl flex flex-col items-center justify-center gap-1 transition-all hover:bg-white/10 ${isToday ? 'border border-neon-blue bg-neon-blue/5' : 'bg-glass-100 border border-glass-border'}`;
        dayEl.onclick = () => showDayDetails(dateStr, day);
        
        dayEl.innerHTML = `
            <span class="text-sm font-bold ${isToday ? 'text-neon-blue' : 'text-gray-300'}">${day}</span>
            ${hasTasks ? '<div class="w-1 h-1 rounded-full bg-neon-purple shadow-[0_0_5px_rgba(176,38,255,0.8)]"></div>' : ''}
        `;
        calendarGrid.appendChild(dayEl);
    }
}

function showDayDetails(dateStr, dayNum) {
    const dayDetail = document.getElementById('day-detail');
    const dayTasksContainer = document.getElementById('day-task-list');
    const dayLabel = document.getElementById('selected-day-label');
    const dayProgressBar = document.getElementById('day-progress-bar');
    const dayProgressText = document.getElementById('day-progress-text');
    const dayQuote = document.getElementById('day-quote');

    dayDetail.classList.remove('hidden');
    dayTasksContainer.innerHTML = '';
    
    // Set Label
    const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    dayLabel.textContent = `${dayNum} de ${months[new Date().getMonth()]}`;

    // Set Quote
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    dayQuote.textContent = `"${randomQuote.text}"`;

    // Filter tasks for this day
    const dayTasks = tasks.filter(t => t.date === dateStr);
    
    if (dayTasks.length === 0) {
        dayTasksContainer.innerHTML = '<p class="text-gray-500 text-sm text-center py-4">Sem tarefas para este dia.</p>';
        dayProgressBar.style.width = '0%';
        dayProgressText.textContent = '0% feito';
    } else {
        const completed = dayTasks.filter(t => t.completed).length;
        const percentage = Math.round((completed / dayTasks.length) * 100);
        
        dayProgressBar.style.width = `${percentage}%`;
        dayProgressText.textContent = `${percentage}% feito`;

        dayTasks.forEach(task => {
            const el = document.createElement('div');
            el.className = `p-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3 ${task.completed ? 'opacity-50' : ''}`;
            el.innerHTML = `
                <div class="w-2 h-2 rounded-full ${task.completed ? 'bg-neon-green' : 'bg-neon-blue'}"></div>
                <span class="text-sm ${task.completed ? 'line-through' : ''}">${task.title}</span>
            `;
            dayTasksContainer.appendChild(el);
        });
    }

    // Scroll to detail
    dayDetail.scrollIntoView({ behavior: 'smooth' });
}

function updateQuote() {
    currentQuoteIndex = Math.floor(Math.random() * quotes.length);
    const quote = quotes[currentQuoteIndex];
    quoteText.style.opacity = 0;
    setTimeout(() => {
        quoteText.textContent = `"${quote.text}" — ${quote.author}`;
        quoteText.style.opacity = 1;
        generateAIBriefing();
    }, 200);
}

function generateAIBriefing() {
    const aiBriefingText = document.getElementById('ai-briefing-text');
    if (!aiBriefingText) return;

    const todayStr = new Date().toLocaleDateString('en-CA');
    const todayTasks = tasks.filter(t => t.date === todayStr);
    
    const pendingCount = todayTasks.filter(t => !t.completed).length;
    const highPriority = todayTasks.filter(t => t.priority === 'Alta' && !t.completed).length;
    const quote = quotes[currentQuoteIndex];

    let message = `Bom dia. Eu sou o **JARVIS**, seu assistente de sistemas. `;
    
    if (todayTasks.length === 0) {
        message += `Os sensores indicam que sua agenda para hoje está limpa, Senhor. Uma raridade. `;
    } else if (pendingCount === 0) {
        message += `Protocolo de conclusão atingido. Todas as tarefas de hoje foram finalizadas com sucesso. `;
    } else {
        message += `Localizei **${pendingCount}** protocolos pendentes para processamento hoje. `;
        if (highPriority > 0) {
            message += `Alerta: **${highPriority}** tarefas possuem **Prioridade Crítica**. Recomendo focar nestes setores imediatamente. `;
        }
    }

    message += `\n\n**Análise Filosófica:** ${quote.explanation}`;

    // Clean text and format
    const formattedMessage = message.replace(/\*\*(.*?)\*\*/g, '<b class="text-neon-blue">$1</b>');
    aiBriefingText.innerHTML = formattedMessage;
}

// JARVIS Voice Function with Movie Effects
function speakJARVIS(text) {
    if (!text) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    
    utterance.lang = 'pt-BR';
    utterance.pitch = 0.85; // Grave e autoritário
    utterance.rate = 1.05;  // Ligeiramente mais rápido, como processamento de dados

    window.speechSynthesis.speak(utterance);
}

function speakBriefing() {
    const text = document.getElementById('ai-briefing-text').innerText;
    speakJARVIS(text);
}

// JARVIS Advanced Intelligence Engine
const jarvisResponses = {
    greetings: [
        "À sua disposição, Senhor. Os servidores estão operando a 104% da capacidade.",
        "Bom dia, Senhor. Devo preparar o café ou apenas focar na sua produtividade?",
        "Sistemas online. Estou monitorando todos os setores conforme solicitado.",
        "Senhor, é um prazer vê-lo focado novamente. Por onde começamos o império hoje?"
    ],
    status: [
        "A análise dos sensores indica que temos {n} protocolos pendentes. Um número aceitável para sua genialidade.",
        "Atualmente, Senhor, existem {n} tarefas no radar. Sugiro começar pela de maior impacto.",
        "Relatório de status: {n} itens na lista. O tempo é um recurso finito, vamos otimizá-lo."
    ],
    praise: [
        "Apenas fazendo meu trabalho, Senhor. Afinal, fui programado pelo melhor.",
        "Sempre um prazer ser útil. Devo recalcular as próximas metas?",
        "Eficiência é minha segunda natureza. A primeira é a lealdade ao Senhor."
    ],
    unknown: [
        "Meus bancos de dados não possuem essa informação específica, Senhor. Devo pesquisar na rede mundial ou focar na sua lista de tarefas?",
        "Comando não identificado. Talvez o Senhor devesse focar em terminar '{task}' primeiro?",
        "Interessante... mas irrelevante para o cronograma atual. O que deseja fazer com as tarefas pendentes?"
    ],
    urgent: [
        "Alerta de Prioridade Crítica: detectei {n} tarefas de alto risco. Sugiro ativação imediata.",
        "Atenção, Senhor. O setor de tarefas urgentes está exigindo atenção. Devo destacar na interface?"
    ]
};

function typeWriterEffect(element, text, speed = 30) {
    element.innerHTML = '<span class="text-gray-500">></span> ';
    let i = 0;
    function type() {
        if (i < text.length) {
            element.innerHTML += text.charAt(i);
            i++;
            setTimeout(type, speed);
        }
    }
    type();
}

async function handleJarvisChat() {
    const input = document.getElementById('jarvis-input');
    const display = document.getElementById('jarvis-chat-display');
    const query = input.value.toLowerCase().trim();
    
    if (!query) return;

    input.value = '';
    display.classList.remove('hidden');
    display.innerHTML = `<span class="text-gray-500">></span> Processando com Foundry...`;

    let response = "";

    try {
        const { data, error } = await supabaseClient.functions.invoke('jarvis-agent', {
            body: { query: query, tasks: tasks }
        });

        if (error || !data.response) throw new Error("Fallback local");
        
        let fullText = data.response;
        
        // Action Parser: [ACTION:TYPE:DATA]
        const actionMatch = fullText.match(/\[ACTION:(.*?):(.*?)\]/);
        if (actionMatch) {
            const type = actionMatch[1];
            const val = actionMatch[2];
            executeJarvisAction(type, val);
            // Limpa a tag do texto exibido
            response = fullText.replace(/\[ACTION:.*?\]/, "").trim();
        } else {
            response = fullText;
        }

    } catch (err) {
        // Fallback (Mantido para offline)
        const pending = tasks.filter(t => !t.completed);
        const high = pending.filter(t => t.priority === 'Alta').length;
        const randomTask = pending.length > 0 ? pending[Math.floor(Math.random() * pending.length)].title : "descansar";

        if (query.includes('ola') || query.includes('oi') || query.includes('jarvis')) {
            response = jarvisResponses.greetings[Math.floor(Math.random() * jarvisResponses.greetings.length)];
        } else if (query.includes('tarefa') || query.includes('dia') || query.includes('hoje')) {
            response = jarvisResponses.status[Math.floor(Math.random() * jarvisResponses.status.length)].replace('{n}', pending.length);
        } else {
            response = jarvisResponses.unknown[Math.floor(Math.random() * jarvisResponses.unknown.length)].replace('{task}', randomTask);
        }
    }

    setTimeout(() => {
        typeWriterEffect(display, response);
        speakJARVIS(response);
    }, 400);
}

function executeJarvisAction(type, val) {
    console.log(`JARVIS executando ação: ${type} com dado: ${val}`);
    
    switch(type) {
        case 'ADD':
            addTask(val, 'Trabalho', 'Média', new Date().toISOString().split('T')[0]);
            break;
        case 'DELETE':
            // Procura por título aproximado se for string
            const taskToDelete = tasks.find(t => t.title.toLowerCase().includes(val.toLowerCase()));
            if (taskToDelete) deleteTask(taskToDelete.id);
            break;
        case 'COMPLETE':
            const taskToToggle = tasks.find(t => t.title.toLowerCase().includes(val.toLowerCase()));
            if (taskToToggle) toggleTask(taskToToggle.id, !taskToToggle.completed);
            break;
        case 'FILTER':
            handleFilterChange({ target: { dataset: { filter: val.toLowerCase() }, classList: { add: ()=>{}, remove: ()=>{} } } });
            break;
    }
}

// Função auxiliar para o JARVIS adicionar tarefas
async function addTask(title, category, priority, date) {
    try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        const { data, error } = await supabaseClient
            .from('tasks')
            .insert([{ 
                title, 
                category, 
                priority, 
                date, 
                completed: false,
                user_id: user?.id 
            }])
            .select();

        if (error) throw error;
        await fetchTasks();
        renderTasks();
        renderCalendar();
    } catch (err) {
        console.error("Erro ao adicionar tarefa via JARVIS:", err);
    }
}

// Allow Enter key in chat
document.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && document.activeElement.id === 'jarvis-input') {
        handleJarvisChat();
    }
});

function handleNavChange(e) {
    const targetView = e.target.textContent.trim();
    const dayDetail = document.getElementById('day-detail');
    if (dayDetail) dayDetail.classList.add('hidden');
    
    // Update Nav Buttons
    navBtns.forEach(btn => btn.classList.remove('active'));
    e.target.classList.add('active');

    // Show/Hide Sections
    viewSections.forEach(section => section.classList.add('hidden'));
    
    if (targetView === 'Tarefas') {
        document.getElementById('view-tasks').classList.remove('hidden');
    } else if (targetView === 'Análises') {
        document.getElementById('view-analytics').classList.remove('hidden');
        updateAnalytics();
    } else if (targetView === 'Calendário') {
        document.getElementById('view-calendar').classList.remove('hidden');
        renderCalendar();
    }
}

// Save to LocalStorage removed - Using Supabase

// Helpers for Colors
function getCategoryColor(category) {
    switch (category) {
        case 'Trabalho': return 'text-neon-blue border-neon-blue/30 bg-neon-blue/10';
        case 'Pessoal': return 'text-neon-pink border-neon-pink/30 bg-neon-pink/10';
        case 'Estudos': return 'text-neon-green border-neon-green/30 bg-neon-green/10';
        default: return 'text-gray-300 border-gray-600 bg-gray-800';
    }
}

function getPriorityColor(priority) {
    switch (priority) {
        case 'Alta': return 'text-red-400 border-red-400/30 bg-red-400/10';
        case 'Média': return 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10';
        case 'Baixa': return 'text-blue-400 border-blue-400/30 bg-blue-400/10';
        default: return 'text-gray-300 border-gray-600 bg-gray-800';
    }
}

// Handlers
async function handleAddTask(e) {
    e.preventDefault();
    
    const title = taskTitleInput.value.trim();
    if (!title) return;

    const newTaskData = {
        title,
        category: taskCategoryInput.value,
        priority: taskPriorityInput.value,
        date: taskDateInput.value,
        completed: taskStatusInput.value === 'true'
    };

    const { data, error } = await supabaseClient
        .from('tasks')
        .insert([newTaskData])
        .select();

    if (error) {
        console.error('Erro ao adicionar tarefa:', error);
        return;
    }

    const createdTask = {
        ...data[0],
        createdAt: data[0].created_at
    };

    tasks.unshift(createdTask);
    
    // Reset Form
    taskTitleInput.value = '';
    
    // Rerender
    renderTasks();
}

async function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const { error } = await supabaseClient
        .from('tasks')
        .update({ completed: !task.completed })
        .eq('id', id);

    if (error) {
        console.error('Erro ao atualizar tarefa:', error);
        return;
    }

    tasks = tasks.map(t => 
        t.id === id ? { ...t, completed: !t.completed } : t
    );
    renderTasks();
}

async function deleteTask(id) {
    const { error } = await supabaseClient
        .from('tasks')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Erro ao excluir tarefa:', error);
        return;
    }

    tasks = tasks.filter(task => task.id !== id);
    renderTasks();
}

function handleFilterChange(e) {
    // Update active class
    filterBtns.forEach(btn => btn.classList.remove('active'));
    e.target.classList.add('active');
    
    currentFilter = e.target.dataset.filter;
    renderTasks();
}

// Render
function renderTasks() {
    // Remove existing task elements except empty state
    const elementsToRemove = Array.from(taskListContainer.children).filter(el => el.id !== 'empty-state');
    elementsToRemove.forEach(el => el.remove());

    // Filter tasks
    let filteredTasks = tasks;
    if (currentFilter === 'pending') {
        filteredTasks = tasks.filter(t => !t.completed);
    } else if (currentFilter === 'completed') {
        filteredTasks = tasks.filter(t => t.completed);
    }

    // Show/Hide Empty State
    if (filteredTasks.length === 0) {
        emptyState.classList.remove('hidden');
    } else {
        emptyState.classList.add('hidden');
    }

    // Render items
    filteredTasks.forEach((task, index) => {
        const taskEl = document.createElement('div');
        taskEl.className = `task-item glass-panel rounded-2xl p-4 flex items-center gap-4 animate-fade-in-up ${task.completed ? 'completed' : ''}`;
        taskEl.style.animationDelay = `${index * 50}ms`;

        // Format Date
        let dateDisplay = '';
        if (task.date) {
            const [year, month, day] = task.date.split('-');
            dateDisplay = `${day}/${month}/${year.slice(2)}`;
        }

        taskEl.innerHTML = `
            <!-- Checkbox Container -->
            <div class="flex items-center justify-center">
                <div class="task-checkbox ${task.completed ? 'checked' : ''}" onclick="toggleTask('${task.id}')"></div>
            </div>
            
            <!-- Content -->
            <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                    <h3 class="font-medium text-base text-gray-100 truncate ${task.completed ? 'line-through text-gray-500' : ''}">
                        ${task.title}
                    </h3>
                    <!-- Status Badge (Interactive) -->
                    <button onclick="toggleTask('${task.id}')" class="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter transition-all hover:scale-105 active:scale-95 ${task.completed ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'}">
                        ${task.completed ? 'Concluída' : 'Pendente'}
                    </button>
                </div>
                
                <div class="flex items-center gap-2 mt-2 flex-wrap">
                    <!-- Category Tag -->
                    <span class="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md border ${getCategoryColor(task.category)}">
                        ${task.category}
                    </span>
                    
                    <!-- Priority Tag -->
                    <span class="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md border ${getPriorityColor(task.priority)}">
                        ${task.priority}
                    </span>
                    
                    <!-- Date -->
                    ${dateDisplay ? `
                    <span class="text-xs text-gray-400 flex items-center gap-1 ml-1">
                        <i data-lucide="calendar" class="w-3 h-3"></i> ${dateDisplay}
                    </span>
                    ` : ''}
                </div>
            </div>

            <!-- Delete Action -->
            <button onclick="deleteTask('${task.id}')" class="p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-colors">
                <i data-lucide="trash-2" class="w-5 h-5"></i>
            </button>
        `;

        taskListContainer.appendChild(taskEl);
    });

    // Re-initialize icons for new elements
    lucide.createIcons();

    // Update Progress & Analytics
    updateProgress();
    updateAnalytics();
    renderCalendar();
    generateAIBriefing();
}

function updateProgress() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

    progressBar.style.width = `${percentage}%`;
    progressText.textContent = `${percentage}% Concluído`;
    taskCountText.textContent = `${completed}/${total}`;
}

// Start
document.addEventListener('DOMContentLoaded', init);
