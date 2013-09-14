var fs = require('fs')
  , smartdc = require('smartdc')
  , util = require('util')
  , cfg = require('../cfg/config').cloud
  , nu = require('nodeutil')
  , log = nu.logger.getInstance('api')

/**
 * Read in the SSH private key
 **/
log.info('Got config:' + JSON.stringify(cfg));
log.info('Load private key from: %s', cfg.privatekey);
var key = fs.readFileSync(cfg.privatekey);

var client = smartdc.createClient({
  account: cfg.account,
  url: cfg.apiserver,
  key: key,
  keyId: util.format('/%s/keys/%s',cfg.account, cfg.keyid)
});

var act = {
  /** List machine sample **/
  list: function(fn){
    client.listMachines(function(err, machines) {
      if (err) {
        console.log('Unable to list machines: ' + err);
        return;
      }
      if(fn) fn(err, machines);
      /*
      */
    });
  },
  /** Get machine by uuid smaple **/
  getById: function(uuid) {
    client.getMachine({id:uuid}, function(err, m){
      if(err) {
        console.log('Error....');
        console.log(err);
      }
      console.log('Output:');
      console.log(m);
    });
  },
  createMachine: function(ds, pkg, opt, fn) {
    var def = {
      dataset: ds,
      "package": pkg,
    }

    if(opt) {
      if(opt.name) def.name = opt.name;
      if(opt.script) def['metadata.user-script'] = opt.script;
      if(opt.tag) def['tag.' + opt.tag.split('=')[0]] = opt.tag.split('=')[1];
    }
    client.createMachine(def, function(err, obj){
      if(err) log.error(err);
      log.info(obj); 
    }); 
  }
}

exports.act = act;


