import { Buffer } from 'buffer';
import { unlink } from 'fs/promises';
import { createWriteStream } from 'fs';

const { log } = console;

const allowedFileTypes = [
    {
        ext: 'pdf',
        contentType: 'application/pdf',
        signature: Buffer.from('25504446', 'hex'),
        description: 'MS Office Open XML Format Document',
    },
    {
        ext: 'xlsx',
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        signature: Buffer.from('504B0304', 'hex'),
        description: 'MS Office Open XML Format Document',
    },
    {
        ext: 'xlsx',
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        signature: Buffer.from('504B030414000600', 'hex'),
        description: 'MS Office 2007 documents',
    },
    {
        ext: 'docx',
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        signature: Buffer.from('504B030414000600', 'hex'),
        description: 'MS Office 2007 documents',
    },
    {
        ext: 'docx',
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        signature: Buffer.from('504B0304', 'hex'),
        description: 'MS Office Open XML Format Document',
    },
];

export const uploadFile1 = async (ctx) => {
    let isFirstChunk = true;
    const WRONG_FILE_TYPE = 'WRONG_FILE_TYPE';
    const WRONG_FILE_NAME = 'WRONG_FILE_NAME';
    const EXCEEDED_FILE_NAME_LENGTH = 'EXCEEDED_FILE_NAME_LENGTH';

    const fileName = ctx.get('X-filename');
    const fullFileName = `tmp/${decodeURIComponent(fileName)}`;

    const isAlowedFileType = (ctx, chunk, fileExt) => {
        let isFraudReported = false;
        const found = allowedFileTypes.find((fileType) => {
            const chunkSignature = chunk.subarray(0, fileType.signature.byteLength);
            const signaturesAreEqual = fileType.signature.equals(chunkSignature);
            const contentTypesAreEqual = ctx.get('content-type') === fileType.contentType;
            const fileHasValidExt = fileType.ext === fileExt;

            if (!isFraudReported && fileHasValidExt && contentTypesAreEqual && !signaturesAreEqual) {
                console.log('Внимание!! попытка подделки файла', fullFileName);
                isFraudReported = true;
            }

            return contentTypesAreEqual && signaturesAreEqual && fileHasValidExt;
        });
        return Boolean(found);
    };

    const uploading = new Promise((resolve, reject) => {
        if (fileName.length > 256) {
            console.error(EXCEEDED_FILE_NAME_LENGTH);
            reject(new Error(EXCEEDED_FILE_NAME_LENGTH));

            return;
        }

        if (!fileName.includes('.')) {
            console.error(WRONG_FILE_NAME);
            reject(new Error(WRONG_FILE_NAME));

            return;
        }

        const fileNameParts = fileName.split('.');
        const fileExt = fileNameParts[fileNameParts.length - 1];
        const writableStream = createWriteStream(fullFileName);

        ctx.req.on('data', (chunk) => {
            if (isFirstChunk) {
                if (!isAlowedFileType(ctx, chunk, fileExt)) {
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

            log('error file saving', fullFileName, message);

            ctx.set('Connection', 'close');
            ctx.status = message === WRONG_FILE_TYPE ? 403 : 500;
            ctx.body = message;

            if (![EXCEEDED_FILE_NAME_LENGTH, WRONG_FILE_NAME].includes(error.message)) {
                void unlink(fullFileName).catch((error) => {
                    log({
                        what: 'Ошибка удаления файла',
                        where: 'uploadFile',
                        fileName: fullFileName,
                        error,
                    });
                });
            }
        });
};
