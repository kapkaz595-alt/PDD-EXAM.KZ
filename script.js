let allQuestions = [];
let currentQuestionsList = [];
let currentIndex = 0;
let isExamMode = false;
let examTimer = null;
let timeLeft = 40 * 60; 
let score = 0;
let hasAnswered = false;

window.onload = async () => {
    try {
        const response = await fetch('questions.json');
        allQuestions = await response.json();
        updateMenuStats();
    } catch (e) {
        alert("Сұрақтарды жүктеу қатесі! questions.json файлын тексеріңіз.");
    }
};

// 更新主页面的刷题进度统计
function updateMenuStats() {
    if (allQuestions.length === 0) return;
    
    // 从缓存读取上次刷到了第几题
    let savedIndex = parseInt(localStorage.getItem('pdd_practice_index')) || 0;
    
    // 如果刷完了，重置为0或者显示已完成
    if (savedIndex >= allQuestions.length) {
        document.getElementById('practice-stats').innerText = `Құттықтаймыз! Барлық ${allQuestions.length} сұрақты толық аяқтадыңыз!`;
        document.getElementById('reset-btn').classList.remove('hidden');
        return;
    }
    
    let leftQuestions = allQuestions.length - savedIndex;
    document.getElementById('practice-stats').innerText = `Өтілгені: ${savedIndex} | Қалғаны: ${leftQuestions} | Барлығы: ${allQuestions.length} сұрақ`;
    
    if (savedIndex > 0) {
        document.getElementById('reset-btn').classList.remove('hidden');
    } else {
        document.getElementById('reset-btn').classList.add('hidden');
    }
}

// 重置进度功能
function resetProgress() {
    if (confirm("Сіз шынымен де барлық жаттығу прогресін нөлдегіңіз келе ме?")) {
        localStorage.removeItem('pdd_practice_index');
        updateMenuStats();
    }
}

function startPractice() {
    if(allQuestions.length === 0) return;
    isExamMode = false;
    clearInterval(examTimer);
    document.getElementById('timer').classList.add('hidden');
    document.getElementById('mode-selection').classList.add('hidden');
    document.getElementById('quiz-area').classList.remove('hidden');
    
    // 刷题模式不随机打乱，严格按照顺序，这样才能完美实现“第几题”的记忆
    currentQuestionsList = [...allQuestions];
    
    // 读取记忆位置
    currentIndex = parseInt(localStorage.getItem('pdd_practice_index')) || 0;
    score = 0;
    showQuestion();
}

function startExam() {
    if(allQuestions.length === 0) return;
    isExamMode = true;
    score = 0;
    // 考试模式保持随机抽取40题
    currentQuestionsList = [...allQuestions].sort(() => Math.random() - 0.5).slice(0, 40);
    currentIndex = 0;
    
    timeLeft = 40 * 60;
    document.getElementById('timer').classList.remove('hidden');
    document.getElementById('mode-selection').classList.add('hidden');
    document.getElementById('quiz-area').classList.remove('hidden');
    
    // 考试模式下进度条直接隐藏或者设为0
    document.getElementById('p-bar').style.width = '0%';
    
    startTimer();
    showQuestion();
}

function showQuestion() {
    if (currentIndex >= currentQuestionsList.length) {
        endQuiz();
        return;
    }

    hasAnswered = false;
    document.getElementById('feedback').innerText = "";
    
    const currentQuestion = currentQuestionsList[currentIndex];
    
    if (isExamMode) {
        document.getElementById('progress').innerText = `Сұрақ: ${currentIndex + 1} / 40`;
    } else {
        // 刷题模式：显示当前是题库中的第几题
        document.getElementById('progress').innerText = `Сұрақ: ${currentIndex + 1} / ${allQuestions.length}`;
        // 更新进度条
        let pct = ((currentIndex) / allQuestions.length) * 100;
        document.getElementById('p-bar').style.width = `${pct}%`;
    }

    document.getElementById('question-text').innerText = currentQuestion.question;
    
    const optionsContainer = document.getElementById('options-container');
    optionsContainer.innerHTML = "";
    
    currentQuestion.options.forEach((option, index) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerText = option;
        btn.onclick = () => checkAnswer(index, btn);
        optionsContainer.appendChild(btn);
    });
}

function checkAnswer(selectedIndex, clickedBtn) {
    if (hasAnswered) return; 
    hasAnswered = true;

    const currentQuestion = currentQuestionsList[currentIndex];
    const correctIndex = currentQuestion.answer;
    const buttons = document.querySelectorAll('.option-btn');

    buttons[correctIndex].classList.add('correct');

    if (selectedIndex === correctIndex) {
        document.getElementById('feedback').innerHTML = "<span style='color:#10b981;'>🟢 Дұрыс!</span>";
        score++;
    } else {
        clickedBtn.classList.add('incorrect');
        document.getElementById('feedback').innerHTML = "<span style='color:#ef4444;'>🔴 Бұрыс!</span>";
    }
    
    // 如果是刷题模式，每答完一题，立刻把当前的进度默默存进手机本地缓存
    if (!isExamMode) {
        localStorage.setItem('pdd_practice_index', currentIndex + 1);
    }
}

function nextQuestion() {
    if (!hasAnswered) {
        alert("Жауапты таңдаңыз!");
        return;
    }
    currentIndex++;
    showQuestion();
}

function startTimer() {
    clearInterval(examTimer);
    examTimer = setInterval(() => {
        timeLeft--;
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        document.getElementById('timer').innerText = `Қалған уақыт: ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        
        if (timeLeft <= 0) {
            clearInterval(examTimer);
            alert("Уақыт аяқталды! Емтихан аяқталды.");
            endQuiz();
        }
    }, 1000);
}

function endQuiz() {
    clearInterval(examTimer);
    document.getElementById('quiz-area').classList.add('hidden');
    document.getElementById('mode-selection').classList.remove('hidden');
    
    if (isExamMode) {
        const resultText = score >= 32 ? "🎉 Құттықтаймыз! Сіз емтиханнан өттіңіз!" : "❌ Сіз емтиханнан өтпедіңіз. Қайтадан байқап көріңіз.";
        alert(`Емтихан аяқталды!\nСіздің нәтижеңіз: ${score} / 40\n\n${resultText}`);
    } else {
        alert(`Жаттығу тоқтатылды. Прогресіңіз сақталды!`);
    }
    updateMenuStats();
}
