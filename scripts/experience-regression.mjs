import { spawn, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { chromium as playwrightChromium } from 'playwright';
const port=Number(process.env.EXPERIENCE_PORT??3110);
if(!Number.isInteger(port)||port<1024||port>65535)throw new Error('Invalid local regression port');
const base=`http://127.0.0.1:${port}`;
const chromium=process.env.CHROMIUM_PATH||spawnSync('sh',['-lc','command -v chromium || command -v chromium-browser'],{encoding:'utf8'}).stdout.trim()||playwrightChromium.executablePath();
if(!existsSync(chromium))throw new Error('Chromium is required for experience regression');
const server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','-p',String(port),'-H','127.0.0.1'],{env:{...process.env,NODE_ENV:'production',RUNTIME_TOPOLOGY:'single',REDIS_URL:'',ALLOW_RISKY_FEATURES:'false',FEATURE_ACTIVE_REDIRECTS:'false',FEATURE_PREMIUM_PROVIDERS:'false',DISABLE_CLOUDFLARE_DNS:'false',DISABLE_GOOGLE_DNS:'false',GROQ_API_KEY:'',VIRUSTOTAL_API_KEY:'',VIRUSTOTAL_API_KEYS:''},stdio:['ignore','pipe','pipe']});
let logs='';server.stdout.on('data',b=>{logs=(logs+b).slice(-4000);});server.stderr.on('data',b=>{logs=(logs+b).slice(-4000);});
try{
 let ready=false;
 for(let attempt=0;attempt<60;attempt++){
  if(server.exitCode!==null)throw new Error(`Regression server exited: ${logs}`);
  try{if((await fetch(`${base}/api/live`)).ok){ready=true;break;}}catch{}
  await new Promise(resolve=>setTimeout(resolve,250));
 }
 if(!ready)throw new Error(`Regression server did not start: ${logs}`);
 for(const script of ['batch1-smoke.mjs','batch2-smoke.mjs','batch3-smoke.mjs','analyst-smoke.mjs','batch456-smoke.mjs','responsive-qa.mjs']){
  const result=spawnSync(process.execPath,[`scripts/${script}`],{env:{...process.env,BASE_URL:base,CHROMIUM_PATH:chromium},encoding:'utf8',timeout:300000,maxBuffer:8*1024*1024});
  if(result.status!==0)throw new Error(`${script} failed: ${(result.stdout+result.stderr).slice(-6000)}`);
  console.log(result.stdout.trim());
 }
 console.log('Integrated experience regression passed. Fixtures/local runtime only; no public release approval.');
}finally{
 server.kill('SIGTERM');
 await new Promise(resolve=>{const timer=setTimeout(()=>{server.kill('SIGKILL');resolve();},3000);server.once('close',()=>{clearTimeout(timer);resolve();});});
}
