pipeline {
  agent any

  options {
    timestamps()
    disableConcurrentBuilds()
    skipDefaultCheckout(true) // ничего не чекаутим из SCM по-умолчанию
  }

  environment {
    // репозиторий
    REPO_OWNER   = 'Madvedo'
    REPO_NAME    = 'madvedo.github.io'
    GIT_URL      = "https://github.com/${REPO_OWNER}/${REPO_NAME}.git"
    GIT_BRANCH   = 'main'
    RAW_BASE     = "https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}"

    // фронт
    FRONT_HOST   = '87.247.142.102'
    FRONT_USER   = 'deploy'
    FRONT_DST    = '/var/www/html'
    SSH_KEY      = '/var/lib/jenkins/.ssh/id_ed25519'

    // бэк (локально на Jenkins-хосте)
    BACK_DST     = '/var/www/html'

    // состояние
    STATE_DIR    = '/var/lib/jenkins/.deploy_state'
    STATE_FILE   = '/var/lib/jenkins/.deploy_state/git_deploy_shun.sha'
  }

  stages {
    stage('Resolve HEAD & previous SHA (no checkout)') {
      steps {
        sh '''
          set -e
          mkdir -p "${STATE_DIR}"

          # текущий HEAD SHA удалённой ветки
          HEAD_SHA=$(git ls-remote --heads "${GIT_URL}" "refs/heads/${GIT_BRANCH}" | awk '{print $1}')
          echo "HEAD_SHA=${HEAD_SHA}"
          test -n "$HEAD_SHA"

          # предыдущий задеплоенный SHA (если отсутствует — пусто)
          if [ -f "${STATE_FILE}" ]; then
            PREV_SHA=$(tr -d '\\n' < "${STATE_FILE}")
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
          git fetch --filter=blob:none --no-tags --depth=2 origin "${GIT_BRANCH}" 1>/dev/null
          git checkout -q --detach FETCH_HEAD

          # если baseline не сохранён — берём предыдущий коммит удалённой ветки
          if [ -z "$PREV_SHA" ]; then
            if git rev-parse -q --verify HEAD~1 >/dev/null 2>&1; then
              PREV_SHA=$(git rev-parse HEAD~1)
              echo "[FIRST RUN] Using remote HEAD~1 as baseline: $PREV_SHA"
            else
              echo "[FIRST RUN] Single-commit repo — нет diffs"
              : > ../front_changed.txt
              : > ../front_deleted.txt
              : > ../media_changed.txt
              : > ../media_deleted.txt
              cd ..
              exit 0
            fi
          fi

          # разница между PREV_SHA и HEAD_SHA (без блобов)
          git diff --name-only   "$PREV_SHA" "$HEAD_SHA" > ../changed_all.txt || true
          git diff --name-status "$PREV_SHA" "$HEAD_SHA" | awk '/^D/{print $2}' > ../deleted_all.txt || true
          cd ..

          awk 'NF' changed_all.txt > changed_all_clean.txt
          awk 'NF' deleted_all.txt > deleted_all_clean.txt

          # ВАЖНО: редирект ДО "|| true"
          # медиа
          grep -E '^(audio/|radio/)' changed_all_clean.txt  > media_changed.txt  || true
          grep -E '^(audio/|radio/)' deleted_all_clean.txt  > media_deleted.txt  || true

          # фронт
          grep -Ev '^(audio/|radio/)' changed_all_clean.txt > front_changed.txt  || true
          grep -Ev '^(audio/|radio/)' deleted_all_clean.txt > front_deleted.txt  || true

          echo "== stats =="
          wc -l front_changed.txt front_deleted.txt media_changed.txt media_deleted.txt || true

          echo "--- front_changed (first lines) ---"
          head -n 30 front_changed.txt || true
        '''
      }
    }

    stage('Deploy FRONT (download changed files via raw.githubusercontent)') {
      when { expression { return fileExists('front_changed.txt') && sh(script: 'test -s front_changed.txt', returnStatus: true) == 0 } }
      steps {
        sh '''
          set -e
          HEAD_SHA=$(cat .head_sha)

          rm -rf dl_front && mkdir -p dl_front

          # качаем ТОЛЬКО изменённые файлы напрямую по SHA
          while IFS= read -r p; do
            [ -n "$p" ] || continue
            echo "DL: $p"
            mkdir -p "dl_front/$(dirname "$p")"
            curl -sfL "${RAW_BASE}/${HEAD_SHA}/${p}" -o "dl_front/${p}"
          done < front_changed.txt

          # отправляем на фронт
          mkdir -p ~/.ssh
          ssh-keyscan -H ${FRONT_HOST} >> ~/.ssh/known_hosts 2>/dev/null || true
          RSYNC_SSH="ssh -i ${SSH_KEY} -o StrictHostKeyChecking=no"

          rsync -azv \
            --include='*/' \
            $(awk '{print "--include=" $0}' front_changed.txt) \
            --exclude='*' \
            -e "$RSYNC_SSH" \
            dl_front/ ${FRONT_USER}@${FRONT_HOST}:${FRONT_DST}

          # удалённые пути
          if [ -s front_deleted.txt ]; then
            echo "Deleting on front:"
            cat front_deleted.txt
            ssh -i ${SSH_KEY} -o StrictHostKeyChecking=no ${FRONT_USER}@${FRONT_HOST} \
              'set -e; while IFS= read -r f; do rm -f -- "${FRONT_DST}/$f"; done' \
              <<< "$(cat front_deleted.txt)"
          fi
        '''
      }
    }

    stage('Deploy MEDIA (only if changed)') {
      when { expression { return fileExists('media_changed.txt') && sh(script: 'test -s media_changed.txt', returnStatus: true) == 0 } }
      steps {
        sh '''
          set -e
          HEAD_SHA=$(cat .head_sha)

          rm -rf dl_media && mkdir -p dl_media

          # если медиа реально менялись — качаем только их
          while IFS= read -r p; do
            [ -n "$p" ] || continue
            echo "DL media: $p"
            mkdir -p "dl_media/$(dirname "$p")"
            curl -sfL "${RAW_BASE}/${HEAD_SHA}/${p}" -o "dl_media/${p}"
          done < media_changed.txt

          # локальный rsync на бэкенд; НЕ удаляем существующее (бэк — источник истины)
          rsync -azv --ignore-existing \
            --include='*/' \
            $(awk '{print "--include=" $0}' media_changed.txt) \
            --exclude='*' \
            dl_media/ "${BACK_DST}"

          # Если хочешь удалять медиа по репозиторию — раскомментируй блок ниже (ОСТОРОЖНО!)
          # if [ -s media_deleted.txt ]; then
          #   echo "Deleting media on backend as per repo:"
          #   while IFS= read -r f; do rm -f -- "${BACK_DST}/$f"; done < media_deleted.txt
          # fi
        '''
      }
    }

    stage('Save baseline') {
      steps {
        sh '''
          set -e
          cp .head_sha "${STATE_FILE}"
          echo "Saved baseline: $(cat ${STATE_FILE})"
        '''
      }
    }
  }

  post {
    always {
      // полная очистка рабочего каталога каждый раз
      deleteDir()
    }
  }
}
