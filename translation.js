(function(){
  const KEY="dataPrimerExplorerLanguage";
  const select=document.getElementById("languageSelect");
  let language=localStorage.getItem(KEY)||"en",timer=0,locked=false;
  const cache=new Map(),pending=new Set();
  const combo=()=>document.querySelector(".goog-te-combo");
  function syncLanguages(){
    const control=combo();if(!control)return false;
    const options=[...control.options].filter(option=>option.value&&option.value!=="en");
    if(!options.length)return false;
    select.replaceChildren(new Option("English","en"),...options.map(option=>new Option(option.textContent,option.value)));
    if(![...select.options].some(option=>option.value===language))language="en";
    select.value=language;select.disabled=false;
    return true;
  }
  function choose(value){
    language=value||"en";select.value=language;localStorage.setItem(KEY,language);document.documentElement.lang=language;
    if(language==="en"){
      document.cookie="googtrans=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
      document.cookie="googtrans=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.chatgpt.site";
      location.reload();return;
    }
    const control=combo();if(!control){setTimeout(()=>choose(language),250);return}
    control.value=language;control.dispatchEvent(new Event("change",{bubbles:true}));
    setTimeout(()=>translateVisible(),1200);
  }
  window.dataPrimerGoogleTranslateInit=function(){
    new google.translate.TranslateElement({pageLanguage:"en",autoDisplay:false,multilanguagePage:true},"google_translate_element");
    const host=document.getElementById("google_translate_element");
    const observer=new MutationObserver(()=>{if(syncLanguages()){observer.disconnect();if(language!=="en")choose(language)}});
    observer.observe(host,{childList:true,subtree:true});
    if(syncLanguages()){observer.disconnect();if(language!=="en")choose(language)}
  };
  async function translateText(parts,targetLanguage){
    const marker="[[[DATA_PRIMER_SPLIT_7F3]]]";
    const url="https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl="+encodeURIComponent(targetLanguage)+"&dt=t&q="+encodeURIComponent(parts.join("\n"+marker+"\n"));
    const response=await fetch(url);if(!response.ok)throw new Error("Translation request failed");
    const data=await response.json();return data[0].map(segment=>segment[0]).join("").split(marker).map(value=>value.trim());
  }
  const originals=new WeakMap();
  function capture(){
    document.querySelectorAll("#results,#dialog-content").forEach(root=>{
      const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
      while(walker.nextNode()){const node=walker.currentNode;if(!originals.has(node))originals.set(node,node.textContent)}
    });
  }
  async function translateGroup(root,targetLanguage){
    const nodes=[],parts=[],walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    while(walker.nextNode()){
      const node=walker.currentNode,text=originals.get(node);
      if(text&&text.trim()&&!/^\s*(https?:\/\/\S+|[\d\s×↗]+)\s*$/.test(text)){nodes.push(node);parts.push(text.trim())}
    }
    if(!parts.length)return;
    const key=targetLanguage+":"+JSON.stringify(parts);if(pending.has(key))return;pending.add(key);
    try{
      let translated=cache.get(key);if(!translated){translated=await translateText(parts,targetLanguage);if(translated.length!==parts.length)return;cache.set(key,translated)}
      if(language!==targetLanguage)return;
      nodes.forEach((node,i)=>{if(node.isConnected&&translated[i])node.textContent=translated[i]});
    }catch(error){console.warn("Dynamic dataset translation unavailable",error)}finally{pending.delete(key)}
  }
  function translateVisible(){
    if(language==="en")return;
    const targetLanguage=language,groups=[...document.querySelectorAll(".dataset-card")];
    const detail=document.getElementById("dialog-content");if(detail.childNodes.length)groups.push(detail);
    let cursor=0;async function worker(){while(cursor<groups.length)await translateGroup(groups[cursor++],targetLanguage)}
    Promise.all(Array.from({length:4},worker));
  }
  window.DATA_PRIMER_TRANSLATE={refresh(){capture();if(language==="en"||locked)return;clearTimeout(timer);timer=setTimeout(()=>{const control=combo();if(!control)return;locked=true;control.value="";requestAnimationFrame(()=>{control.value=language;control.dispatchEvent(new Event("change",{bubbles:true}));setTimeout(()=>{locked=false;translateVisible()},900)})},180)},translateVisible};
  capture();select.value=language;select.addEventListener("change",event=>choose(event.target.value));
})();
