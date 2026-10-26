const photos = [
  'photo-1600210492486-724fe5c67fb0',
  'photo-1600607687920-4e2a09cf159d',
  'photo-1600047509807-ba8f99d2cdde',
  'photo-1600566753086-00f18fb6b3ea',
  'photo-1600607687939-ce8a6c25118c',
  'photo-1600585154340-be6161a56a0c',
  'photo-1600607688969-a5bfcd646154',
  'photo-1600566753190-17f0baa2a6c3'
];
export const imageUrl = id => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1000&q=85`;
const homes = [
  ['The light-filled corner', 'Prestige Lakeside Habitat', 'Whitefield', 'Bengaluru', 3, 3, 1840, 14800000, 'buy', 'Apartment', 'Semi-furnished', 'East', 'Arjun Mehta'],
  ['A little closer to nature', 'Brigade Orchards', 'Devanahalli', 'Bengaluru', 4, 4, 2860, 26500000, 'buy', 'Villa', 'Unfurnished', 'North', 'Neha Rao'],
  ['Made for slow mornings', 'Sobha Dream Acres', 'Panathur', 'Bengaluru', 2, 2, 1210, 9500000, 'buy', 'Apartment', 'Fully furnished', 'East', 'Rahul Shah'],
  ['Room to make it your own', 'Godrej United', 'Whitefield', 'Bengaluru', 3, 3, 1930, 17200000, 'buy', 'Apartment', 'Semi-furnished', 'West', 'Priya Nair'],
  ['Your everyday escape', 'Embassy Grove', 'Indiranagar', 'Bengaluru', 3, 3, 2100, 85000, 'rent', 'Apartment', 'Fully furnished', 'North', 'Ananya Das'],
  ['Good days start here', 'Purva Palm Beach', 'Hennur', 'Bengaluru', 2, 2, 1340, 38000, 'rent', 'Apartment', 'Semi-furnished', 'East', 'Karan Patel'],
  ['A home above the city', 'Lodha Park', 'Worli', 'Mumbai', 3, 3, 1680, 62500000, 'buy', 'Apartment', 'Semi-furnished', 'West', 'Rohan Desai'],
  ['A quieter kind of city life', 'Godrej The Trees', 'Vikhroli', 'Mumbai', 2, 2, 980, 72000, 'rent', 'Apartment', 'Fully furnished', 'East', 'Meera Joshi'],
  ['Space for your next chapter', 'Panchshil Towers', 'Kharadi', 'Pune', 3, 3, 1950, 18500000, 'buy', 'Apartment', 'Unfurnished', 'East', 'Amit Kulkarni'],
  ['The comfort of coming home', 'Blue Ridge', 'Hinjewadi', 'Pune', 2, 2, 1150, 32000, 'rent', 'Apartment', 'Semi-furnished', 'North', 'Sana Khan'],
  ['An address with a view', 'Salarpuria Sattva', 'Sarjapur Road', 'Bengaluru', 3, 3, 1760, 13500000, 'buy', 'Apartment', 'Unfurnished', 'East', 'Dev Malhotra'],
  ['Life, with a little more room', 'Assetz Earth & Essence', 'Yelahanka', 'Bengaluru', 4, 4, 3200, 31000000, 'buy', 'Villa', 'Semi-furnished', 'North', 'Isha Menon']
];
export const seedHomes = homes.map((h, i) => ({
  id: `home-${i+1}`, title:h[0], project:h[1], locality:h[2], city:h[3], beds:h[4], baths:h[5], area:h[6], price:h[7], purpose:h[8], type:h[9], furnishing:h[10], facing:h[11], advertiser:h[12],
  photo:imageUrl(photos[i%photos.length]), gallery:[imageUrl(photos[i%photos.length]),imageUrl(photos[(i+3)%photos.length]),imageUrl(photos[(i+5)%photos.length])],
  owner:i%3!==1, status:'published', createdAt:new Date(Date.now()-i*86400000).toISOString(), amenities:['Covered parking','Power backup','24/7 security',...(h[9]==='Villa'?['Private garden','Clubhouse']:['Swimming pool','Gym','Lift'])],
  description:`Discover a thoughtfully designed ${h[4]} bedroom ${h[9].toLowerCase()} in ${h[1]}, ${h[2]}. Generous living spaces, natural light and a well-connected neighbourhood make room for everything that matters. This illustrative listing is sample inventory for exploring Dwello; availability and prices are not real offers.`
}));
