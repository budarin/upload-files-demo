import Busboy from "busboy";
import { inspect } from "util";

const { log } = console;

export const uploadFile = async (ctx) => {
  const busboy = new Busboy({
    headers: { "content-type": ctx.get("content-type") },
  });

  busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
    log(
      "File [" +
        fieldname +
        "]: filename: " +
        filename +
        ", encoding: " +
        encoding +
        ", mimetype: " +
        mimetype
    );

    file.on("data", (data) => {
      log(`File [${fieldname}] got ${String(data.length)} bytes`);
    });

    file.on("end", () => {
      log("File [" + fieldname + "] Finished");
    });

    file.on("error", (error) => {
      log("ошибка файла", inspect(error));
    });
  });

  busboy.on("error", (error) => {
    log("busboy error", inspect(error));
    ctx.respondWithError(500);
  });

  busboy.on(
    "field",
    (
      fieldname,
      val /*, fieldnameTruncated, valTruncated, encoding, mimetype */
    ) => {
      log(`Field [${fieldname}]: value: ${inspect(val)}`);
    }
  );

  busboy.on("finish", () => {
    log("Done parsing form!");

    ctx.set("Connection", "close");
    ctx.status = 200;
    ctx.body = { result: "Ok" };
  });

  ctx.req.pipe(busboy);
};
