import fs from 'fs'
import path from 'path';

const script = fs.readFileSync(path.resolve('src/simple/script.js'), { encoding: 'utf-8' });

export const renderApp = (ctx) => {
  ctx.body = `<html lang="ru" data-type="SSR">
<head>
    <meta charset="UTF-8"/>
</head>
<body>
<input type="file" id="fileLoader"></input>
<script>
${script}
</script>
</body>
</html>
  `;
};
