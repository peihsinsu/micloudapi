var fs = require('fs');
var smartdc = require('smartdc');
var adminip = '211.78.255.34';
var loadbalancerip = '211.78.255.26';

// Read in the SSH private key
var home = process.env.HOME;
var key = fs.readFileSync(home + '/.ssh/id_rsa', 'ascii');
var exec = require('child_process').exec;

var client = smartdc.createClient({
 	url: 'https://api.micloud.tw',
	key: key,
	keyId: '/micloud/keys/id_rsa'
});

var machineObj = {
  "name":"",
  "ipaddress":"",
  "uuid":"",
  "memUsed":0,
  "memTotal":0
}

function listMachines() {
	client.listMachines(function(err, machines) {
	  machines.forEach(function(m) {
			if(m.state == 'running') {
		    //console.log('Machine: ' + JSON.stringify(m, null, 2));
				//console.log(m.ips[0]);
				var cmd = 'ssh root@' + m.ips[0] + ' zonememstat';
				//console.log('exec:' + cmd);
				exec(cmd, function(error, stdout, stderr) { 
					console.log('Memory state of your machines:' + m.ips[0]);
					//sys.puts(stdout) 
					console.log(stdout);
				});
			}
	  });
	});
}

listMachines();
