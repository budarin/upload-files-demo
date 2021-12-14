export const renderApp = (ctx) => {
  ctx.body = `<html lang="ru" data-type="SSR">
  <head>
      <meta charset="UTF-8"/>
  </head>
  <body>
    <input type="file" id="fileLoader"></input>
    <script>
        const uploadFile = (file) => {
            if (file) {
                const formData = new FormData();
                const xhr = new XMLHttpRequest();

                xhr.withCredentials = true;
                xhr.open('POST', '/upload', true);

                xhr.setRequestHeader('Accept', 'application/json');
                xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
                xhr.setRequestHeader('X-name', file.name);
                xhr.setRequestHeader('content-type', file.type);

                xhr.upload.onprogress = (ev) => {
                    const { total, loaded } = ev;
                    console.log('upload progress', total, loaded);
                };

                xhr.onprogress = (ev) => {
                    const { total, loaded } = ev;
                    console.log('progress', total, loaded);
                };

                xhr.upload.onload = function () {
                    console.log("Загружено: " + xhr.status + "  " + xhr.response);
                };

                xhr.upload.onerror = function (ev) {
                    if (this.status == 200) {
                        console.log('success');
                    } else {
                        console.log("error " + this.status);
                    }
                };

                console.log('start sending form');

                xhr.send(file);
            }
        }

        const onFileChange = (event) => {
            if (event.target.files?.length) {
                const file = event.target.files[0];
                uploadFile(file);
            }
        };

        const el = document.querySelector('input[type="file"]');
        el.onchange = onFileChange;

    </script>
  </body>
</html>
  `;
};
