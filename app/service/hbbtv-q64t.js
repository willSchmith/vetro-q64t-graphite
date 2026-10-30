'use strict';
// Q64T: native menu and persistent launch blocks, independent of boot-time root.
var fs=require('fs'),execError=require('./exec-error.js');
var KEY='db/menu/system/data-service',FILE='/opt/usr/home/owner/share/vetro-hbbtv.json';
var APP='org.tizen.hbbtv',SERVICE='org.tizen.hbbtv-service',FLAG='/tmp/hbbtv_do-not-relaunch',RUNFLAG='/tmp/hbbtv_app_running';
var DB='/opt/dbspace/.pkgmgr_parser.db',STOP='systemctl stop hbbtv-service.path hbbtv-service.service';
function listed(id){return 'app_launcher -S 2>/dev/null | grep -q "^[[:space:]]*'+id.replace(/\./g,'\\.')+'[[:space:]]"';}
function wrap(s){return 'echo '+Buffer.from(s).toString('base64')+' | base64 -d | sh';}
function check(r){if(r.exit_code||r.timed_out)throw execError.failed(r,r.stderr||r.stdout||'HbbTV unavailable');return r.stdout||'';}
function flags(a,disabled){return 'pkgcmd '+(disabled?'-D':'-A')+' -t app -n '+a+' --global';}
function Control(execute,storage){this.execute=execute;this.fs=storage||fs;this.busy=false;}
Control.prototype.saved=function(){try{return JSON.parse(this.fs.readFileSync(FILE,'utf8'));}catch(e){return {};}};
Control.prototype.read=function(){var self=this;
 var script='vconftool get '+KEY+' 2>&1\n'+
  '[ -e '+FLAG+' ] && echo FLAG=1 || echo FLAG=0\n'+
  listed(APP)+' && echo APP=1 || echo APP=0\n'+listed(SERVICE)+' && echo SVC=1 || echo SVC=0\n'+
  'sqlite3 -readonly '+DB+' "SELECT \'DISABLED|\'||app_id||\'|\'||app_disable FROM package_app_info WHERE app_id IN (\''+APP+'\',\''+SERVICE+'\');"';
 return this.execute(wrap(script),10000).then(function(r){var s=check(r),m=/value = (-?\d+) \(Int32\)/.exec(s);if(!m)throw Error('HbbTV value unreadable');
  var v=Number(m[1]),flag=/FLAG=1/.test(s),app=/APP=1/.test(s),svc=/SVC=1/.test(s);
  var ad=s.indexOf('DISABLED|'+APP+'|true')>=0,sd=s.indexOf('DISABLED|'+SERVICE+'|true')>=0;
  var known=s.indexOf('DISABLED|'+APP+'|')>=0&&s.indexOf('DISABLED|'+SERVICE+'|')>=0;
  var saved=self.saved(),restore=Number.isInteger(saved.value)&&saved.value>0&&saved.value!==19?saved.value:null;
  var valueOff=v===19||v===0,persistent=known&&ad&&sd;
  var rebootVerified=require('./platform.js').status().boot.currentBootObserved&&persistent&&valueOff&&!app&&!svc;
  return {value:v,valueOff:valueOff,off:valueOff&&!app&&!svc&&(persistent||flag),flag:flag,running:app,serviceRunning:svc,
   appDisabled:known?ad:null,serviceDisabled:known?sd:null,persistent:persistent,rootNeededToMaintain:false,
   restoreValue:restore,canRestore:restore!==null,source:KEY,rebootVerified:!!rebootVerified,verification:rebootVerified?'HbbTV block verified after a full TV restart':'Native menu, persistent application flags and live processes; full reboot not tested'};
 });
};
Control.prototype.change=function(off,expected){var self=this,previous;
 if(typeof off!=='boolean'||!Number.isInteger(expected))return Promise.reject(Error('Invalid HbbTV state'));
 if(this.busy)return Promise.reject(Error('HbbTV change already in progress'));this.busy=true;
 function run(s){return self.execute(wrap('set -e\n'+s),20000).then(check);}
 function restore(s){return run(flags(SERVICE,s.serviceDisabled===true)+'\n'+flags(APP,s.appDisabled===true)+'\nvconftool set -f -t int '+KEY+' '+s.value+'\n'+(s.flag?'touch '+FLAG:'rm -f '+FLAG)+(s.serviceRunning?'\nsystemctl start hbbtv-service.path hbbtv-service.service':'')+(s.running?'\napp_launcher -s '+APP:''));}
 return this.read().then(function(s){previous=s;if(s.value!==expected)throw Error('Value changed; refresh before editing');
  if(off&&s.off&&s.persistent)return Object.assign(s,{changed:false});
  if(off&&s.appDisabled===null)throw Error('Application flags unavailable; no change sent');
  if(off&&s.value>0&&!s.valueOff){var o=self.saved();o.value=s.value;o.persistentManaged=true;var tmp=FILE+'.tmp';self.fs.writeFileSync(tmp,JSON.stringify(o)+'\n',{mode:0o600});self.fs.renameSync(tmp,FILE);}
  var target=off?19:s.restoreValue;if(!off&&target===null)throw Error('Previous HbbTV value unavailable');
  var script=off?STOP+'\nvconftool set -f -t int '+KEY+' 19\ntouch '+FLAG+'\n'+flags(SERVICE,true)+'\n'+flags(APP,true):
   flags(SERVICE,false)+'\n'+flags(APP,false)+'\nvconftool set -f -t int '+KEY+' '+target+'\nrm -f '+FLAG+' '+RUNFLAG+'\nsystemctl start hbbtv-service.path hbbtv-service.service\napp_launcher -s '+APP;
  return run(script+'\nsleep 1').then(function(){return self.read();}).then(function(a){
   if(off?!a.off||!a.persistent:a.value!==target||a.appDisabled||a.serviceDisabled)throw Error('HbbTV state not confirmed');
   return Object.assign(a,{changed:true});
  }).catch(function(e){return restore(previous).then(function(){throw Error(e.message+'; previous configuration restored');},function(){throw Error(e.message+'; restore not confirmed');});});
 }).finally(function(){self.busy=false;});
};
Control.prototype.enforce=function(){return this.read().then(function(s){return {stopped:false,reason:s.persistent?'Persistent launch block is set':'No persistent block configured'};});};
module.exports={Control:Control,KEY:KEY,FILE:FILE,FLAG:FLAG,STOP:STOP,SERVICE:SERVICE};
