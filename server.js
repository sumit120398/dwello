import http from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { randomBytes, randomUUID } from 'node:crypto';
import { readFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { seedHomes } from './seed.js';

const root=fileURLToPath(new URL('./',import.meta.url));
await mkdir(`${root}data`,{recursive:true});
const db=new DatabaseSync(process.env.DB_PATH || `${root}data/dwello.sqlite`);
db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS listings (id TEXT PRIMARY KEY, owner TEXT, status TEXT NOT NULL, data TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, created INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS favorites (session TEXT NOT NULL, listing TEXT NOT NULL REFERENCES listings(id), PRIMARY KEY(session,listing));
CREATE TABLE IF NOT EXISTS enquiries (id TEXT PRIMARY KEY, session TEXT NOT NULL, listing TEXT NOT NULL REFERENCES listings(id), name TEXT NOT NULL, email TEXT NOT NULL, message TEXT NOT NULL, created TEXT NOT NULL);`);
const insert=db.prepare('INSERT OR IGNORE INTO listings VALUES (?,NULL,?,?)');
for(const home of seedHomes) insert.run(home.id,home.status,JSON.stringify(home));
const limits=new Map();
function limited(key,max){const now=Date.now();const entry=limits.get(key);if(!entry||now-entry.time>60000){limits.set(key,{time:now,n:1});return false;}return ++entry.n>max;}
const cleanup=setInterval(()=>{for(const [k,v] of limits)if(Date.now()-v.time>60000)limits.delete(k);},60000);cleanup.unref();
const send=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
async function body(req){let text='';for await(const chunk of req){text+=chunk;if(Buffer.byteLength(text)>16000)throw Object.assign(new Error('Request too large'),{status:413});}try{return JSON.parse(text);}catch{throw Object.assign(new Error('Invalid JSON'),{status:400});}}
const clean=(value,max=200)=>typeof value==='string'?value.trim().slice(0,max):'';
function invalid(message){throw Object.assign(new Error(message),{status:400});}
export const server=http.createServer(async(req,res)=>{
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');res.setHeader('X-Frame-Options','DENY');
  res.setHeader('Content-Security-Policy',"default-src 'self'; img-src 'self' https://images.unsplash.com data:; style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; script-src 'self'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
  try{
    const url=new URL(req.url,'http://localhost');const path=url.pathname;
    if(path.startsWith('/api/')){
      if(!['GET','POST','DELETE','PATCH'].includes(req.method))return send(res,405,{error:'Method not allowed'});
      if(req.method!=='GET'){
        const origin=req.headers.origin;
        if(!origin||new URL(origin).host!==req.headers.host)return send(res,403,{error:'Request origin rejected'});
        if(req.method!=='DELETE'&&!req.headers['content-type']?.startsWith('application/json'))return send(res,415,{error:'JSON required'});
      }
      const cookie=(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('dwello_session='))?.slice(15);
      let session=cookie&&db.prepare('SELECT id FROM sessions WHERE id=?').get(cookie)?.id;
      if(!session){session=randomBytes(32).toString('hex');db.prepare('INSERT INTO sessions VALUES (?,?)').run(session,Date.now());res.setHeader('Set-Cookie',`dwello_session=${session}; HttpOnly; SameSite=Lax; Path=/; Max-Age=2592000${process.env.COOKIE_SECURE==='true'?'; Secure':''}`);}
      if(limited(`ip:${req.socket.remoteAddress}`,300)||limited(session,180))return send(res,429,{error:'Please slow down and try again in a minute.'});
      const saved=()=>db.prepare('SELECT listing FROM favorites WHERE session=?').all(session).map(x=>x.listing);
      if(req.method==='GET'&&path==='/api/listings')return send(res,200,{listings:db.prepare("SELECT data FROM listings WHERE status='published'").all().map(x=>JSON.parse(x.data)),favorites:saved()});
      if(req.method==='GET'&&path==='/api/dashboard')return send(res,200,{listings:db.prepare('SELECT data,status FROM listings WHERE owner=?').all(session).map(x=>({...JSON.parse(x.data),status:x.status})),enquiries:db.prepare('SELECT e.id,e.name,e.email,e.message,e.created,e.listing FROM enquiries e JOIN listings l ON e.listing=l.id WHERE l.owner=? ORDER BY e.created DESC').all(session),sent:db.prepare('SELECT id,listing,created FROM enquiries WHERE session=?').all(session)});
      const favorite=path.match(/^\/api\/favorites\/([a-zA-Z0-9-]+)$/);
      if(favorite&&['POST','DELETE'].includes(req.method)){
        if(!db.prepare("SELECT id FROM listings WHERE id=? AND status='published'").get(favorite[1]))return send(res,404,{error:'Listing unavailable'});
        if(req.method==='POST')db.prepare('INSERT OR IGNORE INTO favorites VALUES (?,?)').run(session,favorite[1]);else db.prepare('DELETE FROM favorites WHERE session=? AND listing=?').run(session,favorite[1]);
        return send(res,200,{favorites:saved()});
      }
      if(path==='/api/listings'&&req.method==='POST'){
        if(limited(`post:${session}`,10))return send(res,429,{error:'Listing limit reached. Try again later.'});
        const b=await body(req);
        if(!['Bengaluru','Mumbai','Pune'].includes(b.city)||!['buy','rent'].includes(b.purpose)||!['Apartment','Villa','Independent house'].includes(b.type))invalid('Select a valid city, purpose and property type.');
        for(const key of ['title','locality','project','advertiser'])if(clean(b[key]).length<2)invalid(`${key} must contain at least two characters.`);
        for(const [key,min,max] of [['beds',1,10],['baths',1,10],['area',100,100000],['price',1000,10000000000]])if(!Number.isFinite(b[key])||b[key]<min||b[key]>max||!Number.isInteger(b[key]))invalid(`Enter a valid ${key}.`);
        const home={id:randomUUID(),title:clean(b.title,100),locality:clean(b.locality,80),project:clean(b.project,100),advertiser:clean(b.advertiser,80),city:b.city,purpose:b.purpose,type:b.type,beds:b.beds,baths:b.baths,area:b.area,price:b.price,description:clean(b.description,2000),photo:'/placeholder.svg',gallery:['/placeholder.svg'],amenities:['Details to be confirmed'],furnishing:['Unfurnished','Semi-furnished','Fully furnished'].includes(b.furnishing)?b.furnishing:'Unfurnished',facing:'Not specified',owner:true,status:'pending',createdAt:new Date().toISOString()};
        db.prepare('INSERT INTO listings VALUES (?,?,?,?)').run(home.id,session,'pending',JSON.stringify(home));return send(res,201,{listing:home});
      }
      const close=path.match(/^\/api\/listings\/([a-zA-Z0-9-]+)\/close$/);
      if(close&&req.method==='POST'){const listing=db.prepare('SELECT id FROM listings WHERE id=? AND owner=?').get(close[1],session);if(!listing)return send(res,404,{error:'Listing not found'});db.prepare("UPDATE listings SET status='closed' WHERE id=?").run(close[1]);return send(res,200,{ok:true});}
      if(path==='/api/enquiries'&&req.method==='POST'){
        if(limited(`enquiry:${session}`,5))return send(res,429,{error:'Please wait a minute before sending more enquiries.'});
        const b=await body(req);if(!db.prepare("SELECT id FROM listings WHERE id=? AND status='published'").get(clean(b.listing)))return send(res,404,{error:'Listing unavailable'});
        const name=clean(b.name,100),email=clean(b.email,254),message=clean(b.message,1500);
        if(name.length<2||! /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||message.length<5||b.consent!==true)invalid('Enter your name, a valid email, a message and consent to share them.');
        const id=randomUUID();db.prepare('INSERT INTO enquiries VALUES (?,?,?,?,?,?,?)').run(id,session,b.listing,name,email,message,new Date().toISOString());return send(res,201,{id,demo:true});
      }
      return send(res,404,{error:'Not found'});
    }
    if(!['GET','HEAD'].includes(req.method))return send(res,405,{error:'Method not allowed'});
    const assets={'/':'index.html','/app.js':'app.js','/demo-api.js':'demo-api.js','/styles.css':'styles.css','/placeholder.svg':'placeholder.svg'};
    const file=assets[path];if(!file)return send(res,404,{error:'Not found'});
    const content=await readFile(`${root}public/${file}`);const ext=file.split('.').pop();res.writeHead(200,{'Content-Type':{html:'text/html; charset=utf-8',js:'text/javascript; charset=utf-8',css:'text/css; charset=utf-8',svg:'image/svg+xml'}[ext],'Cache-Control':'no-cache'});res.end(req.method==='HEAD'?undefined:content);
  }catch(e){if(!e.status)console.error(e);send(res,e.status||500,{error:e.status?e.message:'Something went wrong. Please try again.'});}
});
if(process.argv[1]===fileURLToPath(import.meta.url))server.listen(Number(process.env.PORT)||3000,process.env.HOST||'127.0.0.1',()=>console.log(`Dwello is running at http://${process.env.HOST||'127.0.0.1'}:${process.env.PORT||3000}`));
