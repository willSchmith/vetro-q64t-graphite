var fs=require('fs'),crypto=require('crypto');
var directory='/opt/usr/home/owner/share/vetro-boot-preparation';
try{fs.mkdirSync(directory,448);}catch(e){if(e.code!=='EEXIST')throw e;}
var file='/etc/profile.d/bash_prompt_custom.sh';
var needle=fs.readFileSync(file),size=Number(fs.readFileSync('/sys/class/block/mmcblk0p18/size','utf8').trim())*512;
if(needle.length!==776)throw Error('Unexpected source size');
var original=directory+'/profile-original.bin';
if(fs.existsSync(original)&&!fs.readFileSync(original).equals(needle))throw Error('Stored backup differs from current source');
fs.writeFileSync(original,needle,{mode:384});
var fd=fs.openSync('/dev/mmcblk0p18','r'),chunk=new Buffer(1048576),previous=new Buffer(0),matches=[],start=Date.now();
for(var pos=0;pos<size;){
 var n=fs.readSync(fd,chunk,0,Math.min(chunk.length,size-pos),pos);if(n<=0)throw Error('Short device read');
 var joined=Buffer.concat([previous,chunk.slice(0,n)]),at=0;
 while((at=joined.indexOf(needle,at))>=0){var offset=pos-previous.length+at;if(matches.indexOf(offset)<0)matches.push(offset);at++;}
 previous=joined.slice(Math.max(0,joined.length-needle.length+1));pos+=n;
 if(pos%(268435456)===0)console.log('READ',pos,'of',size);
}
var result={source:file,device:'/dev/mmcblk0p18',size:size,sourceBytes:needle.length,sourceSHA256:crypto.createHash('sha256').update(needle).digest('hex'),matches:matches,elapsedMs:Date.now()-start,mode:'read-only; system partition not modified'};
if(matches.length===1){var offset=matches[0],first=Math.floor(offset/4096)*4096,last=Math.ceil((offset+needle.length)/4096)*4096,blocks=new Buffer(last-first);var count=fs.readSync(fd,blocks,0,blocks.length,first);if(count!==blocks.length)throw Error('Incomplete backup');
 if(!blocks.slice(offset-first,offset-first+needle.length).equals(needle))throw Error('Backup comparison failed');
 fs.writeFileSync(directory+'/containing-blocks-original.bin',blocks,{mode:384});result.blockOffset=first;result.blockBytes=blocks.length;result.fileOffsetInBlocks=offset-first;result.blockSHA256=crypto.createHash('sha256').update(blocks).digest('hex');}
fs.closeSync(fd);fs.writeFileSync(directory+'/scan-result.json',JSON.stringify(result,null,2)+'\n',{mode:384});console.log('RESULT',JSON.stringify(result));
