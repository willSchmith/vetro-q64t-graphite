#!/usr/bin/env python3
"""Generate overlays from the connected TV's originals. No firmware is distributed."""
import argparse,copy,hashlib,json,pathlib,re,shlex,subprocess
from tv import TV
R=pathlib.Path(__file__).resolve().parents[1];BASE='/opt/vetro-boot/graphite-home/'
p=argparse.ArgumentParser(description=__doc__);p.add_argument('--tv',required=True);p.add_argument('--token-file',required=True);p.add_argument('--model',required=True,choices=['QE65Q64TAUXXH']);p.add_argument('--firmware',required=True,choices=['T-NKLDEUC-2743.0']);a=p.parse_args();t=TV(a.tv,a.token_file);spec=json.loads((R/'theme/compatibility.json').read_text());private=R/'.private/theme';private.mkdir(parents=True,exist_ok=True)
def sha(b):return hashlib.sha256(b).hexdigest()
original={}
for x in spec['nativeResources']+spec['renderer']:
 b=t.read(x['target']);assert sha(b)==x['originalSha256'],'Original resource mismatch; stop: '+x['target'];original[x.get('name',x['target'])]=b
print('All original resources match the tested firmware.')
t.shell('mkdir -p '+BASE+'renderer\nchmod 755 '+BASE+' '+BASE+'renderer\nchsmack -a _ '+BASE+' '+BASE+'renderer')
for k,b in original.items(): (private/pathlib.Path(k).name).write_bytes(b)
candidates={}
main=json.loads(original['mainmenu.json']);main['menutree']['mainmenu']['submenuitems']=['picture','sound','system','source-icon'];candidates['mainmenu.json']=(json.dumps(main,ensure_ascii=False,separators=(',',':'))+'\n').encode()
system=json.loads(original['system.json']);items=system['menutree']['system']['submenuitems'];items=[x for x in items if x not in ['vetro-apps','contact-samsung']];system['menutree']['system']['submenuitems']=['vetro-apps']+items+['contact-samsung']
system['menuitems']['vetro-apps']={'display-name':'Apps','style':'title','help-animation':{'text':'Open Samsung Apps to find, install and manage applications.'},'setting-ui':{'style':'application','name':'com.samsung.tv.store','args':{'Called_App':'org.tizen.menu'}},'exitmenu':'1'}
support=json.loads(t.read('/usr/apps/settings-datafw/res/jsons/tv/support.json'));about=copy.deepcopy(support['menuitems']['contact-samsung']);about['display-name']='About this TV';about['help-animation']={'text':'Model, firmware and device information. Operating system: Tizen 5.5.'};system['menuitems']['contact-samsung']=about;candidates['system.json']=(json.dumps(system,ensure_ascii=False,separators=(',',':'))+'\n').encode()
palettes={'app_custom_colortable.json':{'CC_Eden_Basic_120':'#24282F','CC_Eden_Basic_220':'#1B1F25','CC_Eden_Basic_6100':'#15191F','CC_Eden_Basic_7100':'#8296AE','CC_Eden_Basic_8100':'#BED0E2','CC_Eden_Basic_840':'#BED0E2'},'principle_colortable.json':{'CC_BG4100':'#303640','CC_BG5100':'#1B1F25'}}
for name,changes in palettes.items():
 data=json.loads(original[name]);found=set()
 for row in data:
  if row['Chipname'] in changes:row['Color']=changes[row['Chipname']];found.add(row['Chipname'])
 assert found==set(changes);candidates[name]=(json.dumps(data,separators=(',',':'))+'\n').encode()
candidates['setting_bg_base.png']=(R/'theme/setting_bg_base.png').read_bytes()
assert (R/'build/ThemeImageTool.dll').is_file(),'Run tools/build.sh first'
t.put((R/'build/ThemeImageTool.dll').read_bytes(),'/opt/usr/apps/vetrotvapp/bin/ThemeImageTool.dll',0o644)
colors={'bg_color1':(36,40,47),'bg_color2':(27,31,37),'MENU_POPUP_TITLE_BG_16':(42,48,56),'SUBWINDOW_SLIDER_BG_COLOR':(27,31,37),'SUBMENU_PANNEL_COLOR_NORMAL':(27,31,37),'SUBMENU_PANNEL_COLOR_NORMAL_START':(27,31,37),'SUBMENU_PANNEL_COLOR_DIM':(27,31,37),'SUBMENU_PANNEL_COLOR_BOTTOM':(27,31,37)}
for name in ['menu.edj','menu-theme.edj','support.edj']:
 dest=BASE+name+'.pending';t.put(original[name],dest,0o644)
 if name=='menu.edj':
  from PIL import Image
  for i in [1,2]:
   im=Image.open(R/('theme/plate-'+str(i)+'.png')).convert('RGBA');raw=BASE+'plate-'+str(i)+'.bgra';t.put(im.tobytes('raw','BGRA'),raw)
   print(t.shell('echo System::Privileged >/proc/self/attr/current\n/usr/bin/dotnet-launcher /opt/usr/apps/vetrotvapp/bin/ThemeImageTool.dll '+dest+' edje/images/'+str(i-1)+' '+raw+' '+str(im.width)+' '+str(im.height)))
 t.shell('eet -d '+dest+' edje/file '+BASE+'metadata.txt');text=t.read(BASE+'metadata.txt').decode();found=[]
 def patch(m):
  body=m[0];color=json.loads(re.search(r'value "name" string: (.*);',body)[1])
  if color not in colors:return body
  found.append(color)
  for channel,v in zip(('r','g','b'),colors[color]):body=re.sub(r'(value "'+channel+r'" uchar: )\d+;',lambda z:z[1]+str(v)+';',body)
  return body
 text=re.sub(r'group "Edje_Color_Class" struct \{[^{}]*\}',patch,text);assert set(found)==set(colors),'Missing native color class';t.put(text.encode(),BASE+'metadata.txt');t.shell('eet -e '+dest+' edje/file '+BASE+'metadata.txt 1');candidates[name]=t.read(dest)
manifest={'version':3,'theme':'graphite','files':[]}
for x in spec['nativeResources']:
 name=x['name'];remote=BASE+name;t.put(candidates[name],remote,0o644);t.shell('chsmack -a _ '+remote);manifest['files'].append(dict(x,source=remote,graphiteSha256=sha(candidates[name])))
t.put((json.dumps(manifest,indent=2)+'\n').encode(),BASE+'manifest.json')
for f in ['apply.sh','verify.js']:t.put((R/'theme'/f).read_bytes(),BASE+f)
# Patch only the verified show method; keep the original code as its failure path.
il=private/'csfs.dll';ni=private/'csfs.ni.dll';il.write_bytes(original[spec['renderer'][0]['target']]);ni.write_bytes(original[spec['renderer'][1]['target']]);patched=private/'csfs-graphite.dll'
subprocess.run(['mono',str(R/'build/PatchHome.exe'),str(il),str(patched)],check=True)
renderer={'version':1,'source':BASE+'renderer/csfs.dll','sha256':sha(patched.read_bytes()),'files':spec['renderer']};t.put(patched.read_bytes(),renderer['source'],0o644);t.shell('chsmack -a _ '+renderer['source']);t.put((json.dumps(renderer,indent=2)+'\n').encode(),BASE+'renderer/manifest.json')
for f,dest in [('renderer-apply.sh','apply.sh'),('renderer-verify.js','verify.js')]:t.put((R/'theme'/f).read_bytes(),BASE+'renderer/'+dest)
print('Prepared eight resource overlays and the Home renderer. Select Graphite in Vetro to apply.')
