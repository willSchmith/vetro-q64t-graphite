using System;
using System.IO;
using System.Security.Cryptography;
using System.Collections.Generic;
using System.Runtime.InteropServices;
internal static class ThemeImageTool {
 const string Eet="/usr/lib/libeet.so.1";
 [DllImport(Eet)]static extern int eet_init();
 [DllImport(Eet)]static extern int eet_shutdown();
 [DllImport(Eet)]static extern IntPtr eet_open(string path,int mode);
 [DllImport(Eet)]static extern int eet_close(IntPtr file);
 [DllImport(Eet)]static extern int eet_data_image_write(IntPtr file,string key,byte[] pixels,uint width,uint height,int alpha,int compress,int quality,int lossy);
 [DllImport(Eet)]static extern int eet_data_image_header_read(IntPtr file,string key,out uint width,out uint height,out int alpha,out int compress,out int quality,out int lossy);
 [DllImport(Eet)]static extern IntPtr eet_read(IntPtr file,string key,out int length);
 [DllImport("libc")]static extern void free(IntPtr pointer);
 static string Digest(IntPtr file,string key){int n;IntPtr p=eet_read(file,key,out n);if(p==IntPtr.Zero||n<0)throw new Exception("Read failed: "+key);try{byte[] b=new byte[n];Marshal.Copy(p,b,0,n);using(var h=SHA256.Create())return BitConverter.ToString(h.ComputeHash(b));}finally{free(p);}}
 public static int Main(string[] args) {
  try {
   if(args.Length==0){int result=eet_init();File.WriteAllText("/opt/vetro-boot/graphite-home/image-tool-proof.txt","Native Eet init="+result);eet_shutdown();return 0;}
   if(args[0]=="--compare"||args[0]=="--compare-metadata"){bool metadata=args[0]=="--compare-metadata";
    if(args.Length!=4)throw new Exception("compare original candidate keys");eet_init();IntPtr original=eet_open(args[1],0),candidate=eet_open(args[2],0);if(original==IntPtr.Zero||candidate==IntPtr.Zero)throw new Exception("Compare open failed");
    var changed=new List<string>();int count=0;try{foreach(string key in File.ReadAllLines(args[3])){if(key.Length==0)continue;count++;if(Digest(original,key)!=Digest(candidate,key)){if(metadata?key!="edje/file":(key!="edje/images/0"&&key!="edje/images/1"))throw new Exception("Unexpected changed Eet entry: "+key);changed.Add(key);}}if(changed.Count!=(metadata?1:2))throw new Exception("Unexpected changed entry count");File.WriteAllText("/opt/vetro-boot/graphite-home/image-tool-proof.txt","Verified "+count+" entries; changed exactly: "+String.Join(",",changed));}finally{eet_close(original);eet_close(candidate);eet_shutdown();}return 0;
   }
   if(args.Length!=5)throw new ArgumentException("file key raw-bgra width height");
   uint w=uint.Parse(args[3]),h=uint.Parse(args[4]);byte[] pixels=File.ReadAllBytes(args[2]);if(pixels.LongLength!=(long)w*h*4)throw new ArgumentException("Pixel buffer length");
   if(eet_init()<=0)throw new Exception("Eet init failed");IntPtr file=eet_open(args[0],2);if(file==IntPtr.Zero)throw new Exception("Eet open failed");
   try{int count=eet_data_image_write(file,args[1],pixels,w,h,1,9,100,0);if(count<=0)throw new Exception("Eet image write failed");Console.WriteLine("Image encoded: "+args[1]+" "+w+"x"+h+" bytes="+count);}finally{if(eet_close(file)!=0)throw new Exception("Eet close failed");}
   file=eet_open(args[0],0);if(file==IntPtr.Zero)throw new Exception("Readback open failed");
   try{uint rw,rh;int a,c,q,l;if(eet_data_image_header_read(file,args[1],out rw,out rh,out a,out c,out q,out l)==0||rw!=w||rh!=h)throw new Exception("Image header mismatch");Console.WriteLine("Native image readback passed");}finally{eet_close(file);eet_shutdown();}return 0;
  }catch(Exception e){Console.Error.WriteLine(e.ToString());return 1;}
 }
}
