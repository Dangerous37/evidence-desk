import * as engine from './engine.mjs';
const byId=id=>document.getElementById(id);
const actions=byId('actions'),results=byId('results');
const api=location.pathname.startsWith('/desk/');
let data,report,original;
async function execute(operation,input){
  if(!api)return operation==='evaluate'?engine.evaluate(input):engine.apply(input.input,input.approvedFingerprint);
  const res=await fetch('/api/'+operation,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input)});
  const result=await res.json();if(!res.ok)throw Error(result.error);return result;
}
function element(tag,text){const node=document.createElement(tag);if(text!==undefined)node.textContent=text;return node;}
function button(parent,title,change){
  const btn=element('button',title);parent.append(btn);btn.onclick=()=>run(change);
}
function article(label,title){const card=element('article');card.className='card';const badge=element('span',label);badge.className='badge';card.append(badge,element('h3',title));results.append(card);return card;}
function stats(card,pairs){const dl=element('dl');dl.className='stats';for(const [k,v] of pairs){const box=element('div');box.append(element('dt',k),element('dd',v));dl.append(box);}card.append(dl);}
let busy=false;
async function run(change){
  if(busy)return;busy=true;
  const previous=structuredClone(data);
  try{
    if(change)await change();
    report=await execute('evaluate',data);
    results.replaceChildren();render();byId('input').value=JSON.stringify(data,null,2);
    byId('decision').textContent=report.decision.toUpperCase();byId('status').textContent=summary();
  }catch(error){data=previous;byId('status').textContent=error.message;}
  finally{busy=false;}
}
function controls(){
  button(actions,'Withdraw source',()=>{data.sources=[];});
  button(actions,'Revise source',()=>{if(!data.sources.length)throw Error('Restore the example first.');data.sources[0].revision+='*';});
}
function render(){
  for(const r of report.rows){
    const card=article(r.id+' / '+r.source,r.statement);
    const doc=data.sources.find(s=>s.id===r.source);
    const block=element('blockquote');
    if(doc && r.start!==null){block.append(doc.text.slice(0,r.start),element('mark',doc.text.slice(r.start,r.end)),doc.text.slice(r.end));}
    else block.textContent='Submitted quote: '+r.quote;
    card.append(block,element('p',r.approved?'Signed off':r.reason));
    if(r.receipt && !r.approved)button(card,'Sign off '+r.id,()=>{(data.approvals??=[]).push(r.receipt);});
  }
}
function summary(){return report.rows.filter(r=>r.approved).length+' / '+report.rows.length+' claims signed off. Read each passage before approving.';}
function resetCase(){data=structuredClone(original);}
byId('load').onclick=()=>run(()=>{data=JSON.parse(byId('input').value);});
byId('reset').onclick=()=>run(resetCase);
byId('export').onclick=()=>{
  if(!report)return;const a=element('a');const url=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'}));
  a.href=url;a.download='evidence-desk-report.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
};
try{original=await (await fetch('./example.json')).json();resetCase();controls();byId('mode').textContent=api?'LOCAL API':'BROWSER SANDBOX';await run();}
catch(error){byId('status').textContent=error.message;}
