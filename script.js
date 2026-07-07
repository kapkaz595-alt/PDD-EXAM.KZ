// ==========================================
// ⚙️ Кері байланыс және логикалық бақылау коды (Прогресті сақтаумен)
// ==========================================
let allQuestions = [];       // JSON-дан жүктелген барлық сұрақтар
let currentQuestions = [];   // Ағымдағы тест сұрақтарының жиынтығы
let currentMode = '';        // 'practice' (жаттығу), 'exam' (емтихан), 'wrong' (қателермен жұмыс)
let currentQuestionIndex = 0;
let score = 0;
let hasAnswered = false;
let wrongQuestionIds = [];   // Қате сұрақтардың ID жиынтығы (localStorage-да сақталады)

// 1. Бет толық жүктелгеннен кейін іске қосылатын функция
document.addEventListener("DOMContentLoaded", () => {
    // 🌓 Түнгі режимнің баптауларын тексеру
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    const themeBtn = document.getElementById('theme-btn');
    if (themeBtn) {
        themeBtn.innerText = savedTheme === 'dark' ? '☀️ Күндізгі режим' : '🌙 Түнгі режим';
    }

    // ❌ Сақталған қате сұрақтарды жүктеу
    const savedWrongs = localStorage.getItem('pdd_wrong_questions');
    if (savedWrongs) {
        wrongQuestionIds = JSON.parse(savedWrongs);
    }

    // 📥 JSON-нан сұрақтарды жүктеу
    fetch('questions.json')
        .then(response => {
            if (!response.ok) throw new Error('Сұрақтар файлын жүктеу мүмкін болмады');
            return response.json();
        })
        .then(data => {
            allQuestions = data; 
            updateStatsDisplay(); // Негізгі беттің статистикасын жаңарту
            
            // 🔄 Сақталған прогресті автоматты түрде тексеру және жүктеу
            checkAndRestoreProgress();
        })
        .catch(error => {
            console.error('Сұрақтарды жүктеу қатесі:', error);
            const statsText = document.getElementById('practice-stats');
            if (statsText) statsText.innerText = 'Сұрақтарды жүктеу қатесі';
        });
});

// 2. 🌓 Түнгі және күндізгі режимді ауыстыру функциясы
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    document.getElementById('theme-btn').innerText = newTheme === 'dark' ? '☀️ Күндізгі режим' : '🌙 Түнгі режим';
}

// 3. 📊 Статистиканы жаңарту
function updateStatsDisplay() {
    const statsText = document.getElementById('practice-stats');
    if (statsText) {
        statsText.innerText = `Базада барлығы ${allQuestions.length} сұрақ бар.`;
    }

    const wrongCountSpan = document.getElementById('wrong-count');
    const wrongBtn = document.getElementById('wrong-questions-btn');
    if (wrongCountSpan && wrongBtn) {
        wrongCountSpan.innerText = wrongQuestionIds.length;
        wrongBtn.disabled = wrongQuestionIds.length === 0;
    }
}

// 4. 🔄 Режимдерді іске қосу
function startPractice() {
    if (allQuestions.length === 0) return;
    currentMode = 'practice';
    currentQuestions = [...allQuestions];
    saveCurrentStateToLocal(); // Режимді сақтау
    initQuiz();
}

function startExam() {
    if (allQuestions.length === 0) return;
    currentMode = 'exam';
    let shuffled = [...allQuestions].sort(() => 0.5 - Math.random());
    currentQuestions = shuffled.slice(0, Math.min(40, allQuestions.length));
    
    // Емтихан сұрақтарының реті бұзылмас үшін оны да сақтаймыз
    localStorage.setItem('pdd_exam_questions', JSON.stringify(currentQuestions));
    
    document.getElementById('timer').classList.remove('hidden');
    saveCurrentStateToLocal();
    initQuiz();
}

function startWrongPractice() {
    if (wrongQuestionIds.length === 0) return;
    currentMode = 'wrong';
    currentQuestions = wrongQuestionIds.map(idx => allQuestions[idx]).filter(q => q !== undefined);
    
    if (currentQuestions.length === 0) {
        clearSavedProgress();
        updateStatsDisplay();
        return;
    }
    saveCurrentStateToLocal();
    initQuiz();
}

function initQuiz() {
    document.getElementById('mode-selection').classList.add('hidden');
    document.getElementById('quiz-area').classList.remove('hidden');
    
    // Reset-link (Прогресті нөлдеу) батырмасын көрсету
    document.getElementById('reset-btn').classList.remove('hidden');
    showQuestion();
}

// 📥 Сақталған прогресті тексеру және қалпына келтіру функциясы
function checkAndRestoreProgress() {
    const savedMode = localStorage.getItem('pdd_current_mode');
    if (!savedMode) return; // Егер сақталған прогресс жоқ болса, тоқтаймыз

    currentMode = savedMode;
    currentQuestionIndex = parseInt(localStorage.getItem('pdd_current_index') || '0', 10);
    score = parseInt(localStorage.getItem('pdd_current_score') || '0', 10);

    if (currentMode === 'practice') {
        currentQuestions = [...allQuestions];
    } else if (currentMode === 'exam') {
        const savedExamArr = localStorage.getItem('pdd_exam_questions');
        if (savedExamArr) currentQuestions = JSON.parse(savedExamArr);
        document.getElementById('timer').classList.remove('hidden');
    } else if (currentMode === 'wrong') {
        currentQuestions = wrongQuestionIds.map(idx => allQuestions[idx]).filter(q => q !== undefined);
    }

    // Егер сақталған индекс сұрақтар санынан асып кетсе (тест аяқталған болса) тазалаймыз
    if (currentQuestionIndex >= currentQuestions.length) {
        clearSavedProgress();
        return;
    }

    // Автоматты түрде тестілеу аймағына өту
    initQuiz();
}

