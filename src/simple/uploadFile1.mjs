import { createWriteStream } from 'fs';
import { unlink } from 'fs/promises';
import { inspect } from 'util';
import { Buffer } from 'buffer';

const { log } = console;

// const pdf = Buffer.from('%PDF', 'utf8');

const pdf = Buffer.from('25504446', 'hex');
const pdfType = 'application/pdf';

export const uploadFile1 = async (ctx) => {
    let isFirstChunk = true;
    const fileType = ctx.get('content-type');
    const fileName = `tmp/${decodeURIComponent(ctx.get('X-filename'))}`;
    const writableStream = createWriteStream(fileName);

    const p = new Promise((resolve, reject) => {
        ctx.req.on('data', (chunk) => {
            if (isFirstChunk) {
                const sign = chunk.subarray(0, pdf.byteLength);

                if (fileType !== pdfType || !pdf.equals(sign)) {
                    writableStream.destroy();

                    reject(new Error('Wrong file type'));
                    return;
                }

                log(chunk.subarray(0, pdf.byteLength));
                isFirstChunk = false;
            }

            if (!writableStream.writableEnded) {
                writableStream.write(chunk);
            }
        });

        ctx.req.on('end', () => {
            writableStream.end();
            resolve(true);
        });

        ctx.req.on('error', (error) => {
            writableStream.end();

            log(error, error.stack);

            void unlink(fileName).catch((error) => {
                log({
                    what: 'Ошибка удаления файла',
                    where: 'uploadFile',
                    fileName,
                    error,
                });
            });

            reject(error);
        });

        ctx.req.pipe(writableStream);
    });

    await p
        .then(() => {
            ctx.set('Connection', 'close');
            ctx.status = 201;
            ctx.body = { result: 'Ok' };
        })
        .catch((error) => {
            log('error file saving', fileName, inspect(error));

            ctx.set('Connection', 'close');
            ctx.status = 500;
            ctx.body = error.message;

            void unlink(fileName).catch((error) => {
                log({
                    what: 'Ошибка удаления файла',
                    where: 'uploadFile',
                    fileName,
                    error,
                });
            });
        });
};
