'use strict';
var Base=require('./quick-wins.js'),execError=require('./exec-error.js');
var ID='com.samsung.tv.multiscreen',UNIT=ID+'.service';
var FLAG='/home/owner/share/multiviewnotsupport';
var LEGACY='/home/owner/apps_rw/com.samsung.tv.multiscreen/data/disable_preloading';
function wrap(s){return 'echo '+Buffer.from(s).toString('base64')+' | base64 -d | sh';}
function check(r){if(r.exit_code||r.timed_out)throw execError.failed(r,r.stderr||r.stdout||'MultiScreen unavailable');return r.stdout||'';}
function Wins(execute,options){Base.Wins.call(this,execute,options);}
Wins.prototype=Object.create(Base.Wins.prototype);Wins.prototype.constructor=Wins;
Wins.prototype.read=function(){var self=this;
 return Base.Wins.prototype.read.call(this).then(function(state){
  var script='[ -e '+FLAG+' ] && echo MF=1 || echo MF=0\n'+
   'sqlite3 -readonly /opt/dbspace/.pkgmgr_parser.db "SELECT \'MD|\'||app_disable FROM package_app_info WHERE app_id=\''+ID+'\';"\n'+
   'echo "MU|$(systemctl is-active '+UNIT+' 2>/dev/null)"\ntrue';
  return self.execute(wrap(script),8000).then(function(r){var s=check(r),flag=/MF=1/.test(s),known=/MD\|(true|false)/.test(s),disabled=/MD\|true/.test(s),active=/MU\|active/.test(s);
   var running=state.wins.multiscreen.running,persistent=flag&&known&&disabled;
   state.wins.multiscreen={status:!known?'unknown':persistent&&!running&&!active?'on':flag||disabled?'partial':'off',
    running:running,persistent:persistent,launchBlocked:known?disabled:null,bootBlocked:flag,serviceActive:active,
    flagPath:FLAG,rootNeededToMaintain:false,rebootVerified:!!(require('./platform.js').status().boot.currentBootObserved&&persistent&&!running&&!active)};
   return state;
  });
 });
};
Wins.prototype.multiscreen=function(on){var self=this,before;
 function apply(disabled,flag,start){var s='set -e\n'+(flag?'touch '+FLAG+'\nchown owner:system_share '+FLAG+'\nchmod 664 '+FLAG+'\nchsmack -a _ '+FLAG:'rm -f '+FLAG)+'\nsystemctl stop '+UNIT+'\npkgcmd '+(disabled?'-D':'-A')+' -t app -n '+ID+' --global\n'+(start?'systemctl reset-failed '+UNIT+' || true\nsystemctl start '+UNIT:'true')+'\nsleep 1';return self.execute(wrap(s),15000).then(check);}
 return this.read().then(function(s){before=s.wins.multiscreen;if(before.launchBlocked===null)throw Error('MultiScreen registry unavailable');
  return apply(on,on,!on).then(function(){return self.read();}).then(function(a){var w=a.wins.multiscreen;
   if(on?w.status!=='on':w.launchBlocked||w.bootBlocked)throw Error('MultiScreen state not confirmed');
   return {id:'multiscreen',changed:true,status:w.status,persistent:w.persistent,verified:true};
  }).catch(function(e){return apply(before.launchBlocked,before.bootBlocked,before.serviceActive).then(function(){throw Error(e.message+'; previous configuration restored');},function(){throw Error(e.message+'; restore not confirmed');});});
 });
};
module.exports={Wins:Wins,FILE:Base.FILE,MULTISCREEN_FLAG:FLAG,LEGACY_FLAG:LEGACY};
