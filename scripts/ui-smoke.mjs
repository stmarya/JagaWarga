import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
const baseURL=process.env.BASE_URL??'http://127.0.0.1:3000';
assert(['localhost','127.0.0.1'].includes(new URL(baseURL).hostname),'Local acceptance only');
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
try{
 const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 async function accessible(label){const result=await new AxeBuilder({page}).analyze();assert.deepEqual(result.violations.filter(v=>['serious','critical'].includes(v.impact)).map(v=>v.id),[],label);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`${label} overflow`);}
 await page.goto(baseURL);assert.equal(await page.locator('h1').count(),1);await accessible('home');
 await page.goto(`${baseURL}/periksa`);await page.locator('#indicator').fill('a'.repeat(64));await page.getByRole('button',{name:/Periksa sekarang/}).click();await page.waitForURL('**/result');await page.getByText('Skor sinyal',{exact:true}).waitFor();await page.getByRole('heading',{name:'Bukti yang ditemukan',exact:true}).waitFor();assert.equal(await page.evaluate(()=>localStorage.getItem('jagawarga:history:v2')),null);await accessible('private lookup result');
 await page.evaluate(()=>navigator.serviceWorker.ready);assert.equal(await page.evaluate(async()=>(await navigator.serviceWorker.getRegistrations()).length),1);await page.evaluate(async()=>{await caches.open('jagawarga-obsolete-test');await Promise.all((await navigator.serviceWorker.getRegistrations()).map(r=>r.unregister()));});await page.reload();await page.evaluate(()=>navigator.serviceWorker.ready);await page.waitForFunction(async()=>!(await caches.keys()).includes('jagawarga-obsolete-test'));
 await context.setOffline(true);await page.goto(`${baseURL}/privacy`,{waitUntil:'domcontentloaded'});await page.getByRole('heading',{name:'Koneksi tidak tersedia.'}).waitFor();await accessible('explicit offline notice');await context.setOffline(false);
 await page.goto(`${baseURL}/ops`);await page.getByRole('heading',{name:'Periksa status, bukan asumsi kesiapan.'}).waitFor();await accessible('ops');
 await page.goto(`${baseURL}/tools/message`);await page.locator('#message').fill('Segera kirim OTP dan password untuk menghindari pemblokiran.');await page.getByRole('button',{name:'Analisis pesan',exact:true}).click();await page.getByText(/Skor sinyal:/).waitFor();await accessible('message');
 await page.goto(`${baseURL}/tools/email-header`);await page.locator('#headers').fill('Authentication-Results: mx.example; spf=fail; dkim=fail; dmarc=fail\nReply-To: other@example.net');await page.getByRole('button',{name:'Periksa email',exact:true}).click();await page.getByText(/Skor sinyal:/).waitFor();await accessible('header');
 await page.goto(`${baseURL}/tools/file-hash`);await page.locator('#file').setInputFiles({name:'safe-fixture.txt',mimeType:'text/plain',buffer:Buffer.from('JagaWarga acceptance')});await page.locator('#file-sha256').waitFor();assert.match(await page.locator('#file-sha256').inputValue(),/^[a-f0-9]{64}$/);await accessible('local hash');
 await page.goto(`${baseURL}/tools/qr`);await page.locator('#qr').setInputFiles({name:'not-qr.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=','base64')});await page.getByRole('status').filter({hasText:/Browser ini belum mendukung|QR tidak ditemukan/}).waitFor();await accessible('QR unsupported/empty');
 await page.goto(`${baseURL}/dashboard`);await page.getByRole('heading',{name:'Pribadi dan publik, dipisahkan.'}).waitFor();await accessible('dashboard');
 await page.goto(`${baseURL}/support`);assert.equal(await page.getByRole('link',{name:'Buka pelaporan keamanan privat ↗'}).count(),1);await accessible('support');assert.deepEqual(errors,[]);
 console.log('Real local runtime smoke passed: private lookup, operations, server pattern tools, local hash/QR, dashboard, private support, SW cleanup and explicit offline fallback. No production/provider acceptance.');
}finally{await browser.close();}
