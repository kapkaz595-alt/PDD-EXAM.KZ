// ==========================================
// ⚙️ Логикалық бақылау және прогресті сақтау коды (v3 - тәуелсіз режимдер)
// ==========================================
let allQuestions = [];
let currentQuestions = [];
let currentIndices = [];      // currentQuestions ішіндегі әр сұрақтың allQuestions ішіндегі нақты индексі
let currentMode = '';
let currentQuestionIndex = 0;
let score = 0;
let hasAnswered = false;
let wrongQuestionIds = [];
let examTimerInterval = null;
let examRemainingSeconds = 40 * 60;

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

// ---------- Режимдерді бастау ----------

function startPractice() {
    if (allQuestions.length === 0) return;
    currentMode = 'practice';
    currentQuestions = [...allQuestions];
    currentIndices = allQuestions.map((_, i) => i);
    currentQuestionIndex = parseInt(localStorage.getItem('pdd_practice_index') || '0', 10);
    if (currentQuestionIndex >= currentQuestions.length) currentQuestionIndex = 0;
    score = 0;
    localStorage.setItem('pdd_active_mode', 'practice');
    initQuiz();
}

function startExam() {
    if (allQuestions.length === 0) return;
    currentMode = 'exam';

    let indices = allQuestions.map((_, i) => i);
    indices.sort(() => 0.5 - Math.random());
    currentIndices = indices.slice(0, Math.min(40, allQuestions.length));
    currentQuestions = currentIndices.map(i => allQuestions[i]);

    currentQuestionIndex = 0;
    score = 0;

    document.getElementById('timer').classList.remove('hidden');
    localStorage.setItem('pdd_active_mode', 'exam');
    saveExamState();
    startExamTimer();
    initQuiz();
}

function startWrongPractice() {
    if (wrongQuestionIds.length === 0) return;
    currentMode = 'wrong';
    currentIndices = [...wrongQuestionIds];
    currentQuestions = currentIndices.map(idx => allQuestions[idx]).filter(q => q !== undefined);
    currentQuestionIndex = 0;
    score = 0;
    localStorage.setItem('pdd_active_mode', 'wrong');
    initQuiz();
}

function initQuiz() {
    document.getElementById('mode-selection').classList.add('hidden');
    document.getElementById('quiz-area').classList.remove('hidden');
    document.getElementById('reset-btn').classList.remove('hidden');
    showQuestion();
}

// ---------- Емтихан таймері ----------

function startExamTimer() {
    updateTimerDisplay();
    if (examTimerInterval) clearInterval(examTimerInterval);
    examTimerInterval = setInterval(() => {
        examRemainingSeconds--;
        updateTimerDisplay();
        saveExamState();
        if (examRemainingSeconds <= 0) {
            finishQuiz(true);
        }
    }, 1000);
}

function stopExamTimer() {
    if (examTimerInterval) {
        clearInterval(examTimerInterval);
        examTimerInterval = null;
    }
}

