import Script from "next/script";

/** Срабатывает до React — ловит ошибки чанков после деплоя (только production). */
export function ChunkLoadRecoveryScript() {
  if (process.env.NODE_ENV !== "production") return null;

  return (
    <Script id="chunk-load-recovery" strategy="beforeInteractive">
      {`(function(){
  var KEY="vechera-chunk-reload";
  function shouldReload(msg){
    return /ChunkLoadError|Loading chunk|Failed to fetch dynamically imported module/i.test(msg||"");
  }
  function reloadOnce(){
    try{
      if(sessionStorage.getItem(KEY))return;
      sessionStorage.setItem(KEY,"1");
    }catch(e){}
    location.reload();
  }
  window.addEventListener("error",function(e){
    if(e.target&&e.target.tagName==="SCRIPT"){
      var src=e.target.src||"";
      if(src.indexOf("/_next/static/chunks/")!==-1)reloadOnce();
      return;
    }
    if(shouldReload((e.error&&e.error.message)||e.message))reloadOnce();
  },true);
  window.addEventListener("unhandledrejection",function(e){
    var r=e.reason;
    if(shouldReload(r&&(r.message||String(r))))reloadOnce();
  });
  window.addEventListener("load",function(){
    try{sessionStorage.removeItem(KEY);}catch(e){}
  });
})();`}
    </Script>
  );
}
