const { Command } = require("./Command");
const { getFiles, getFileNamesFromDirectory, getFilesFromDirectory, getFileContent, parseFilesInDirectory } = require("../data/fileProccess");
const fs = require("node:fs");
const path = require("node:path");
const { Markup } = require("telegraf");

const textDirectoryPath = path.join(__dirname, '../../src/files/text');
const voiceDirectoryPath = path.join(__dirname, '../../src/files/voice');

const CommandType = {
    VOICE: 'Ноты (Голос)',
    TEXT: 'Текст',
    LIST_TEXT: 'Список доступных хвал (ТЕКСТ)',
    COLLECTION_CHORDS: 'Сборник хвал',
    SEARCH_BY_SUBSTRING: 'Поиск хвалы по ключевым словам',
};

const Collections = {
    TWENTY_ONE: 'Сборник (2021 год)',
    TWENTY_THREE: 'Сборник (2023 год)',
};

const DirectoryName = {
    VOICE: 'voice',
    TEXT: 'text',
    COLLECTIONS: 'collections',
};

class StartCommand extends Command {
    constructor(bot) {
        super(bot);
        this.handle();
        this.handleTextMessages();
    }

    handle() {
        this.bot.start(async (ctx) => {
            await this.askForPraise(ctx);
        });
    }

    async askForPraise(ctx) {
        await ctx.reply('Что Вам необходимо? Выберите из опций представленных ниже', Markup.keyboard([
            [CommandType.SEARCH_BY_SUBSTRING],
            [CommandType.LIST_TEXT],
            [CommandType.COLLECTION_CHORDS],
        ]).oneTime().resize());
        ctx.session.awaitingPraise = true;
    }

    async askForCollection(ctx) {
        await ctx.reply('Сборник какого года Вам нужен?', Markup.keyboard([
            [Collections.TWENTY_ONE, Collections.TWENTY_THREE],
        ]).oneTime().resize());
        ctx.session.awaitingPraise = false;
        ctx.session.collection = true;
    }

    handleTextMessages() {
        this.bot.on('text', async (ctx) => {
            if (ctx.session.awaitingPraise) {
                await this.processPraiseSelection(ctx);
            } else if (ctx.session.awaitingSongName) {
                await this.processSongName(ctx);
            } else if (ctx.session.collection) {
                await this.processCollectionMessage(ctx);
            } else if (ctx.session.awaitingSubstringSearch) {
                await this.processSubstringSearch(ctx);
            } else {
                await this.askForPraise(ctx);
            }
        });
    }

    async processPraiseSelection(ctx) {
        const messageText = ctx.message.text;

        if (messageText === CommandType.SEARCH_BY_SUBSTRING) {
            await ctx.reply('Введите ключевое слово для поиска:');
            ctx.session.awaitingSubstringSearch = true;
            ctx.session.awaitingPraise = false;
        } else if (messageText === CommandType.LIST_TEXT) {
            const fileNames = await getFileNamesFromDirectory(textDirectoryPath);
            if (fileNames.length === 0) {
                await ctx.reply('Нет доступных хвал.');
            } else {
                await ctx.reply(fileNames.join(',\n'));
                await ctx.reply('Введите название хвалы:');
                ctx.session.awaitingPraise = false;
                ctx.session.awaitingSongName = true;
                ctx.session.selectedPraise = CommandType.TEXT
            }
        } else if (messageText === CommandType.COLLECTION_CHORDS) {
            await this.askForCollection(ctx);
        } else {
            await ctx.reply('Пожалуйста, уточните Ваш запрос или выберите из опций ниже.');
        }
    }

    async processSongName(ctx) {
        const fileType = ctx.session.selectedPraise;
        const songName = ctx.message.text;
        const fileName = await this.getFileName(fileType, songName);
        if (fileName) {
            const directory = fileType === CommandType.VOICE ? DirectoryName.VOICE : DirectoryName.TEXT;
            const fullPath = path.join(__dirname, `../../src/files/${directory}/${fileName}`);
            await this.replyWithFile(ctx, fullPath, directory, fileName);
        } else {
            await ctx.reply('Файл не найден.');
        }

        ctx.session.awaitingSongName = false;
        await this.askForPraise(ctx);
    }

    async processCollectionMessage(ctx) {
        const messageText = ctx.message.text;
        const collectionMap = {
            [Collections.TWENTY_ONE]: '2021.pdf',
            [Collections.TWENTY_THREE]: '2023.pdf',
        };
        const fileName = collectionMap[messageText];
        if (fileName) {
            const fullPath = path.join(__dirname, `../../src/files/collections/${fileName}`);
            await this.replyWithFile(ctx, fullPath, DirectoryName.COLLECTIONS, fileName);
        } else {
            await ctx.reply('Сборник не найден.');
        }

        ctx.session.collection = false;
        await this.askForPraise(ctx);
    }

    async processSubstringSearch(ctx) {
        const searchTerm = ctx.message.text.toLowerCase();
        const textFiles = await getFiles(textDirectoryPath); 
        const matchedFiles = [];
        for (const fileName of Object.values(textFiles)) {
            const filePath = path.join(textDirectoryPath, fileName);
            const content = await getFileContent(filePath);
            
            if (content && content.toLowerCase().includes(searchTerm)) {
                matchedFiles.push({
                    fileName,
                    content,
                    matchingLines: content
                        .split('\n') 
                        .filter(line => line.toLowerCase().includes(searchTerm)) // Только строки с совпадениями
                });
            }
        }
    
        if (matchedFiles.length > 0) {
            const firstMatch = matchedFiles[0];
            await this.replyWithFile(ctx, path.join(textDirectoryPath, firstMatch.fileName), DirectoryName.TEXT, firstMatch.fileName);
    
            // const matchesSummary = firstMatch.matchingLines.join('\n');
            // await ctx.reply(`Найдено совпадение в файле ${firstMatch.fileName}:\n\n${matchesSummary}`);
        } else {
            await ctx.reply('Файлы с указанным ключевым словом не найдены.');
        }
    
        ctx.session.awaitingSubstringSearch = false;
        await this.askForPraise(ctx);
    }

    async getFileName(fileType, songName) {
        const directoryPath = fileType === CommandType.VOICE ? voiceDirectoryPath : textDirectoryPath;
        const files = await getFiles(directoryPath);
        const foundSong = Object.keys(files).find(key => key.toLowerCase().includes(songName.toLowerCase()));
        return foundSong ? files[foundSong] : null;
    }

    async replyWithFile(ctx, filePath, directory, fileName) {
        try {
            if (directory === 'text') {
                const songFile = fs.readFileSync(filePath, 'utf-8').replace(/([\[\]()~`>#\+\-=|{}\.!])/g, '\\$1');
                await ctx.replyWithMarkdownV2(songFile);
            } else {
                const file = fs.readFileSync(filePath);
                await ctx.replyWithDocument({
                    source: file,
                    filename: fileName,
                });
            }
        } catch (error) {
            console.error('Ошибка чтения файла:', error);
            await ctx.reply('Произошла ошибка при отправке файла.');
        }
    }
}

module.exports.StartCommand = StartCommand;
