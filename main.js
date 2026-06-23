/* ========================================
   konbini-story — 游戏主逻辑
   ======================================== */

// ==========================================================
//  角色数据 (重构版)
// ==========================================================

const characters = {
  player: {
    name: '你',
    title: '后端开发',
    traits: ['疲惫但细腻', '习惯观察细节']
  },
  heroine: {
    // 表面身份
    name: '山田小姐',           // 对外称呼
    role: '便利店夜班店员',
    age: 25,
    traits: ['治愈', '有神秘感', '观察力强'],

    // 秘密
    secret: '正在自学编程',

    // 双重身份 (第56夜前全部隐藏)
    trueName: '山田澪',         // 真名 — trust > 60 后解锁
    fakeName: '田山凛',         // 她对外使用的假名
    identityLayers: {
      layer1: '便利店店员',     // 所有客人都看到的一层
      layer2: '失业的田山',     // 她编造的过往 — trust > 50 时透露端倪
      layer3: '前游戏策划·山田' // 真相 — trust > 80 且完成编程秘密线后解锁
    }
  }
};

// ---- 观察细节池 ----
const observeDetails = [
  '她说话时，手指不自觉地绕着围裙的边角。',
  '她的围裙口袋里露出一截小票，背面画满了奇怪的符号和箭头。',
  '今天她换了一根淡紫色的发绳，和昨天的不一样。',
  '她弯腰时，你看到她围裙内侧别着一枚小小的猫咪胸针。'
];

// ---- 环境描写池（吸烟场景每 10 秒切换） ----
const ambientTexts = [
  '远处传来电车经过的声音。',
  '她呼出的烟雾在路灯下变成淡蓝色。',
  '后门的感应灯忽然灭了，又亮了。',
  '便利店里的自动门响了三次，但没有客人出来。'
];

// ---- 烟盒留言（按 session 索引） ----
const cigaretteMessages = {
  5:  '今天风很大。',
  6:  '薄荷的，记住了。',
  7:  '你要不要试试抽我这种？',
  8:  '其实我不太会说话，但和你……还行。',
  10: '山田澪·真的那个我\n\n090-XXXX-XXXX'
};

// ---- 她的视角：观察你的细节池 ----
const perspectiveDetails = [
  '他今天领子没翻好。',
  '他今天比昨天笑了一下。',
  '他每次点烟前都会先闻一下烟。',
  '他的手指甲很干净——不像一般抽烟的人。',
  '他喝黑咖啡的时候会先吹一口气，即使已经不烫了。'
];

// ---- 破绽检测池（伪装的不自然之处） ----
const flawDetails = [
  '她点烟的手势很标准，但吸进去就咳——装了很久了。',
  '她说"以前的公司"时，停顿了0.5秒。',
  '她的手机屏幕亮了一下，锁屏是一张游戏角色图——不是便利店店员会用的壁纸。',
  '她提到"田山"这个名字时，左手会捏一下围裙边——说谎的微反应。'
];

// ---- 游戏状态 ----
const gameState = {
  affection: 0,
  fatigue: 60,
  trust: 0,                 // 信任值 (0-100)，独立于好感度
  currentScene: 'start',
  memories: [],
  observeCount: 0,
  observeUsed: [],
  trustBase: 0,              // 手动信任增量
  smokeSessions: 0,         // 后门吸烟累计次数
  perspectiveSwitches: 0,   // 后门视角切换累计次数
  currentPerspective: 'player',   // 当前视角: 'player' | 'heroine'
  ambientTimerId: null,      // 环境文字定时器 ID
  flawCount: 0,             // 已发现的破绽次数
  flawsUsed: [],             // 本轮已使用的破绽 index
  foodEventTriggered: false,
  rainEventTriggered: false,
  returnScene: null
};

// ---- DOM 引用 ----
function $(id) { return document.getElementById(id); }

