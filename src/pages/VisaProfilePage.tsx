import { useMemo, useRef, useState, type CSSProperties } from 'react'
import { MAX_DOCUMENT_SIZE_BYTES, parseDocument } from '../services/documents/documentParser'
import { requestProfileExtraction } from '../services/profile/profileExtractionClient'
import { ARJUN_PROFILE_EXTRACTION } from '../data/demo/arjunProfileExtraction'
import type { ProfileExtractionSection } from '../types/profile/profileExtraction'
import { useAssessment } from '../state/assessmentStore'
import { StatusPill } from '../components/StatusPill'
import './ProfilePage.css'

const ACCEPTED_TYPES = ['application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document']
const ACCEPTED_EXTENSIONS = ['.pdf','.docx']

function formatFileSize(bytes:number){return bytes<1024*1024?`${Math.round(bytes/1024)} KB`:`${(bytes/(1024*1024)).toFixed(2)} MB`}
function sectionIcon(title:string){const v=title.toLowerCase();if(v.includes('education'))return'ED';if(v.includes('employment')||v.includes('experience'))return'EX';if(v.includes('publication'))return'PU';if(v.includes('patent')||v.includes('ip'))return'IP';if(v.includes('award'))return'AW';if(v.includes('membership'))return'MB';if(v.includes('judg')||v.includes('review'))return'JR';if(v.includes('speak')||v.includes('present'))return'SP';if(v.includes('media'))return'ME';if(v.includes('leadership')||v.includes('management'))return'LD';return'PF'}

function SectionCard({section}:{section:ProfileExtractionSection}){
  const [open,setOpen]=useState(false)
  return <article className={`extraction-section ${open?'is-open':''}`}>
    <button type="button" className="extraction-section-header" onClick={()=>setOpen(v=>!v)}>
      <span className="section-icon">{sectionIcon(section.title)}</span>
      <span className="section-title-block"><strong>{section.title}</strong><small>{section.items.length} {section.items.length===1?'item':'items'} extracted from profile</small></span>
      <span className="section-chevron">{open?'−':'+'}</span>
    </button>
    {open&&<div className="extraction-items">{section.items.map((item,index)=><div className="extraction-item" key={`${section.title}-${index}`}><span className="item-index">{String(index+1).padStart(2,'0')}</span><div><p>{item.text}</p><span className="item-source">{item.sourcePage?`Source page ${item.sourcePage}`:'Source page not preserved in current extraction'}</span></div></div>)}</div>}
  </article>
}

