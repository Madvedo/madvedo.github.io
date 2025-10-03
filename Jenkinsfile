pipeline {
  agent any

  options {
    timestamps()
    disableConcurrentBuilds()
    ansiColor('xterm')
  }

  environment {
    FRONT_HOST = '87.247.142.102'
    FRONT_USER = 'deploy'
    REPO_BRANCH = 'main'
    // ID входных кредов Jenkins -> Credentials (SSH Username with private key)
    SSH_CRED_ID = 'ssh_deploy_shunder'
  }

  triggers {
    // Автозапуск по GitHub webhook:
    githubPush()
    // Резервно можно включить polling, если вебхук временно не работает:
    // pollSCM('H/5 * * * *')
  }

  stages {
    stage('Checkout (for metadata only)') {
      steps {
        // Чекаутим чтобы в билде были инфо о ревизии/логах (на сервер файлы НЕ копируем)
        checkout([
          $class: 'GitSCM',
          branches: [[name: "*/${env.REPO_BRANCH}"]],
          userRemoteConfigs: [[url: 'https://github.com/Madvedo/madvedo.github.io.git']]
        ])
        sh 'git log -1 --pretty=oneline'
      }
    }

    stage('Deploy on Front via SSH') {
      steps {
        sshagent(credentials: [env.SSH_CRED_ID]) {
          sh """
            set -e
            ssh -o StrictHostKeyChecking=no ${FRONT_USER}@${FRONT_HOST} \\
              'git -C /var/www/html fetch --all --prune && \\
               git -C /var/www/html checkout ${REPO_BRANCH} && \\
               git -C /var/www/html pull --ff-only && \\
               sudo nginx -t && \\
               sudo systemctl reload nginx || true'
          """
        }
      }
    }
  }

  post {
    success {
      echo "✅ Deployed ${env.REPO_BRANCH} to ${env.FRONT_HOST}"
    }
    failure {
      echo "❌ Deploy failed. Check stages output."
    }
  }
}
