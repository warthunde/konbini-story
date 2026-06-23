/* ========================================
   konbini-story — Canvas 几何立绘
   田山(左) + 山田(右) · 纯几何分解
   ======================================== */

(function () {
  'use strict';

  const W = 700, H = 550;
  let canvas, ctx;
  let stars = [];          // 星光坐标池
  let smokeFrame = 0;      // 烟雾动画帧
  let animId = null;

  // ---- 初始化 ---- //
  function init() {
    const area = document.getElementById('character-area');
    if (!area) return;

    // 清除旧内容，创建 canvas
    area.innerHTML = '';
    canvas = document.createElement('canvas');
    canvas.id = 'standee-canvas';
    canvas.width = W;
    canvas.height = H;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    area.appendChild(canvas);

    ctx = canvas.getContext('2d');

    // 生成星光
    generateStars();

    // 启动动画循环
    animate();
  }

  function generateStars() {
    stars = [];
    const count = 70;
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: 1 + Math.random() * 3,
        opacity: 0.2 + Math.random() * 0.6,
        twinkleSpeed: 0.005 + Math.random() * 0.02,
        twinkleOffset: Math.random() * Math.PI * 2
      });
    }
  }

  // ---- 动画循环 ---- //
  function animate() {
    drawFrame();
    smokeFrame++;
    animId = requestAnimationFrame(animate);
  }

  // ---- 绘制工具 ---- //
  function rect(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  }

  function oval(x, y, rx, ry, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function circle(x, y, r, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  function arcLine(x, y, r, startAngle, endAngle, color, lineWidth) {
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth || 1.5;
    ctx.beginPath();
    ctx.arc(x, y, r, startAngle, endAngle);
    ctx.stroke();
  }

  function polygon(points, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i][0], points[i][1]);
    }
    ctx.closePath();
    ctx.fill();
  }

  function strokeLine(x1, y1, x2, y2, color, lineWidth) {
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth || 1;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  function strokePolygon(points, color, lineWidth) {
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth || 1;
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i][0], points[i][1]);
    }
    ctx.closePath();
    ctx.stroke();
  }

  // ---- 主绘制帧 ---- //
  function drawFrame() {
    ctx.clearRect(0, 0, W, H);

    // 背景
    drawBackground();
    // 星光
    drawStars();
    // 田山（左）
    drawTazan();
    // 山田（右）
    drawYamada();
    // 交互元素（烟雾、手势）
    drawInteraction();
  }

  // ========================================
  //  背景
  // ========================================
  function drawBackground() {
    rect(0, 0, W, H, '#0B0D2A');
  }

  function drawStars() {
    stars.forEach(s => {
      const twinkle = 0.5 + 0.5 * Math.sin(smokeFrame * s.twinkleSpeed + s.twinkleOffset);
      const alpha = s.opacity * (0.5 + 0.5 * twinkle);
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // ========================================
  //  田山 (左) — 冷御姐
  // ========================================
  function drawTazan() {
    const cx = 200; // 中心 X

    drawTazanLegs(cx);
    drawTazanSkirt(cx);
    drawTazanJacket(cx);
    drawTazanArms(cx);
    drawTazanHead(cx);
    drawTazanCigarette(cx);
  }

  function drawTazanLegs(cx) {
    // 左腿黑丝
    rect(cx - 28, 340, 18, 150, '#1A1A1A');
    // 右腿黑丝
    rect(cx + 10, 340, 18, 150, '#1A1A1A');
    // 腿中线
    strokeLine(cx - 19, 340, cx - 19, 488, '#2A2A2A', 0.5);
    strokeLine(cx + 19, 340, cx + 19, 488, '#2A2A2A', 0.5);

    // 左靴
    rect(cx - 31, 485, 24, 28, '#F0EDE8');
    oval(cx - 19, 514, 13, 5, '#C0B8B0');  // 鞋底
    // 右靴
    rect(cx + 7, 485, 24, 28, '#F0EDE8');
    oval(cx + 19, 514, 13, 5, '#C0B8B0');
  }

  function drawTazanSkirt(cx) {
    // 白色梯形短裙
    polygon([
      [cx - 38, 310],  // 左上
      [cx + 38, 310],  // 右上
      [cx + 42, 355],  // 右下
      [cx - 42, 355]   // 左下
    ], '#F5F0EB');
    // 裙边直线
    strokeLine(cx - 42, 355, cx + 42, 355, '#D0C8C0', 1);
  }

  function drawTazanJacket(cx) {
    // 黑色皮质短夹克主体
    rect(cx - 48, 230, 96, 82, '#1A1A1A');

    // 翻领（两个三角形）
    polygon([[cx - 20, 230], [cx - 8, 260], [cx - 30, 260]], '#222222');
    polygon([[cx + 20, 230], [cx + 30, 260], [cx + 8, 260]], '#222222');

    // 拉链中线
    strokeLine(cx, 232, cx, 310, '#444444', 0.8);

    // 肩膀线
    strokeLine(cx - 48, 240, cx - 48, 250, '#333333', 1);
    strokeLine(cx + 48, 240, cx + 48, 250, '#333333', 1);
  }

  function drawTazanArms(cx) {
    // 左臂自然下垂
    rect(cx - 56, 240, 13, 90, '#1A1A1A');
    oval(cx - 50, 332, 8, 10, '#FDE8D0');  // 左手

    // 右臂弯曲持烟（向外斜）
    ctx.save();
    ctx.translate(cx + 46, 245);
    ctx.rotate(0.35);
    rect(-6, 0, 12, 55, '#1A1A1A');
    oval(0, 60, 8, 10, '#FDE8D0');  // 右手
    ctx.restore();
  }

  function drawTazanHead(cx) {
    // 颈部
    rect(cx - 8, 200, 16, 30, '#FDE8D0');

    // 面部椭圆
    oval(cx, 155, 32, 38, '#FDE8D0');

    // 头发主体（半圆覆盖头顶）
    ctx.fillStyle = '#8B2A3A';
    ctx.beginPath();
    ctx.arc(cx, 155, 34, Math.PI, 0);
    ctx.fill();
    // 头发两侧
    rect(cx - 35, 140, 35, 55, '#8B2A3A');
    rect(cx + 1, 140, 35, 55, '#8B2A3A');
    // 头顶圆角
    oval(cx - 20, 128, 20, 15, '#8B2A3A');
    oval(cx + 20, 128, 20, 15, '#8B2A3A');
    // 覆盖层让面部重新露出
    oval(cx, 158, 30, 35, '#FDE8D0');
    // 侧发遮回
    rect(cx - 34, 140, 14, 52, '#8B2A3A');
    rect(cx + 20, 140, 14, 52, '#8B2A3A');

    // 眼睛（两个深棕椭圆，平静直线瞳孔）
    oval(cx - 10, 150, 5, 3.5, '#3D2B1F');
    oval(cx + 10, 150, 5, 3.5, '#3D2B1F');
    // 瞳孔高光
    circle(cx - 9, 149, 1.2, 'rgba(255,255,255,0.6)');
    circle(cx + 11, 149, 1.2, 'rgba(255,255,255,0.6)');

    // 眉毛（细直线，微挑）
    strokeLine(cx - 16, 141, cx - 5, 138, '#5A3A3A', 1.2);
    strokeLine(cx + 16, 141, cx + 5, 138, '#5A3A3A', 1.2);

    // 嘴巴（水平直线）
    strokeLine(cx - 7, 168, cx + 7, 168, '#C08080', 1);
  }

  function drawTazanCigarette(cx) {
    const sx = cx + 62, sy = 302;
    // 烟身
    rect(sx - 20, sy - 2, 20, 3.5, '#F5EDE3');
    // 过滤嘴
    rect(sx - 20, sy - 2.5, 6, 4.5, '#D4C0A0');
    // 烟头
    oval(sx - 20, sy, 2.5, 2.5, '#E8841A');
    // 火星
    circle(sx - 20, sy, 4, 'rgba(255,140,30,0.5)');
  }

  // ========================================
  //  山田 (右) — 开心店员
  // ========================================
  function drawYamada() {
    const cx = 490;

    drawYamadaLegs(cx);
    drawYamadaShoes(cx);
    drawYamadaShirt(cx);
    drawYamadaApron(cx);
    drawYamadaArms(cx);
    drawYamadaHead(cx);
  }

  function drawYamadaLegs(cx) {
    // 黑长裤
    rect(cx - 28, 330, 22, 155, '#1A1A1A');
    rect(cx + 6, 330, 22, 155, '#1A1A1A');
    // 裤中线
    strokeLine(cx - 17, 330, cx - 17, 483, '#2E2E2E', 0.5);
    strokeLine(cx + 17, 330, cx + 17, 483, '#2E2E2E', 0.5);
  }

  function drawYamadaShoes(cx) {
    // 黑皮鞋
    rect(cx - 32, 483, 26, 18, '#1A1A1A');
    oval(cx - 19, 504, 14, 6, '#333333');
    rect(cx + 6, 483, 26, 18, '#1A1A1A');
    oval(cx + 19, 504, 14, 6, '#333333');
    // 鞋面高光
    strokeLine(cx - 25, 485, cx - 15, 485, '#3A3A3A', 0.8);
    strokeLine(cx + 10, 485, cx + 22, 485, '#3A3A3A', 0.8);
  }

  function drawYamadaShirt(cx) {
    // 米色长袖衬衫
    rect(cx - 43, 245, 86, 88, '#F5EDE3');
    // 领口
    polygon([[cx - 12, 245], [cx, 268], [cx + 12, 245]], '#F5EDE3');
    strokePolygon([[cx - 12, 245], [cx, 268], [cx + 12, 245]], '#D0C8B8', 1);

    // 左袖口
    rect(cx - 53, 300, 10, 18, '#F5EDE3');
    strokeLine(cx - 53, 300, cx - 43, 300, '#D0C8B8', 0.8);
    // 右袖口
    rect(cx + 43, 295, 10, 18, '#F5EDE3');
    strokeLine(cx + 43, 295, cx + 53, 295, '#D0C8B8', 0.8);
  }

  function drawYamadaApron(cx) {
    // 红色围裙工装（梯形）
    polygon([
      [cx - 33, 260],
      [cx + 33, 260],
      [cx + 40, 340],
      [cx - 40, 340]
    ], '#C42E2E');

    // 围裙边缘深红描边
    strokePolygon([
      [cx - 33, 260],
      [cx + 33, 260],
      [cx + 40, 340],
      [cx - 40, 340]
    ], '#8B1A1A', 1.5);

    // 围裙系带（脖子后圆弧）
    arcLine(cx, 248, 26, Math.PI * 0.85, Math.PI * 0.15, '#A02020', 2);

    // 腰后系带
    strokeLine(cx - 46, 300, cx - 56, 315, '#A02020', 1.5);
    strokeLine(cx + 46, 300, cx + 56, 315, '#A02020', 1.5);

    // 围裙口袋
    rect(cx - 15, 290, 30, 20, '#B52828');
    strokeLine(cx - 15, 290, cx + 15, 290, '#8B1A1A', 1);

    // 胸前小标签
    rect(cx - 5, 268, 10, 12, '#F5EDE3');
    strokeLine(cx - 5, 268, cx + 5, 268, '#8B1A1A', 0.5);
  }

  function drawYamadaArms(cx) {
    // 左臂自然下垂
    rect(cx - 52, 248, 14, 82, '#F5EDE3');
    // 左手（自然张开）
    oval(cx - 45, 333, 6, 8, '#FDE8D0');

    // 右臂微微抬起（打招呼姿态）
    ctx.save();
    ctx.translate(cx + 38, 252);
    ctx.rotate(-0.4);
    rect(0, -5, 14, 65, '#F5EDE3');
    // 右手掌
    oval(7, -15, 8, 9, '#FDE8D0');
    ctx.restore();
  }

  function drawYamadaHead(cx) {
    // 颈部
    rect(cx - 7, 210, 16, 32, '#FDE8D0');

    // 面部椭圆
    oval(cx, 172, 33, 40, '#FDE8D0');

    // 头发（酒红色齐短发）
    ctx.fillStyle = '#8B2A3A';
    ctx.beginPath();
    ctx.arc(cx, 172, 35, Math.PI, 0);
    ctx.fill();
    rect(cx - 36, 150, 36, 62, '#8B2A3A');
    rect(cx + 1, 150, 36, 62, '#8B2A3A');
    oval(cx - 22, 142, 20, 14, '#8B2A3A');
    oval(cx + 22, 142, 20, 14, '#8B2A3A');
    // 重新露出面部
    oval(cx, 175, 31, 36, '#FDE8D0');
    // 侧发
    rect(cx - 35, 155, 15, 55, '#8B2A3A');
    rect(cx + 20, 155, 15, 55, '#8B2A3A');

    // 红色发箍
    rect(cx - 28, 134, 56, 7, '#C42E2E');
    // 发箍高光
    oval(cx - 8, 136, 10, 2, 'rgba(255,255,255,0.3)');

    // 眼睛（笑眼——大椭圆 + 上方弧线）
    oval(cx - 11, 165, 6, 5, '#3D2B1F');
    oval(cx + 11, 165, 6, 5, '#3D2B1F');
    // 瞳孔高光
    circle(cx - 10, 164, 1.5, 'rgba(255,255,255,0.7)');
    circle(cx + 12, 164, 1.5, 'rgba(255,255,255,0.7)');
    // 笑眼弧线（眼睛下方弯月形）
    arcLine(cx - 11, 168, 8, 0.3, Math.PI - 0.3, '#5A3A3A', 1);
    arcLine(cx + 11, 168, 8, 0.3, Math.PI - 0.3, '#5A3A3A', 1);

    // 眉毛
    arcLine(cx - 11, 158, 9, Math.PI + 0.2, Math.PI * 2 - 0.2, '#5A3A3A', 1);
    arcLine(cx + 11, 158, 9, Math.PI + 0.2, Math.PI * 2 - 0.2, '#5A3A3A', 1);

    // 嘴巴（张开笑）
    oval(cx, 186, 7, 8, '#7A2020');
    // 牙齿
    rect(cx - 3, 184, 6, 3, '#FFFFFF');
    // 下唇弧线
    arcLine(cx, 190, 5, 0.1, Math.PI - 0.1, '#C08080', 0.8);
  }

  // ========================================
  //  交互元素
  // ========================================
  function drawInteraction() {
    // ---- 田山香烟烟雾（向右飘向山田） ---- //
    const smokeBase = { x: 240, y: 298 };
    const smokeArcCount = 4;
    const driftSpeed = 0.003;

    for (let i = 0; i < smokeArcCount; i++) {
      const t = smokeFrame * driftSpeed + i * 0.8;
      const offX = i * 20 + Math.sin(t * 2) * 10;
      const offY = -i * 22 + Math.cos(t * 1.5) * 8;
      const fade = Math.max(0, 1 - i * 0.22 - (smokeFrame % 180) / 250);

      ctx.strokeStyle = `rgba(180,180,190,${fade * 0.5})`;
      ctx.lineWidth = 2.5 - i * 0.4;
      ctx.beginPath();
      ctx.arc(
        smokeBase.x + offX,
        smokeBase.y + offY,
        8 + i * 3,
        Math.PI * 0.2,
        Math.PI * 1.8
      );
      ctx.stroke();
    }

    // ---- 山田右手招呼手势（小弧线） ---- //
    const handX = 530, handY = 248;
    arcLine(handX, handY, 12, -0.6, 0.6, '#F5EDE3', 2);
    // 手指（三条短线）
    strokeLine(handX + 10, handY - 6, handX + 18, handY - 12, '#F5EDE3', 2);
    strokeLine(handX + 11, handY - 2, handX + 20, handY - 4, '#F5EDE3', 2);
    strokeLine(handX + 10, handY + 2, handX + 18, handY + 4, '#F5EDE3', 2);
  }

  // ---- 启动 ---- //
  document.addEventListener('DOMContentLoaded', init);

  // 暴露给外部：当角色区需要重建时调用
  window.initStandee = init;

})();
