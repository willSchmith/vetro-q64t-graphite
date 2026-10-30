'use strict';
// Redirect inside csfs before the native window is mapped. No polling or SDK
// launch sits on the path from a Home request to the resident dock's FIFO.
var fs=require('fs'),os=require('os');
var RUN='/tmp/vetro-graphite-redirect',BASE='/opt/vetro-boot/graphite-home/renderer/';
function check(r){if(!r||r.exit_code||r.timed_out)throw Error(r&&r.stderr||r&&r.stdout||'Home redirect command failed');return r;}
function Control(execute,dock){this.execute=execute;this.dock=dock;this.busy=false;this.suspended=false;this.active=false;this.error=null;this.requests=0;this.retryAt=0;}
Control.prototype.mounted=function(){try{var m=JSON.parse(fs.readFileSync(BASE+'manifest.json','utf8')),s=fs.statSync(m.source);return m.files.every(function(x){var t=fs.statSync(x.target);return t.dev===s.dev&&t.ino===s.ino;});}catch(e){return false;}};
Control.prototype.status=function(){return {active:this.active&&this.mounted()&&this.dock.ready(),beforeNativeWindow:true,busy:this.busy,error:this.error,requests:this.requests,lastRequestUptime:this.lastRequestUptime||null,dispatchMilliseconds:this.dispatchMilliseconds===undefined?null:this.dispatchMilliseconds};};
Control.prototype.request=function(){if(this.queued)return;var self=this;this.queued=true;setTimeout(function(){self.queued=false;if(!self.active||self.suspended||!self.dock.ready())return;try{if(fs.readFileSync(RUN+'/request','utf8')!=='show')return;var t=process.hrtime();self.dock.command('show');var d=process.hrtime(t);self.dispatchMilliseconds=+(d[0]*1000+d[1]/1000000).toFixed(2);self.lastRequestUptime=os.uptime();self.requests++;}catch(e){self.error=e.message;}},5);};
Control.prototype.watch=function(){if(this.watcher)return;var self=this;this.watcher=fs.watch(RUN,function(event,name){if(name&&String(name)==='request')self.request();});this.watcher.on('error',function(e){self.error=e.message;});};
Control.prototype.set=function(on){var self=this;if(this.busy)return Promise.reject(Error('Home redirect is changing'));this.busy=true;this.error=null;
 var off='set -e\nrm -f '+RUN+'/ready\n/bin/sh -c "$(cat '+BASE+'apply.sh)" vetro-home-redirect off\napp_launcher -k com.samsung.tv.csfs >/dev/null 2>&1 || :';
 if(!on){return this.execute(off,12000).then(check).then(function(){self.active=false;if(self.dock.ready())self.dock.command('redirect-off');}).finally(function(){self.busy=false;});}
 return this.execute('set -e\nmkdir -p '+RUN+'\nchmod 711 '+RUN+'\nchsmack -a _ '+RUN+'\ntouch '+RUN+'/request\nchown 5001:100 '+RUN+'/request\nchmod 600 '+RUN+'/request\nchsmack -a User::Pkg::com.samsung.tv.csfs '+RUN+'/request\nrm -f '+RUN+'/ready\nln -s /proc/'+process.pid+'/status '+RUN+'/ready',10000).then(check).then(function(){self.watch();self.dock.command('redirect-on');return self.execute('set -e\n/bin/sh -c "$(cat '+BASE+'apply.sh)" vetro-home-redirect on\napp_launcher -k com.samsung.tv.csfs >/dev/null 2>&1 || :',12000);}).then(check).then(function(){if(!self.mounted())throw Error('Home redirect bind readback failed');self.active=true;return self.execute('app_launcher -s com.samsung.tv.csfs __NO_RAISE_WINDOW enable',8000);}).then(check).catch(function(e){self.error=e.message;return self.execute(off,12000).then(function(){self.active=false;if(self.dock.ready())self.dock.command('redirect-off');throw e;});}).finally(function(){self.busy=false;});
};
Control.prototype.suspend=function(){this.suspended=true;return this.set(false);};
Control.prototype.resume=function(){this.suspended=false;return this.sync();};
Control.prototype.sync=function(){if(this.busy)return Promise.resolve();var want=!this.suspended&&require('./appearance-q64t.js').selected()==='graphite'&&this.dock.ready(),mounted=this.mounted();if(want&&this.active&&mounted)return Promise.resolve();if(!want&&!this.active&&!mounted)return Promise.resolve();return this.set(want);};
Control.prototype.start=function(){if(this.timer)return;var self=this;this.timer=setInterval(function(){if(Date.now()<self.retryAt)return;self.sync().catch(function(e){self.error=e.message;self.retryAt=Date.now()+10000;});},1000);this.sync().catch(function(e){self.error=e.message;});};
module.exports={Control:Control};