const dialogueText   = $('dialogue-text');
const choicesBox     = $('choices-box');
const dialogueBox    = $('dialogue-box');
const observeBtn     = $('observe-btn');
const observeCountEl = $('observe-count');
const observeArea    = $('observe-area');
const smokeBtn       = $('smoke-btn');
const smokeCountEl   = $('smoke-count');
const affectionBar   = $('affection-bar');
const affectionValue = $('affection-value');
const fatigueBar     = $('fatigue-bar');
const fatigueValue   = $('fatigue-value');
const trustBar       = $('trust-bar');
const trustValue     = $('trust-value');
const timeDisplay    = $('time-display');
const characterArea  = $('character-area');
const characterName  = $('character-name');
const trustHint       = $('trust-hint');
const badgeReveal     = $('badge-reveal');
const ambientText     = $('ambient-text');
const cigaretteNote   = $('cigarette-note');
const perspectiveBtn  = $('perspective-btn');
const perspectiveCountEl = $('perspective-count');
const flawBtn        = $('flaw-btn');
const flawCountEl    = $('flaw-count');

// ---- DOM 存在性检查 ----
(function checkDOM() {
  const ids = [
    'dialogue-text', 'choices-box', 'dialogue-box',
    'observe-btn', 'observe-count', 'observe-area',
    'smoke-btn', 'smoke-count',
    'affection-bar', 'affection-value',
    'fatigue-bar', 'fatigue-value',
    'trust-bar', 'trust-value',
    'time-display', 'character-area', 'character-name',
    'trust-hint', 'badge-reveal',
    'ambient-text', 'cigarette-note',
    'perspective-btn', 'perspective-count',
    'flaw-btn', 'flaw-count'
  ];
  const missing = ids.filter(id => !document.getElementById(id));
  if (missing.length) {
    console.warn('[konbini-story] 缺失的 DOM 元素:', missing.join(', '));
  }
})();

// ---- 工具函数 ----
function setDialogue(text) {
  if (!dialogueText) return;
  dialogueText.classList.remove('visible');
  setTimeout(() => {
    // 信任值 > 50 时，有 40% 概率在对话末尾追加半截话
    let finalText = text || '';
    if (gameState.trust > 50 && text && text.length > 30 && Math.random() < 0.4) {
      finalText += '\n\n『其实我……』她的嘴唇动了动，又把话咽了回去。';
    }
    dialogueText.textContent = finalText;
    dialogueText.classList.add('visible');
  }, 200);
}

function clearChoices() {
  if (choicesBox) choicesBox.innerHTML = '';
}

function renderChoices(choices) {
  clearChoices();
  if (!choices || !choices.length) return;
  if (!choicesBox) return;

  choices.forEach(choice => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.textContent = choice.label || '[?]';
    btn.addEventListener('click', () => {
      if (typeof choice.effect === 'function') choice.effect();
      if (choice.next) {
        const nextId = typeof choice.next === 'function' ? choice.next() : choice.next;
        if (nextId) showScene(nextId);
      }
    });
    choicesBox.appendChild(btn);
  });
}

// ---- 信任值计算 ---- //
// 信任值不是手动增减的，而是由其他状态派生 +
// 关键事件触发时的增量。
// 以下在 updateUI() 中动态计算。

function calcDerivedTrust() {
  let trust = gameState.trustBase;  // 手动增量（场景选项直接加）

  // 观察行为增加信任
  trust += gameState.observeCount * 5;

  // 某些记忆指向深度信任
  const trustMemories = [
    '便签纸上的秘密', '小票上的逻辑图', '凌晨班的开发者',
    '沉默的默契', '夜间编程课的约定', '关东煮计时器',
    '豆沙的认可', '银的信任', '后门的七根烟'
  ];
  for (const m of trustMemories) {
    if (gameState.memories.includes(m)) trust += 8;
  }

  // 好感度也会贡献一部分信任
  trust += Math.floor(gameState.affection * 0.3);

  // 吸烟次数增进信任
  trust += gameState.smokeSessions * 4;

  return Math.min(100, trust);
}

// ---- 观察系统 ---- //

