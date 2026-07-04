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
        alert("Сұрақтарды жүктеу қатесі! questions.json файлын тексеріңіз.");
    }
};

function startPractice() {
    if(allQuestions.length === 0) return;
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
    if(allQuestions.length === 0) return;
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
        document.getElementById('progress').innerText = `Сұрақ: ${currentIndex + 1} / 40`;
    } else {
        document.getElementById('progress').innerText = `Өтілген сұрақтар: ${currentIndex + 1} | Дұрыс: ${score}`;
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
            alert("Уақыт аяқталды! Ем提хан аяқталды.");
            endQuiz();
        }
    }, 1000);
}

function endQuiz() {
    clearInterval(examTimer);
    document.getElementById('quiz-area').classList.add('hidden');
    document.getElementById('mode-selection').classList.remove('hidden');
    
    if (isExamMode) {
        // 哈萨克斯坦考驾照40题中答对32题及以上为通过
        const resultText = score >= 32 ? "🎉 Құттықтаймыз! Сіз емтиханнан өттіңіз!" : "❌ Сіз емтиханнан өтпедіңіз. Қайтадан байқап көріңіз.";
        alert(`Емтихан аяқталды!\nСіздің нәтижеңіз: ${score} / 40\n\n${resultText}`);
    } else {
        alert(`Марафон аяқталды! Жалпы дұрыс жауаптар саны: ${score}`);
    }
}
