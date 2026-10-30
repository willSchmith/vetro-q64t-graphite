'use strict';
var fs=require('fs'),crypto=require('crypto');
var BASE='/opt/vetro-boot/graphite-home/';
function selected(read){try{return (read||fs).readFileSync(BASE+'selection','utf8').trim()==='graphite'?'graphite':'samsung';}catch(e){return 'samsung';}}
function Control(execute,options){options=options||{};this.execute=execute;this.fs=options.fs||fs;this.busy=false;this.error=null;this.pause=options.pause||function(ms){return new Promise(function(resolve){setTimeout(resolve,ms);});};}
Control.prototype.status=function(){
 var desired=selected(this.fs),r={selected:desired,active:'unknown',ready:false,busy:this.busy,error:this.error,settingsCategories:desired==='graphite'?['Picture','Sound','General']:null};
 try{var self=this,m=JSON.parse(this.fs.readFileSync(BASE+'manifest.json','utf8')),states=m.files.map(function(x){var digest=crypto.createHash('sha256').update(self.fs.readFileSync(x.target)).digest('hex');return digest===x.graphiteSha256?'graphite':digest===x.originalSha256?'samsung':'unknown';});r.ready=m.version===3&&states.length===8;r.active=states.every(function(x){return x==='graphite';})?'graphite':states.every(function(x){return x==='samsung';})?'samsung':'mixed';}catch(e){r.error=e.message;}
 if(this.dock){r.dock=this.dock.status();r.resourcesActive=r.active;if(r.active==='graphite'&&!r.dock.ready)r.active='partial';}
 if(this.redirect)r.homeReturn=this.redirect.status();
 return r;
};
Control.prototype.applyResources=function(theme){return this.execute('app_launcher -k org.tizen.menu >/dev/null 2>&1 || :\napp_launcher -k com.samsung.tv.csfs >/dev/null 2>&1 || :\nsleep 0.3\n/bin/sh -c "$(cat /opt/vetro-boot/graphite-home/apply.sh)" vetro-theme '+theme,20000).then(function(r){if(r.exit_code||r.timed_out)throw Error(r.stderr||r.stdout||'Theme resources failed');});};
Control.prototype.save=function(theme){this.fs.writeFileSync(BASE+'selection.pending',theme+'\n',{mode:384});this.fs.renameSync(BASE+'selection.pending',BASE+'selection');};
Control.prototype.set=function(theme){
 var self=this;if(theme!=='graphite'&&theme!=='samsung')return Promise.reject(Error('Invalid theme'));if(this.busy)return Promise.reject(Error('Theme change in progress'));
 var old=selected(this.fs),homeMayHaveChanged=false;this.busy=true;this.error=null;
 return (this.redirect?this.redirect.suspend():Promise.resolve()).then(function(){return self.applyResources(theme);}).then(function(){self.save(theme);homeMayHaveChanged=true;return (self.dock?self.dock.sync(theme):Promise.resolve()).then(function(){if(self.dock)self.dock.changed();return self.execute(theme==='graphite'?'app_launcher -k org.tizen.menu >/dev/null 2>&1 || :\napp_launcher -t com.samsung.tv.csfs >/dev/null 2>&1 || :':'app_launcher -k org.tizen.menu >/dev/null 2>&1 || :\napp_launcher -k com.samsung.tv.csfs >/dev/null 2>&1 || :\nsleep 0.3\napp_launcher -s com.samsung.tv.csfs',10000);});}).then(function(r){if(r.exit_code||r.timed_out)throw Error(r.stderr||'Home reload failed');return (self.redirect?self.redirect.resume():Promise.resolve()).then(function(){return self.pause(4500);});}).then(function(){self.busy=false;var s=self.status();if(s.active!==theme)throw Error('Theme resource readback failed');return s;}).catch(function(e){self.error=e.message;return self.applyResources(old).then(function(){self.save(old);if(self.redirect)self.redirect.resume().catch(function(){});if(self.dock){self.dock.sync(old).catch(function(){});self.dock.changed();}if(homeMayHaveChanged)return self.execute('app_launcher -t com.samsung.tv.csfs >/dev/null 2>&1 || :\napp_launcher -s com.samsung.tv.csfs',10000);}).catch(function(rollback){self.error+='; rollback: '+rollback.message;}).then(function(){self.busy=false;throw Error(self.error);});});
};
module.exports={Control:Control,selected:selected,BASE:BASE};