function updateObserveButton() {
  if (!observeBtn || !observeCountEl) return;
  const count = gameState.observeCount;
  observeCountEl.textContent = count > 0 ? `已观察 ${count}/3 次` : '';

  if (count >= 3) {
    observeBtn.classList.add('ready');
    observeBtn.textContent = '🔍 观察（她注意到了）';
  } else {
    observeBtn.classList.remove('ready');
    observeBtn.textContent = '🔍 观察';
  }
}

function showObserveDetail() {
  const old = document.getElementById('observe-detail');
  if (old) old.remove();

  const available = observeDetails
    .map((_, i) => i)
    .filter(i => !gameState.observeUsed.includes(i));

  if (available.length === 0) {
    gameState.observeUsed = [];
    available.push(...observeDetails.map((_, i) => i));
  }

  const pick = available[Math.floor(Math.random() * available.length)];
  gameState.observeUsed.push(pick);

  const detailEl = document.createElement('div');
  detailEl.id = 'observe-detail';
  detailEl.textContent = '👁 ' + observeDetails[pick];
  if (observeArea) observeArea.appendChild(detailEl);

  setTimeout(() => {
    if (detailEl.parentNode) detailEl.remove();
  }, 8000);
}

function onObserve() {
  gameState.observeCount++;
  updateObserveButton();

  if (gameState.observeCount >= 3) {
    showScene('observe_trigger');
  } else {
    showObserveDetail();
  }
}

// ---- 吸烟系统 ---- //

function updateSmokeButton() {
  if (!smokeBtn || !smokeCountEl) return;
  const n = gameState.smokeSessions;
  smokeCountEl.textContent = n > 0 ? `${n} 次` : '';
}

function onSmoke() {
  // 不能在事件/结局内抽烟
  if (EVENT_BLOCKLIST.has(gameState.currentScene)) return;

  gameState.smokeSessions++;
  gameState.returnScene = gameState.currentScene;
  updateSmokeButton();
  updateUI();

  // 路由到对应阶段（先 updateUI 以得出最新 trust）
  const s = gameState.smokeSessions;
  const t = gameState.trust;

  let sceneId;

  if (s === 1) {
    sceneId = 'smoke_phase1';
  } else if (s >= 2 && s <= 3) {
    sceneId = 'smoke_phase2';
  } else if (s >= 4 && s <= 6 && t > 40) {
    sceneId = 'smoke_phase3';
  } else if (s === 7 && t > 60) {
    sceneId = 'smoke_phase4';
  } else if (s >= 8 && t > 75) {
    sceneId = 'smoke_phase5';
  } else {
    return;  // 不满足任何阶段条件，仅累计 session 数
  }

  showScene(sceneId);

  // 烟盒留言（session ≥ 5 后每次吸烟后延迟展示）
  if (s >= 5) {
    setTimeout(() => showCigaretteNote(s), 2500);
  }
}

// ---- 环境描写系统 ---- //

/** 启动环境文字循环（仅烟雾场景） */
function startAmbientText() {
  stopAmbientText();
  if (!ambientText) return;

  function cycleAmbient() {
    if (!ambientText) return;
    const pick = ambientTexts[Math.floor(Math.random() * ambientTexts.length)];
    ambientText.textContent = pick;
    ambientText.classList.add('visible');

    // 6 秒后淡出，2 秒空白，再下一个
    setTimeout(() => {
      if (ambientText) ambientText.classList.remove('visible');
    }, 6000);
  }

  cycleAmbient();
  gameState.ambientTimerId = setInterval(cycleAmbient, 10000);
}

/** 停止环境文字循环 */
function stopAmbientText() {
  if (gameState.ambientTimerId) {
    clearInterval(gameState.ambientTimerId);
    gameState.ambientTimerId = null;
  }
  if (ambientText) {
    ambientText.classList.remove('visible');
    ambientText.textContent = '';
  }
}

// ---- 烟盒留言系统 ---- //

