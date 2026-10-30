import {admin,db,state,noCache,method,sha} from './_lib.mjs';
export default async function handler(req,res){noCache(res);if(!admin(req))return res.status(403).json({error:'관리자 키가 올바르지 않습니다.'});try{
 if(req.method==='GET'){const gate=await state();const codes=await db('mitta_codes?select=label,code_hash,activated_at,retired_at&order=created_at.asc');return res.status(200).json({gate,codes})}
 if(!method(req,res,'POST'))return;const hash=String(req.body?.hash||'');if(!/^[a-f0-9]{64}$/.test(hash))return res.status(400).json({error:'코드 해시를 선택해 주세요.'});
 const result=await db('rpc/mitta_activate_code',{method:'POST',body:JSON.stringify({p_hash:hash})});return res.status(200).json({ok:true,result});
 }catch(e){console.error(e);return res.status(503).json({error:'관리자 작업 실패'})}}
