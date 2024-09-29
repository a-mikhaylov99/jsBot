const {Telegraf} = require("telegraf");
const {TOKEN} = require("./env");
const LocalSession = require("telegraf-session-local");
const {StartCommand} = require("./commands/Start.command");

class Bot {
    constructor() {
        this.bot = new Telegraf(TOKEN);
        this.bot.use((new LocalSession({ database: 'sessions.json' })).middleware());
    }

    init() {
        const commands = [new StartCommand(this.bot)];
        for (const command of commands) {
            command.handle();
        }
        this.bot.launch();
    }
}

const bot = new Bot();
bot.init();