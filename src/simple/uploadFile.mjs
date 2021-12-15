import { createWriteStream } from 'fs';
import { inspect } from 'util';

const { log } = console;

export const uploadFile = async (ctx) => {
    const p = new Promise((resolve, reject) => {
        const fileName = decodeURIComponent(ctx.get('X-filename'));
        const writableStream = createWriteStream(fileName);

        writableStream.on('error', (error) => {
            log('error wririnf file', inspect(error));
            reject(error);
        });

        writableStream.on('finish', () => {
            log('finished writing file');
            resolve();
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
            log('error', inspect(error));

            ctx.status = 500;
            ctx.body = error.message;
        });
};
