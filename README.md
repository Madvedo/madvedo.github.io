# Shah Underground — деплой и медиа

## Общая схема

- **Локалка (Windows):**  
  Проект в `E:\Development\madvedo.github.io`.  
  Репозиторий: [Madvedo/madvedo.github.io](https://github.com/Madvedo/madvedo.github.io.git)

- **Фронт (Prod Web):**  
  Сервер: `87.247.142.102`  
  Домен: `shunder.madvedoplay.ru`
  Сайт хранится в `/var/www/html`.  
  Git работает от пользователя `deploy`.

- **Бэкенд (Media):**  
  Сервер: `193.47.33.114`<br>
  Медиа-файлы в `/var/www/html/audio` и `/var/www/html/radio`.  
  Доступ к ним идёт через фронт (Nginx reverse proxy).

---

## Структура проекта (локально)

madvedo.github.io/
├─ audio/ # медиа, в Git не попадает
├─ radio/ # медиа, в Git не попадает
├─ css/
├─ js/
├─ img/
├─ pages/
├─ index.html
└─ .gitignore

bash
Копировать код

### .gitignore
```gitignore
/audio/
/radio/
.DS_Store
.vscode/
node_modules/
Если медиа когда-то были в репозитории:

bash
Копировать код
git rm -r --cached audio radio
git commit -m "Ignore audio & radio"
git push
Обновление фронта на сервере
Работаем от root, но git выполняется от имени deploy:

bash
Копировать код
sudo -u deploy git -C /var/www/html pull --ff-only
sudo nginx -t && sudo systemctl reload nginx
👉 --ff-only гарантирует, что на проде не будет случайных merge-коммитов.

Жёсткий сброс (если на сервере были изменения в отслеживаемых файлах):

bash
Копировать код
sudo -u deploy git -C /var/www/html fetch --all --prune
sudo -u deploy git -C /var/www/html reset --hard origin/main
Заливка медиа на бэкенд
Windows PowerShell:

powershell
Копировать код
scp -r "E:\Development\madvedo.github.io\audio\*" root@193.47.33.114:/var/www/html/audio/
scp -r "E:\Development\madvedo.github.io\radio\*" root@193.47.33.114:/var/www/html/radio/
WSL / Linux:

bash
Копировать код
rsync -av --delete /mnt/e/Development/madvedo.github.io/audio/ root@193.47.33.114:/var/www/html/audio/
rsync -av --delete /mnt/e/Development/madvedo.github.io/radio/ root@193.47.33.114:/var/www/html/radio/
Nginx
Фронт (87.247.142.102, shunder.madvedoplay.ru)
/etc/nginx/sites-enabled/shunder:

nginx
Копировать код
server {
    listen 80;
    server_name shunder.madvedoplay.ru;
    return 301 https://shunder.madvedoplay.ru$request_uri;
}

server {
    listen 443 ssl http2;
    server_name shunder.madvedoplay.ru;

    ssl_certificate     /etc/letsencrypt/live/shunder.madvedoplay.ru/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/shunder.madvedoplay.ru/privkey.pem;

    root /var/www/html;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }

    location /audio/ {
        proxy_pass http://193.47.33.114/audio/;
        proxy_set_header Host 193.47.33.114;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_buffering off;
        proxy_request_buffering off;
    }

    location /radio/ {
        proxy_pass http://193.47.33.114/radio/;
        proxy_set_header Host 193.47.33.114;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_buffering off;
        proxy_request_buffering off;
    }

    location ~* \.(?:css|js|png|jpg|jpeg|svg|woff2)$ {
        expires 7d;
        add_header Cache-Control "public, max-age=604800" always;
        try_files $uri =404;
    }

    autoindex off;
    access_log /var/log/nginx/shunder.access.log;
    error_log  /var/log/nginx/shunder.error.log;
}
Бэкенд (193.47.33.114)
/etc/nginx/sites-available/media.conf:

Для WAV в `/etc/nginx/mime.types` должна быть запись `audio/wav wav;`. Не задавайте `default_type application/octet-stream` для аудиофайлов: браузеру нужен аудио MIME-тип.

nginx
Копировать код
server {
    listen 80;
    server_name _;

    root /var/www/html;

    location /audio/ {
        expires 30d;
        add_header Cache-Control "public, max-age=2592000, immutable" always;
        add_header Accept-Ranges bytes;
        sendfile on;
        tcp_nopush on;
        aio threads;
        try_files $uri =404;
        autoindex off;
    }

    location /radio/ {
        expires 30d;
        add_header Cache-Control "public, max-age=2592000, immutable" always;
        add_header Accept-Ranges bytes;
        sendfile on;
        tcp_nopush on;
        aio threads;
        try_files $uri =404;
        autoindex off;
    }

    access_log /var/log/nginx/media.access.log;
    error_log  /var/log/nginx/media.error.log;
}
HTTPS (фронт)
bash
Копировать код
sudo apt update
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d shunder.madvedoplay.ru
Скрипты
/usr/local/bin/update_front
bash
Копировать код
#!/usr/bin/env bash
set -euo pipefail
sudo -u deploy git -C /var/www/html fetch --all --prune
sudo -u deploy git -C /var/www/html pull --ff-only
sudo nginx -t
sudo systemctl reload nginx
echo "[OK] Front updated and nginx reloaded."
bash
Копировать код
sudo chmod +x /usr/local/bin/update_front
Запуск:

bash
Копировать код
update_front
/usr/local/bin/sync_media (на локалке, в WSL)
bash
Копировать код
#!/usr/bin/env bash
set -euo pipefail
SRC=/mnt/e/Development/madvedo.github.io
DEST=root@193.47.33.114:/var/www/html
rsync -av --delete "$SRC/audio/" "$DEST/audio/"
rsync -av --delete "$SRC/radio/" "$DEST/radio/"
echo "[OK] Media synced to backend."
Чеклист релиза
Локально → git add/commit/push.

На фронте → update_front.

На бэкенде → sync_media.

Проверить:

bash
Копировать код
curl -I https://shunder.madvedoplay.ru/
curl -I https://shunder.madvedoplay.ru/radio/track.mp3
curl -H "Range: bytes=0-100" -I https://shunder.madvedoplay.ru/audio/track.mp3
Ожидаем 200 OK и 206 Partial Content.

Проверить логи:

Фронт: /var/log/nginx/shunder.error.log

Бэкенд: /var/log/nginx/media.error.log
