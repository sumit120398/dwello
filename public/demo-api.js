// Browser-only adapter for the static showcase. The Node app never uses this store.
export function createDemoApi({storage,loadHomes,uuid=()=>crypto.randomUUID(),now=()=>new Date().toISOString()}){
  const key='dwello-showcase-v1';
  let seed;
  const read=()=>{
    try{const raw=JSON.parse(storage.getItem(key)||'null');if(raw&&Array.isArray(raw.favorites)&&Array.isArray(raw.listings)&&Array.isArray(raw.enquiries))return raw;}catch{}
    return {favorites:[],listings:[],enquiries:[]};
  };
  const persist=data=>{try{storage.setItem(key,JSON.stringify(data));}catch{throw new Error('Browser storage is unavailable or full. Allow site storage to save changes.');}};
  return async function demoApi(path,options={}){
    seed ||= await loadHomes();
    const data=read(),method=options.method||'GET';
    let body={};try{if(options.body)body=JSON.parse(options.body);}catch{throw new Error('Invalid request');}
    if(path==='/api/listings'&&method==='GET')return {listings:seed,favorites:data.favorites};
    if(path==='/api/dashboard'&&method==='GET')return {listings:data.listings,enquiries:[],sent:data.enquiries.map(({id,listing,created})=>({id,listing,created}))};
    const favorite=path.match(/^\/api\/favorites\/([a-zA-Z0-9-]+)$/);
    if(favorite&&['POST','DELETE'].includes(method)){
      if(!seed.some(h=>h.id===favorite[1]))throw new Error('Listing unavailable');
      data.favorites=data.favorites.filter(id=>id!==favorite[1]);
      if(method==='POST')data.favorites.push(favorite[1]);
      persist(data);return {favorites:data.favorites};
    }
    if(path==='/api/listings'&&method==='POST'){
      if(!['Bengaluru','Mumbai','Pune'].includes(body.city)||!['buy','rent'].includes(body.purpose)||!['Apartment','Villa','Independent house'].includes(body.type))throw new Error('Select valid property details.');
      for(const key of ['title','project','locality','advertiser'])if(typeof body[key]!=='string'||body[key].trim().length<2)throw new Error(`Enter a valid ${key}.`);
      for(const [key,min,max] of [['beds',1,10],['baths',1,10],['area',100,100000],['price',1000,10000000000]])if(!Number.isInteger(body[key])||body[key]<min||body[key]>max)throw new Error(`Enter a valid ${key}.`);
      if(data.listings.length>=50)throw new Error('This showcase allows up to 50 listings per browser.');
      const listing={id:uuid(),title:body.title.trim().slice(0,100),project:body.project.trim().slice(0,100),locality:body.locality.trim().slice(0,80),advertiser:body.advertiser.trim().slice(0,80),city:body.city,purpose:body.purpose,type:body.type,beds:body.beds,baths:body.baths,area:body.area,price:body.price,description:String(body.description||'').slice(0,2000),furnishing:body.furnishing,photo:'./placeholder.svg',gallery:['./placeholder.svg'],owner:true,status:'pending',createdAt:now()};
      data.listings.push(listing);persist(data);return {listing};
    }
    const close=path.match(/^\/api\/listings\/([a-zA-Z0-9-]+)\/close$/);
    if(close&&method==='POST'){
      const listing=data.listings.find(h=>h.id===close[1]);if(!listing)throw new Error('Listing not found');listing.status='closed';persist(data);return {ok:true};
    }
    if(path==='/api/enquiries'&&method==='POST'){
      if(!seed.some(h=>h.id===body.listing))throw new Error('Listing unavailable');
      if(typeof body.name!=='string'||body.name.trim().length<2||! /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email||'')||typeof body.message!=='string'||body.message.trim().length<5||body.consent!==true)throw new Error('Enter your name, email, message and consent.');
      if(data.enquiries.length>=100)throw new Error('This showcase allows up to 100 enquiries per browser.');
      // Keep only the receipt; contact data is never sent or persisted by this showcase.
      const enquiry={id:uuid(),listing:body.listing,created:now()};data.enquiries.push(enquiry);persist(data);return {id:enquiry.id,demo:true};
    }
    throw new Error('This action is not available in the showcase.');
  };
}
