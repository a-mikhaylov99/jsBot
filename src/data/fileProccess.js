const fs = require("node:fs");
const path = require("node:path");
const util = require('util');
const readFile = util.promisify(fs.readFile);

async function getFilesFromDirectory(directoryPath) {
  return new Promise((resolve, reject) => {
    fs.readdir(directoryPath, (err, files) => {
      if (err) {
        reject(err);
        return;
      }
      const txtFiles = files.filter(
        (file) => file.endsWith(".txt") || file.endsWith(".pdf")
      );
      resolve(txtFiles);
    });
  });
}

async function getFileNamesFromDirectory(directoryPath) {
  const fileExtensions = [".txt", ".pdf"];
  const fileNames = [];
  const files = await getFilesFromDirectory(directoryPath);
  for (const file of files) {
    for (const ext of fileExtensions) {
      if (file.endsWith(ext)) {
        fileNames.push(file.replace(ext, ""));
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

function getStringFile(filePath) {
    try {
        // Проверяем, является ли переданный путь файлом
        if (fs.statSync(filePath).isDirectory()) {
            throw new Error(`Путь ${filePath} указывает на директорию, а не на файл.`);
        }
        
        let fileContent = fs.readFileSync(filePath, 'utf8');
        return fileContent;
    } catch (err) {
        console.error("Ошибка при чтении файла:", err);
        throw err; // Переправляем ошибку выше для обработки вызывающим кодом
    }
}

function readFilesInDirectory(dirPath) {
    try {
        // Получаем список файлов в директории
        const files = fs.readdirSync(dirPath);

        // Читаем содержимое каждого файла
        const fileContents = files.map(file => {
            const filePath = path.join(dirPath, file);
            if (fs.statSync(filePath).isFile()) {
                return fs.readFileSync(filePath, 'utf8');
            } else {
                console.warn(`Пропущен ${filePath}, так как это не файл.`);
                return null; // Или можно выбросить ошибку
            }
        });

        return fileContents.filter(content => content !== null); // Возвращаем только содержимое файлов
    } catch (err) {
        console.error("Ошибка при чтении файлов из директории:", err);
        throw err; // Переправляем ошибку выше для обработки вызывающим кодом
    }
}

function parseFilesInDirectory(dirPath) {
    try {
        const files = fs.readdirSync(dirPath);

        files.forEach(file => {
            const filePath = path.join(dirPath, file);
            if (fs.statSync(filePath).isFile()) {
                const content = fs.readFileSync(filePath, 'utf8');
                console.log(content);
                return content;
            } else {
                console.warn(`Пропущен ${filePath}, так как это не файл.`);
            }
        });
    } catch (err) {
        console.error("Ошибка при чтении файлов из директории:", err);
    }
}
async function getFileContent(filePath) {
    try {
        const content = await readFile(filePath, 'utf-8');
        return content;
    } catch (err) {
        console.error(`Ошибка чтения файла ${filePath}:`, err);
        return null;
    }
}

module.exports = {
  getFilesFromDirectory,
  getFileNamesFromDirectory,
  getFiles,
  getStringFile,
  parseFilesInDirectory,
  getFileContent
};
