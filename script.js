// ==========================================
// 💡 题目数据源（你可以在下面追加剩下的 12 道题）
// ==========================================
const questions = [
  {
    "question": "«Жеткіліксіз көріну» – бұл:",
    "options": [
      "Тұман, жаңбыр, шаң, қар жауыу және сол сияқты жағдайларда, сондай-ақ қара көлеңкеде жолдың 350 метрден кем көрінуі.",
      "Тұман, жаңбыр, шаң, қар жауыу және сол сияқты жағдайларда, сондай-ақ қара көлеңкеде жолдың 400 метрден кем көрінуі.",
      "Тұман, жаңбыр, шаң, қар жауыу және сол сияқты жағдайларда, сондай-ақ қара көлеңкеде жолдың 300 метрден кем көрінуі."
    ],
    "answer": 2, // 对应选项数组中的第3项（索引从0开始算）
    "explanation": "Түсініктеме: ҚР ЖҚЕ 1-бөліміне сәйкес, «Жеткіліксіз көріну» — тұман, жаңбыр, шаң, қар жаууы және сол сияқты жағдайларда, сондай-ақ ымыртта (қара көлеңкеде) жолдың көрінуінің 300 метрден кем болуы.",
    "image": "images/1.jpg" 
  }
  // ⬇️ 如果有第2题、第3题，按照上面一样的格式，在下方用逗号隔开依次粘贴即可
  
];

// ==========================================
// ⚙️ 核心业务逻辑控制代码
// ==========================================
let currentMode = ''; // 'practice' 还是 'exam'
let currentQuestionIndex = 0;
let score = 0;
let hasAnswered = false;

// 页面加载完成后初始化状态
document.addEventListener("DOMContentLoaded", () => {
    updateStatsDisplay();
});

function startPractice() {
    currentMode = 'practice';
    currentQuestionIndex = 0;
    score = 0;
    document.getElementById('mode-selection').classList.add('hidden');
    document.getElementById('quiz-area').classList.remove('hidden');
    document.getElementById('timer').classList.add('hidden');
    showQuestion();
}

function startExam() {
    currentMode = 'exam';
    currentQuestionIndex = 0;
    score = 0;
    document.getElementById('mode-selection').classList.add('hidden');
    document.getElementById('quiz-area').classList.remove('hidden');
    document.getElementById('timer').classList.remove('hidden');
    // 这里如果以后需要加倒计时，可以在此处扩展
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

// 核心渲染函数：展示题目和处理图片显示
function showQuestion() {
    hasAnswered = false;
    const q = questions[currentQuestionIndex];
    
    // 1. 渲染题干
    document.getElementById('question-text').innerText = q.question;
    
    // 2. 💡 动态判断并渲染媒体（图片/视频）
    const mediaBlock = document.getElementById('media-block');
    if (q.image) {
        // 判断是视频还是图片
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
    
    // 3. 隐藏上题的解析与反馈，隐藏下一题按钮
    document.getElementById('explanation-block').style.display = 'none';
    document.getElementById('feedback').innerText = '';
    document.getElementById('next-btn').classList.add('hidden');
    
    // 4. 渲染进度条与文字
    const progressPercent = ((currentQuestionIndex + 1) / questions.length) * 100;
    document.getElementById('p-bar').style.width = `${progressPercent}%`;
    document.getElementById('progress').innerText = `Сұрақ: ${currentQuestionIndex + 1} / ${questions.length}`;
    
    // 5. 渲染选项按钮
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

// 处理点击选项后的对错逻辑
function selectOption(selectedIndex, clickedBtn) {
    if (hasAnswered) return; // 防止重复点击
    hasAnswered = true;
    
    const q = questions[currentQuestionIndex];
    const allButtons = document.querySelectorAll('.option-btn');
    
    if (selectedIndex === q.answer) {
        clickedBtn.classList.add('correct');
        document.getElementById('feedback').innerHTML = '<span style="color:#10b981;">✅ Дұрыс! (Правильно)</span>';
        score++;
    } else {
        clickedBtn.classList.add('incorrect');
        // 高亮标出正确答案
        allButtons[q.answer].classList.add('correct');
        document.getElementById('feedback').innerHTML = '<span style="color:#ef4444;">❌ Қате! (Неправильно)</span>';
    }
    
    // 显示解析
    if (q.explanation) {
        document.getElementById('explanation-content').innerText = q.explanation;
        document.getElementById('explanation-block').style.style = 'none'; // 确保显示
        document.getElementById('explanation-block').style.display = 'block';
    }
    
    // 显示下一题按钮
    document.getElementById('next-btn').classList.remove('hidden');
}

function nextQuestion() {
    currentQuestionIndex++;
    if (currentQuestionIndex < questions.length) {
        showQuestion();
    } else {
        // 测试结束
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
