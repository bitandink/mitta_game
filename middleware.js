// Edge middleware: protect every game page and asset, not just index.html.
import {next} from '@vercel/edge';
const PUBLIC=['/gate.html','/admin.html','/favicon.ico'];
const enc=new TextEncoder();
function decode(str){try{return Uint8Array.from(atob(str.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0))}catch{return new Uint8Array()}}
async function session(request){const cookie=request.headers.get('cookie')?.match(/(?:^|;\s*)mitta_session=([^;]+)/)?.[1];if(!cookie)return null;const [raw,sig]=cookie.split('.');if(!raw||!sig)return null;const key=process.env.SESSION_SECRET;if(!key)return null;const k=await crypto.subtle.importKey('raw',enc.encode(key),{name:'HMAC',hash:'SHA-256'},false,['verify']);if(!(await crypto.subtle.verify('HMAC',k,decode(sig),enc.encode(raw))))return null;try{return JSON.parse(new TextDecoder().decode(decode(raw)))}catch{return null}}
export default async function middleware(request){const path=new URL(request.url).pathname;if(path.startsWith('/api/')||PUBLIC.includes(path))return next();
 try{const s=await session(request);if(s){const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;const r=await fetch(`${url}/rest/v1/mitta_gate_state?select=active_hash,changed_at,version&singleton=eq.true`,{headers:{apikey:key,Authorization:`Bearer ${key}`},cache:'no-store'});if(r.ok){const gate=(await r.json())[0];const t=Date.parse(gate?.changed_at);if(gate?.active_hash&&(s.h===gate.active_hash||(s.v===gate.version-1&&s.i<=t&&Date.now()<t+3600000)))return next()}}}
 catch(e){console.error('Gate unavailable',e)}return Response.redirect(new URL('/gate.html',request.url),302)}
export const config={matcher:['/((?!api/|_vercel/).*)']};
