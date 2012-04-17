var fs = require('fs');
var smartdc = require('smartdc');
var adminip = '211.78.255.34';
var loadbalancerip = '211.78.255.26';

var zoneVo = {
	"name":"",
	"uuid":"",
	"ipaddress":"",
	"usedMem":0,
	"totalMem":0
};
// Read in the SSH private key
var home = process.env.HOME;
//var key = fs.readFileSync(home + '/.ssh/' + process.env.SDC_CLI_KEY_ID, 'ascii');
var key = fs.readFileSync(process.env.SDC_CLI_IDENTITY, 'ascii');
var exec = require('child_process').exec;

var client = smartdc.createClient({
 	url: 'https://api.micloud.tw',
	key: key,
	keyId: '/'+process.env.SDC_CLI_ACCOUNT+'/keys/'+process.env.SDC_CLI_KEY_ID
});

/**
 * Usage:
 * var api = require('./apiutil.js');
 * api.getMachinesMemStat();
 */
exports.getMachinesMemStat = function(){
	client.listMachines(function(err, machines) {
	  if (err) {
		    console.log('Unable to list machines: ' + e);
				return;
	  }

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
};

exports.createZxtmPool = function(){
	var str = '';
	client.listMachines(function(err, machines) {
	  if (err) {
		    console.log('Unable to list machines: ' + e);
			return;
	  }

	  str += 'disabled        \n';
      str += 'draining        \n';
      
	  machines.forEach(function(m) {
	  	if(m.state == 'running' && m.ips[0] != adminip && m.ips[0] != loadbalancerip) {
			var ip = m.ips[0];
			str += 'load_balancing!weighting!' + ip + ':3001     1\n';
		}	
	  });
	  str += 'monitors        Ping\n';
	  str += 'nodes   ';
  	  machines.forEach(function(m) {
  	  	if(m.state == 'running' && m.ips[0] != adminip && m.ips[0] != loadbalancerip) {
			str += (m.ips[0]+':3001 ');
		}
	  });
	  str += '\n';
	  console.log(str);
	  //Write to file
	  fs.writeFileSync('/tmp/test-node-pool', str, 'utf8');
	  var cmd = 'scp /tmp/test-node-pool root@211.78.255.26:/opt/zeus/zxtm/conf/pools/'
	  exec(cmd, function(error, stdout, stderr) { 
		console.log('Provisioning pool setting...');
		console.log(stdout);
	  });
	});
};

/**
 * Usage:
 * var callback = function(ecnt, total, totalUsed, totalMem, bookedMem){...};
 * api.getTotalMemSum(null,callback);
 */
exports.getTotalMemSum =function(_t, callback) {
	//console.log('type:%s, callback:%s', _t, callback);
	var MAX_MEM = 0.25;
	//var BURST_RATE = 0.5;
	client.listMachines(function(err, machines){
			if(err){
				console.log('Excetion when list machines:' + err);
				return;
			}

			var cnt = 0;
			var machineCnt = 0;
			var allMachineCnt = 0; //include history
			var totalUsed = new Array();
			var totalMem = new Array();
			var bookedMem = new Array();
			var ecnt = 0;
			machines.forEach(function(m){
				allMachineCnt ++;
				if(m.state != 'destroyed') {
					bookedMem.push(Number(m.memory));
				}

				if(m.state == 'running' && m.ips[0] != adminip && m.ips[0] != loadbalancerip) {
					machineCnt ++;
					var cmd = 'ssh root@' + m.ips[0] + ' zonememstat';
					exec(cmd, function(error, stdout, stderr) {
						if(error) return;
						ecnt ++;
						log('>>>' + cmd);
						if(_t == 'm') {
							console.log('[Name:'+(m.name != null? m.name : m.id) + '\tIp:' + m.ips[0] + ']\n' + stdout);
					    }
					  	var rtn = stdout.toString();
			      		var v = rtn.split('\n')[1];
						v = mformat(v);
						var rss = v[0];
						var total = v[1];
						totalUsed.push(rss);
						totalMem.push(total);
						if(rss/total > MAX_MEM) {
							cnt ++;
						}
						callback(ecnt, machineCnt, allMachineCnt, totalUsed, totalMem, bookedMem, cnt);
					});
				}
			});

	});
}

/**
 * Usage:
 * var callback = function(ecnt, total, totalUsed, totalMem, bookedMem){...};
 * api.getTotalMemSum(null,callback);
 */
exports.getMachineMemoryState =function(_t, callback) {
	//console.log('type:%s, callback:%s', _t, callback);
	var MAX_MEM = 0.25;
	var machineList = new Array();
	//var BURST_RATE = 0.5;
	client.listMachines(function(err, machines){
			if(err){
				console.log('Excetion when list machines:' + err);
				return;
			}

			var cnt = 0;
			var machineCnt = 0;
			var allMachineCnt = 0; //include history
			var totalUsed = new Array();
			var totalMem = new Array();
			var bookedMem = new Array();
			var ecnt = 0;
			
			machines.forEach(function(m){
				allMachineCnt ++;
				if(m.state != 'destroyed') {
					bookedMem.push(Number(m.memory));
				}

				if(m.state == 'running' && m.ips[0] != adminip && m.ips[0] != loadbalancerip) {
					machineCnt ++;
					var cmd = 'ssh root@' + m.ips[0] + ' zonememstat';
					exec(cmd, function(error, stdout, stderr) {
						if(error) return;
						ecnt ++;
							zoneVo.name = m.name;
							zoneVo.uuid = m.id;
							zoneVo.ipaddress = m.ips[0];
					  	var rtn = stdout.toString();
			      		var v = rtn.split('\n')[1];
						v = mformat(v);
						var rss = v[0];
						var total = v[1];
						zoneVo.usedMem = rss;
						zoneVo.totalMem = total;
						
						totalUsed.push(rss);
						totalMem.push(total);
						if(rss/total > MAX_MEM) {
							cnt ++;
						}
						
						machineList.push(zoneVo);
						if(ecnt >= machineCnt)
							callback(ecnt, machineCnt, allMachineCnt, totalUsed, totalMem, bookedMem, cnt, machineList);
					});
				}
			});

	});
}

exports.createMachine = function(){
	var machineOptions = {
	  "dataset": "sdc:sdc:smartosplus64:3.0.7",
	  "name": "TS-72-SIMON-" + new Date().getTime(),
	  "package": "S 1GB RAM (1CORE)"
	};
	client.createMachine(machineOptions, function (er, machine) {

		if (er) {
		  if (er.message == "At least one key is required on your account to provision this dataset") {
		    er.message = "At least one key is required on your account to provision this dataset. [Add a SSH Key here.](/sshkeys)";
		    console.log(er.message);
		  }
		  
		  console.log('>>'+er.message);
		}
		console.log('Creating machine:' + JSON.stringify(machine));
		console.log("Create machine done!");
	});
}

exports.deleteMachine = function(uuid){
	
	console.log('Try to stop machine first:' + uuid);    
    client.stopMachine(uuid, function (e) {
    	if (e) {
	      console.log(e.message);
    	}
    	console.log("Deleting machine: " + uuid);
    	client.deleteMachine(uuid, function (er) {
		    if (er) {
		      console.log(er.httpCode);
		      console.log(er.message);
	    	}
	    	console.log("Delete machine done!");
	    });
    });
}

function mformat(m){
	var result = new Array();
	//console.log('m='+m);
	var mm = m.substring(37,55);
	mm = mm.trim();
	result.push(mm.split('MB')[0]);
	result.push(mm.split('MB')[1].replace('MB','').trim());
	return result;
}

function log(msg){
	//console.log('[LOG]'+msg);
}
