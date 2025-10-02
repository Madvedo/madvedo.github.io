pipeline {
  agent any

  environment {
    FRONT_HOST   = '87.247.142.102'
    FRONT_USER   = 'deploy'
    FRONT_DST    = '/var/www/html'
    BACK_DST     = '/var/www/html'      // локально на Jenkins-хосте
    SSH_CREDS_ID = 'front-deploy-ssh'   // ID cred'а из шага 1

    MEDIA_INCLUDE_A = 'audio/***'
    MEDIA_INCLUDE_R = 'radio/***'
  }

  options {
    timestamps()
    disableConcurrentBuilds()
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
        sh 'git --no-pager log -1 --pretty="format:%h %s"'
      }
    }

    stage('Detect changes') {
      steps {
        script {
          def diff = sh(returnStdout: true, script: '''
            set -e
            git diff --name-only HEAD~1..HEAD 2>/dev/null || true
          ''').trim()
          if (!diff) { diff = sh(returnStdout: true, script: 'git ls-files').trim() }

          def files = diff.readLines()
          env.CHANGED_MEDIA = files.any { it.startsWith('audio/') || it.startsWith('radio/') }.toString()
          env.CHANGED_FRONT = files.any { !(it.startsWith('audio/') || it.startsWith('radio/')) }.toString()

          echo "CHANGED_MEDIA=${env.CHANGED_MEDIA}, CHANGED_FRONT=${env.CHANGED_FRONT}"
        }
      }
    }

    stage('Deploy media to BACK (local)') {
      when { expression { env.CHANGED_MEDIA == 'true' } }
      steps {
        sh '''
          set -e
          echo "[MEDIA] -> ${BACK_DST}"
          rsync -azv --delete \
            --prune-empty-dirs \
            --include="${MEDIA_INCLUDE_A}" \
            --include="${MEDIA_INCLUDE_R}" \
            --exclude='*' \
            ./ "${BACK_DST}"
          # при необходимости:
          # sudo chown -R www-data:www-data "${BACK_DST}/audio" "${BACK_DST}/radio" || true
        '''
      }
    }

    stage('Deploy front to FRONT (ssh+rsync)') {
      when { expression { env.CHANGED_FRONT == 'true' } }
      steps {
        sshagent (credentials: [env.SSH_CREDS_ID]) {
          sh '''
            set -e
            mkdir -p ~/.ssh
            ssh-keyscan -H ${FRONT_HOST} >> ~/.ssh/known_hosts 2>/dev/null || true

            rsync -azv --delete \
              --exclude='.git/' \
              --exclude='.github/' \
              --exclude='node_modules/' \
              --exclude='audio/***' \
              --exclude='radio/***' \
              ./ ${FRONT_USER}@${FRONT_HOST}:${FRONT_DST}
          '''
        }
      }
    }
  }

  post {
    success { echo '✅ Deploy completed.' }
    failure { echo '❌ Deploy failed.' }
  }
}
