// =======================================
// Lisprotec - Cookie Banner
// =======================================

(function () {

  const STORAGE_KEY = "lisprotec_cookie_consent";

  if (localStorage.getItem(STORAGE_KEY)) return;

  const css = `
#cookie-banner{
position:fixed;
bottom:20px;
left:20px;
right:20px;
background:#1f2937;
color:#fff;
padding:20px;
border-radius:12px;
box-shadow:0 10px 30px rgba(0,0,0,.25);
z-index:99999;
font-family:Inter,Arial,sans-serif;
display:flex;
gap:20px;
align-items:center;
justify-content:space-between;
flex-wrap:wrap;
}
#cookie-banner p{margin:0;flex:1;line-height:1.6;font-size:15px;}
#cookie-banner .cookie-buttons{display:flex;gap:10px;flex-wrap:wrap;}
#cookie-banner button{border:none;padding:11px 18px;border-radius:8px;cursor:pointer;font-weight:600;transition:.2s;}
#cookie-accept{background:#f97316;color:#fff;}
#cookie-accept:hover{background:#ea580c;}
#cookie-reject{background:#4b5563;color:#fff;}
#cookie-reject:hover{background:#374151;}
#cookie-banner a{color:#fff;text-decoration:underline;}
@media(max-width:768px){
#cookie-banner{left:10px;right:10px;bottom:10px;}
}
`;

  const style=document.createElement("style");
  style.textContent=css;
  document.head.appendChild(style);

  const banner=document.getElementById("cookie-banner");
  if(!banner) return;

  banner.innerHTML=`
<p>
A Lisprotec utiliza cookies essenciais e, mediante o seu consentimento, cookies analíticos e publicitários para melhorar a experiência de navegação e medir a eficácia das campanhas.
Consulte a <a href="./cookies.html" target="_blank">Política de Cookies</a>.
</p>
<div class="cookie-buttons">
<button id="cookie-reject">Recusar</button>
<button id="cookie-accept">Aceitar</button>
</div>`;

  document.getElementById("cookie-accept").onclick=function(){
    localStorage.setItem(STORAGE_KEY,"accepted");
    window.dispatchEvent(new Event("cookieConsentAccepted"));
    banner.remove();
  };

  document.getElementById("cookie-reject").onclick=function(){
    localStorage.setItem(STORAGE_KEY,"rejected");
    banner.remove();
  };

})();
