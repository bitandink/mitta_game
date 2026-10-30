import {admin,db,noCache,method} from './_lib.mjs';
export default async function handler(req,res){noCache(res);if(!method(req,res,'POST'))return;if(!admin(req))return res.status(403).json({error:'Forbidden'});try{
 const rows=req.body?.codes;if(!Array.isArray(rows)||rows.length<1||rows.length>500)return res.status(400).json({error:'1~500개씩 등록하세요.'});
 if(rows.some(x=>!x||!/^[a-f0-9]{64}$/.test(x.hash)||typeof x.label!=='string'||x.label.length>80))return res.status(400).json({error:'잘못된 코드 목록'});
 await db('mitta_codes?on_conflict=code_hash',{method:'POST',headers:{Prefer:'resolution=ignore-duplicates,return=minimal'},body:JSON.stringify(rows.map(x=>({code_hash:x.hash,label:x.label})))});return res.status(200).json({ok:true,count:rows.length});
 }catch(e){console.error(e);return res.status(503).json({error:'등록 실패'})}}
