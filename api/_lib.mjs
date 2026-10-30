import {createHash, createHmac, timingSafeEqual, randomBytes} from 'node:crypto';
export const sha = v=>createHash('sha256').update(v).digest('hex');
const key=()=>{if(!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length<32)throw Error('SESSION_SECRET must be >=32 chars');return process.env.SESSION_SECRET};
export function sign(payload){const raw=Buffer.from(JSON.stringify(payload)).toString('base64url');return raw+'.'+createHmac('sha256',key()).update(raw).digest('base64url')}
export function verify(token){if(!token)return null;const [raw,sig]=token.split('.');if(!raw||!sig)return null;const expect=createHmac('sha256',key()).update(raw).digest();let got;try{got=Buffer.from(sig,'base64url')}catch{return null}if(got.length!==expect.length||!timingSafeEqual(got,expect))return null;try{return JSON.parse(Buffer.from(raw,'base64url').toString())}catch{return null}}
export function cookie(req){const raw=req.headers.cookie||'';const match=raw.match(/(?:^|;\s*)mitta_session=([^;]+)/);return verify(match&&match[1])}
export function setCookie(res,token){res.setHeader('Set-Cookie',`mitta_session=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=2592000`)}
export function noCache(res){res.setHeader('Cache-Control','no-store, max-age=0')}
export async function db(path,options={}){const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!url||!key)throw Error('Supabase env missing');const r=await fetch(`${url}/rest/v1/${path}`,{...options,headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json',...options.headers},cache:'no-store'});if(!r.ok)throw Error(`Database error ${r.status}: ${(await r.text()).slice(0,250)}`);const body=await r.text();return body?JSON.parse(body):null}
export async function state(){const rows=await db('mitta_gate_state?select=active_hash,changed_at,version&singleton=eq.true');return rows[0]}
export function allowed(session,gate){if(!session||!gate?.active_hash)return false;if(session.h===gate.active_hash)return true;const t=Date.parse(gate.changed_at);return Number.isFinite(t)&&Date.now()<t+3600000&&session.v===gate.version-1&&session.i<=t}
export const method=(req,res,verb)=>{if(req.method!==verb){res.status(405).json({error:'Method not allowed'});return false}return true};
export const admin=(req)=>{const value=req.headers['x-admin-key']||'';const correct=process.env.ADMIN_SECRET||'';const a=Buffer.from(value),b=Buffer.from(correct);return b.length>=32&&a.length===b.length&&timingSafeEqual(a,b)};
