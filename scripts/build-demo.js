import { mkdir, readFile, writeFile, copyFile } from 'node:fs/promises';
import { seedHomes } from '../seed.js';

const root=new URL('../',import.meta.url);
await mkdir(new URL('dist/',root),{recursive:true});
for(const file of ['app.js','styles.css','demo-api.js','placeholder.svg'])await copyFile(new URL(`public/${file}`,root),new URL(`dist/${file}`,root));
const html=await readFile(new URL('public/index.html',root),'utf8');
await writeFile(new URL('dist/index.html',root),html.replace('name="dwello-mode" content="server"','name="dwello-mode" content="static"'));
await writeFile(new URL('dist/homes.json',root),JSON.stringify(seedHomes));
await writeFile(new URL('dist/.nojekyll',root),'');
console.log('Built GitHub Pages demo in dist/. Only illustrative seed data is included.');
