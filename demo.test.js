import test from 'node:test';
import assert from 'node:assert/strict';
import { createDemoApi } from './public/demo-api.js';
import { seedHomes } from './seed.js';

function client(){const values=new Map();let seq=0;return {values,api:createDemoApi({storage:{getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)},loadHomes:async()=>seedHomes,uuid:()=>`demo-${++seq}`})};}
test('static showcase saves favorites and keeps visitors separate',async()=>{
  const a=client(),b=client();assert.equal((await a.api('/api/listings')).listings.length,12);
  await a.api('/api/favorites/home-1',{method:'POST'});
  assert.deepEqual((await a.api('/api/listings')).favorites,['home-1']);
  assert.deepEqual((await b.api('/api/listings')).favorites,[]);
  await a.api('/api/favorites/home-1',{method:'DELETE'});
  assert.deepEqual((await a.api('/api/listings')).favorites,[]);
});
test('static submissions remain private, can close, and enquiry contacts are not stored',async()=>{
  const {api,values}=client();
  const body={title:'A sample home',project:'Demo Heights',locality:'Whitefield',advertiser:'Demo Owner',city:'Bengaluru',purpose:'buy',type:'Apartment',beds:2,baths:2,area:1200,price:9000000};
  const {listing}=await api('/api/listings',{method:'POST',body:JSON.stringify(body)});
  assert.equal(listing.status,'pending');assert.equal((await api('/api/listings')).listings.length,12);
  assert.equal((await api('/api/dashboard')).listings.length,1);
  await api(`/api/listings/${listing.id}/close`,{method:'POST'});
  assert.equal((await api('/api/dashboard')).listings[0].status,'closed');
  await api('/api/enquiries',{method:'POST',body:JSON.stringify({listing:'home-1',name:'Private Person',email:'private@example.com',message:'I would like more details.',consent:true})});
  assert.equal((await api('/api/dashboard')).sent.length,1);
  const stored=[...values.values()].join('');assert.equal(stored.includes('private@example.com'),false);assert.equal(stored.includes('Private Person'),false);
  await assert.rejects(api('/api/listings',{method:'POST',body:JSON.stringify({...body,price:-1})}));
});
test('static showcase explains storage failure rather than pretending to save',async()=>{
  const api=createDemoApi({storage:{getItem:()=>null,setItem:()=>{throw new Error('blocked');}},loadHomes:async()=>seedHomes});
  await assert.rejects(api('/api/favorites/home-1',{method:'POST'}),/storage is unavailable/);
});
