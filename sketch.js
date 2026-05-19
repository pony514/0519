let video;
let hands;
let camera;
let score = 0;
let target = { x: 300, y: 200, radius: 30 };
let handResults = null;

function setup() {
  // 建立畫布並放入指定容器
  let cnv = createCanvas(640, 480);
  cnv.parent('canvas-container');

  // 初始化攝影機
  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide(); // 隱藏原生 HTML 標籤，改用 p5 image() 繪製

  // 初始化 MediaPipe Hands
  hands = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
  });

  hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
  });

  // 接收 MediaPipe 回傳結果
  hands.onResults((results) => {
    handResults = results;
  });

  // 啟動 MediaPipe Camera 輔助工具
  camera = new Camera(video.elt, {
    onFrame: async () => {
      await hands.send({ image: video.elt });
    },
    width: 640,
    height: 480
  });
  camera.start();
}

function draw() {
  // 繪製背景
  background(0);

  // 水平翻轉畫布（讓操作像照鏡子）
  push();
  translate(width, 0);
  scale(-1, 1);

  // 1. 繪製攝影機畫面
  image(video, 0, 0, width, height);

  // 2. 繪製目標紅球
  fill(255, 0, 0);
  noStroke();
  circle(target.x, target.y, target.radius * 2);

  // 3. 處理偵測結果
  if (handResults && handResults.multiHandLandmarks) {
    for (const landmarks of handResults.multiHandLandmarks) {
      const indexFinger = landmarks[8]; // 食指指尖
      const x = indexFinger.x * width;
      const y = indexFinger.y * height;

      // 繪製指尖位置
      fill(255, 255, 0);
      circle(x, y, 20);

      // 碰撞檢測
      if (dist(x, y, target.x, target.y) < target.radius) {
        score++;
        select('#score').html(score); // 更新 HTML 中的分數
        respawnTarget();
      }
    }
  }
  pop();
}

function respawnTarget() {
  target.x = random(target.radius, width - target.radius);
  target.y = random(target.radius, height - target.radius);
}
