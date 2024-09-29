# Как запустить проект
Перед установкой на MacOS или Windows, необходимо скачать и установить node, git.

После, удостовериться, что все команды ```git -v```, ```node -v``` возвращают версию.

## Подготовка проекта

- В корне проекта создать папку dist (туда будет собираться проект)
- В корне проект создать файл .env и записать туда переменную TOKEN
- В файле tsconfig.json указать выходную директорию "outDir": "./dist",                             


## Запуск проекта
- Выкачать зависимости ```npm install```
- Запустить проект ```npm run start``` 

