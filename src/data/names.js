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

module.exports = {
    CommandType,
    Collections,
    DirectoryName,
}