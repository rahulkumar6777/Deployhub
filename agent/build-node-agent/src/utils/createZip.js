import { createRequire } from 'module';

const require = createRequire(import.meta.url);

const archiver = require('archiver');
import fs from 'fs'

export const createZip = (
    sourceDir,
    zipPath
) => {

    return new Promise(
        (resolve, reject) => {

            const output =
                fs.createWriteStream(zipPath);

            const archive =
                archiver('zip', {
                    zlib: {
                        level: 9
                    }
                });

            output.on(
                'close',
                resolve
            );

            archive.on(
                'error',
                reject
            );

            archive.pipe(output);

            archive.directory(
                sourceDir,
                false
            );

            archive.finalize();
        }
    );
};