var client = require('./lib/api').act
  , nu = require('nodeutil')
  , log = nu.logger.getInstance('api')
  , request = require('request')
  , exec = require('child_process').exec
  , util = require('util')
  , fs = require('fs')

var target = 'http://opennodejs.my.micloud.tw/';

var proxyServer = '211.78.245.250';
var haproxycfg = ['listen http opennodejs.my.micloud.tw:80',
        'mode tcp',
        'option tcplog',
        'balance roundrobin',
        'maxconn 10000'];

var servercfg = 'server web01 %s:3000 maxconn 5000';

var waittime = 3000
  , cnt = 0
  , machine_max = 15
  , long_wait = 30000
  , wait_degree = 1000;

function start() {
  log.info('waittime:%s, cnt:%s', waittime, cnt);
  //using request for monitor and event trigger
  request.get({ url: target, method: 'GET', timeout:3000 }, function(e,r,d) {
    log.info('in request...');
    if(e) {
      log.warn('Lost hart bit signal...');
      log.error(e);
      waittime += wait_degree;
      cnt++;
      if(cnt >=3) {
        //start new machine...
        log.fatal('START NEW MACHINE....');
        cnt = 0;
        //wait 30 seconds for machine start
        waittime = long_wait;
        //check machine size, not over 3 machines
        client.list(function(e,machines){
          if(machines.length <= 5) {
            exec('./create.sh', function(e,stdo, stde) {
              if(e) log.error(e);
              log.info(stdo);

              client.list(function(e, ms) {
                if(e) log.error(e);
                var out = haproxycfg.join('\n');
                ms.forEach(function(v) {
                  if(v.primaryIp != proxyServer && v.state == 'running') {
                    out += ('\n' + util.format(servercfg, v.primaryIp));
                  }
                });
                //persistance file
                fs.writeFile('/tmp/haproxy.cfg', out, 'utf8', function(err){
                  if(err) log.error(err);
                  postToHaproxy();
                }); 
              });
            });
          } else {
            log.fatal('Reach the machine max times: %s', machine_max);
          }
        })
      }
    } else {
      cnt = 0;
      waittime = 3000;
      log.info('hart bit ok [%s]', d.length);
    }
    setTimeout(function(){
      start();
    }, waittime);  
  });
}

function postToHaproxy(){
  log.fatal('POSTING CONFIG TO HAPROXY...');
  exec('scp /tmp/haproxy.cfg root@211.78.245.250:/opt/local/etc/', function(e,stdo, stde) {
      if(e) log.error(e);
      log.info(stdo);
      exec('ssh root@211.78.245.250 svcadm restart haproxy', function(e,stdo, stde) {
        if(e) log.error(e);
        log.info(stdo);
      });
  });
}

start();
