exports.cloud = {
  apiserver: process.env.SDC_CLI_URL || 'https://api.micloud.tw',
  account: process.env.SDC_CLI_ACCOUNT || 'your account',
  privatekey: process.env.SDC_CLI_IDENTITY || process.env.HOME + '/.ssh/id_rsa',
  keyid: process.env.SDC_CLI_KEY_ID || 'id_rsa'
}
