// ==========================================
// ⚙️ 核心业务逻辑控制代码（通过异步加载 JSON 数据）
// ==========================================
let questions = []; // 动态存储从 json 读取到的题目
let currentMode = ''; 
let currentQuestionIndex = 0;
let score = 0;
let hasAnswered = false;

// 页面加载完成后，自动去读取 questions.json
document.addEventListener("DOMContentLoaded", () => {
    fetch('questions.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('网络响应错误，无法加载题目文件');
            }
            return response.json();
        })
        .then(data => {
            questions = data; // 成功装载数据
            updateStatsDisplay(); // 更新首页数量
        })
        .catch(error => {
            console.error('加载题目失败:', error);
            const statsText = document.getElementById('practice-stats');
            if (statsText) statsText.innerText = 'Сұрақтарды жүктеу қатесі (加载题目失败)';
        });
});

function startPractice() {
    if (questions.length === 0) return;
    currentMode = 'practice';
    currentQuestionIndex = 0;
    score = 0;
    document.getElementById('mode-selection').classList.add('hidden');
    document.getElementById('quiz-area').classList.remove('hidden');
    document.getElementById('timer').classList.add('hidden');
    showQuestion();
}

function startExam() {
    if (questions.length === 0) return;
    currentMode = 'exam';
    currentQuestionIndex = 0;
    score = 0;
    document.getElementById('mode-selection').classList.add('hidden');
    document.getElementById('quiz-area').classList.remove('hidden');
    document.getElementById('timer').classList.remove('hidden');
    showQuestion();
}

function backToHome() {
    document.getElementById('quiz-area').classList.add('hidden');
    document.getElementById('mode-selection').classList.remove('hidden');
    updateStatsDisplay();
}

function updateStatsDisplay() {
    const statsText = document.getElementById('practice-stats');
    if (statsText) {
        statsText.innerText = `Базада барлығы ${questions.length} сұрақ бар.`;
    }
}

function showQuestion() {
    hasAnswered = false;
    const q = questions[currentQuestionIndex];
    
    // 1. 渲染题干
    document.getElementById('question-text').innerText = q.question;
    
    // 2. 渲染媒体（图片/视频）
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
    
    // 3. 重置状态
    document.getElementById('explanation-block').style.display = 'none';
    document.getElementById('feedback').innerText = '';
    document.getElementById('next-btn').classList.add('hidden');
    
    // 4. 进度条
    const progressPercent = ((currentQuestionIndex + 1) / questions.length) * 100;
    document.getElementById('p-bar').style.width = `${progressPercent}%`;
    document.getElementById('progress').innerText = `Сұрақ: ${currentQuestionIndex + 1} / ${questions.length}`;
    
    // 5. 选项按钮
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
    
    const q = questions[currentQuestionIndex];
    const allButtons = document.querySelectorAll('.option-btn');
    
    if (selectedIndex === q.answer) {
        clickedBtn.classList.add('correct');
        document.getElementById('feedback').innerHTML = '<span style="color:#10b981;">✅ Дұрыс!</span>';
        score++;
    } else {
        clickedBtn.classList.add('incorrect');
        allButtons[q.answer].classList.add('correct');
        document.getElementById('feedback').innerHTML = '<span style="color:#ef4444;">❌ Қате!</span>';
    }
    
    if (q.explanation) {
        document.getElementById('explanation-content').innerText = q.explanation;
        document.getElementById('explanation-block').style.display = 'block';
    }
    
    document.getElementById('next-btn').classList.remove('hidden');
}

function nextQuestion() {
    currentQuestionIndex++;
    if (currentQuestionIndex < questions.length) {
        showQuestion();
    } else {
        document.getElementById('options-container').innerHTML = '';
        document.getElementById('media-block').style.display = 'none';
        document.getElementById('explanation-block').style.display = 'none';
        document.getElementById('next-btn').classList.add('hidden');
        document.getElementById('question-text').innerText = `Жаттығу аяқталды! 🎉\nСіздің нәтижеңіз: ${questions.length} сұрақтан ${score} дұрыс жауап.`;
        document.getElementById('feedback').innerText = '';
    }
}

function resetProgress() {
    currentQuestionIndex = 0;
    score = 0;
    backToHome();
}
