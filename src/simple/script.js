let wakeLock;
let locks = 0;

const requestWakeLock = async () => {
    if ('wakeLock' in navigator && document.visibilityState === 'visible') {
        console.log('request wakelock');
        wakeLock = await navigator.wakeLock.request('screen');
        locks++;
    }
};

const releaseWakeLock = async () => {
    if ('wakeLock' in navigator) {
        console.log('release wakelock');

        if (locks) {
            locks--;
        } else {
            return;
        }

        if (wakeLock) {
            await wakeLock.release().then(() => {
                wakeLock = null;
            });
        }
    }
};

if ('wakeLock' in navigator) {
    document.addEventListener('visibilitychange', () => {
        if (wakeLock !== null && document.visibilityState === 'visible') {
            console.log('rerequest wakelock');
            locks--;
            void requestWakeLock();
        }
    });
}

function sendFile(xhr, body) {
    return new Promise((resolve, reject) => {
        xhr.onload = () => resolve(xhr);
        xhr.upload.onerror = reject;
        xhr.upload.ontimeout = () => reject(new Error('Request exceeded timeout'));
        xhr.send(body);
    });
}

const uploadFile = async (file) => {
    if (file) {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/upload', true);

        xhr.upload.onprogress = (ev) => {
            const { total, loaded } = ev;
            console.log('upload progress', ((loaded / total) * 100).toFixed(2), '%');
        };

        xhr.timeout = 60000;
        xhr.setRequestHeader('content-type', file.type);
        xhr.setRequestHeader('Accept', 'application/json');
        xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        xhr.setRequestHeader('X-filename', encodeURIComponent(file.name));

        await sendFile(xhr, file)
            .catch((err) => {
                console.log('err sending file', err);
            })
            .finally(() => {
                void releaseWakeLock();
            });

        if (xhr.status === 201) {
            console.log(JSON.parse(xhr.response));
        } else {
            console.log('error', xhr.status);
        }
    }
};

const onFileChange = (event) => {
    requestWakeLock();

    if (event.target.files?.length) {
        const file = event.target.files[0];
        void uploadFile(file);
    }
};

const el = document.querySelector('input[type="file"]');
el.onchange = onFileChange;
