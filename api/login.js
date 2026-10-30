import {sha,sign,setCookie,db,state,noCache,method} from './_lib.mjs';
export default async function handler(req,res){noCache(res);if(!method(req,res,'POST'))return;try{
 const code=String(req.body?.code||'').trim().toUpperCase();if(!/^[A-Z0-9-]{8,40}$/.test(code))return res.status(400).json({error:'입장코드 형식을 확인해 주세요.'});
 const gate=await state();if(!gate?.active_hash||sha(code)!==gate.active_hash)return res.status(401).json({error:'현재 유효하지 않은 입장코드입니다.'});
 const now=Date.now();setCookie(res,sign({h:gate.active_hash,v:gate.version,i:now,n:crypto.randomUUID()}));return res.status(200).json({ok:true});
 }catch(e){console.error(e);return res.status(503).json({error:'인증 서버에 연결하지 못했습니다.'})}}
