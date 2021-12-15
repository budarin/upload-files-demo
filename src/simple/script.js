function sendFile(xhr, body) {
    return new Promise((resolve, reject) => {
        xhr.onload = () => resolve(xhr);
        xhr.onerror = reject;
        xhr.send(body);
    });
}

const uploadFile = async (file) => {
    if (file) {
        const formData = new FormData();
        const xhr = new XMLHttpRequest();
        xhr.timeout = 60000;

        xhr.open('POST', '/upload', true);

        xhr.setRequestHeader('Accept', 'application/json');
        xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        xhr.setRequestHeader('X-filename', encodeURIComponent(file.name));
        xhr.setRequestHeader('content-type', file.type);

        xhr.upload.onprogress = (ev) => {
            const { total, loaded } = ev;
            console.log('upload progress', total, loaded);
        };

        xhr.upload.ontimeout = function () {
            console.log('timeout error');
        };

        xhr.upload.onload = function () {
            console.log('Загружено: ' + xhr.status + '  ' + xhr.response + ' ' + xhr.readyState);
        };

        xhr.upload.onerror = function (ev) {
            if (this.status == 200) {
                console.log('success');
            } else {
                console.log('error ' + this.status);
            }
        };

        await sendFile(xhr, file).catch((err) => {
            console.log('err sending file', err);
        });

        if (xhr.status === 201) {
            console.log(JSON.parse(xhr.response));
        } else {
            console.log('error', xhr.status);
        }
    }
};

const onFileChange = (event) => {
    if (event.target.files?.length) {
        const file = event.target.files[0];
        void uploadFile(file);
    }
};

const el = document.querySelector('input[type="file"]');
el.onchange = onFileChange;
