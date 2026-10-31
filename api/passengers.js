import {randomBytes, randomUUID, scryptSync, timingSafeEqual} from 'node:crypto';
import {allowed,cookie,db,noCache,sign,verify,state} from './_lib.mjs';

const STAGES=new Set(['candy','cave','potion','treat','shelter','cake','hut','broom','kitchen','hat','ghost','forest','moon']);
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const validPuzzle=p=>p&&Array.isArray(p.answer)&&p.answer.length===6&&new Set(p.answer).size===6&&p.answer.every(n=>Number.isInteger(n)&&n>=1&&n<=33)&&Array.isArray(p.choices)&&p.choices.length===12&&new Set(p.choices).size===12&&p.choices.every(n=>Number.isInteger(n)&&n>=1&&n<=33)&&p.answer.every(n=>p.choices.includes(n));
const validStages=s=>Array.isArray(s)&&s.length<=13&&s.every(x=>STAGES.has(x))&&new Set(s).size===s.length;
const digest=(code,salt)=>scryptSync(code,salt,32).toString('hex');
const getCookie=(req,name)=>req.headers.cookie?.match(new RegExp('(?:^|;\\s*)'+name+'=([^;]+)'))?.[1];
const passengerSession=req=>{const v=verify(getCookie(req,'mitta_passenger'));return v?.kind==='passenger'&&uuid.test(v.id)&&Number.isSafeInteger(v.exp)&&v.exp>Date.now()?v:null};
const sessionCookie=(res,id)=>res.setHeader('Set-Cookie',`mitta_passenger=${sign({kind:'passenger',id,exp:Date.now()+7*86400000})}; HttpOnly; Secure; SameSite=Strict; Path=/api/passengers; Max-Age=604800`);
const clearCookie=res=>res.setHeader('Set-Cookie','mitta_passenger=; HttpOnly; Secure; SameSite=Strict; Path=/api/passengers; Max-Age=0');
const fail=(res,status,error)=>res.status(status).json({error});
const one=async(path)=>{const r=await db(path);return r?.[0]||null};
const profile=async id=>{const p=await one(`game_passengers?id=eq.${id}&select=id,nickname,character`);const g=await one(`game_progress?passenger_id=eq.${id}&select=completed_stages,rune_puzzle,revision,saved_at`);return p&&g?{passenger:p,progress:g}:null};
const sameOrigin=req=>{const origin=req.headers.origin;const host=req.headers['x-forwarded-host']||req.headers.host;return !origin||(typeof host==='string'&&new URL(origin).host===host)};
export default async function handler(req,res){
 noCache(res);
 if(!['POST','GET'].includes(req.method))return fail(res,405,'지원하지 않는 요청입니다.');
 if(!sameOrigin(req))return fail(res,403,'요청 출처가 올바르지 않습니다.');
 try{
  if(!allowed(cookie(req),await state()))return fail(res,401,'탑승코드 인증이 필요합니다.');
  const action=req.method==='GET'?'me':req.body?.action;
  if(action==='register'){
   if(req.method!=='POST')return fail(res,405,'잘못된 요청입니다.');
   const nickname=typeof req.body.nickname==='string'?req.body.nickname.trim():'';
   const character=req.body.character,puzzle=req.body.runePuzzle;
   if(!nickname||[...nickname].length>12||typeof character!=='string'||character.length>40||!validPuzzle(puzzle))return fail(res,400,'승객 정보가 올바르지 않습니다.');
   const id=randomUUID(),code=randomBytes(24).toString('base64url'),salt=randomBytes(16).toString('hex');
   await db('game_passengers',{method:'POST',body:JSON.stringify({id,nickname,character})});
   try{
    await db('game_progress',{method:'POST',body:JSON.stringify({passenger_id:id,completed_stages:[],rune_puzzle:puzzle})});
    await db('passenger_credentials',{method:'POST',body:JSON.stringify({passenger_id:id,recovery_hash:`${salt}:${digest(code,salt)}`})});
   }catch(e){await db(`game_passengers?id=eq.${id}`,{method:'DELETE'}).catch(()=>{});throw e;}
   sessionCookie(res,id);return res.status(201).json({ok:true,recoveryCode:code,...await profile(id)});
  }
  if(action==='login'){
   const id=req.body?.passengerId,code=req.body?.recoveryCode;
   if(typeof id!=='string'||!uuid.test(id)||typeof code!=='string'||code.length>200)return fail(res,400,'승객 ID와 복구코드를 확인해 주세요.');
   const c=await one(`passenger_credentials?passenger_id=eq.${id}&select=recovery_hash`);
   const [salt,hash]=(c?.recovery_hash||'').split(':');
   if(!salt||!/^[a-f0-9]{32}$/.test(salt)||!/^[a-f0-9]{64}$/.test(hash))return fail(res,401,'승객 인증에 실패했습니다.');
   const expected=Buffer.from(hash,'hex'),actual=Buffer.from(digest(code,salt),'hex');
   if(!timingSafeEqual(expected,actual))return fail(res,401,'승객 인증에 실패했습니다.');
   sessionCookie(res,id);return res.status(200).json({ok:true,...await profile(id)});
  }
  if(action==='logout'){clearCookie(res);return res.status(200).json({ok:true});}
  const s=passengerSession(req);if(!s)return fail(res,401,'승객 인증이 필요합니다.');
  if(action==='me'){const data=await profile(s.id);return data?res.status(200).json({ok:true,...data}):fail(res,404,'승객을 찾지 못했습니다.');}
  if(action==='save'){
   const stages=req.body?.completedStages,revision=req.body?.revision;
   if(!validStages(stages)||!Number.isSafeInteger(revision)||revision<0)return fail(res,400,'저장 정보가 올바르지 않습니다.');
   const current=await one(`game_progress?passenger_id=eq.${s.id}&select=completed_stages,revision`);
   if(!current)return fail(res,404,'승객 진행도를 찾지 못했습니다.');
   if(current.revision!==revision)return res.status(409).json({error:'다른 저장 기록이 있습니다. 최신 진행도를 다시 불러와 주세요.',current});
   if(current.completed_stages.some(x=>!stages.includes(x)))return fail(res,409,'이미 완료한 스테이지를 제거할 수 없습니다.');
   const rows=await db(`game_progress?passenger_id=eq.${s.id}&revision=eq.${revision}`,{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify({completed_stages:stages,revision:revision+1,saved_at:new Date().toISOString()})});
   if(!rows?.length)return fail(res,409,'동시에 저장된 다른 기록이 있습니다. 다시 불러와 주세요.');
   return res.status(200).json({ok:true,progress:rows[0]});
  }
  return fail(res,400,'알 수 없는 요청입니다.');
 }catch(e){console.error('Passenger API failure:',e);return fail(res,503,'승객 데이터 서버에 연결하지 못했습니다.');}
}
