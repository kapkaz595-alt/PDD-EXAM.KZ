let allQuestions = [];
let currentQuestionsList = [];
let currentIndex = 0;
let isExamMode = false;
let examTimer = null;
let timeLeft = 40 * 60; 
let score = 0;
let hasAnswered = false;

// 🔒 核心安全与付费配置（当前设置为全免费运行）
const SECURITY_KEY = "000000"; // 你的解锁密码（后期收费时用）
const FREE_LIMIT = 999999;       // 免费题数限制（设为999999相当于当前全免费）

window.onload = async () => {
    try {
        const response = await fetch('questions.json');
        allQuestions = await response.json();
        updateMenuStats();
    } catch (e) {
        alert("Қателік: Тізім жүктелмеді.");
    }
};

function updateMenuStats() {
    if (allQuestions.length === 0) return;
    let savedIndex = parseInt(localStorage.getItem('pdd_practice_index')) || 0;
    if (savedIndex >= allQuestions.length) {
        document.getElementById('practice-stats').innerText = `Ұттыңыз! Барлығын аяқтадыңыз!`;
        return;
    }
    let leftQuestions = allQuestions.length - savedIndex;
    document.getElementById('practice-stats').innerText = `Өтілгені: ${savedIndex} | Қалғаны: ${leftQuestions} | Барлығы: ${allQuestions.length}`;
}

function startPractice() {
    if(allQuestions.length === 0) return;
    isExamMode = false;
    document.getElementById('mode-selection').classList.add('hidden');
    document.getElementById('quiz-area').classList.remove('hidden');
    currentQuestionsList = [...allQuestions];
    currentIndex = parseInt(localStorage.getItem('pdd_practice_index')) || 0;
    showQuestion();
}

function startExam() {
    if(allQuestions.length === 0) return;
    isExamMode = true;
    document.getElementById('mode-selection').classList.add('hidden');
    document.getElementById('quiz-area').classList.remove('hidden');
    document.getElementById('timer').classList.remove('hidden');
    
    // 随机抽取40道题
    currentQuestionsList = [...allQuestions].sort(() => 0.5 - Math.random()).slice(0, 40);
    currentIndex = 0;
    score = 0;
    timeLeft = 40 * 60;
    
    showQuestion();
    
    clearInterval(examTimer);
    examTimer = setInterval(() => {
        timeLeft--;
        let mins = Math.floor(timeLeft / 60);
        let secs = timeLeft % 60;
        document.getElementById('timer').innerText = `Қалған уақыт: ${mins}:${secs < 10 ? '0' : ''}${secs}`;
        if (timeLeft <= 0) {
            clearInterval(examTimer);
            endQuiz();
        }
    }, 1000);
}

function showQuestion() {
    if (currentIndex >= currentQuestionsList.length) {
        endQuiz();
        return;
    }

    // 🛑 付费卡点拦截逻辑
    if (!isExamMode && currentIndex >= FREE_LIMIT) {
        let isUnlocked = localStorage.getItem('pdd_user_unlocked') === 'true';
        if (!isUnlocked) {
            lockScreenForPayment();
            return;
        }
    }

    hasAnswered = false;
    document.getElementById('feedback').innerText = "";
    const currentQuestion = currentQuestionsList[currentIndex];
    
    // 渲染进度与题号
    if (isExamMode) {
        document.getElementById('progress').innerText = `Сұрақ: ${currentIndex + 1} / 40`;
        document.getElementById('p-bar').style.width = `${((currentIndex) / 40) * 100}%`;
    } else {
        document.getElementById('progress').innerText = `Сұрақ: ${currentIndex + 1} / ${allQuestions.length}`;
        document.getElementById('p-bar').style.width = `${((currentIndex) / allQuestions.length) * 100}%`;
    }
    
    document.getElementById('question-text').innerText = currentQuestion.question;
    
    // 🎬 图片与视频媒体动态加载区
    const mediaBlock = document.getElementById('media-block');
    mediaBlock.innerHTML = ""; 
    mediaBlock.style.display = "none"; 

    if (currentQuestion.image) {
        mediaBlock.innerHTML = `<img src="${currentQuestion.image}" alt="PDD Image">`;
        mediaBlock.style.display = "block";
    } else if (currentQuestion.video) {
        mediaBlock.innerHTML = `
            <video src="${currentQuestion.video}" controls autoplay loop muted playsinline></video>
        `;
        mediaBlock.style.display = "block";
    }

    // 📘 隐藏并清空上一题的解析框
    const expBlock = document.getElementById('explanation-block');
    if (expBlock) {
        expBlock.style.display = "none";
        document.getElementById('explanation-content').innerText = "";
    }
    
    // 渲染选项
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
    const allButtons = document.querySelectorAll('.option-btn');
    
    allButtons[correctIndex].classList.add('correct');

    if (selectedIndex === correctIndex) {
        score++;
        document.getElementById('feedback').innerHTML = "<span style='color:#10b981;'>🟢 Дұрыс!</span>";
    } else {
        clickedBtn.classList.add('incorrect');
        document.getElementById('feedback').innerHTML = "<span style='color:#ef4444;'>🔴 Бұрыс!</span>";
    }

    // 📘 核心：如果在练习模式下，且当前题目有“Түсініктеме（解析）”，就自动弹出来
    const expBlock = document.getElementById('explanation-block');
    if (!isExamMode && currentQuestion.explanation && expBlock) {
        document.getElementById('explanation-content').innerText = currentQuestion.explanation;
        expBlock.style.display = "block"; 
    }

    if (!isExamMode) {
        localStorage.setItem('pdd_practice_index', currentIndex + 1);
        updateMenuStats();
    }
}

