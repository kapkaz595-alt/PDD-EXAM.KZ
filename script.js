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
    } catch (e) {
        alert("题库加载失败，请检查 questions.json 文件格式！");
    }
};

function startPractice() {
    if(allQuestions.length === 0) { alert("题库还在加载中或为空，请稍候..."); return; }
    isExamMode = false;
    clearInterval(examTimer);
    document.getElementById('timer').classList.add('hidden');
    document.getElementById('mode-selection').classList.add('hidden');
    document.getElementById('quiz-area').classList.remove('hidden');
    
    currentQuestionsList = [...allQuestions].sort(() => Math.random() - 0.5);
    currentIndex = 0;
    score = 0;
    showQuestion();
}

function startExam() {
    if(allQuestions.length === 0) { alert("题库还在加载中或为空，请稍候..."); return; }
    isExamMode = true;
    score = 0;
    currentQuestionsList = [...allQuestions].sort(() => Math.random() - 0.5).slice(0, 40);
    currentIndex = 0;
    
    timeLeft = 40 * 60;
    document.getElementById('timer').classList.remove('hidden');
    document.getElementById('mode-selection').classList.add('hidden');
    document.getElementById('quiz-area').classList.remove('hidden');
    
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
        document.getElementById('progress').innerText = `题目: ${currentIndex + 1} / 40`;
    } else {
        document.getElementById('progress').innerText = `已刷: ${currentIndex + 1} 题 | 答对: ${score}`;
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
        document.getElementById('feedback').innerHTML = "<span style='color:#10b981;'>🟢 Правильно! (正确)</span>";
        score++;
    } else {
        clickedBtn.classList.add('incorrect');
        document.getElementById('feedback').innerHTML = "<span style='color:#ef4444;'>🔴 Неправильно! (错误)</span>";
    }
}

function nextQuestion() {
    if (!hasAnswered) {
        alert("请先选择一个答案！/ Выберите ответ!");
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
        document.getElementById('timer').innerText = `剩余时间: ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        
        if (timeLeft <= 0) {
            clearInterval(examTimer);
            alert("Время вышло! 考试时间到！");
            endQuiz();
        }
    }, 1000);
}

function endQuiz() {
    clearInterval(examTimer);
    document.getElementById('quiz-area').classList.add('hidden');
    document.getElementById('mode-selection').classList.remove('hidden');
    
    if (isExamMode) {
        const passed = score >= 32 ? "🎉 Поздравляем! Вы сдали! (恭喜你通过考试！)" : "❌ Вы не сдали. (未通过，继续努力)";
        alert(`考试结束！\n你的得分: ${score} / 40\n${passed}`);
    } else {
        alert(`练习结束！共答对 ${score} 题。`);
    }
}
