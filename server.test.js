import test from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
process.env.DB_PATH=':memory:';
const {server}=await import('./server.js');
const handler=server.listeners('request')[0];
async function request(path,{method='GET',body,cookie,origin='http://localhost:3000'}={}){
  const req=Readable.from(body===undefined?[]:[JSON.stringify(body)]);
  Object.assign(req,{url:path,method,headers:{host:'localhost:3000',origin,'content-type':'application/json',cookie},socket:{remoteAddress:'test'}});
  const headers={};let status=200,content='';
  const res={setHeader(k,v){headers[k.toLowerCase()]=v;},writeHead(s,h){status=s;Object.assign(headers,h);},end(data){content=data?.toString()||'';}};
  await handler(req,res);
  return {status,headers,body:content?(content.startsWith('{')?JSON.parse(content):content):null,cookie:headers['set-cookie']?.split(';')[0]};
}
test('marketplace persistence and isolation',async()=>{
  const first=await request('/api/listings');assert.equal(first.status,200);assert.equal(first.body.listings.length,12);assert.ok(first.cookie);assert.ok(first.headers['set-cookie'].includes('HttpOnly'));
  const alice=first.cookie;
  const second=await request('/api/listings');const bob=second.cookie;
  const favorite=await request('/api/favorites/home-1',{method:'POST',body:{},cookie:alice});assert.deepEqual(favorite.body.favorites,['home-1']);
  assert.deepEqual((await request('/api/listings',{cookie:bob})).body.favorites,[]);
  assert.deepEqual((await request('/api/favorites/home-1',{method:'DELETE',cookie:alice})).body.favorites,[]);
  const listing={title:'My test home',project:'Test Heights',locality:'Whitefield',city:'Bengaluru',advertiser:'Test Owner',purpose:'buy',type:'Apartment',beds:2,baths:2,area:1200,price:9000000,description:'A real test submission'};
  const created=await request('/api/listings',{method:'POST',body:listing,cookie:alice});assert.equal(created.status,201);assert.equal(created.body.listing.status,'pending');
  const id=created.body.listing.id;
  assert.equal((await request('/api/listings',{cookie:alice})).body.listings.some(h=>h.id===id),false);
  assert.equal((await request('/api/dashboard',{cookie:alice})).body.listings.length,1);
  assert.equal((await request('/api/dashboard',{cookie:bob})).body.listings.length,0);
  assert.equal((await request(`/api/listings/${id}/close`,{method:'POST',body:{},cookie:bob})).status,404);
  assert.equal((await request('/api/listings',{method:'POST',body:{...listing,price:-10},cookie:alice})).status,400);
  const enquiry={listing:'home-1',name:'Test Buyer',email:'test@example.com',message:'Please share further details.',consent:true};
  assert.equal((await request('/api/enquiries',{method:'POST',body:{...enquiry,consent:false},cookie:alice})).status,400);
  assert.equal((await request('/api/enquiries',{method:'POST',body:enquiry,cookie:alice})).status,201);
  const dashboard=await request('/api/dashboard',{cookie:alice});assert.equal(dashboard.body.sent.length,1);assert.equal(dashboard.body.enquiries.length,0);
  assert.equal((await request('/api/dashboard',{cookie:bob})).body.sent.length,0);
  assert.equal((await request('/api/enquiries',{method:'POST',body:{...enquiry,listing:id},cookie:alice})).status,404);
  assert.equal((await request(`/api/listings/${id}/close`,{method:'POST',body:{},cookie:alice})).status,200);
  assert.equal((await request('/api/dashboard',{cookie:alice})).body.listings[0].status,'closed');
});
test('reject cross-origin writes and unknown routes',async()=>{
  assert.equal((await request('/api/favorites/home-1',{method:'POST',body:{},origin:'https://evil.example'})).status,403);
  assert.equal((await request('/api/unknown')).status,404);
  assert.equal((await request('/api/listings',{method:'PUT',body:{}})).status,405);
});
test('serve application assets with security headers and keep source files private',async()=>{
  for(const path of ['/','/app.js','/styles.css','/placeholder.svg']){
    const response=await request(path);assert.equal(response.status,200);assert.ok(response.body.length>100);assert.equal(response.headers['x-content-type-options'],'nosniff');assert.ok(response.headers['content-security-policy'].includes("frame-ancestors 'none'"));
  }
  for(const path of ['/server.js','/data/dwello.sqlite','/../server.js','/.git/config'])assert.equal((await request(path)).status,404);
});
test('reject large request bodies and throttle repeated enquiries',async()=>{
  const session=(await request('/api/listings')).cookie;
  assert.equal((await request('/api/listings',{method:'POST',cookie:session,body:{description:'a'.repeat(17000)}})).status,413);
  const enquiry={listing:'home-1',name:'Test Buyer',email:'test@example.com',message:'Please share more information.',consent:true};
  for(let i=0;i<5;i++)assert.equal((await request('/api/enquiries',{method:'POST',body:enquiry,cookie:session})).status,201);
  assert.equal((await request('/api/enquiries',{method:'POST',body:enquiry,cookie:session})).status,429);
});