function nextQuestion() {
    if (!hasAnswered) return;
    currentIndex++;
    showQuestion();
}

function endQuiz() {
    clearInterval(examTimer);
    document.getElementById('quiz-area').classList.add('hidden');
    document.getElementById('mode-selection').classList.remove('hidden');
    
    if (isExamMode) {
        alert(`Емтихан аяқталды!\nНәтижеңіз: 40-тан ${score} дұрыс.\n${score >= 32 ? '🎉 Құттықтаймыз! Емтиханнан өттіңіз!' : '❌ Өкінішке орай, емтиханнан өтпедіңіз.'}`);
    } else {
        alert("Жаттығу аяқталды!");
    }
    updateMenuStats();
}

function resetProgress() {
    if (confirm("Прогресті нөлдегіңіз келеді ме?")) {
        localStorage.removeItem('pdd_practice_index');
        currentIndex = 0;
        updateMenuStats();
    }
}

// 🔒 渲染付费锁屏提示
function lockScreenForPayment() {
    const optionsContainer = document.getElementById('options-container');
    document.getElementById('question-text').innerText = "🔒 Толық база жабық (Доступ ограничен)";
    
    optionsContainer.innerHTML = `
        <div style="text-align: center; padding: 15px; background: #fff; border-radius: 8px;">
            <p style="font-size: 12pt; font-weight: bold; color: #dc2626; margin-bottom: 10px;">
                Пароль таратпаймыз ‼️ <br>
                <span style="font-size: 10.5pt; font-weight: normal; color: #475569;">За распространение пароля другим будет блокировка!</span>
            </p>
            <p style="font-size: 10pt; color: #64748b; margin-bottom: 15px; line-height: 1.4;">
                Тегін сұрақтар шегіне жеттіңіз. Барлық 1500+ сұрақты ашу және құпия сөзді сатып алу үшін жазыңыз: <br>
                <strong style="color: #2563eb; font-size: 12pt;">@your_telegram_username</strong>
            </p>
            <input type="text" id="pass-input" placeholder="Парольді енгізіңіз" style="width: 80%; padding: 12px; font-size: 12pt; border: 2px solid #cbd5e1; border-radius: 6px; text-align: center; margin-bottom: 15px;">
            <button class="menu-btn" onclick="verifyUserPassword()" style="background: #10b981; margin: 0 auto; width: 80%;">Кіру (Войти)</button>
        </div>
    `;
    document.getElementById('feedback').innerText = "";
}

function verifyUserPassword() {
    const input = document.getElementById('pass-input').value.trim();
    if (input === SECURITY_KEY) {
        localStorage.setItem('pdd_user_unlocked', 'true');
        alert("🎉 Сәтті ашылды! (Доступ open!)");
        showQuestion();
    } else {
        alert("❌ Қате пароль! (Неверный пароль!)");
    }
}
