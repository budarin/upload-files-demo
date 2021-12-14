export function appOnError(error, ctx) {
  console.error({
    what: "Ошибка в приложении Koa",
    why: error.message,
    where: "app.onError",
    url: ctx.url,
    request: pino.stdSerializers.req(ctx.req),
    response: pino.stdSerializers.res(ctx.res),
    error: pino.stdSerializers.err(error),
    ...(__DEV__ && { body: String(ctx.body) }),
  });

  ctx.respondWithError(
    error.statusCode ||
      error.status ||
      httpConsts.HTTP_STATUS_INTERNAL_SERVER_ERROR
  );
}
