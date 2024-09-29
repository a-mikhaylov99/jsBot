const { Telegraf, Markup } = require('telegraf');
const fs = require('fs');
const path = require('path');
const LocalSession = require('telegraf-session-local');

class Command {
    constructor(bot) {
        this.bot = bot;
    }

    handle() {
        throw new Error('Метод handle должен быть реализован в наследуемом классе');
    }
}

module.exports.Command = Command;