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

    const uploading = new Promise((resolve, reject) => {
        ctx.req.on('data', (chunk) => {
            if (isFirstChunk) {
                if (!isAlowedFileType(ctx, chunk)) {
                    writableStream.destroy();

                    reject(new Error('Wrong file type'));
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
