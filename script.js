const video = document.getElementById('video');
const canvas = document.getElementById('output');
const ctx = canvas.getContext('2d');
let detector;
const specifiedDeviceId = "dad1e0bab1626ec0fe8c828e777be3b735059a837bfd1c15c17797a8e169834d"; // The specific device ID

async function setupCamera() {
    try {
        const constraints = {
            video: {
                deviceId: { exact: specifiedDeviceId } // 指定したデバイスIDを正確に入力
            }
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = stream;
        await video.play();
        
        console.log("指定されたデバイスIDでカメラが正常に初期化されました。");
    } catch (error) {
        console.error("指定されたカメラへのアクセス中にエラーが発生しました:", error);

        if (error.name === "NotReadableError") {
            alert("カメラにアクセスできません。他のアプリケーションが使用している可能性があります。");
        }
    }
}

async function loadMoveNet() {
    console.log("Loading MoveNet model...");
    const model = poseDetection.SupportedModels.MoveNet;
    detector = await poseDetection.createDetector(model);
    console.log("MoveNet model loaded.");
}

async function detectPose() {
    console.log("Starting pose detection...");
    async function renderFrame() {
        const poses = await detector.estimatePoses(video);
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        poses.forEach((pose) => {
            pose.keypoints.forEach((keypoint) => {
                if (keypoint.score > 0.5) {
                    ctx.beginPath();
                    ctx.arc(keypoint.x, keypoint.y, 5, 0, 2 * Math.PI);
                    ctx.fillStyle = 'green';
                    ctx.fill();
                }
            });

            const adjacentPairs = poseDetection.util.getAdjacentPairs(poseDetection.SupportedModels.MoveNet);
            adjacentPairs.forEach(([i, j]) => {
                const kp1 = pose.keypoints[i];
                const kp2 = pose.keypoints[j];
                if (kp1.score > 0.5 && kp2.score > 0.5) {
                    ctx.beginPath();
                    ctx.moveTo(kp1.x, kp1.y);
                    ctx.lineTo(kp2.x, kp2.y);
                    ctx.strokeStyle = 'black';
                    ctx.lineWidth = 15;
                    ctx.stroke();
                }
            });
        });

        requestAnimationFrame(renderFrame);
    }

    renderFrame();
}

async function start() {
    async function start() {
        await setupCamera();
        
        // videoのメタデータ読み込み後に寸法を設定
        video.addEventListener('loadedmetadata', () => {
            video.width = video.videoWidth;
            video.height = video.videoHeight;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            
            console.log("ビデオとキャンバスの寸法を設定しました。");
        });
    
        await loadMoveNet();
        detectPose();
    }    
}

start();