/** 显示烟盒留言（按 session 对应） */
function showCigaretteNote(sessionNum) {
  if (!cigaretteNote) return;
  const msg = cigaretteMessages[sessionNum];
  if (!msg) return;

  cigaretteNote.textContent = msg;
  cigaretteNote.classList.add('visible');

  // 12 秒后自动消失
  setTimeout(() => {
    if (cigaretteNote) cigaretteNote.classList.remove('visible');
  }, 12000);
}

/** 隐藏烟盒留言 */
function hideCigaretteNote() {
  if (cigaretteNote) cigaretteNote.classList.remove('visible');
}

// ---- 后门视角切换系统 ---- //

/** 她的视角详情（本轮已使用过的 index） */
const perspectiveUsed = [];

/** 更新视角按钮 UI */
function updatePerspectiveButton() {
  if (!perspectiveBtn || !perspectiveCountEl) return;
  const n = gameState.perspectiveSwitches;
  perspectiveCountEl.textContent = n > 0 ? `${n} 次` : '';

  if (gameState.currentPerspective === 'heroine') {
    perspectiveBtn.classList.add('flipped');
    perspectiveBtn.textContent = '👁️ 她的视角';
  } else {
    perspectiveBtn.classList.remove('flipped');
    perspectiveBtn.textContent = '👁️ 后门视角';
  }
}

/** 视角切换按钮点击 */
function onPerspectiveSwitch() {
  // 只在烟雾场景内可用
  const isSmokeScene = gameState.currentScene.startsWith('smoke_');
  if (!isSmokeScene) return;

  gameState.perspectiveSwitches++;
  updatePerspectiveButton();

  if (gameState.currentPerspective === 'player') {
    // 切换到她的视角
    gameState.currentPerspective = 'heroine';
    if (characterArea) characterArea.classList.add('perspective-flipped');

    // 随机显示一条她观察你的细节
    const available = perspectiveDetails
      .map((_, i) => i)
      .filter(i => !perspectiveUsed.includes(i));
    if (available.length === 0) perspectiveUsed.length = 0;

    const pickIdx = available.length > 0
      ? available[Math.floor(Math.random() * available.length)]
      : Math.floor(Math.random() * perspectiveDetails.length);
    perspectiveUsed.push(pickIdx);

    // 在对话区展示她的观察
    setDialogue('她低头看着自己的手。\n\n但她的余光，一直跟随着你的每一个动作。\n\n她在心里默默记下一条笔记——\n\n『' + perspectiveDetails[pickIdx] + '』');
    clearChoices();

    // 3 秒后自动切回，但累计触发达到3次时触发事件
    if (gameState.perspectiveSwitches >= 3 && !gameState.memories.includes('双向理解')) {
      setTimeout(() => {
        gameState.currentPerspective = 'player';
        if (characterArea) characterArea.classList.remove('perspective-flipped');
        updatePerspectiveButton();
        showScene('smoke_perspective_event');
      }, 3000);
    } else {
      setTimeout(() => {
        gameState.currentPerspective = 'player';
        if (characterArea) characterArea.classList.remove('perspective-flipped');
        updatePerspectiveButton();
        // 恢复之前烟雾场景的内容
        showScene(gameState.currentScene);
      }, 4000);
    }
  }
  // 如果已经是 heroine 视角，点击切回
  else {
    gameState.currentPerspective = 'player';
    if (characterArea) characterArea.classList.remove('perspective-flipped');
    updatePerspectiveButton();
    showScene(gameState.currentScene);
  }
}

// ---- 结局片尾曲跳转 ---- //

