'use strict';
var fs=require('fs'),path=require('path'),constants=require('constants');
var root=path.resolve(__dirname,'..','queue'), seq=0, running=false;
var pending=Object.create(null), watcher=null, fallback=null;
function settle(id){
 var job=pending[id];if(!job)return;
 try{
  if(fs.existsSync(job.path+'.done')){
   var rc=Number(fs.readFileSync(job.path+'.done','utf8'));
   var result={exit_code:rc,timed_out:rc===124,stdout:fs.readFileSync(job.path+'.out','utf8'),stderr:fs.readFileSync(job.path+'.err','utf8')};
   delete pending[id];['.done','.out','.err','.seconds'].forEach(function(x){try{fs.unlinkSync(job.path+x);}catch(e){}});job.resolve(result);
  }else if(Date.now()>job.deadline){delete pending[id];job.reject(Error('root worker deadline exceeded'));}
 }catch(e){delete pending[id];job.reject(e);}
}
function scan(){Object.keys(pending).forEach(settle);}
function start(){
 if(running)return;running=true;
 try{
  watcher=fs.watch(root,function(event,name){if(name&&/\.done$/.test(String(name)))settle(String(name).slice(0,-5));});
  watcher.on('error',function(){if(watcher){watcher.close();watcher=null;}});
 }catch(e){watcher=null;}
 // Also covers missing/coalesced inotify events and the command deadline.
 fallback=setInterval(scan,1000);if(fallback.unref)fallback.unref();
}
function stop(){running=false;if(watcher){watcher.close();watcher=null;}if(fallback){clearInterval(fallback);fallback=null;}Object.keys(pending).forEach(function(id){var job=pending[id];delete pending[id];job.reject(Error('adapter stopped'));});}
function wake(){
 var fd;
 try{fd=fs.openSync(root+'/wake',constants.O_WRONLY|constants.O_NONBLOCK);fs.writeSync(fd,new Buffer('!'),0,1);}
 catch(e){/* The worker's one-second scan also accepts commands from older clients. */}
 finally{if(fd!==undefined)try{fs.closeSync(fd);}catch(e){}}
}
function identity(){return {pid:process.pid,uid:process.getuid(),euid:process.geteuid(),gid:process.getgid(),egid:process.getegid(),node:process.version,autostart:process.env.VETRO_BOOT_AUTOSTART==='1',smack:fs.readFileSync('/proc/self/attr/current','utf8').trim()};}
function execute(cmd,ms){return new Promise(function(resolve,reject){
 if(!running)return reject(Error('adapter stopped'));
 var id=String(Date.now())+'-'+process.pid+'-'+('0000000000'+(++seq)).slice(-10),p=root+'/'+id;
 pending[id]={path:p,resolve:resolve,reject:reject,deadline:Date.now()+(ms||30000)+10000};
 try{fs.writeFileSync(p+'.cmd',cmd,{mode:384});fs.writeFileSync(p+'.seconds',String(Math.max(1,Math.ceil((ms||30000)/1000))),{mode:384});fs.renameSync(p+'.cmd',p+'.ready');wake();settle(id);}
 catch(e){delete pending[id];['.cmd','.seconds'].forEach(function(x){try{fs.unlinkSync(p+x);}catch(ignore){}});reject(e);}
});}

function bootState(){var state={},proof={};try{state=JSON.parse(fs.readFileSync('/opt/vetro-boot/install-state.json','utf8'));}catch(e){}try{proof=JSON.parse(fs.readFileSync('/opt/vetro-boot/last-entry.json','utf8'));}catch(e){}var current=fs.readFileSync('/proc/sys/kernel/random/boot_id','utf8').trim();var observed=state.installed===true&&state.initialBootId!==current&&process.env.VETRO_BOOT_AUTOSTART==='1'&&proof.bootId===current&&proof.uid===0;return {configured:state.installed===true,verified:observed||(state.verifiedBootIds||[]).length>0,currentBootObserved:observed,lastEntry:proof.timestamp||null};}
module.exports={start:start,stop:stop,status:function(){var i=identity(),b=bootState();return {mode:'tv-integration',portKind:'q64t-cifs-volatile',running:running,prepared:true,self:i,boot:b,attempts:[],agent:{connected:running&&i.uid===0,identity:i},transport:{completion:watcher?'filesystem-events':'fallback-scan',fallbackMs:1000},limitations:b.verified?[]:b.configured?['boot hook installed; cold boot not yet verified']:['temporary until reboot','boot policies disabled']};},execute:execute,install:function(){return Promise.reject(Error('Package install not enabled in this temporary port'));},setApplicationsEnabled:function(ids,on){var d=require('./debloat-commands');return execute(on?d.enableCommand(ids):d.disableCommand(ids),60000);}};
