import test from 'node:test';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import {readFileSync} from 'node:fs';
import * as engine from './docs/engine.mjs';
import {server} from './server.mjs';
const fixture=()=>JSON.parse(readFileSync(new URL('./docs/example.json',import.meta.url)));
test('sign-off binds exact statement and complete source',async()=>{
  const d=fixture();let r=await engine.evaluate(d);
  d.approvals=r.rows.map(x=>x.receipt);assert.equal((await engine.evaluate(d)).decision,'approved');
  d.sources[0].text+=' Appendix.';assert.equal((await engine.evaluate(d)).decision,'hold');
});
test('missing, ambiguous and stale passages cannot be signed',async()=>{
  for(const reason of ['missing source','ambiguous quote','stale revision','quote missing']){
    const d=fixture();
    if(reason==='missing source')d.sources=[];
    if(reason==='ambiguous quote')d.sources[0].text+=' '+d.claims[0].quote;
    if(reason==='stale revision')d.sources[0].revision='r5';
    if(reason==='quote missing')d.claims[0].quote='Not present';
    const row=(await engine.evaluate(d)).rows[0];assert.equal(row.reason,reason);assert.equal(row.receipt,null);
  }
});
test('HTTP review agrees with the browser engine and rejects invalid data',async()=>{
  const app=server();app.listen(0,'127.0.0.1');await once(app,'listening');
  try{
    const url='http://127.0.0.1:'+app.address().port+'/api/evaluate';
    const post=body=>fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body});
    const r=await post(JSON.stringify(fixture()));assert.equal(r.status,200);assert.deepEqual(await r.json(),await engine.evaluate(fixture()));
    assert.equal((await post('{}')).status,400);
  }finally{await new Promise(done=>app.close(done));}
});