/** 结局触发后显示倒计时遮罩，3 秒后跳转 B 站片尾曲 */
function triggerEndingWithBGM() {
  // 防止重复触发
  if (document.getElementById('ending-overlay')) return;

  const overlay = document.createElement('div');
  overlay.id = 'ending-overlay';
  overlay.innerHTML =
    '<div class="ending-content">' +
      '<h1>🎵 片尾曲即将播放</h1>' +
      '<p class="ending-countdown" id="ending-countdown">3</p>' +
      '<p class="ending-hint">点击任意处立即跳转</p>' +
    '</div>';
  document.body.appendChild(overlay);

  const countdownEl = document.getElementById('ending-countdown');
  let count = 3;

  const timer = setInterval(() => {
    count--;
    if (count <= 0) {
      clearInterval(timer);
      window.location.href = 'https://www.bilibili.com/video/BV18dLR67E4f/';
    } else if (countdownEl) {
      countdownEl.textContent = count;
    }
  }, 1000);

  // 点击任意处立即跳转
  overlay.addEventListener('click', () => {
    clearInterval(timer);
    window.location.href = 'https://www.bilibili.com/video/BV18dLR67E4f/';
  });
}

// ---- 破绽检测系统 ---- //

/** 在对话文本中随机注入破绽提示（注入到环境文字浮层） */
function injectFlawHint() {
  // 只在非结局/非事件/非烟雾场景中有机会触发，每 3 次 showScene 尝试一次
  if (gameState.currentScene.startsWith('smoke_')) return;
  if (gameState.currentScene.startsWith('ending_')) return;
  if (gameState.currentScene.startsWith('observe_')) return;
  if (EVENT_BLOCKLIST.has(gameState.currentScene)) return;

  // 20% 基础概率，已发现破绽越多概率越高
  const chance = 0.20 + gameState.flawCount * 0.08;
  if (Math.random() > chance) return;

  // 选一条本轮未用过的破绽
  const available = flawDetails
    .map((_, i) => i)
    .filter(i => !gameState.flawsUsed.includes(i));
  if (available.length === 0) gameState.flawsUsed = [];

  const pool = available.length > 0 ? available : [...Array(flawDetails.length).keys()];
  const pick = pool[Math.floor(Math.random() * pool.length)];
  if (!gameState.flawsUsed.includes(pick)) gameState.flawsUsed.push(pick);

  // 在对话区追加一条淡入破绽
  const oldFlaw = document.getElementById('flaw-hint');
  if (oldFlaw) oldFlaw.remove();

  const flawEl = document.createElement('div');
  flawEl.id = 'flaw-hint';
  flawEl.textContent = '⚠ ' + flawDetails[pick];
  if (dialogueBox) dialogueBox.appendChild(flawEl);

  // 6 秒后自动消失
  setTimeout(() => {
    if (flawEl.parentNode) flawEl.remove();
  }, 6000);
}

/** 更新破绽按钮 UI */
function updateFlawButton() {
  if (!flawBtn || !flawCountEl) return;
  const n = gameState.flawCount;
  flawCountEl.textContent = n > 0 ? `${n} 次` : '';

  if (n >= 3) {
    flawBtn.classList.add('flaw-ready');
    flawBtn.textContent = '⚠ 破绽（质问她）';
  } else {
    flawBtn.classList.remove('flaw-ready');
    flawBtn.textContent = '⚠ 破绽';
  }
}

