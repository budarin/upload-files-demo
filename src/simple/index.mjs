import Koa from "koa";
import Router from "koa-router";

import { appOnError } from "../appOnError.mjs";
import { uploadFile } from "./uploadFile.mjs";
import { renderApp } from "./renderApp.mjs";

const router = new Router();
export const app = new Koa();

app.on("error", appOnError);

router.post("/upload", uploadFile);
router.get("/", renderApp);

app.use(router.routes());
app.use(router.allowedMethods());

app.listen(4500);
