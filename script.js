// ==========================================
// ⚙️ Логикалық бақылау және прогресті сақтау коды (Жаңартылған)
// ==========================================
let allQuestions = [];       
let currentQuestions = [];   
let currentMode = '';        
let currentQuestionIndex = 0;
let score = 0;
let hasAnswered = false;
let wrongQuestionIds = [];   

document.addEventListener("DOMContentLoaded", () => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    const themeBtn = document.getElementById('theme-btn');
    if (themeBtn) {
        themeBtn.innerText = savedTheme === 'dark' ? '☀️ Күндізгі режим' : '🌙 Түнгі режим';
    }

    const savedWrongs = localStorage.getItem('pdd_wrong_questions');
    if (savedWrongs) wrongQuestionIds = JSON.parse(savedWrongs);

    fetch('questions.json')
        .then(response => response.json())
        .then(data => {
            allQuestions = data; 
            updateStatsDisplay();
            checkAndRestoreProgress();
        })
        .catch(error => console.error('Қателік орын алды:', error));
});

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    document.getElementById('theme-btn').innerText = newTheme === 'dark' ? '☀️ Күндізгі режим' : '🌙 Түнгі режим';
}

function updateStatsDisplay() {
    const statsText = document.getElementById('practice-stats');
    if (statsText) statsText.innerText = `Базада барлығы ${allQuestions.length} сұрақ бар.`;
    const wrongCountSpan = document.getElementById('wrong-count');
    const wrongBtn = document.getElementById('wrong-questions-btn');
    if (wrongCountSpan && wrongBtn) {
        wrongCountSpan.innerText = wrongQuestionIds.length;
        wrongBtn.disabled = wrongQuestionIds.length === 0;
    }
}

function startPractice() {
    if (allQuestions.length === 0) return;
    currentMode = 'practice';
    currentQuestions = [...allQuestions];
    currentQuestionIndex = parseInt(localStorage.getItem('pdd_practice_index') || '0', 10);
    initQuiz();
}

function startExam() {
    if (allQuestions.length === 0) return;
    currentMode = 'exam';
    // Емтиханды әрқашан нөлден бастаймыз
    let shuffled = [...allQuestions].sort(() => 0.5 - Math.random());
    currentQuestions = shuffled.slice(0, Math.min(40, allQuestions.length));
    currentQuestionIndex = 0;
    score = 0;
    
    document.getElementById('timer').classList.remove('hidden');
    initQuiz();
}

function startWrongPractice() {
    if (wrongQuestionIds.length === 0) return;
    currentMode = 'wrong';
    currentQuestions = wrongQuestionIds.map(idx => allQuestions[idx]).filter(q => q !== undefined);
    currentQuestionIndex = 0;
    initQuiz();
}

function initQuiz() {
    document.getElementById('mode-selection').classList.add('hidden');
    document.getElementById('quiz-area').classList.remove('hidden');
    document.getElementById('reset-btn').classList.remove('hidden');
    showQuestion();
}

// Режимге байланысты прогресті бөлек сақтау
function saveCurrentStateToLocal() {
    localStorage.setItem('pdd_current_mode', currentMode);
    localStorage.setItem('pdd_current_score', score);
    
    if (currentMode === 'practice') {
        localStorage.setItem('pdd_practice_index', currentQuestionIndex);
    }
}

function checkAndRestoreProgress() {
    const savedMode = localStorage.getItem('pdd_current_mode');
    if (savedMode === 'practice') {
        currentMode = 'practice';
        currentQuestions = [...allQuestions];
        currentQuestionIndex = parseInt(localStorage.getItem('pdd_practice_index') || '0', 10);
        score = parseInt(localStorage.getItem('pdd_current_score') || '0', 10);
        if (currentQuestionIndex > 0) initQuiz();
    }
}

function clearSavedProgress() {
    localStorage.removeItem('pdd_current_mode');
    localStorage.removeItem('pdd_practice_index');
    localStorage.removeItem('pdd_current_score');
    currentQuestionIndex = 0;
    score = 0;
    currentMode = '';
}

function showQuestion() {
    hasAnswered = false;
    const q = currentQuestions[currentQuestionIndex];
    document.getElementById('question-text').innerText = q.question;
    const mediaBlock = document.getElementById('media-block');
    mediaBlock.innerHTML = q.image ? (q.image.endsWith('.mp4') ? `<video src="${q.image}" controls autoplay muted loop></video>` : `<img src="${q.image}">`) : '';
    mediaBlock.style.display = q.image ? 'block' : 'none';
    document.getElementById('explanation-block').style.display = 'none';
    document.getElementById('next-btn').classList.add('hidden');
    
    const currentNum = currentQuestionIndex + 1;
    document.getElementById('p-bar').style.width = `${(currentNum / currentQuestions.length) * 100}%`;
    document.getElementById('progress').innerHTML = `Сұрақ: ${currentNum} / ${currentQuestions.length}`;
    
    const optionsContainer = document.getElementById('options-container');
    optionsContainer.innerHTML = '';
    q.options.forEach((option, index) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerText = option;
        btn.onclick = () => selectOption(index, btn);
        optionsContainer.appendChild(btn);
    });
}

function selectOption(selectedIndex, clickedBtn) {
    if (hasAnswered) return;
    hasAnswered = true;
    const q = currentQuestions[currentQuestionIndex];
    if (selectedIndex === q.answer) {
        clickedBtn.classList.add('correct');
        score++;
    } else {
        clickedBtn.classList.add('incorrect');
        document.querySelectorAll('.option-btn')[q.answer].classList.add('correct');
    }
    if (q.explanation) {
        document.getElementById('explanation-content').innerText = q.explanation;
        document.getElementById('explanation-block').style.display = 'block';
    }
    document.getElementById('next-btn').classList.remove('hidden');
    saveCurrentStateToLocal();
}

function nextQuestion() {
    currentQuestionIndex++;
    if (currentQuestionIndex < currentQuestions.length) {
        showQuestion();
        saveCurrentStateToLocal();
    } else {
        clearSavedProgress();
        alert(`Сынақ аяқталды! Нәтижеңіз: ${score}`);
        backToHome();
    }
}

function backToHome() {
    document.getElementById('quiz-area').classList.add('hidden');
    document.getElementById('timer').classList.add('hidden');
    document.getElementById('mode-selection').classList.remove('hidden');
    updateStatsDisplay();
}

function resetProgress() {
    if (confirm("Прогресті толығымен өшіргіңіз келе ме?")) {
        localStorage.clear();
        location.reload();
    }
}