// 💾 Прогресті браузерге жазып отыру функциясы
function saveCurrentStateToLocal() {
    localStorage.setItem('pdd_current_mode', currentMode);
    localStorage.setItem('pdd_current_index', currentQuestionIndex);
    localStorage.setItem('pdd_current_score', score);
}

// 🧼 Сақталған прогресті өшіру функциясы
function clearSavedProgress() {
    localStorage.removeItem('pdd_current_mode');
    localStorage.removeItem('pdd_current_index');
    localStorage.removeItem('pdd_current_score');
    localStorage.removeItem('pdd_exam_questions');
    currentQuestionIndex = 0;
    score = 0;
    currentMode = '';
}

// 5. 📝 Сұрақты көрсету және Прогресс-бар есептеу
function showQuestion() {
    hasAnswered = false;
    const q = currentQuestions[currentQuestionIndex];
    
    document.getElementById('question-text').innerText = q.question;
    
    const mediaBlock = document.getElementById('media-block');
    if (q.image) {
        if (q.image.endsWith('.mp4')) {
            mediaBlock.innerHTML = `<video src="${q.image}" controls autoplay muted loop></video>`;
        } else {
            mediaBlock.innerHTML = `<img src="${q.image}" alt="ЖҚЕ сұрақ суреті">`;
        }
        mediaBlock.style.display = 'block';
    } else {
        mediaBlock.innerHTML = '';
        mediaBlock.style.display = 'none';
    }
    
    document.getElementById('explanation-block').style.display = 'none';
    document.getElementById('feedback').innerText = '';
    document.getElementById('next-btn').classList.add('hidden');
    
    const currentNum = currentQuestionIndex + 1;
    const totalNum = currentQuestions.length;
    const remainingNum = totalNum - currentNum;

    const progressPercent = (currentNum / totalNum) * 100;
    document.getElementById('p-bar').style.width = `${progressPercent}%`;
    
    document.getElementById('progress').innerHTML = `Сұрақ: ${currentNum} / ${totalNum} <span style="font-size: 0.9em; color: #718096; margin-left: 8px;">(Қалды: ${remainingNum})</span>`;
    
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

// 6. 👆 Жауапты таңдау
function selectOption(selectedIndex, clickedBtn) {
    if (hasAnswered) return;
    hasAnswered = true;
    
    const q = currentQuestions[currentQuestionIndex];
    const allButtons = document.querySelectorAll('.option-btn');
    const originalIndex = allQuestions.findIndex(item => item.question === q.question);

    if (selectedIndex === q.answer) {
        clickedBtn.classList.add('correct');
        document.getElementById('feedback').innerHTML = '<span style="color:#10b981;">✅ Дұрыс!</span>';
        score++;
        localStorage.setItem('pdd_current_score', score); // Скорды жаңарту

        if (currentMode === 'wrong' && originalIndex !== -1) {
            wrongQuestionIds = wrongQuestionIds.filter(id => id !== originalIndex);
            localStorage.setItem('pdd_wrong_questions', JSON.stringify(wrongQuestionIds));
        }
    } else {
        clickedBtn.classList.add('incorrect');
        allButtons[q.answer].classList.add('correct');
        document.getElementById('feedback').innerHTML = '<span style="color:#ef4444;">❌ Қате!</span>';
        
        if (originalIndex !== -1 && !wrongQuestionIds.includes(originalIndex)) {
            wrongQuestionIds.push(originalIndex);
            localStorage.setItem('pdd_wrong_questions', JSON.stringify(wrongQuestionIds));
        }
    }
    
    if (q.explanation) {
        document.getElementById('explanation-content').innerText = q.explanation;
        document.getElementById('explanation-block').style.display = 'block';
    }
    
    document.getElementById('next-btn').classList.remove('hidden');
}

// 7. ➡️ Келесі сұраққа өту
function nextQuestion() {
    currentQuestionIndex++;
    saveCurrentStateToLocal(); // Индексті алдын ала браузерге сақтаймыз

    if (currentQuestionIndex < currentQuestions.length) {
        showQuestion();
    } else {
        // Тест толық аяқталса прогресті тазалаймыз
        clearSavedProgress();

        document.getElementById('options-container').innerHTML = '';
        document.getElementById('media-block').style.display = 'none';
        document.getElementById('explanation-block').style.display = 'none';
        document.getElementById('next-btn').classList.add('hidden');
        document.getElementById('reset-btn').classList.add('hidden'); // Жасыру
        
        let completionText = `Сынақ аяқталды! 🎉\nСіздің нәтижеңіз: ${currentQuestions.length} сұрақтан ${score} дұрыс жауап.`;
        if (currentMode === 'wrong') {
            completionText = `Қателермен жұмыс аяқталды! 👍\nҚалған қателер саны: ${wrongQuestionIds.length}`;
        }
        
        document.getElementById('question-text').innerText = completionText;
        document.getElementById('feedback').innerText = '';
    }
}

// 8. ⬅ Басты бетке қайту (Прогресс жойылмайды, тек артқа шығады)
function backToHome() {
    document.getElementById('quiz-area').classList.add('hidden');
    document.getElementById('timer').classList.add('hidden');
    document.getElementById('mode-selection').classList.remove('hidden');
    updateStatsDisplay();
}

// 9. 🔄 Прогресті нөлдеу (Пайдаланушы өзі басса ғана бәрі өшеді)
function resetProgress() {
    if (confirm("Прогресті нөлдегіңіз келе ме? (Ағымдағы жауаптар мен жиналған барлық қателер өшіріледі)")) {
        wrongQuestionIds = [];
        localStorage.removeItem('pdd_wrong_questions');
        clearSavedProgress();
        backToHome();
    }
}
