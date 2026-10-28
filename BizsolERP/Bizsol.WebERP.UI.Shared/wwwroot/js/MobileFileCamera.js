(function () {
    var activeInput = null;
    var cameraStream = null;
    var openToken = 0;

    function isMobileDevice() {
        var ua = navigator.userAgent || navigator.vendor || '';
        if (/Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(ua)) {
            return true;
        }
        return navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
    }

    if (!isMobileDevice()) {
        return;
    }

    function isCameraFileInput(el) {
        return !!(el && el.tagName === 'INPUT' && el.type === 'file' && el.hasAttribute('capture')
            && !(el.closest && el.closest('#ScanQRCodeByCameraControlModal')));
    }

    function ensurePanel() {
        var panel = document.getElementById('bizsolMobileCameraPanel');
        if (panel) {
            return panel;
        }
        var style = document.createElement('style');
        style.textContent = ''
            + '#bizsolMobileCameraPanel{display:none;position:fixed;left:0;top:0;right:0;bottom:0;z-index:2147483000;background:#000;flex-direction:column;}'
            + '#bizsolMobileCameraPanel.is-open{display:flex;}'
            + '#bizsolMobileCameraPanel video{width:100%;flex:1 1 auto;min-height:0;object-fit:cover;background:#000;}'
            + '#bizsolMobileCameraPanel .bizsol-camera-actions{display:flex;gap:8px;padding:12px;padding-bottom:calc(12px + env(safe-area-inset-bottom));background:#fff;}'
            + '#bizsolMobileCameraPanel .bizsol-camera-actions .btn{flex:1;min-height:48px;font-size:16px;}';
        document.head.appendChild(style);

        panel = document.createElement('div');
        panel.id = 'bizsolMobileCameraPanel';
        panel.innerHTML = ''
            + '<video id="bizsolMobileCameraVideo" playsinline webkit-playsinline muted autoplay></video>'
            + '<div class="bizsol-camera-actions">'
            + '<button type="button" class="btn btn-success" id="bizsolMobileCameraCapture">Capture</button>'
            + '<button type="button" class="btn btn-danger" id="bizsolMobileCameraClose">Close Camera</button>'
            + '</div>';
        document.body.appendChild(panel);

        var video = panel.querySelector('video');
        video.playsInline = true;
        video.muted = true;
        panel.querySelector('#bizsolMobileCameraClose').addEventListener('click', closeCamera);
        panel.querySelector('#bizsolMobileCameraCapture').addEventListener('click', capturePhoto);
        return panel;
    }

    function closeCamera() {
        openToken++;
        if (cameraStream) {
            cameraStream.getTracks().forEach(function (track) { track.stop(); });
            cameraStream = null;
        }
        var video = document.getElementById('bizsolMobileCameraVideo');
        if (video) {
            video.pause();
            video.srcObject = null;
        }
        var panel = document.getElementById('bizsolMobileCameraPanel');
        if (panel) {
            panel.classList.remove('is-open');
        }
        activeInput = null;
    }

    function openCamera(input) {
        var token = ++openToken;
        activeInput = input;
        ensurePanel().classList.add('is-open');
        navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: 'environment' } },
            audio: false
        }).then(function (stream) {
            if (token !== openToken) {
                stream.getTracks().forEach(function (track) { track.stop(); });
                return;
            }
            cameraStream = stream;
            var video = document.getElementById('bizsolMobileCameraVideo');
            video.srcObject = stream;
            var playPromise = video.play();
            if (playPromise && playPromise.catch) {
                playPromise.catch(function (err) { console.log(err); });
            }
        }).catch(function () {
            if (token !== openToken) {
                return;
            }
            closeCamera();
            if (window.toastr) {
                toastr.error('Unable to open the camera. Please allow camera access.');
            }
        });
    }

    function capturePhoto() {
        var video = document.getElementById('bizsolMobileCameraVideo');
        var input = activeInput;
        if (!input || !video || !video.videoWidth) {
            return;
        }
        var canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);
        canvas.toBlob(function (blob) {
            if (!blob) {
                return;
            }
            try {
                var dataTransfer = new DataTransfer();
                dataTransfer.items.add(new File([blob], 'camera-photo.jpg', { type: 'image/jpeg' }));
                input.files = dataTransfer.files;
            } catch (err) {
                console.log(err);
                return;
            }
            closeCamera();
            input.dispatchEvent(new Event('change', { bubbles: true }));
        }, 'image/jpeg', 0.9);
    }

    document.addEventListener('click', function (event) {
        var input = event.target;
        if (!isCameraFileInput(input) || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            return;
        }
        event.preventDefault();
        openCamera(input);
    }, true);

    document.addEventListener('visibilitychange', function () {
        if (document.hidden) {
            closeCamera();
        }
    });
})();
