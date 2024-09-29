const fs = require("node:fs");

async function getFilesFromDirectory(directoryPath) {
    return new Promise((resolve, reject) => {
        fs.readdir(directoryPath, (err, files) => {
            if (err) {
                reject(err);
                return;
            }
            const txtFiles = files.filter((file) => file.endsWith('.txt') || file.endsWith('.pdf'));
            resolve(txtFiles);
        });
    });
}

async function getFileNamesFromDirectory(directoryPath) {
    const fileExtensions = ['.txt', '.pdf'];
    const fileNames = [];
    const files = await getFilesFromDirectory(directoryPath);

    for (const file of files) {
        for (const ext of fileExtensions) {
            if (file.endsWith(ext)) {
                fileNames.push(file.replace(ext, ''));
                break;
            }
        }
    }

    return fileNames;
}

async function getFiles(directoryPath) {
    const files = await getFilesFromDirectory(directoryPath);
    const fileNames = await getFileNamesFromDirectory(directoryPath);
    const dataSongs = {};
    fileNames.forEach((fileName, index) => {
        dataSongs[fileName] = files[index];
    });
    return dataSongs;
}

module.exports = {
    getFilesFromDirectory,
    getFileNamesFromDirectory,
    getFiles,
};
