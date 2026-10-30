'use strict';
// A held key fires on release. A disconnected helper or a missing key-down never fires an action.
function Hold(){this.down=Object.create(null);}
Hold.prototype.clear=function(){this.down=Object.create(null);};
function time(e){var n=Number(e.time_seconds)*1000+Number(e.time_microseconds)/1000;return isFinite(n)?n:null;}
Hold.prototype.feed=function(e,generation,rules){
 var code=String(e.code),holding=rules.filter(function(r){return r.enabled&&r.trigger.type==='physical'&&r.trigger.value===code&&r.trigger.holdMs;});
 if(!holding.length)return [];
 if(e.action==='down'){if(!this.down[code]||this.down[code].generation!==generation)this.down[code]={at:time(e),generation:generation};return [];}
 if(e.action!=='up')return [];
 var down=this.down[code];delete this.down[code];var end=time(e);
 if(!down||down.generation!==generation||down.at===null||end===null)return [];
 var elapsed=end-down.at;if(elapsed<0||elapsed>15000)return [];
 return holding.filter(function(r){return elapsed>=r.trigger.holdMs;}).reduce(function(a,r){return a.concat(r.actions);},[]);
};
module.exports={Hold:Hold};
