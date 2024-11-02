const video = document.getElementById('video');
const canvas = document.getElementById('output');
const ctx = canvas.getContext('2d');
let detector;

async function loadMoveNet() {
    console.log("MoveNetモデルを読み込み中...");
    const model = poseDetection.SupportedModels.MoveNet;
    detector = await poseDetection.createDetector(model);
    console.log("MoveNetモデルのロード完了");
}

// Webカメラからのストリームを設定
async function setupVideo() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false // 音声は不要ならfalse
        });
        video.srcObject = stream;
        video.onloadeddata = async () => {
            console.log("Webカメラからのストリームが開始されました");
            await loadMoveNet(); // MoveNetモデルをロード
            detectPose(); // 姿勢検出開始
        };
    } catch (error) {
        console.error("カメラの設定中にエラーが発生しました:", error);
    }
}


// 姿勢検出と描画
async function detectPose() {
    console.log("姿勢検出を開始します");
    async function renderFrame() {
        const poses = await detector.estimatePoses(video);
        console.log("姿勢が検出されました:", poses);

        // Canvasをクリア
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 各関節を描画
        poses.forEach((pose) => {
            pose.keypoints.forEach((keypoint) => {
                if (keypoint.score > 0.5) { // 信頼度が一定以上の関節のみを描画
                    ctx.beginPath();
                    ctx.arc(keypoint.x + 100, keypoint.y + 500, 5, 0, 2 * Math.PI);
                    ctx.fillStyle = 'green';
                    ctx.fill();
                    console.log(`関節ポイント描画: (${keypoint.x + 100}, ${keypoint.y + 500})`);
                }
            });

            // 点と点を線でつなぐ
            const adjacentPairs = poseDetection.util.getAdjacentPairs(poseDetection.SupportedModels.MoveNet);
            adjacentPairs.forEach(([i, j]) => {
                const kp1 = pose.keypoints[i];
                const kp2 = pose.keypoints[j];
                if (kp1.score > 0.5 && kp2.score > 0.5) {
                    ctx.beginPath();
                    ctx.moveTo(kp1.x + 100, kp1.y + 500);
                    ctx.lineTo(kp2.x + 100, kp2.y + 500);
                    ctx.strokeStyle = 'black';
                    ctx.lineWidth = 15;
                    ctx.stroke();
                    console.log(`線描画: (${kp1.x + 100}, ${kp1.y} + 500) から (${kp2.x + 100}, ${kp2.y + 500})`);
                }
            });
        });

        requestAnimationFrame(renderFrame); // 次のフレームで再度呼び出し
    }

    renderFrame();
}

// メイン処理を開始
setupVideo();
