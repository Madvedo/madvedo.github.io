pipeline {
  agent any

  options {
    timestamps()
    disableConcurrentBuilds()
  }

  environment {
    FRONT_HOST   = '87.247.142.102'
    REPO_URL     = 'https://github.com/Madvedo/madvedo.github.io.git'
    REPO_BRANCH  = 'main'
    SSH_CRED_ID  = 'front-deploy-ssh'   // <-- твой Credential ID
  }

  triggers {
    githubPush()
    // pollSCM('H/5 * * * *') // опционально как запаска
  }

  stages {
    stage('Checkout (metadata)') {
      steps {
        checkout([
          $class: 'GitSCM',
          branches: [[name: "*/${env.REPO_BRANCH}"]],
          userRemoteConfigs: [[url: env.REPO_URL]]
        ])
        sh 'git log -1 --pretty=oneline'
      }
    }

    stage('Deploy to Front') {
      steps {
        withCredentials([sshUserPrivateKey(credentialsId: env.SSH_CRED_ID, keyFileVariable: 'SSH_KEY', usernameVariable: 'SSH_USER')]) {
          sh """
            set -e
            ssh -o StrictHostKeyChecking=no -i "$SSH_KEY" ${SSH_USER}@${FRONT_HOST} \\
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
    success { echo "✅ Deployed ${env.REPO_BRANCH} to ${env.FRONT_HOST}" }
    failure { echo "❌ Deploy failed. Check console output." }
  }
}
