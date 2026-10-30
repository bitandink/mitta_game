import {randomBytes,createHash} from 'node:crypto';
import {writeFileSync} from 'node:fs';
const n=Math.min(500,Math.max(1,Number(process.argv[2]||50)));const rows=[];for(let i=0;i<n;i++){const code='MITTA-'+randomBytes(9).toString('hex').toUpperCase();rows.push({label:`${String(i+1).padStart(3,'0')}번`,code,hash:createHash('sha256').update(code).digest('hex')})}
writeFileSync('codes.csv','label,code,hash\n'+rows.map(x=>`${x.label},${x.code},${x.hash}`).join('\n'));writeFileSync('codes-import.json',JSON.stringify({codes:rows.map(({label,hash})=>({label,hash}))},null,2));console.log(`${n}개 생성: codes.csv (엑셀 열기), codes-import.json (관리자 등록용). 절대 public 폴더에 넣지 마세요.`);
