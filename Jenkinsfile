pipeline {
  agent any

  options {
    timestamps()
    disableConcurrentBuilds()
    skipDefaultCheckout(true) // не тянем репозиторий автоматически
  }

  environment {
    // Репозиторий
    GIT_URL    = 'https://github.com/Madvedo/madvedo.github.io.git'
    GIT_BRANCH = 'main'

    // Фронт
    FRONT_HOST = '87.247.142.102'
    FRONT_USER = 'deploy'
    FRONT_DST  = '/var/www/html'

    // Бэкенд (локально на Jenkins-хосте, где nginx бэка)
    BACK_DST   = '/var/www/html'

    // Где хранить "последний задеплоенный коммит"
    STATE_DIR  = '/var/lib/jenkins/.deploy_state'
    STATE_FILE = '/var/lib/jenkins/.deploy_state/git_deploy_shun.sha'
  }

  stages {

    stage('Resolve HEAD & previous SHA (no checkout)') {
      steps {
        sh '''
          set -e
          mkdir -p "${STATE_DIR}"

          # Получаем текущий HEAD SHA ветки без загрузки блобов
          HEAD_SHA=$(git ls-remote --heads "${GIT_URL}" "refs/heads/${GIT_BRANCH}" | awk '{print $1}')
          echo "HEAD_SHA=${HEAD_SHA}"
          test -n "$HEAD_SHA"

          # Предыдущий задеплоенный SHA (если нет — пусто)
          if [ -f "${STATE_FILE}" ]; then
            PREV_SHA=$(cat "${STATE_FILE}" | tr -d '\\n')
          else
            PREV_SHA=""
          fi
          echo "PREV_SHA=${PREV_SHA}"

          echo "$HEAD_SHA" > .head_sha
          echo "$PREV_SHA" > .prev_sha
        '''
      }
    }

    stage('Get change lists (blobless)') {
      steps {
        sh '''
          set -e
          HEAD_SHA=$(cat .head_sha)
          PREV_SHA=$(cat .prev_sha)

          rm -rf .meta && mkdir .meta && cd .meta
          git init -q
          git remote add origin "${GIT_URL}"

          # partial fetch без блобов
          git fetch --filter=blob:none --no-tags --depth=2 origin "${GIT_BRANCH}"
          git checkout -q --detach FETCH_HEAD

          # Если нет PREV_SHA — первый деплой: возьмём весь трек-лист
          if [ -z "$PREV_SHA" ]; then
            git ls-tree -r --name-only "$HEAD_SHA" > ../changed_all.txt
            : > ../deleted_all.txt
          else
            # Получаем списки изменённых и удалённых путей (блобов не нужно)
            git diff --name-only "$PREV_SHA" "$HEAD_SHA" > ../changed_all.txt || true
            git diff --name-status "$PREV_SHA" "$HEAD_SHA" | awk '/^D/{print $2}' > ../deleted_all.txt || true
          fi

          cd ..
          # Делим на фронт/медиа
          awk '!/^\\s*$/' changed_all.txt | awk '{print $0}' > changed_all_clean.txt
          awk '!/^\\s*$/' deleted_all.txt | awk '{print $0}' > deleted_all_clean.txt

          # медиа: только audio/ или radio/
          grep -E '^(audio/|radio/)' changed_all_clean.txt  || true > media_changed.txt
          grep -E '^(audio/|radio/)' deleted_all_clean.txt  || true > media_deleted.txt

          # фронт: всё, кроме audio/ и radio/
          grep -Ev '^(audio/|radio/)' changed_all_clean.txt || true > front_changed.txt
          grep -Ev '^(audio/|radio/)' deleted_all_clean.txt || true > front_deleted.txt

          echo "== stats =="
          wc -l front_changed.txt front_deleted.txt media_changed.txt media_deleted.txt || true
        '''
      }
    }

    stage('Deploy FRONT (checkout only changed files)') {
      when { expression { return fileExists('front_changed.txt') && sh(script: 'test -s front_changed.txt', returnStatus: true) == 0 } }
      steps {
        sh '''
          set -e
          mkdir -p ~/.ssh
          ssh-keyscan -H ${FRONT_HOST} >> ~/.ssh/known_hosts 2>/dev/null || true

          rm -rf src_front && mkdir src_front
          git -C src_front init -q
          git -C src_front remote add origin "${GIT_URL}"
          # Частичный клон без блобов
          git -C src_front fetch --filter=blob:none --depth=1 origin "${GIT_BRANCH}"
          git -C src_front checkout -q --detach FETCH_HEAD

          # Точечный checkout только изменённых фронтовых путей (скачает блобы ТОЛЬКО для них)
          if [ -s front_changed.txt ]; then
            # Убедимся, что каталоги существуют
            awk -F/ 'BEGIN{OFS="/"}{n=split($0,a,"/"); if(n>1){d=$0; sub("/"a[n] "$","", d); print d}}' front_changed.txt | sort -u | xargs -r -I{} mkdir -p "src_front/{}"
            git -C src_front checkout --pathspec-from-file=../front_changed.txt
          fi

          # Выкладываем изменённые файлы
          RSYNC_SSH="ssh -i /var/lib/jenkins/.ssh/id_ed25519 -o StrictHostKeyChecking=no"
          rsync -azv \
            --files-from=front_changed.txt \
            -e "$RSYNC_SSH" \
            src_front/ ${FRONT_USER}@${FRONT_HOST}:${FRONT_DST}

          # Удаляем удалённые файлы на фронте
          if [ -s front_deleted.txt ]; then
            echo "Deleting on front:"
            cat front_deleted.txt
            # Осторожно: удаляем только в пределах FRONT_DST
            ssh -i /var/lib/jenkins/.ssh/id_ed25519 -o StrictHostKeyChecking=no ${FRONT_USER}@${FRONT_HOST} \
              'set -e; while IFS= read -r f; do rm -f -- "${FRONT_DST}/$f"; done' \
              <<< "$(cat front_deleted.txt)"
          fi
        '''
      }
    }

    stage('Deploy MEDIA (checkout only changed media)') {
      when { expression { return fileExists('media_changed.txt') && sh(script: 'test -s media_changed.txt', returnStatus: true) == 0 } }
      steps {
        sh '''
          set -e
          rm -rf src_media && mkdir src_media
          git -C src_media init -q
          git -C src_media remote add origin "${GIT_URL}"
          # Частичный клон без блобов
          git -C src_media fetch --filter=blob:none --depth=1 origin "${GIT_BRANCH}"
          git -C src_media checkout -q --detach FETCH_HEAD

          # Точечный checkout только изменённых медиа-файлов
          if [ -s media_changed.txt ]; then
            awk -F/ 'BEGIN{OFS="/"}{n=split($0,a,"/"); if(n>1){d=$0; sub("/"a[n] "$","", d); print d}}' media_changed.txt | sort -u | xargs -r -I{} mkdir -p "src_media/{}"
            git -C src_media checkout --pathspec-from-file=../media_changed.txt
          fi

          # Локальный rsync на бэкенд (этот же сервер)
          rsync -azv \
            --files-from=media_changed.txt \
            src_media/ "${BACK_DST}"

          # Удаляем удалённые медиа локально
          if [ -s media_deleted.txt ]; then
            echo "Deleting on backend:"
            cat media_deleted.txt
            while IFS= read -r f; do rm -f -- "${BACK_DST}/$f"; done < media_deleted.txt
          fi
        '''
      }
    }

    stage('Update state file') {
      steps {
        sh '''
          set -e
          cp .head_sha "${STATE_FILE}"
          echo "Saved new state: $(cat ${STATE_FILE})"
        '''
      }
    }
  }

  post {
    always {
      // Чистим workspace, чтобы место не копилось
      deleteDir()
    }
  }
}
