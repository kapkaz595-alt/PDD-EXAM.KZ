// ==========================================
// ⚙️ 核心业务逻辑控制代码（支持错题本与夜间模式）
// ==========================================
let allQuestions = [];       // 动态存储从 JSON 读取到的所有题目
let currentQuestions = [];   // 当前正在测试的题目集合（全套题目、或错题集）
let currentMode = '';        // 'practice' (练习), 'exam' (考试), 'wrong' (错题本)
let currentQuestionIndex = 0;
let score = 0;
let hasAnswered = false;
let wrongQuestionIds = [];   // 存储错题的索引编号（保存到本地）

// 1. 页面加载完成后自动初始化
document.addEventListener("DOMContentLoaded", () => {
    // 🌓 恢复之前保存的夜间模式设置
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    const themeBtn = document.getElementById('theme-btn');
    if (themeBtn) {
        themeBtn.innerText = savedTheme === 'dark' ? '☀️ Күндізгі режим' : '🌙 Түнгі режим';
    }

    // ❌ 读取本地保存的错题本数据
    const savedWrongs = localStorage.getItem('pdd_wrong_questions');
    if (savedWrongs) {
        wrongQuestionIds = JSON.parse(savedWrongs);
    }

    // 📥 异步加载题目 JSON 文件
    fetch('questions.json')
        .then(response => {
            if (!response.ok) throw new Error('Сұрақтар файлын жүктеу мүмкін болмады');
            return response.json();
        })
        .then(data => {
            allQuestions = data; 
            updateStatsDisplay(); // 更新主页各种数据状态
        })
        .catch(error => {
            console.error('加载题目失败:', error);
            const statsText = document.getElementById('practice-stats');
            if (statsText) statsText.innerText = 'Сұрақтарды жүктеу қатесі (加载题目失败)';
        });
});

// 2. 🌓 昼夜模式切换函数
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme); // 保存用户选择
    
    document.getElementById('theme-btn').innerText = newTheme === 'dark' ? '☀️ Күндізгі режим' : '🌙 Түнгі regime';
}

// 3. 📊 更新主界面统计状态（总题数、错题数）
function updateStatsDisplay() {
    // 更新总题数
    const statsText = document.getElementById('practice-stats');
    if (statsText) {
        statsText.innerText = `Базада барлығы ${allQuestions.length} сұрақ бар.`;
    }

    // 更新错题本数量与按钮状态
    const wrongCountSpan = document.getElementById('wrong-count');
    const wrongBtn = document.getElementById('wrong-questions-btn');
    if (wrongCountSpan && wrongBtn) {
        wrongCountSpan.innerText = wrongQuestionIds.length;
        if (wrongQuestionIds.length > 0) {
            wrongBtn.disabled = false; // 有错题时激活按钮
        } else {
            wrongBtn.disabled = true;  // 没错题时禁用
        }
    }
}

// 4. 🔄 启动不同的模式
function startPractice() {
    if (allQuestions.length === 0) return;
    currentMode = 'practice';
    currentQuestions = [...allQuestions]; // 复制一份全量题库
    initQuiz();
}

function startExam() {
    if (allQuestions.length === 0) return;
    currentMode = 'exam';
    // 模拟真实考试：从总题库随机抽 40 题（若不够40题则全抽）
    let shuffled = [...allQuestions].sort(() => 0.5 - Math.random());
    currentQuestions = shuffled.slice(0, Math.min(40, allQuestions.length));
    
    document.getElementById('timer').classList.remove('hidden');
    initQuiz();
}

function startWrongPractice() {
    if (wrongQuestionIds.length === 0) return;
    currentMode = 'wrong';
    // 根据错题本保存的索引，把对应的题目过滤出来
    currentQuestions = wrongQuestionIds.map(idx => allQuestions[idx]).filter(q => q !== undefined);
    
    if (currentQuestions.length === 0) {
        wrongQuestionIds = [];
        localStorage.removeItem('pdd_wrong_questions');
        updateStatsDisplay();
        return;
    }
    initQuiz();
}

