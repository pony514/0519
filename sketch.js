<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <title>MediaPipe 手部感應遊戲</title>
  <script src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js" crossorigin="anonymous"></script>
  <script src="https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js" crossorigin="anonymous"></script>
  <style>
    body { margin: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #222; color: white; font-family: sans-serif; }
    .container { position: relative; width: 640px; height: 480px; }
    #video_input { display: none; }
    #canvas_output { border-radius: 10px; border: 4px solid #444; width: 100%; height: 100%; transform: scaleX(-1); } /* 鏡像顯示 */
    #ui { position: absolute; top: 10px; left: 10px; font-size: 24px; text-shadow: 2px 2px 4px rgba(0,0,0,0.5); pointer-events: none; }
  </style>
</head>
<body>

  <h1>手部感應碰碰球</h1>
  <div class="container">
    <video id="video_input"></video>
    <canvas id="canvas_output"></canvas>
    <div id="ui">分數: <span id="score">0</span></div>
  </div>

  <script>
    const videoElement = document.getElementById('video_input');
    const canvasElement = document.getElementById('canvas_output');
    const canvasCtx = canvasElement.getContext('2d');
    const scoreElement = document.getElementById('score');

    let score = 0;
    let target = { x: 300, y: 200, radius: 30 };

    // 初始化畫布大小
    canvasElement.width = 640;
    canvasElement.height = 480;

    // 當偵測到手部後的處理邏輯
    function onResults(results) {
      // 1. 繪製視訊畫面
      canvasCtx.save();
      canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
      canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

      // 2. 繪製目標球
      canvasCtx.beginPath();
      canvasCtx.arc(target.x, target.y, target.radius, 0, 2 * Math.PI);
      canvasCtx.fillStyle = 'red';
      canvasCtx.fill();

      // 3. 處理手部點位
      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        for (const landmarks of results.multiHandLandmarks) {
          // 食指尖端的索引是 8
          const indexFingerTip = landmarks[8];
          
          // 將標準化座標 (0-1) 轉換為畫布座標
          const x = indexFingerTip.x * canvasElement.width;
          const y = indexFingerTip.y * canvasElement.height;

          // 繪製食指指尖位置（選配，幫助除錯）
          canvasCtx.beginPath();
          canvasCtx.arc(x, y, 10, 0, 2 * Math.PI);
          canvasCtx.fillStyle = 'yellow';
          canvasCtx.fill();

          // 碰撞檢測：計算指尖與目標的距離
          const dist = Math.hypot(x - target.x, y - target.y);
          if (dist < target.radius) {
            score += 1;
            scoreElement.innerText = score;
            respawnTarget();
          }
        }
      }
      canvasCtx.restore();
    }

    // 隨機移動目標球
    function respawnTarget() {
      target.x = Math.random() * (canvasElement.width - 60) + 30;
      target.y = Math.random() * (canvasElement.height - 60) + 30;
    }

    // 設定 MediaPipe Hands
    const hands = new Hands({
      locateFile: (file) => `<https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}>`
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    hands.onResults(onResults);

    // 設定攝影機
    const camera = new Camera(videoElement, {
      onFrame: async () => {
        await hands.send({image: videoElement});
      },
      width: 640,
      height: 480
    });
    camera.start();
  </script>
</body>
</html>
function setup() {
  createCanvas(400, 400);
}

function draw() {
  background(220);
}
