/* Generează style.min.css și script.min.js din style.css / script.js.
   Rulează: node build.js   (necesită esbuild: npm i -D esbuild  SAU  npx esbuild merge automat)
   Serverul folosește fișierele .min DOAR dacă hash-ul din prima linie se potrivește cu sursa curentă. */
const fs=require('fs'),path=require('path'),crypto=require('crypto'),cp=require('child_process');
function run(src,out,args){
  const h=crypto.createHash('sha1').update(fs.readFileSync(path.join(__dirname,src))).digest('hex').slice(0,16);
  let code;
  try{ code=require('esbuild').transformSync(fs.readFileSync(path.join(__dirname,src),'utf8'),{loader:src.endsWith('.css')?'css':'js',minify:src.endsWith('.css'),target:src.endsWith('.css')?'chrome80':'es2015',minifyWhitespace:true,minifySyntax:true,legalComments:'none'}).code; }
  catch(e){ code=cp.execFileSync('npx',['--yes','esbuild',src,...args],{cwd:__dirname,maxBuffer:64*1024*1024}).toString(); }
  fs.writeFileSync(path.join(__dirname,out),'/*src:'+h+'*/\n'+code);
  console.log(out,fs.statSync(path.join(__dirname,src)).size,'->',fs.statSync(path.join(__dirname,out)).size,'bytes');
}
run('style.css','style.min.css',['--minify','--target=chrome80']);
run('script.js','script.min.js',['--minify-whitespace','--minify-syntax','--target=es2015']);  /* fără redenumirea variabilelor: handler-ele din HTML rămân funcționale */
