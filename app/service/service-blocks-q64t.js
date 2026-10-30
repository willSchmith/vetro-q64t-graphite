'use strict';
// Read-only view of the six explicitly approved optional services.
var fs=require('fs');
var ROOT='/opt/vetro-boot';
var CATALOG=[
 {id:'ambient-ua-agent.service',name:'Ambient UA Agent',comm:'ambient-ua-agen',activators:['net.auad.busname']},
 {id:'slive-provider-daemon.service',name:'Slive — TV Plus and channels',comm:'slive-provider-',activators:['slive-provider-daemon.path']},
 {id:'sddp.service',name:'SDDP — Control4',comm:'SDDP',activators:[]},
 {id:'pvr-service.service',name:'PVR — TV recording',comm:'pvr-service',activators:[]},
 {id:'gamepad-service.service',name:'Gamepad service',comm:'gamepad-service',activators:['org.tizen.tv.gamepadservice.busname']},
 {id:'com.samsung.tv.nfc-monitor.service',name:'NFC monitor',comm:'nfc-monitor',activators:[]}
];
function read(storage){
 var f=storage||fs,policy,last,current,boot;
 try{policy=JSON.parse(f.readFileSync(ROOT+'/optional-services.json','utf8'));}catch(e){return {configured:false,services:[]};}
 function exists(p){try{return f.existsSync(p);}catch(e){return false;}}
 try{last=JSON.parse(f.readFileSync(ROOT+'/optional-services-last.json','utf8'));}catch(e){last={};}
 try{current=f.readFileSync('/proc/sys/kernel/random/boot_id','utf8').trim();boot=f.readFileSync(ROOT+'/boot.sh','utf8');}catch(e){return {configured:false,services:[],error:e.message};}
 var enabled=exists(ROOT+'/optional-services.enabled'),configured=enabled&&boot.indexOf('optional-services.sh')>=0;
 var pids={},scanError=null;
 try{f.readdirSync('/proc').filter(function(n){return /^\d+$/.test(n);}).forEach(function(n){try{var name=f.readFileSync('/proc/'+n+'/comm','utf8').trim();if(CATALOG.some(function(c){return c.comm===name;}))(pids[name]||(pids[name]=[])).push(+n);}catch(e){if(e.code!=='ENOENT'&&e.code!=='ESRCH')scanError=e.message;}});}catch(e){scanError=e.message;}
 function masked(id){try{return f.readlinkSync('/run/systemd/system/'+id)==='/dev/null';}catch(e){return false;}}
 var services=CATALOG.map(function(c){var ids=[c.id].concat(c.activators),pid=pids[c.comm]||[],blocked=ids.every(masked),running=pid.length?true:scanError?null:false;
  return {id:c.id,name:c.name,enabledInPolicy:Array.isArray(policy.units)&&policy.units.indexOf(c.id)>=0,masked:blocked,running:running,pids:pid,
   activators:c.activators.map(function(id){return {id:id,masked:masked(id)};}),blocked:blocked&&running===false,persistent:configured&&Array.isArray(policy.units)&&policy.units.indexOf(c.id)>=0};});
 return {configured:configured,rebootVerified:!!(configured&&current!==policy.initialBootId&&last.bootId===current&&last.servicesStopped===6&&last.activatorsBlocked===3&&services.every(function(s){return s.blocked;})),
  appliedThisBoot:last.bootId===current,services:services,error:scanError};
}
module.exports={read:read,CATALOG:CATALOG};