/** 破绽按钮点击：主动发现一条破绽 */
function onFlaw() {
  if (gameState.flawCount >= 3) {
    // 已累计 3 次 → 触发真相质问
    gameState.returnScene = gameState.currentScene;
    showScene('flaw_confront');
    return;
  }

  // 选一条本轮未用过的
  const available = flawDetails
    .map((_, i) => i)
    .filter(i => !gameState.flawsUsed.includes(i));
  if (available.length === 0) gameState.flawsUsed = [];

  const pool = available.length > 0 ? available : [...Array(flawDetails.length).keys()];
  const pick = pool[Math.floor(Math.random() * pool.length)];
  if (!gameState.flawsUsed.includes(pick)) gameState.flawsUsed.push(pick);

  gameState.flawCount++;
  updateFlawButton();
  updateUI();

  // 把破绽显示在观察区
  const old = document.getElementById('observe-detail');
  if (old) old.remove();

  const detailEl = document.createElement('div');
  detailEl.id = 'observe-detail';
  detailEl.textContent = '⚠ ' + flawDetails[pick] + '\n\n（已发现 ' + gameState.flawCount + '/3 个破绽）';
  if (observeArea) observeArea.appendChild(detailEl);

  setTimeout(() => {
    if (detailEl.parentNode) detailEl.remove();
  }, 8000);
}
function updateUI() {
  // 0. 计算派生信任值
  gameState.trust = calcDerivedTrust();

  // 1. 好感度
  const aff = Math.min(100, Math.max(0, gameState.affection));
  if (affectionBar) affectionBar.style.width = aff + '%';
  if (affectionValue) affectionValue.textContent = aff;

  // 2. 疲劳值
  const fat = Math.min(100, Math.max(0, gameState.fatigue));
  if (fatigueBar) fatigueBar.style.width = fat + '%';
  if (fatigueValue) fatigueValue.textContent = fat;

  // 3. 信任值
  const tr = Math.min(100, Math.max(0, gameState.trust));
  if (trustBar) trustBar.style.width = tr + '%';
  if (trustValue) trustValue.textContent = tr;

  // 4. 时间
  const scene = scenes && scenes[gameState.currentScene];
  if (scene && scene.time && timeDisplay) {
    timeDisplay.textContent = scene.time;
  }

  // 5. 疲劳 < 30
  if (dialogueBox) {
    if (fat < 30) {
      dialogueBox.classList.add('fatigue-low');
    } else {
      dialogueBox.classList.remove('fatigue-low');
    }
  }

  // 6. Canvas 立绘由 standee.js 独立渲染，此处仅管理状态标记

  // 7. 信任 ≥ 60 → 解锁真名 "山田澪"
  if (characterName) {
    if (tr >= 60) {
      characterName.textContent = '山田澪';
      characterName.title = '对外自称: ' + characters.heroine.fakeName;
    } else {
      characterName.textContent = '山田小姐';
      characterName.title = '';
    }
  }

  // 8. 信任 ≥ 70 → 胸针翻面，露出背后字迹
  if (badgeReveal && characterArea) {
    if (tr >= 70) {
      characterArea.classList.add('badge-revealed');
      if (!gameState.memories.includes('胸针背后的字')) {
        gameState.memories.push('胸针背后的字');
      }
    } else {
      characterArea.classList.remove('badge-revealed');
    }
  }

  // 9. 信任 > 50 → 半截话提示可见
  if (trustHint) {
    if (tr > 50) {
      trustHint.style.opacity = '0.7';
    } else {
      trustHint.style.opacity = '0';
    }
  }
}

// ---- /debug 控制台命令 ---- //
window.debug = function () {
  const state = {
    ...gameState,
    _heroine: {
      displayName: characters.heroine.name,
      trueName: characters.heroine.trueName,
      fakeName: characters.heroine.fakeName,
      unlocked: gameState.trust >= 60 ? '山田澪' : '(未解锁)',
      identity: (gameState.trust >= 80 && gameState.memories.includes('凌晨班的开发者'))
        ? characters.heroine.identityLayers.layer3
        : (gameState.trust >= 50 ? characters.heroine.identityLayers.layer2 : characters.heroine.identityLayers.layer1)
    },
    _sceneKeys: scenes ? Object.keys(scenes).length + ' scenes' : 'scenes not loaded',
    _scene: scenes && scenes[gameState.currentScene]
      ? { id: gameState.currentScene, time: scenes[gameState.currentScene].time }
      : null
  };
  console.group('🎮 konbini-story GameState (refactored)');
  console.table(state);
  console.log('好感度:', gameState.affection, '/ 100');
  console.log('疲劳值:', gameState.fatigue, '/ 100');
  console.log('信任值:', gameState.trust, '/ 100');
  console.log('吸烟次数:', gameState.smokeSessions);
  console.log('当前身份层:', state._heroine.identity);
  console.log('记忆:', gameState.memories.length ? gameState.memories : '(空)');
  console.log('观察次数:', gameState.observeCount, '/ 3');
  console.log('宵夜已触发:', gameState.foodEventTriggered);
  console.log('雨夜已触发:', gameState.rainEventTriggered);
  console.log('returnScene:', gameState.returnScene);
  console.log('视角切换:', gameState.perspectiveSwitches, '次 → 当前:', gameState.currentPerspective);
  console.log('环境文字定时器:', gameState.ambientTimerId ? '运行中' : '已停止');
  console.log('破绽发现:', gameState.flawCount, '/ 3');
  console.groupEnd();
  return gameState;
};

