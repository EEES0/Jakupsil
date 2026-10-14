import { initTheme } from "./editor/theme.js";
import { initServerPing } from "./editor/server.js?v=20261011-1";
import { processTiles, canvasBlob, checkAbort } from "./image-tiles.js?v=20261014-5";
initTheme(); initServerPing();
const get = id => document.getElementById(id);
const form=get("convert-form"), input=get("enhance-image"), start=get("convert-button"), format=get("save-type"), cancel=get("cancel-enhance"), download=get("download-enhance"), status=get("convert-status"), progress=get("tile-progress"), comparison=get("enhance-comparison"), preview=get("original-preview"), output=get("enhanced-canvas"), zoom=get("compare-zoom");
let controller=null, originalUrl=null, resultBlob=null, filename="", dimensions=null;
const downloadUrls=new Set();
function validFile() {
 const file=input.files[0];
 return input.files.length===1 && file && ["image/jpeg","image/png"].includes(file.type) && file.size>0 && file.size<=50*1024*1024;
}
function resetResult() {
 resultBlob=null; download.disabled=true; comparison.hidden=true; output.width=output.height=0; dimensions=null;
 preview.removeAttribute("src"); if(originalUrl) URL.revokeObjectURL(originalUrl); originalUrl=null;
}
function controls() {
 const busy=controller!==null;
 format.disabled=input.disabled=busy;
 start.disabled=busy||!validFile(); cancel.disabled=!busy; download.disabled=busy||!resultBlob;
 start.textContent=busy?"처리 중…":"대비 강조 시작"; start.setAttribute("aria-busy",String(busy));
 download.textContent=(format.value==="pdf"?"PDF":"PNG")+" 다운로드";
}
function selection() {
 resetResult(); progress.hidden=true;
 const file=input.files[0]; get("selected-file").textContent=file?file.name+" · "+(file.size/1024).toLocaleString("ko-KR",{maximumFractionDigits:1})+" KB":"선택된 파일이 없습니다.";
 status.textContent=file&&!validFile()?"지원 용량 이하의 JPG·PNG 이미지 한 장을 선택해주세요.":""; controls();
}
input.addEventListener("change",selection); format.addEventListener("change",selection);
cancel.addEventListener("click",()=>{controller?.abort(); cancel.disabled=true; status.textContent="취소 중입니다. 이후 타일은 전송하지 않습니다.";});
function resizeComparison() {
 if(!dimensions||comparison.hidden)return;
 for(const element of [preview,output]){
  const scale=zoom.value==="fit"?Math.min(1,element.parentElement.clientWidth/dimensions.width):Number(zoom.value);
  element.style.width=Math.round(dimensions.width*scale)+"px"; element.style.height=Math.round(dimensions.height*scale)+"px";
 }
}
zoom.addEventListener("change",resizeComparison); window.addEventListener("resize",resizeComparison);
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
 resetResult(); progress.hidden=true; progress.value=0; const file=input.files[0], saveType=format.value;
 const mime={png:"image/png",pdf:"application/pdf"}[saveType];
 if(!mime){status.textContent="PNG 또는 PDF를 선택해주세요.";return;}
 controller=new AbortController(); const signal=controller.signal; controls(); let original;
 try{
  if(typeof createImageBitmap!=="function")throw new Error("이미지 디코딩을 지원하는 최신 브라우저를 사용해주세요.");
  status.textContent="원본 이미지를 읽고 있습니다.";
  try{original=await createImageBitmap(file);}catch{throw new Error("이미지를 읽을 수 없거나 메모리가 부족합니다. 축소한 JPG·PNG 이미지를 업로드해주세요.");}
  checkAbort(signal); let completedBlob;
  progress.hidden=false;
  await processTiles(original,output,signal,(done,total,retry)=>{progress.max=total;progress.value=done;status.textContent=done+" / "+total+" 타일 완료"+(retry?" · 현재 타일 재시도 "+retry+"/2":"");});
  status.textContent="모든 타일 완료. PNG를 저장하고 있습니다.";
  const png=await canvasBlob(output);
  checkAbort(signal);
  completedBlob=png;
  if(saveType==="pdf"){
   status.textContent="모든 타일 완료. 보정된 PNG를 PDF로 변환하고 있습니다.";
   const body=new FormData();body.append("images",png,"enhanced.png");
   const response=await fetch("/api/conversion/image-pdf",{method:"POST",body,signal});
   if(!response.ok)throw new Error("PDF 변환 API 오류 ("+response.status+"). 변환 주소와 서버 업로드 제한을 확인해주세요.");
   if((response.headers.get("Content-Type")||"").split(";")[0].trim().toLowerCase()!=="application/pdf")throw new Error("PDF 변환 서버가 PDF가 아닌 응답을 반환했습니다.");
   completedBlob=await response.blob();if(!completedBlob.size)throw new Error("PDF 변환 결과가 비어 있습니다.");
  }
  checkAbort(signal);
  {dimensions={width:original.width,height:original.height};originalUrl=URL.createObjectURL(file);preview.src=originalUrl;comparison.hidden=false;resizeComparison();}
  resultBlob=completedBlob;filename=file.name.replace(/\.[^.]+$/,"")+"."+saveType;
  status.textContent=progress.max+" / "+progress.max+" 타일 완료. 확대 비교 후 "+saveType.toUpperCase()+"를 다운로드하세요. 경계 밝기 차이가 남을 수 있습니다.";
 }catch(error){resetResult();status.textContent=signal.aborted||error.name==="AbortError"?"취소했습니다. 다시 실행할 수 있습니다.":error.message;}
 finally{original?.close();controller=null;controls();}
});
download.addEventListener("click",()=>{
 if(controller||!resultBlob)return;
 const url=URL.createObjectURL(resultBlob);downloadUrls.add(url);const link=document.createElement("a");
 try{link.href=url;link.download=filename;document.body.appendChild(link);link.click();}
 finally{link.remove();setTimeout(()=>{URL.revokeObjectURL(url);downloadUrls.delete(url);},60000);}
});
window.addEventListener("pagehide",event=>{controller?.abort();if(!event.persisted){resetResult();downloadUrls.forEach(url=>URL.revokeObjectURL(url));downloadUrls.clear();}});
controls();
