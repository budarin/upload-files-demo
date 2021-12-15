import { createWriteStream } from 'fs';
import { unlink } from 'fs/promises';
import { inspect } from 'util';
import { Buffer } from 'buffer';

const { log } = console;

const allowedFileTypes = [
    {
        contentType: 'application/pdf',
        signature: Buffer.from('25504446', 'hex'),
    },
];

export const uploadFile1 = async (ctx) => {
    let isFirstChunk = true;
    const fileType = ctx.get('content-type');
    const fileName = `tmp/${decodeURIComponent(ctx.get('X-filename'))}`;
    const writableStream = createWriteStream(fileName);

    const isAlowedFileType = (ctx, chunk) => {
        allowedFileTypes.find((fileType) => {
            const chunkSignature = chunk.subarray(0, fileType.signature.byteLength);
            const signaturesAreEqual = fileType.signature.equals(chunkSignature);
            const contentTypesAreEqual = ctx.get('content-type') === fileType.contentType;

            if (contentTypesAreEqual && !signaturesAreEqual) {
                console.log('Внимание!! попытка подделки файла', fileName);
            }

            return contentTypesAreEqual && signaturesAreEqual;
        });
    };

    const p = new Promise((resolve, reject) => {
        ctx.req.on('data', (chunk) => {
            if (isFirstChunk) {
                if (!isAlowedFileType(ctx, chunk)) {
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
            log('error file saving', fileName, error.message);

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
