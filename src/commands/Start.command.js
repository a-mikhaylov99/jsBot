const {Command} = require("./Command");
const {getFiles, getFileNamesFromDirectory} = require("../data/fileProccess");
const fs = require("node:fs");
const path = require("node:path");
const {Markup} = require("telegraf");

const textDirectoryPath = '../../src/files/text'
const voiceDirectoryPath = '../../src/files/voice'

const CommandType = {
    VOICE: 'Ноты (Голос)',
    TEXT: 'Текст',
    LIST_TEXT: 'Список доступных хвал (ТЕКСТ)',
    LIST_VOICE: 'Список доступных хвал (НОТЫ)',
    COLLECTION_CHORDS: 'Сборник хвал',
    SEARCH_BY_SUBSTRING: 'Поиск по ключевым словам',
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
            [CommandType.VOICE, CommandType.TEXT],
            [CommandType.LIST_TEXT, CommandType.LIST_VOICE],
            [CommandType.COLLECTION_CHORDS],
        ]).oneTime().resize());
        ctx.session.awaitingPraise = true;
    }

    async askForCollection(ctx) {
        await ctx.reply('Сборник какого года Вам нужен?', Markup.keyboard([
            [Collections.TWENTY_ONE, Collections.TWENTY_THREE],
        ]).oneTime().resize());
        ctx.session.collection = true;
        ctx.session.awaitingPraise = false;
    }

    handleTextMessages() {
        this.bot.on('text', async (ctx) => {
            if (ctx.session.awaitingPraise) {
                await this.processPraiseSelection(ctx);
            } else if (ctx.session.awaitingSongName) {
                await this.processSongName(ctx);
            } else if (ctx.session.collection) {
                await this.processCollectionMessage(ctx);
            } else {
                await this.askForPraise(ctx);
            }
        });
    }

    async processPraiseSelection(ctx) {
        const messageText = ctx.message.text;
        if (
            Object.values(CommandType).includes(messageText)
            && messageText !== CommandType.LIST_TEXT
            && messageText !== CommandType.COLLECTION_CHORDS
            && messageText !== CommandType.LIST_VOICE
        ) {
            ctx.session.selectedPraise = messageText;
            await ctx.reply('Введите название хвалы:');
            ctx.session.awaitingPraise = false;
            ctx.session.awaitingSongName = true;
        } else if (messageText === CommandType.LIST_TEXT || messageText === CommandType.LIST_VOICE) {
            const directoryPath = messageText === CommandType.LIST_TEXT ? textDirectoryPath : voiceDirectoryPath;
            const fileNames = await getFileNamesFromDirectory(path.resolve(__dirname, directoryPath));
            await ctx.reply(fileNames.join(',\n'));
            await this.askForPraise(ctx);
        } else if (messageText === CommandType.COLLECTION_CHORDS) {
            await this.askForCollection(ctx);
        } else {
            await ctx.reply('Пожалуйста, уточните Ваш запрос или выберите из опций казанных ниже.');
        }
    }

    async processSongName(ctx) {
        const fileType = ctx.session.selectedPraise;
        const songName = ctx.message.text;
        const fileName = await this.getFileName(fileType, songName);
        if (fileName) {
            const directory = fileType === CommandType.VOICE ? DirectoryName.VOICE : DirectoryName.TEXT;
            const fullPath = path.resolve(__dirname, `../../src/files/${directory}/${fileName}`);
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
            const fullPath = path.resolve(__dirname, `../../src/files/collections/${fileName}`);
            await this.replyWithFile(ctx, fullPath, DirectoryName.COLLECTIONS, fileName);
        } else {
            await ctx.reply('Сборник не найден.');
        }
        ctx.session.awaitingSongName = false;
        await this.askForPraise(ctx);
    }

    async getFileName(fileType, songName) {
        const files = fileType === CommandType.VOICE
            ? await getFiles(path.resolve(__dirname, voiceDirectoryPath))
            : await getFiles(path.resolve(__dirname, textDirectoryPath));
        const foundSong = Object.keys(files).find(key => key.toLowerCase().includes(songName.toLowerCase()));
        return foundSong ? files[foundSong] : files[songName];
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