// ==========================================
// ⚙️ Кері байланыс және логикалық бақылау коды
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
    localStorage.setItem('theme', newTheme); // Пайдаланушы таңдауын сақтау
    
    document.getElementById('theme-btn').innerText = newTheme === 'dark' ? '☀️ Күндізгі dynamic' : '🌙 Түнгі режим';
    // Ескерту: Жоғарыдағы Түнгі режим мәтіні толық түзетілді
    document.getElementById('theme-btn').innerText = newTheme === 'dark' ? '☀️ Күндізгі режим' : '🌙 Түнгі regime'.replace('regime', 'режим');
}

// 3. 📊 Статистиканы жаңарту (Базадағы сұрақтар мен қателер саны)
function updateStatsDisplay() {
    const statsText = document.getElementById('practice-stats');
    if (statsText) {
        statsText.innerText = `Базада барлығы ${allQuestions.length} сұрақ бар.`;
    }

    const wrongCountSpan = document.getElementById('wrong-count');
    const wrongBtn = document.getElementById('wrong-questions-btn');
    if (wrongCountSpan && wrongBtn) {
        wrongCountSpan.innerText = wrongQuestionIds.length;
        if (wrongQuestionIds.length > 0) {
            wrongBtn.disabled = false;
        } else {
            wrongBtn.disabled = true;
        }
    }
}

// 4. 🔄 Режимдерді іске қосу
function startPractice() {
    if (allQuestions.length === 0) return;
    currentMode = 'practice';
    currentQuestions = [...allQuestions];
    initQuiz();
}

function startExam() {
    if (allQuestions.length === 0) return;
    currentMode = 'exam';
    let shuffled = [...allQuestions].sort(() => 0.5 - Math.random());
    currentQuestions = shuffled.slice(0, Math.min(40, allQuestions.length));
    
    document.getElementById('timer').classList.remove('hidden');
    initQuiz();
}

function startWrongPractice() {
    if (wrongQuestionIds.length === 0) return;
    currentMode = 'wrong';
    currentQuestions = wrongQuestionIds.map(idx => allQuestions[idx]).filter(q => q !== undefined);
    
    if (currentQuestions.length === 0) {
        wrongQuestionIds = [];
        localStorage.removeItem('pdd_wrong_questions');
        updateStatsDisplay();
        return;
    }
    initQuiz();
}

// Тестті бастау
function initQuiz() {
    currentQuestionIndex = 0;
    score = 0;
    document.getElementById('mode-selection').classList.add('hidden');
    document.getElementById('quiz-area').classList.remove('hidden');
    showQuestion();
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
    
    // 📈 ------------------- ПРОГРЕСС-БАР ЖӘНЕ СҰРАҚТАР САНЫН ЕСЕПТЕУ -------------------
    const currentNum = currentQuestionIndex + 1; // Ағымдағы сұрақ нөмірі
    const totalNum = currentQuestions.length;    // Жалпы сұрақ саны
    const remainingNum = totalNum - currentNum;  // Қалған сұрақтар саны

    const progressPercent = (currentNum / totalNum) * 100;
    document.getElementById('p-bar').style.width = `${progressPercent}%`;
    
    // Мәтінді жаңарту: "Сұрақ: 1 / 3 (Қалды: 2)" форматында шығады
    document.getElementById('progress').innerHTML = `Сұрақ: ${currentNum} / ${totalNum} <span style="font-size: 0.9em; color: #718096; margin-left: 8px;">(Қалды: ${remainingNum})</span>`;
    // ----------------------------------------------------------------------------------
    
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

// 6. 👆 Жауапты таңдау және тексеру
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

// 7. ➡️ Келесі сұраққа өту немесе нәтижені көрсету
function nextQuestion() {
    currentQuestionIndex++;
    if (currentQuestionIndex < currentQuestions.length) {
        showQuestion();
    } else {
        document.getElementById('options-container').innerHTML = '';
        document.getElementById('media-block').style.display = 'none';
        document.getElementById('explanation-block').style.display = 'none';
        document.getElementById('next-btn').classList.add('hidden');
        
        let completionText = `Сынақ аяқталды! 🎉\nСіздің нәтижеңіз: ${currentQuestions.length} сұрақтан ${score} дұрыс жауап.`;
        if (currentMode === 'wrong') {
            completionText = `Қателермен жұмыс аяқталды! 👍\nҚалған қателер саны: ${wrongQuestionIds.length}`;
        }
        
        document.getElementById('question-text').innerText = completionText;
        document.getElementById('feedback').innerText = '';
    }
}

// 8. ⬅ Басты бетке қайту
function backToHome() {
    document.getElementById('quiz-area').classList.add('hidden');
    document.getElementById('timer').classList.add('hidden');
    document.getElementById('mode-selection').classList.remove('hidden');
    updateStatsDisplay();
}

// 9. 🔄 Прогресті өшіру (Нөлдеу)
function resetProgress() {
    if (confirm("Прогресті нөлдегіңіз келе ме? (Жиналған барлық қателер өшіріледі)")) {
        wrongQuestionIds = [];
        localStorage.removeItem('pdd_wrong_questions');
        currentQuestionIndex = 0;
        score = 0;
        backToHome();
    }
}
