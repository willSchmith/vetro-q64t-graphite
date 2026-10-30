'use strict';
// Permanent boot root must not expose arbitrary shell commands without a key.
var fs=require('fs'),FILE='/opt/vetro-boot/admin-token';
function allowed(req,read){
 var expected;
 try{expected=(read||function(){return fs.readFileSync(FILE,'utf8');})().trim();}
 catch(e){return e.code==='ENOENT';}
 var supplied=req.headers&&req.headers['x-vetro-exec-token'];
 if(expected.length<32||typeof supplied!=='string'||supplied.length!==expected.length)return false;
 var difference=0;for(var i=0;i<expected.length;i++)difference|=expected.charCodeAt(i)^supplied.charCodeAt(i);
 return difference===0;
}
module.exports={allowed:allowed};
