if(!self.define){const e=e=>{"require"!==e&&(e+=".js");let r=Promise.resolve();return s[e]||(r=new Promise(async r=>{if("document"in self){const s=document.createElement("script");s.src=e,document.head.appendChild(s),s.onload=r}else importScripts(e),r()})),r.then(()=>{if(!s[e])throw new Error(`Module ${e} didn’t register its module`);return s[e]})},r=(r,s)=>{Promise.all(r.map(e)).then(e=>s(1===e.length?e[0]:e))},s={require:Promise.resolve(r)};self.define=(r,i,c)=>{s[r]||(s[r]=Promise.resolve().then(()=>{let s={};const f={uri:location.origin+r.slice(1)};return Promise.all(i.map(r=>{switch(r){case"exports":return s;case"module":return f;default:return e(r)}})).then(e=>{const r=c(...e);return s.default||(s.default=r),s})}))}}define("./sw.js",["./workbox-7c85bfc1"],(function(e){"use strict";self.addEventListener("message",e=>{e.data&&"SKIP_WAITING"===e.data.type&&self.skipWaiting()}),e.precacheAndRoute([{url:"auth.js",revision:"e0899f7a682f9c19832fbffa01b7abfe"},{url:"gh.js",revision:"26009ebef96d3c37fd30bc569d717a2e"},{url:"index.html",revision:"96c66c702c7c2b6a17730c5ac315e85e"},{url:"main.css",revision:"033d3d3b65c7a17f7173161e184dfbaa"},{url:"main.js",revision:"f67347690e802fe4ac1f7e88e4ec8c09"},{url:"manifest.webmanifest",revision:"a61f8068fa05c7c375067666d117b4ee"},{url:"sw.js",revision:"d810e9cc946dfdff12b752a3dcfe6e70"},{url:"utils.js",revision:"73683ed686f10cd34bdec5f47a256b0e"},{url:"workbox-config.js",revision:"6fcb310a405216d8ccb5f9f0a402e63f"}],{})}));
//# sourceMappingURL=sw.js.map