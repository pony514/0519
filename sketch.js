let video;
let hands;
let camera;
let handResults = null;

// 遊戲變數
let gameState = "WAITING"; // WAITING, COUNTING, RESULT
let timer = 3;
let lastTime = 0;
let playerChoice = "";
let aiChoice = "";
let gameResult = "";
let choices = ["石頭", "剪刀", "布"];

function setup() {
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
  background(34);
  
  push();
  translate(width, 0); // 鏡像處理
  scale(-1, 1); 
  image(video, 0, 0, width, height);
  
  if (handResults && handResults.multiHandLandmarks) {
    for (const landmarks of handResults.multiHandLandmarks) {
      drawSkeleton(landmarks);
      let gesture = getGesture(landmarks);
      playerChoice = gesture;

      // 手勢控制邏輯
      if (gesture === "ROCK") {
        gameState = "WAITING";
      } else if (gameState === "RESULT" && gesture === "OK") {
        startNewGame();
      }
    }
  }
  pop();

  // UI 層
  drawUI();
  
  // 遊戲邏輯處理
  if (gameState === "COUNTING") {
    if (millis() - lastTime > 1000) {
      timer--;
      lastTime = millis();
      if (timer <= 0) {
        executeBattle();
      }
    }
  }
}

function drawSkeleton(landmarks) {
  // 定義手指連線路徑
  const connections = [
    [0, 1, 2, 3, 4],     // 大拇指
    [0, 5, 6, 7, 8],     // 食指
    [9, 10, 11, 12],     // 中指
    [13, 14, 15, 16],    // 無名指
    [17, 18, 19, 20],    // 小拇指
    [0, 17], [5, 9], [9, 13], [13, 17] // 掌心
  ];

  stroke(0, 255, 0);
  strokeWeight(4);
  for (let path of connections) {
    for (let i = 0; i < path.length - 1; i++) {
      let a = landmarks[path[i]];
      let b = landmarks[path[i+1]];
      line(a.x * width, a.y * height, b.x * width, b.y * height);
    }
  }

  fill(255);
  noStroke();
  for (let pt of landmarks) {
    circle(pt.x * width, pt.y * height, 8);
  }
}

function getGesture(landmarks) {
  // 判斷手指是否伸直 (Tip 的 Y 軸座標比 PIP 的 Y 軸座標小，代表伸直)
  let isIndexUp = landmarks[8].y < landmarks[6].y;
  let isMiddleUp = landmarks[12].y < landmarks[10].y;
  let isRingUp = landmarks[16].y < landmarks[14].y;
  let isPinkyUp = landmarks[20].y < landmarks[18].y;

  // 計算拇指尖與食指尖的距離 (標準化座標 0~1)
  let thumbIndexDist = dist(landmarks[4].x, landmarks[4].y, landmarks[8].x, landmarks[8].y);

  // OK 手勢: 拇指食指碰觸，其餘三指伸直
  if (thumbIndexDist < 0.05 && isMiddleUp && isRingUp && isPinkyUp) return "OK";
  // ROCK 手勢: 食指小指伸直，中指無名指彎曲
  if (isIndexUp && isPinkyUp && !isMiddleUp && !isRingUp) return "ROCK";

  if (isIndexUp && isMiddleUp && isRingUp && isPinkyUp) return "布";
  if (isIndexUp && isMiddleUp && !isRingUp && !isPinkyUp) return "剪刀";
  if (!isIndexUp && !isMiddleUp && !isRingUp && !isPinkyUp) return "石頭";
  return "偵測中...";
}

function executeBattle() {
  aiChoice = random(choices);
  if (playerChoice === aiChoice) {
    gameResult = "平手！";
  } else if (
    (playerChoice === "石頭" && aiChoice === "剪刀") ||
    (playerChoice === "剪刀" && aiChoice === "布") ||
    (playerChoice === "布" && aiChoice === "石頭")
  ) {
    gameResult = "你贏了！";
  } else {
    gameResult = "你輸了！";
  }
  gameState = "RESULT";
}

function drawUI() {
  textAlign(CENTER, CENTER);
  textSize(32);
  fill(255);
  
  if (gameState === "WAITING") {
    rectMode(CENTER);
    fill(0, 150);
    rect(width/2, height/2, 400, 100);
    fill(255);
    text("點擊畫面開始遊戲", width/2, height/2);
  } else if (gameState === "COUNTING") {
    textSize(100);
    fill(255, 204, 0);
    text(timer, width/2, height/2);
    textSize(32);
    text("目前出拳: " + playerChoice, width/2, height/2 + 80);
  } else if (gameState === "RESULT") {
    fill(0, 180);
    rect(width/2, height/2, 500, 300, 20);
    fill(255);
    textSize(48);
    text(gameResult, width/2, height/2 - 60);
    textSize(24);
    text(`玩家: ${playerChoice}  VS  AI: ${aiChoice}`, width/2, height/2 + 10);
    fill(100, 255, 100);
    text("比 OK 手勢進行下一局", width/2, height/2 + 70);
    fill(255, 100, 100);
    text("比 ROCK 手勢結束遊戲", width/2, height/2 + 105);
  }
}

function startNewGame() {
  gameState = "COUNTING";
  timer = 3;
  lastTime = millis();
  gameResult = "";
}

function mousePressed() {
  if (gameState === "WAITING" || gameState === "RESULT") {
    startNewGame();
  }
}
