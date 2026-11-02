const nonblank = v => typeof v === 'string' && v.trim().length > 0;

async function fingerprint(values) {
  const bytes = new TextEncoder().encode(JSON.stringify(values));
  const digest = await crypto.subtle.digest('SHA-256',bytes);
  return Array.from(new Uint8Array(digest), b=>b.toString(16).padStart(2,'0')).join('');
}

export async function evaluate(input) {
  const {sources,claims,approvals=[]}=input;
  if (!Array.isArray(sources) || !Array.isArray(claims) || !claims.length || !Array.isArray(approvals))
    throw Error('Supply sources, at least one claim, and an optional approval list.');
  const library=new Map(), ids=new Set();
  for(const src of sources) {
    if(![src.id,src.revision,src.text].every(nonblank) || library.has(src.id)) throw Error('Invalid or duplicate source.');
    library.set(src.id,src);
  }
  const rows=[];
  for(const claim of claims) {
    const {id,statement,source,revision,quote}=claim;
    if (![id,statement,source,revision,quote].every(nonblank) || ids.has(id)) throw Error('Invalid or duplicate claim.');
    ids.add(id);
    const doc=library.get(source);
    const start=doc?.text.indexOf(quote) ?? -1;
    let reason='eligible';
    if(!doc) reason='missing source';
    else if(doc.revision!==revision) reason='stale revision';
    else if(start<0) reason='quote missing';
    else if(doc.text.indexOf(quote,start+1)>=0) reason='ambiguous quote';
    const receipt=reason==='eligible' ? await fingerprint([id,statement,source,revision,quote,doc.text]) : null;
    rows.push({id,statement,source,quote,reason,start:reason==='eligible'?start:null,
      end:reason==='eligible'?start+quote.length:null,receipt,
      approved:receipt!==null && approvals.includes(receipt)});
  }
  return {decision:rows.every(r=>r.approved)?'approved':'hold',rows};
}