// ---- 重置游戏 ---- //
function resetGame() {
  gameState.affection = 0;
  gameState.fatigue = 60;
  gameState.trust = 0;
  gameState.currentScene = 'start';
  gameState.memories = [];
  gameState.observeCount = 0;
  gameState.observeUsed = [];
  gameState.trustBase = 0;
  gameState.smokeSessions = 0;
  gameState.perspectiveSwitches = 0;
  gameState.currentPerspective = 'player';
  gameState.flawCount = 0;
  gameState.flawsUsed = [];
  gameState.foodEventTriggered = false;
  gameState.rainEventTriggered = false;
  gameState.returnScene = null;
  stopAmbientText();
  hideCigaretteNote();
  // 清除结局片尾曲遮罩（如果存在）
  const overlay = document.getElementById('ending-overlay');
  if (overlay) overlay.remove();
  if (characterArea) characterArea.classList.remove('perspective-flipped');
  perspectiveUsed.length = 0;
  updateUI();
  updateObserveButton();
  updateSmokeButton();
  updatePerspectiveButton();
  updateFlawButton();
}

// ============================================================
//  事件系统
// ============================================================

/** 完整事件屏蔽列表 */
const EVENT_BLOCKLIST = new Set([
  'start', 'none',
  // 主线结局
  'ending_a', 'ending_b', 'ending_c',
  // 隐藏结局
  'ending_d', 'ending_e', 'ending_f',
  // 观察隐藏线
  'observe_trigger',
  'observe_d1', 'observe_d2', 'observe_d3', 'observe_d4', 'observe_d5',
  'observe_e1', 'observe_e2', 'observe_e3', 'observe_e4', 'observe_e5',
  'observe_f1', 'observe_f2', 'observe_f3', 'observe_f4', 'observe_f5',
  // 宵夜事件
  'food_event', 'food_ochazuke', 'food_ochazuke_2',
  'food_daikon', 'food_daikon_2',
  'food_karage', 'food_karage_2',
  'food_fishcake',
  // 雨夜事件
  'rain_event', 'rain_a1', 'rain_a2', 'rain_b1', 'rain_b2',
  'rain_c1', 'rain_c2', 'rain_c3', 'rain_c3_short',
  'rain_c4', 'rain_c5', 'rain_c6', 'rain_c7', 'rain_c8', 'rain_c9', 'rain_c10',
  // 吸烟场景 — smokeBreak 5 阶段
  'smoke_phase1',
  'smoke_p1_look', 'smoke_p1_silent', 'smoke_p1_light',
  'smoke_phase2',
  'smoke_p2_fast', 'smoke_p2_mint', 'smoke_p2_silent',
  'smoke_phase3',
  'smoke_p3_change', 'smoke_p3_you', 'smoke_p3_clerk',
  'smoke_phase4',
  'smoke_phase5',
  'smoke_p5_side', 'smoke_p5_return', 'smoke_p5_poet', 'smoke_p5_poet_end',
  'smoke_perspective_event',
  'flaw_confront'
]);

function triggerFoodEvent(targetSceneId) {
  if (gameState.foodEventTriggered) return targetSceneId;
  if (gameState.affection <= 20) return targetSceneId;
  if (EVENT_BLOCKLIST.has(targetSceneId)) return targetSceneId;
  if (Math.random() > 0.30) return targetSceneId;

  gameState.foodEventTriggered = true;
  gameState.returnScene = targetSceneId;
  return 'food_event';
}