function updateTimerDisplay() {
    const minutes = Math.floor(examRemainingSeconds / 60);
    const seconds = examRemainingSeconds % 60;
    const timerEl = document.getElementById('timer');
    if (timerEl) {
        timerEl.innerText = `Қалған уақыт: ${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
}

// ---------- Экзамен күйін сақтау/тазалау (толығымен тәуелсіз) ----------

function saveExamState() {
    localStorage.setItem('pdd_exam_indices', JSON.stringify(currentIndices));
    localStorage.setItem('pdd_exam_current_index', currentQuestionIndex);
    localStorage.setItem('pdd_exam_score', score);
    localStorage.setItem('pdd_exam_remaining', examRemainingSeconds);
}

function clearExamState() {
    localStorage.removeItem('pdd_exam_indices');
    localStorage.removeItem('pdd_exam_current_index');
    localStorage.removeItem('pdd_exam_score');
    localStorage.removeItem('pdd_exam_remaining');
    localStorage.removeItem('pdd_active_mode');
    stopExamTimer();
}

// ---------- Прогресті қалпына келтіру (тек "белсенді" режим) ----------

function checkAndRestoreProgress() {
    const activeMode = localStorage.getItem('pdd_active_mode');

    if (activeMode === 'practice') {
        currentMode = 'practice';
        currentQuestions = [...allQuestions];
        currentIndices = allQuestions.map((_, i) => i);
        currentQuestionIndex = parseInt(localStorage.getItem('pdd_practice_index') || '0', 10);
        score = 0;
        if (currentQuestionIndex > 0 && currentQuestionIndex < currentQuestions.length) {
            initQuiz();
        } else {
            localStorage.removeItem('pdd_active_mode');
        }
        return;
    }

    if (activeMode === 'exam') {
        const savedIndices = localStorage.getItem('pdd_exam_indices');
        if (savedIndices) {
            currentMode = 'exam';
            currentIndices = JSON.parse(savedIndices);
            currentQuestions = currentIndices.map(i => allQuestions[i]).filter(q => q !== undefined);
            currentQuestionIndex = parseInt(localStorage.getItem('pdd_exam_current_index') || '0', 10);
            score = parseInt(localStorage.getItem('pdd_exam_score') || '0', 10);
            examRemainingSeconds = parseInt(localStorage.getItem('pdd_exam_remaining') || String(40 * 60), 10);

            if (currentQuestions.length > 0 && currentQuestionIndex < currentQuestions.length && examRemainingSeconds > 0) {
                document.getElementById('timer').classList.remove('hidden');
                startExamTimer();
                initQuiz();
            } else {
                clearExamState();
            }
        } else {
            localStorage.removeItem('pdd_active_mode');
        }
        return;
    }

    // 'wrong' режимі немесе басқа ескірген белгі қалса — тазалаймыз
    if (activeMode) localStorage.removeItem('pdd_active_mode');
}

// ---------- Сұрақ көрсету ----------

function showQuestion() {
    hasAnswered = false;
    const q = currentQuestions[currentQuestionIndex];
    document.getElementById('question-text').innerText = q.question;

    const mediaBlock = document.getElementById('media-block');
    mediaBlock.innerHTML = q.image
        ? (q.image.endsWith('.mp4')
            ? `<video src="${q.image}" controls autoplay muted loop></video>`
            : `<img src="${q.image}">`)
        : '';
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
    const originalIndex = currentIndices[currentQuestionIndex];
    const isCorrect = selectedIndex === q.answer;

    if (isCorrect) {
        clickedBtn.classList.add('correct');
        score++;
        const pos = wrongQuestionIds.indexOf(originalIndex);
        if (pos !== -1) {
            wrongQuestionIds.splice(pos, 1);
            localStorage.setItem('pdd_wrong_questions', JSON.stringify(wrongQuestionIds));
        }
    } else {
        clickedBtn.classList.add('incorrect');
        document.querySelectorAll('.option-btn')[q.answer].classList.add('correct');
        if (!wrongQuestionIds.includes(originalIndex)) {
            wrongQuestionIds.push(originalIndex);
            localStorage.setItem('pdd_wrong_questions', JSON.stringify(wrongQuestionIds));
        }
    }

    if (q.explanation) {
        document.getElementById('explanation-content').innerText = q.explanation;
        document.getElementById('explanation-block').style.display = 'block';
    }

    document.getElementById('next-btn').classList.remove('hidden');
    updateStatsDisplay();

    if (currentMode === 'exam') saveExamState();
}

function nextQuestion() {
    currentQuestionIndex++;
    if (currentQuestionIndex < currentQuestions.length) {
        if (currentMode === 'practice') {
            localStorage.setItem('pdd_practice_index', currentQuestionIndex);
        }
        if (currentMode === 'exam') {
            saveExamState();
        }
        showQuestion();
    } else {
        finishQuiz(false);
    }
}

// ---------- Аяқтау және нәтиже ----------

function finishQuiz(timeUp) {
    stopExamTimer();
    const total = currentQuestions.length;
    const percent = total > 0 ? Math.round((score / total) * 100) : 0;

    if (currentMode === 'exam') {
        clearExamState(); // әр емтихан аяқталса, келесі жолы міндетті түрде жаңа 40 сұрақ
    } else if (currentMode === 'practice') {
        localStorage.setItem('pdd_practice_index', '0'); // база соңына жетті, келесі жолы басынан
        localStorage.removeItem('pdd_active_mode');
    } else {
        localStorage.removeItem('pdd_active_mode');
    }

    const message = timeUp
        ? `⏱ Уақыт бітті!\n\nНәтижеңіз: ${score} / ${total} (${percent}%)`
        : `✅ Сынақ аяқталды!\n\nНәтижеңіз: ${score} / ${total} (${percent}%)`;

    alert(message);
    backToHome();
}

function backToHome() {
    // "Шығу" арқылы аяқталмай шыққанда
    if (currentMode === 'exam') {
        clearExamState(); // емтихан жартылай тоқтатылса да, келесі жолы жаңа 40 сұрақ
    } else if (currentMode === 'practice' || currentMode === 'wrong') {
        localStorage.removeItem('pdd_active_mode'); // practice индексі сақтаулы қалады
    }

    stopExamTimer();
    document.getElementById('quiz-area').classList.add('hidden');
    document.getElementById('timer').classList.add('hidden');
    document.getElementById('mode-selection').classList.remove('hidden');
    currentMode = '';
    updateStatsDisplay();
}

function resetProgress() {
    if (confirm("Прогресті толығымен өшіргіңіз келе ме? (Тақырып сақталады)")) {
        stopExamTimer();
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('pdd_')) localStorage.removeItem(key);
        });
        location.reload();
    }
}
