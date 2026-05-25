(function() {
    'use strict';

    const VideoExportModule = {
        isExporting: false,

        startExport: async function() {
            if (this.isExporting) return;
            this.isExporting = true;

            const btn = document.getElementById('export-video-btn');
            const originalBtnHtml = btn.innerHTML;
            btn.innerHTML = `<svg class="animate-spin w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> <span>錄製中...</span>`;
            btn.disabled = true;

            try {
                // 1. Capture the static DOM using html2canvas
                const target = document.getElementById('capture-area');
                if (!target) throw new Error('Capture area not found');

                target.classList.add('export-vertical');

                const staticCanvas = await html2canvas(target, {
                    scale: 2,
                    backgroundColor: '#0f172a',
                    logging: false,
                    useCORS: true
                });

                target.classList.remove('export-vertical');


                // 2. Setup recording canvas
                const canvas = document.createElement('canvas');
                canvas.width = staticCanvas.width;
                canvas.height = staticCanvas.height;
                const ctx = canvas.getContext('2d');

                // 3. Setup particles
                const particles = [];
                for(let i=0; i<50; i++) {
                    particles.push({
                        x: Math.random() * canvas.width,
                        y: Math.random() * canvas.height,
                        vx: (Math.random() - 0.5) * 2,
                        vy: (Math.random() - 0.5) * 2,
                        r: Math.random() * 4 + 1,
                        alpha: Math.random()
                    });
                }

                // 4. Setup MediaRecorder
                const stream = canvas.captureStream(30);
                const options = { mimeType: 'video/webm; codecs=vp9' };
                let recorder;
                try {
                    recorder = new MediaRecorder(stream, options);
                } catch(e) {
                    // Fallback
                    recorder = new MediaRecorder(stream);
                }

                const chunks = [];
                recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
                
                const recordingPromise = new Promise((resolve) => {
                    recorder.onstop = () => {
                        const blob = new Blob(chunks, { type: 'video/webm' });
                        resolve(blob);
                    };
                });

                recorder.start();

                // 5. Animation loop
                let animationId;
                const duration = 4000; // Record for 4 seconds
                const startTime = Date.now();

                function draw() {
                    const elapsed = Date.now() - startTime;
                    if (elapsed > duration) {
                        recorder.stop();
                        cancelAnimationFrame(animationId);
                        return;
                    }

                    // Draw static background
                    ctx.drawImage(staticCanvas, 0, 0);

                    // Overlay some dynamic effect (e.g., scanning line or pulsing border)
                    const progress = elapsed / duration;
                    const scanY = (canvas.height + 200) * progress - 100;

                    ctx.fillStyle = 'rgba(56, 189, 248, 0.15)'; // Cyan tint
                    ctx.fillRect(0, scanY, canvas.width, 100);

                    // Draw particles
                    particles.forEach(p => {
                        p.x += p.vx;
                        p.y += p.vy;
                        if(p.x < 0) p.x = canvas.width;
                        if(p.x > canvas.width) p.x = 0;
                        if(p.y < 0) p.y = canvas.height;
                        if(p.y > canvas.height) p.y = 0;

                        ctx.beginPath();
                        ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
                        ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
                        ctx.fill();
                    });

                    animationId = requestAnimationFrame(draw);
                }
                
                draw();

                // 6. Wait for recording to finish
                const videoBlob = await recordingPromise;
                
                // 7. Download
                const userName = window.QuizState?.finalUserName || 'User';
                const url = URL.createObjectURL(videoBlob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = `MBTI64-${userName}-Animated.webm`;
                document.body.appendChild(a);
                a.click();
                
                setTimeout(() => {
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                }, 100);

                if (typeof MBTI64Utils !== 'undefined') MBTI64Utils.showToast('✅ 影片匯出成功！');

            } catch (err) {
                console.error('[VideoExport]', err);
                alert('影片匯出失敗，請確認您的瀏覽器是否支援 MediaRecorder API。');
            } finally {
                this.isExporting = false;
                btn.innerHTML = originalBtnHtml;
                btn.disabled = false;
            }
        }
    };

    window.VideoExportModule = VideoExportModule;
})();
