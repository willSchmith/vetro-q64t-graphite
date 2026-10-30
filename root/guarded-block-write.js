// Prepared for this exact TV and firmware. Default caller action is read-only.
var fs=require('fs'),crypto=require('crypto'),mode=ACTION,expected=EXPECTED;
function sha(b){return crypto.createHash('sha256').update(b).digest('hex');}
function requireCondition(v,why){if(!v)throw Error(why);}
var dir='/opt/vetro-boot',stored=JSON.parse(fs.readFileSync(dir+'/manifest.json','utf8'));
['device','size','blockOffset','blockBytes','sourceSHA256','blockSHA256','candidateSourceSHA256','candidateBlockSHA256','archiveSHA256'].forEach(function(k){requireCondition(stored[k]===expected[k],'Manifest mismatch: '+k);});
requireCondition(Number(fs.readFileSync('/sys/class/block/mmcblk0p18/size','utf8').trim())*512===expected.size,'Partition size changed');
var mount=fs.readFileSync('/proc/mounts','utf8').split('\n').map(function(l){return l.split(' ');}).filter(function(f){return f[1]==='/'&&f[2]==='vdfs';})[0];
requireCondition(mount&&mount[2]==='vdfs'&&mount[3].split(',').indexOf('ro')>=0&&fs.statSync(expected.device).isBlockDevice()&&fs.statSync('/').dev===fs.statSync(expected.device).rdev,'Active read-only root filesystem changed');
var original=fs.readFileSync(dir+'/backup/containing-blocks-original.bin'),candidate=fs.readFileSync(dir+'/containing-blocks-candidate.bin');
requireCondition(original.length===4096&&candidate.length===4096&&expected.blockBytes===4096,'Unexpected block size');
requireCondition(sha(original)===expected.blockSHA256,'Backup checksum mismatch');
requireCondition(sha(candidate)===expected.candidateBlockSHA256,'Candidate checksum mismatch');
requireCondition(original.slice(776).equals(candidate.slice(776)),'Bytes outside the script changed');
var currentBoot=fs.readFileSync('/proc/sys/kernel/random/boot_id','utf8').trim();
var fd=fs.openSync(expected.device,mode==='check'?'r':'r+'),current=new Buffer(4096);
requireCondition(fs.readSync(fd,current,0,4096,expected.blockOffset)===4096,'Short current-block read');
var currentHash=sha(current);requireCondition(currentHash===expected.blockSHA256||currentHash===expected.candidateBlockSHA256,'Current block is neither the verified original nor candidate; refusing write');
if(mode==='check'){fs.closeSync(fd);console.log(JSON.stringify({mode:'read-only',current:currentHash===expected.blockSHA256?'original':'candidate',offset:expected.blockOffset,bytes:4096,systemPartitionModified:false}));}
else{
 requireCondition(mode==='apply'||mode==='rollback','Invalid action');
 if(mode==='apply'){
  var p=JSON.parse(fs.readFileSync(dir+'/probe.json','utf8'));
  requireCondition(p.bootId===currentBoot&&p.uid===0&&p.euid===0&&p.gid===0&&p.smack==='_'&&p.runs===1&&p.capEff==='0000003fffffffff','Matching root boot-context probe required');
  requireCondition(sha(fs.readFileSync(dir+'/port.tar.gz'))===expected.archiveSHA256,'Protected port archive mismatch');
  requireCondition(fs.readFileSync(dir+'/admin-token','utf8').trim().length===64,'Command key missing');
 }
 var target=mode==='apply'?candidate:original,targetHash=sha(target);
 if(currentHash!==targetHash){
  try{
   requireCondition(fs.writeSync(fd,target,0,4096,expected.blockOffset)===4096,'Short block write');fs.fsyncSync(fd);
   var after=new Buffer(4096);requireCondition(fs.readSync(fd,after,0,4096,expected.blockOffset)===4096&&sha(after)===targetHash,'Readback mismatch');
  }catch(e){fs.writeSync(fd,current,0,4096,expected.blockOffset);fs.fsyncSync(fd);throw e;}
 }
 fs.closeSync(fd);
 var state={installed:mode==='apply',installedAt:Date.now(),initialBootId:currentBoot,verifiedBootIds:[],phase:mode==='apply'?'raw-write-applied; VFS and cold-start checks pending':'original block restored',sourceSHA256:expected.sourceSHA256,candidateSourceSHA256:expected.candidateSourceSHA256,offset:expected.blockOffset};
 fs.writeFileSync(dir+'/install-state.json',JSON.stringify(state,null,2)+'\n',{mode:384});
 console.log(JSON.stringify({mode:mode,changed:currentHash!==targetHash,bytes:4096,offset:expected.blockOffset,verifiedSHA256:targetHash,coldBootVerified:false}));
}
