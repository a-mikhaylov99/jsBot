const { config } = require('dotenv');

class ConfigService {
    constructor() {
        const { error, parsed } = config();
        if (error) {
            throw new Error('Не найден файл .env');
        }
        if (!parsed) {
            throw new Error('Пустой файл .env');
        }
        this.config = parsed;
    }

    get(key) {
        const result = this.config[key];
        if (!result) {
            throw new Error('Нет такого ключа');
        }
        return result;
    }
}

module.exports.ConfigService = ConfigService;c