function triggerRainEvent(targetSceneId) {
  if (gameState.rainEventTriggered) return targetSceneId;
  if (gameState.affection <= 40) return targetSceneId;
  if (gameState.fatigue <= 70) return targetSceneId;
  if (EVENT_BLOCKLIST.has(targetSceneId)) return targetSceneId;
  if (Math.random() > 0.35) return targetSceneId;

  gameState.rainEventTriggered = true;
  gameState.returnScene = targetSceneId;
  return 'rain_event';
}

function checkEvents(sceneId) {
  const afterRain = triggerRainEvent(sceneId);
  if (afterRain !== sceneId) return afterRain;
  return triggerFoodEvent(sceneId);
}

// ---- 场景切换 ---- //
function showScene(sceneId) {
  if (!sceneId) {
    console.warn('[konbini-story] showScene 收到空 sceneId，回退到 none');
    sceneId = 'none';
  }

  const actualSceneId = checkEvents(sceneId);

  const scene = scenes && scenes[actualSceneId];

  if (!scene) {
    console.error('[konbini-story] 场景不存在:', actualSceneId, '→ 回退到 none');
    // 如果不是 none 自身缺失，尝试跳转到 none（仅一次）
    if (actualSceneId !== 'none' && scenes && scenes['none']) {
      showScene('none');
      return;
    }
    // 连 none 都没有，显示硬编码结束屏
    setDialogue(
      '……故事暂告一段落。\n\n' +
      '好感度：' + gameState.affection + '  |  ' +
      '疲劳度：' + gameState.fatigue + '  |  ' +
      '信任值：' + gameState.trust + '\n\n' +
      '回忆：' + (gameState.memories.length > 0 ? gameState.memories.join('、') : '无')
    );
    clearChoices();
    if (choicesBox) {
      const btn = document.createElement('button');
      btn.className = 'choice-btn';
      btn.textContent = '🔄 重新开始';
      btn.addEventListener('click', () => { resetGame(); showScene('start'); });
      choicesBox.appendChild(btn);
    }
    updateUI();
    return;
  }

  gameState.currentScene = actualSceneId;

  // 环境文字：烟雾场景启动，非烟雾场景停止
  const isSmokeScene = actualSceneId.startsWith('smoke_');
  if (isSmokeScene) {
    startAmbientText();
  } else {
    stopAmbientText();
    hideCigaretteNote();
  }

  // 进入烟雾场景时重置视角状态
  if (isSmokeScene) {
    gameState.currentPerspective = 'player';
    if (characterArea) characterArea.classList.remove('perspective-flipped');
    updatePerspectiveButton();
  }

  setDialogue(scene.text || '');
  renderChoices(scene.choices || []);
  updateUI();

  // 结局场景 → 延迟 3 秒触发片尾曲跳转
  if (actualSceneId.startsWith('ending_')) {
    setTimeout(() => triggerEndingWithBGM(), 3000);
  }

  // 场景切换后尝试注入破绽提示
  if (!isSmokeScene) {
    injectFlawHint();
  }
}

// ---- 启动游戏 ---- //
document.addEventListener('DOMContentLoaded', () => {
  if (observeBtn) observeBtn.addEventListener('click', onObserve);
  if (smokeBtn) smokeBtn.addEventListener('click', onSmoke);
  if (perspectiveBtn) perspectiveBtn.addEventListener('click', onPerspectiveSwitch);
  if (flawBtn) flawBtn.addEventListener('click', onFlaw);

  updateObserveButton();
  updateSmokeButton();
  updatePerspectiveButton();
  updateFlawButton();
  updateUI();
  showScene('start');

  console.log(
    '%c🍙 konbini-story 已启动 (refactored) %c| %c输入 %cdebug()%c 查看游戏状态',
    'font-size:16px', '',
    '', 'font-weight:bold;color:#D4687C', ''
  );
  console.log(
    '%c  新系统: 信任值 (trust) | 吸烟累计 (smokeSessions) | 双重身份',
    'color:#8B7355'
  );
});
