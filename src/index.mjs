import Koa from "koa";
import Router from "koa-router";

import { appOnError } from "./appOnError.mjs";
import { uploadFile } from "./uploadFile.mjs";
import { renderApp } from "./renderApp.mjs";

const router = new Router();
export const app = new Koa();

router.post("/upload", uploadFile);
router.get("/(.*)", renderApp);

app.use(router.routes());
app.on("error", appOnError);

app.listen(4500);