export function ProfilePage(){
  const inputRef=useRef<HTMLInputElement>(null)
  const {parsedDocument,profileExtraction,extractionSource,setParsedDocument,setProfileExtraction}=useAssessment()
  const [selectedFile,setSelectedFile]=useState<File|null>(null)
  const [error,setError]=useState('')
  const [isDragging,setIsDragging]=useState(false)
  const [isParsing,setIsParsing]=useState(false)
  const [isAnalyzing,setIsAnalyzing]=useState(false)
  const [search,setSearch]=useState('')

  const validateFile=(file:File)=>{const extension=`.${file.name.split('.').pop()?.toLowerCase()}`;if(!ACCEPTED_TYPES.includes(file.type)&&!ACCEPTED_EXTENSIONS.includes(extension))return'Please select a PDF or DOCX file.';if(file.size>MAX_DOCUMENT_SIZE_BYTES)return'File size must be 10 MB or less.';return''}
  const handleFile=(file:File|undefined)=>{if(!file)return;const e=validateFile(file);if(e){setError(e);return}setError('');setSelectedFile(file);setParsedDocument(null);setProfileExtraction(null,null)}
  const parseSelectedFile=async()=>{if(!selectedFile)return;setIsParsing(true);setError('');try{const parsed=await parseDocument(selectedFile);setParsedDocument(parsed)}catch(v){setError(v instanceof Error?v.message:'Unable to parse this document.')}finally{setIsParsing(false)}}
  const runAiExtraction=async()=>{if(!parsedDocument)return;setIsAnalyzing(true);setError('');try{const result=await requestProfileExtraction(parsedDocument);setProfileExtraction(result.extraction,'AI')}catch(v){setError(v instanceof Error?v.message:'AI profile extraction failed.')}finally{setIsAnalyzing(false)}}
  const loadFixture=()=>{setProfileExtraction(ARJUN_PROFILE_EXTRACTION,'FIXTURE');setError('')}
  const removeFile=()=>{setSelectedFile(null);setParsedDocument(null);setProfileExtraction(null,null);setError('');if(inputRef.current)inputRef.current.value=''}
  const filteredSections=useMemo(()=>{if(!profileExtraction||!search.trim())return profileExtraction?.sections??[];const q=search.trim().toLowerCase();return profileExtraction.sections.filter(s=>s.title.toLowerCase().includes(q)||s.items.some(i=>i.text.toLowerCase().includes(q)))},[profileExtraction,search])
  const totalItems=profileExtraction?.sections.reduce((n,s)=>n+s.items.length,0)??0

  return <section className="profile-page">
    <div className="profile-hero"><div><span className="profile-eyebrow">STAGE 01 · DOCUMENT INTAKE</span><h2>Start with the professional record.</h2><p>Upload a profile and VisaPilot will first establish what the document actually contains. Interpretation and criterion analysis happen only after this extraction layer.</p></div><div className="profile-hero-rule"><span>CURRENT RULE</span><strong>Document facts first.</strong><small>Missing information is not silently treated as absence.</small></div></div>

    <div className="profile-layout">
      <div className="profile-main-column">
        <section className="upload-card">
          <div className="card-heading"><div><span className="profile-eyebrow">PROFILE SOURCE</span><h3>{selectedFile?'Selected professional profile':'Upload professional profile'}</h3></div>{selectedFile&&<StatusPill tone="info">{formatFileSize(selectedFile.size)}</StatusPill>}</div>
          <input ref={inputRef} className="profile-file-input" type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={e=>handleFile(e.target.files?.[0])}/>
          {!selectedFile?<div className={`profile-dropzone ${isDragging?'profile-dropzone--dragging':''}`} onDragOver={e=>{e.preventDefault();setIsDragging(true)}} onDragLeave={()=>setIsDragging(false)} onDrop={e=>{e.preventDefault();setIsDragging(false);handleFile(e.dataTransfer.files?.[0])}} onClick={()=>inputRef.current?.click()} role="button" tabIndex={0} onKeyDown={e=>{if(e.key==='Enter'||e.key===' ')inputRef.current?.click()}}><div className="upload-mark">↑</div><strong>Drop a PDF or DOCX here</strong><span>or <b>browse your files</b></span><small>Maximum 10 MB · Professional profile / CV / résumé</small></div>:<div className="selected-file"><div className="file-type">{selectedFile.name.toLowerCase().endsWith('.pdf')?'PDF':'DOCX'}</div><div className="file-details"><strong>{selectedFile.name}</strong><span>{formatFileSize(selectedFile.size)} · Ready for local document extraction</span></div><button type="button" className="ghost-button" onClick={removeFile}>Remove</button></div>}
          {error&&<div className="profile-error" role="alert"><strong>Action required</strong><span>{error}</span></div>}
          <div className="upload-footer"><div className="upload-trust"><span>01</span><small>Parse document</small><i>→</i><span>02</span><small>Extract profile</small><i>→</i><span>03</span><small>Analyze evidence</small></div><button className="primary-button" type="button" disabled={!selectedFile||isParsing} onClick={parseSelectedFile}>{isParsing?'Parsing document…':parsedDocument?'Re-parse document':'Extract document →'}</button></div>
        </section>

        {parsedDocument&&<section className="telemetry-card"><div className="telemetry-header"><div><span className="profile-eyebrow">DOCUMENT TELEMETRY</span><h3>Extraction foundation</h3></div><StatusPill tone="success">Text extracted</StatusPill></div><div className="telemetry-grid"><div><span>File</span><strong>{parsedDocument.filename}</strong></div><div><span>Pages</span><strong>{parsedDocument.pageCount??'—'}</strong></div><div><span>Characters</span><strong>{parsedDocument.characterCount.toLocaleString()}</strong></div><div><span>Words</span><strong>{parsedDocument.wordCount.toLocaleString()}</strong></div></div><details className="source-details"><summary>Inspect extracted document text</summary><pre>{parsedDocument.extractedText}</pre></details></section>}

        {parsedDocument&&!profileExtraction&&<section className="ai-launch-card"><div><span className="profile-eyebrow">PROFILE INTELLIGENCE</span><h3>Turn extracted text into a structured profile.</h3><p>VisaPilot sends the parsed document to its server-side AI extraction endpoint. API credentials stay off the browser; the returned structured profile is rendered directly in this workspace.</p></div><div className="ai-launch-actions"><button className="primary-button" type="button" onClick={runAiExtraction} disabled={isAnalyzing}>{isAnalyzing?'Analyzing profile…':'Run AI extraction'}</button><button className="secondary-button" type="button" onClick={loadFixture}>Load synthetic UI fixture</button></div></section>}

        {profileExtraction&&<section className="extraction-review">
          <div className="review-top"><div><div className="review-kicker"><span className="profile-eyebrow">PROFILE EXTRACTION REVIEW</span><StatusPill tone={extractionSource==='AI'?'success':'warning'}>{extractionSource==='AI'?'AI result':'Development fixture'}</StatusPill></div><h3>{profileExtraction.candidate.name||'Candidate profile'}</h3><p>{profileExtraction.candidate.currentTitle||'Professional profile'}{profileExtraction.candidate.location?` · ${profileExtraction.candidate.location}`:''}</p></div><div className="review-confidence"><span>Extraction confidence</span><strong>{profileExtraction.extraction.confidence}</strong><small>{profileExtraction.extraction.quality} profile</small></div></div>
          <div className="profile-metrics"><div><span>Sections</span><strong>{profileExtraction.sections.length}</strong></div><div><span>Extracted items</span><strong>{totalItems}</strong></div><div><span>Claims to verify</span><strong>{profileExtraction.claims.length}</strong></div><div><span>Ambiguities</span><strong>{profileExtraction.ambiguities.length}</strong></div></div>
          <div className="extraction-toolbar"><div><span className="profile-eyebrow">DETECTED STRUCTURE</span><h4>What the document contains</h4></div><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search extracted sections…" aria-label="Search extracted sections"/></div>
          <div className="extraction-sections">{filteredSections.map(section=><SectionCard key={section.title} section={section}/>)}</div>
          {profileExtraction.claims.length>0&&<section className="claims-review"><div className="claims-heading"><div><span className="profile-eyebrow">CLAIM SAFETY</span><h4>Claims requiring verification</h4></div><StatusPill tone="warning">{profileExtraction.claims.length} flagged</StatusPill></div><div className="claim-list">{profileExtraction.claims.map((claim,index)=><article className="claim-row" key={`${claim.text}-${index}`}><span className="claim-marker">!</span><div><strong>{claim.text}</strong><small>{claim.verificationReason.replaceAll('-',' ')}</small></div><StatusPill tone="warning">Unverified</StatusPill></article>)}</div></section>}
          <div className="review-disclaimer"><strong>Extraction is not legal assessment.</strong><span>These results describe what the source profile contains. Criterion mapping and regulatory evaluation are separate stages.</span></div>
        </section>}
      </div>

      <aside className="profile-side-column">
        <section className="progress-card"><span className="profile-eyebrow">ASSESSMENT PROGRESS</span><div className="progress-ring" style={{'--progress':`${profileExtraction?20:parsedDocument?10:0}%`} as CSSProperties}><div><strong>{profileExtraction?'20':parsedDocument?'10':'0'}%</strong><span>workflow</span></div></div><h3>{profileExtraction?'Profile intelligence ready':parsedDocument?'Document parsed':'Waiting for upload'}</h3><p>{profileExtraction?'Next: claim normalization and criterion mapping.':parsedDocument?'The source text is ready for the AI extraction layer.':'Upload a profile to activate the first stage.'}</p></section>
        <section className="side-card"><span className="profile-eyebrow">ACTIVE PATHWAY</span><div className="pathway-row"><div className="pathway-badge">EB-1A</div><div><strong>Extraordinary Ability</strong><small>10 criteria · EB1A-2026-09</small></div></div><div className="side-rule"/><p>Pathway selection will become interactive in Stage 02.</p></section>
        <section className="side-card"><span className="profile-eyebrow">WHAT HAPPENS NEXT</span><ol className="next-list"><li><span>01</span><div><strong>Normalize claims</strong><small>Give every claim a traceable identity.</small></div></li><li><span>02</span><div><strong>Map to criteria</strong><small>Identify potential proposition matches.</small></div></li><li><span>03</span><div><strong>Apply rules</strong><small>Let deterministic rules control assessment state.</small></div></li></ol></section>
      </aside>
    </div>
  </section>
}
