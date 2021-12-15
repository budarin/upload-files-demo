export function appOnError(error, ctx) {
    console.error({
        what: 'Ошибка в приложении Koa',
        why: error.message,
        where: 'app.onError',
        url: ctx.url,
    });

    ctx.set('Cache-Control', 'no-cache, proxy-revalidate');
    ctx.status = error.statusCode || error.status || 500;
    ctx.body = 'Server Error';
}
