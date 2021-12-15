import { Buffer } from 'buffer';
import { unlink } from 'fs/promises';
import { createWriteStream } from 'fs';

const { log } = console;

const allowedFileTypes = [
    {
        contentType: 'application/pdf',
        signature: Buffer.from('25504446', 'hex'),
    },
];

export const uploadFile1 = async (ctx) => {
    let isFirstChunk = true;

    const fileName = `tmp/${decodeURIComponent(ctx.get('X-filename'))}`;
    const writableStream = createWriteStream(fileName);

    const isAlowedFileType = (ctx, chunk) => {
        const found = allowedFileTypes.find((fileType) => {
            const chunkSignature = chunk.subarray(0, fileType.signature.byteLength);
            const signaturesAreEqual = fileType.signature.equals(chunkSignature);
            const contentTypesAreEqual = ctx.get('content-type') === fileType.contentType;

            if (contentTypesAreEqual && !signaturesAreEqual) {
                console.log('Внимание!! попытка подделки файла', fileName);
            }

            return contentTypesAreEqual && signaturesAreEqual;
        });
        return Boolean(found);
    };

    const WRONG_FILE_TYPE = 'Wrong file type';

    const uploading = new Promise((resolve, reject) => {
        ctx.req.on('data', (chunk) => {
            if (isFirstChunk) {
                if (!isAlowedFileType(ctx, chunk)) {
                    writableStream.destroy();
                    reject(new Error(WRONG_FILE_TYPE));
                    return;
                }

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

    await uploading
        .then(() => {
            ctx.set('Connection', 'close');
            ctx.status = 201;
            ctx.body = { result: 'Ok' };
        })
        .catch((error) => {
            const { message } = error;

            log('error file saving', fileName, message);

            ctx.set('Connection', 'close');
            ctx.status = message === WRONG_FILE_TYPE ? 403 : 500;
            ctx.body = message;

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