// 核心初始化
function initQuiz() {
    currentQuestionIndex = 0;
    score = 0;
    document.getElementById('mode-selection').classList.add('hidden');
    document.getElementById('quiz-area').classList.remove('hidden');
    showQuestion();
}

// 5. 📝 渲染当前题目
function showQuestion() {
    hasAnswered = false;
    const q = currentQuestions[currentQuestionIndex];
    
    // 渲染题干
    document.getElementById('question-text').innerText = q.question;
    
    // 渲染媒体组件（图片/视频）
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
    
    // 复位组件状态
    document.getElementById('explanation-block').style.display = 'none';
    document.getElementById('feedback').innerText = '';
    document.getElementById('next-btn').classList.add('hidden');
    
    // 计算并更新进度条
    const progressPercent = ((currentQuestionIndex + 1) / currentQuestions.length) * 100;
    document.getElementById('p-bar').style.width = `${progressPercent}%`;
    document.getElementById('progress').innerText = `Сұрақ: ${currentQuestionIndex + 1} / ${currentQuestions.length}`;
    
    // 生成选项按钮
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

// 6. 👆 用户点击选项判断
function selectOption(selectedIndex, clickedBtn) {
    if (hasAnswered) return;
    hasAnswered = true;
    
    const q = currentQuestions[currentQuestionIndex];
    const allButtons = document.querySelectorAll('.option-btn');
    
    // 寻找到当前题目在原始总题库 allQuestions 中的真实索引值
    const originalIndex = allQuestions.findIndex(item => item.question === q.question);

    if (selectedIndex === q.answer) {
        clickedBtn.classList.add('correct');
        document.getElementById('feedback').innerHTML = '<span style="color:#10b981;">✅ Дұрыс!</span>';
        score++;

        // 💡 如果在“错题本模式”下答对了，则将它从错题本中移除
        if (currentMode === 'wrong' && originalIndex !== -1) {
            wrongQuestionIds = wrongQuestionIds.filter(id => id !== originalIndex);
            localStorage.setItem('pdd_wrong_questions', JSON.stringify(wrongQuestionIds));
        }
    } else {
        clickedBtn.classList.add('incorrect');
        allButtons[q.answer].classList.add('correct');
        document.getElementById('feedback').innerHTML = '<span style="color:#ef4444;">❌ Қате!</span>';
        
        // 💡 只要答错了，就加入错题本（避免重复加入）
        if (originalIndex !== -1 && !wrongQuestionIds.includes(originalIndex)) {
            wrongQuestionIds.push(originalIndex);
            localStorage.setItem('pdd_wrong_questions', JSON.stringify(wrongQuestionIds));
        }
    }
    
    // 显示解析蓝框
    if (q.explanation) {
        document.getElementById('explanation-content').innerText = q.explanation;
        document.getElementById('explanation-block').style.display = 'block';
    }
    
    document.getElementById('next-btn').classList.remove('hidden');
}

// 7. ➡️ 下一题或结束结算
function nextQuestion() {
    currentQuestionIndex++;
    if (currentQuestionIndex < currentQuestions.length) {
        showQuestion();
    } else {
        // 完成答题后的结算界面展现
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

// 8. ⬅ 返回主页
function backToHome() {
    document.getElementById('quiz-area').classList.add('hidden');
    document.getElementById('timer').classList.add('hidden');
    document.getElementById('mode-selection').classList.remove('hidden');
    updateStatsDisplay();
}

// 9. 🔄 重置数据
function resetProgress() {
    if (confirm("Прогресті нөлдегіңіз келе ме? (Жиналған барлық қателер өшіріледі)")) {
        wrongQuestionIds = [];
        localStorage.removeItem('pdd_wrong_questions');
        currentQuestionIndex = 0;
        score = 0;
        backToHome();
    }
}
