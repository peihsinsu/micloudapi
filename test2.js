var client = require('./lib/api');

client.act.createMachine('sdc:sdc:nodejs:13.1.0', 'S 1GB RAM (1CORE)', {
  script: './deploy.sh', name: 'simontest001'
  //, tag: 'key=value'
});
