import { initTheme } from "./editor/theme.js";
import { initServerPing } from "./editor/server.js?v=20261011-1";
import { processTiles, canvasBlob, checkAbort } from "./image-tiles.js?v=20261014-7";
initTheme(); initServerPing();
const get = id => document.getElementById(id);
const form=get("convert-form"), input=get("enhance-image"), start=get("convert-button"), format=get("save-type"), cancel=get("cancel-enhance"), download=get("download-enhance"), status=get("convert-status"), progress=get("tile-progress"), comparison=get("enhance-comparison"), preview=get("original-preview"), output=get("enhanced-canvas");
let controller=null, originalUrl=null, resultBlob=null, pdfBlob=null, filename="", dimensions=null;
const downloadUrls=new Set();
function validFile() {
 const file=input.files[0];
 return input.files.length===1 && file && ["image/jpeg","image/png"].includes(file.type) && file.size>0 && file.size<=50*1024*1024;
}
function resetResult() {
 resultBlob=null; pdfBlob=null; download.disabled=true; comparison.hidden=true; output.width=output.height=0; dimensions=null;
 preview.removeAttribute("src"); if(originalUrl) URL.revokeObjectURL(originalUrl); originalUrl=null;
}
function controls() {
 const busy=controller!==null;
 format.disabled=busy||!resultBlob; input.disabled=busy;
 start.disabled=busy||!validFile(); cancel.disabled=!busy; download.disabled=busy||!resultBlob;
 start.textContent=busy?"처리 중…":"대비 강조 시작"; start.setAttribute("aria-busy",String(busy));
 download.textContent=(format.value==="pdf"?"PDF":"PNG")+" 다운로드";
}
function selection() {
 resetResult(); progress.hidden=true;
 const file=input.files[0]; get("selected-file").textContent=file?file.name+" · "+(file.size/1024).toLocaleString("ko-KR",{maximumFractionDigits:1})+" KB":"선택된 파일이 없습니다.";
 status.textContent=file&&!validFile()?"지원 용량 이하의 JPG·PNG 이미지 한 장을 선택해주세요.":""; controls();
}
input.addEventListener("change",selection); format.addEventListener("change",controls);
cancel.addEventListener("click",()=>{controller?.abort(); cancel.disabled=true; status.textContent="취소 중입니다.";});
function resizeComparison() {
 if(!dimensions||comparison.hidden)return;
 for(const element of [preview,output]){
  const scale=Math.min(1,element.parentElement.clientWidth/dimensions.width);
  element.style.width=Math.round(dimensions.width*scale)+"px"; element.style.height=Math.round(dimensions.height*scale)+"px";
 }
}
window.addEventListener("resize",resizeComparison);
let syncing=false;
const viewports=[...comparison.querySelectorAll(".image-viewport")];
viewports.forEach((view,index)=>view.addEventListener("scroll",()=>{
 if(syncing)return; const other=viewports[1-index];
 if(Math.abs(other.scrollLeft-view.scrollLeft)<1&&Math.abs(other.scrollTop-view.scrollTop)<1)return;
 syncing=true; other.scrollLeft=view.scrollLeft; other.scrollTop=view.scrollTop; requestAnimationFrame(()=>{syncing=false;});
}));
form.addEventListener("submit",async event=>{
 event.preventDefault(); if(controller)return;
 if(!validFile()){status.textContent="지원 용량 이하의 JPG·PNG 이미지 한 장을 선택해주세요.";return;}
 resetResult(); progress.hidden=true; progress.value=0; const file=input.files[0];
 controller=new AbortController(); const signal=controller.signal; controls(); let original;
 try{
  if(typeof createImageBitmap!=="function")throw new Error("이 브라우저에서는 처리할 수 없습니다. 다른 브라우저를 사용해주세요.");
  status.textContent="원본 이미지를 읽고 있습니다.";
  try{original=await createImageBitmap(file);}catch{throw new Error("이미지를 읽지 못했습니다. 크기를 줄여 다시 선택해주세요.");}
  checkAbort(signal); let completedBlob;
  progress.hidden=false;
  await processTiles(original,output,signal,(done,total,retry)=>{progress.max=total;progress.value=done;status.textContent="처리 "+done+" / "+total+(retry?" · 재시도 "+retry+"/2":"");});
  status.textContent="PNG를 준비 중입니다.";
  const png=await canvasBlob(output);
  checkAbort(signal);
  completedBlob=png;
  checkAbort(signal);
  {dimensions={width:original.width,height:original.height};originalUrl=URL.createObjectURL(file);preview.src=originalUrl;comparison.hidden=false;resizeComparison();}
  resultBlob=completedBlob;filename=file.name.replace(/\.[^.]+$/,"");
  status.textContent="완료했습니다. 결과를 확인하고 저장 형식을 선택하세요.";
 }catch(error){resetResult();status.textContent=signal.aborted||error.name==="AbortError"?"취소했습니다. 다시 실행할 수 있습니다.":error.message;}
 finally{original?.close();controller=null;controls();}
});
download.addEventListener("click",async()=>{
 if(controller||!resultBlob)return;
 const saveType=format.value;
 if(!["png","pdf"].includes(saveType))return;
 controller=new AbortController();const signal=controller.signal;controls();
 try{
  let blob=resultBlob;
  if(saveType==="pdf"){
   if(!pdfBlob){
    status.textContent="PDF로 변환 중입니다.";
    const body=new FormData();body.append("images",resultBlob,"enhanced.png");
    const response=await fetch("/api/conversion/image-pdf",{method:"POST",body,signal});
    if(!response.ok)throw new Error("PDF 변환에 실패했습니다. 다시 시도해주세요.");
    if((response.headers.get("Content-Type")||"").split(";")[0].trim().toLowerCase()!=="application/pdf")throw new Error("PDF 파일을 받지 못했습니다. 다시 시도해주세요.");
    const pdf=await response.blob();checkAbort(signal);
    if(!pdf.size)throw new Error("PDF 파일을 받지 못했습니다. 다시 시도해주세요.");
    pdfBlob=pdf;
   }
   blob=pdfBlob;
  }
  checkAbort(signal);
  const url=URL.createObjectURL(blob);downloadUrls.add(url);const link=document.createElement("a");
  try{link.href=url;link.download=filename+"."+saveType;document.body.appendChild(link);link.click();}
  finally{link.remove();setTimeout(()=>{URL.revokeObjectURL(url);downloadUrls.delete(url);},60000);}
  status.textContent="다운로드를 시작했습니다.";
 }catch(error){status.textContent=signal.aborted?"취소했습니다. 저장 형식을 선택해 다시 다운로드하세요.":"다운로드에 실패했습니다. 다시 시도해주세요.";}
 finally{controller=null;controls();}
});
window.addEventListener("pagehide",event=>{controller?.abort();if(!event.persisted){resetResult();downloadUrls.forEach(url=>URL.revokeObjectURL(url));downloadUrls.clear();}});
controls();
