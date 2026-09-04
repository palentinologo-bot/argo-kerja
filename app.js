const DEFAULTS={wage:25000,workStart:"08:30",workEnd:"17:30",breakEnabled:true,breakStart:"12:00",breakEnd:"13:00"};
const KEY="argoKerjaSettings";
const settings=Object.assign({},DEFAULTS,JSON.parse(localStorage.getItem(KEY)||"{}"));
const $=id=>document.getElementById(id);
const app=$("app"), earned=$("earned"), workTime=$("workTime"), statusTitle=$("statusTitle"), earnedLabel=$("earnedLabel"), rate=$("rate"), detail=$("detail"), clock=$("clock"), schedule=$("schedule");
const dlg=$("settings");

function mins(t){const [h,m]=t.split(":").map(Number);return h*60+m}
function pad(n){return String(n).padStart(2,"0")}
function rupiah(n){return "Rp "+Math.floor(Math.max(0,n)).toLocaleString("id-ID")}
function duration(sec){sec=Math.max(0,Math.floor(sec));return `${pad(Math.floor(sec/3600))}:${pad(Math.floor(sec%3600/60))}:${pad(sec%60)}`}
function todayKey(d){return d.toISOString().slice(0,10)}
function weekday(d){const n=d.getDay();return n>=1&&n<=5}
function paidSecondsAt(d){
  if(!weekday(d)) return 0;
  const start=mins(settings.workStart), end=mins(settings.workEnd);
  const current=d.getHours()*60+d.getMinutes()+d.getSeconds()/60;
  if(current<=start)return 0;
  const capped=Math.min(current,end);
  let sec=Math.max(0,(capped-start)*60);
  if(settings.breakEnabled){
    const bs=mins(settings.breakStart), be=mins(settings.breakEnd);
    const overlap=Math.max(0,(Math.min(capped,be)-Math.max(start,bs))*60);
    sec-=overlap;
  }
  return Math.max(0,sec)
}
function statusAt(d){
  if(!weekday(d)) return ["OFF","HARI LIBUR","Hari ini argo tidak berjalan", "off"];
  const m=d.getHours()*60+d.getMinutes()+d.getSeconds()/60;
  const s=mins(settings.workStart), e=mins(settings.workEnd);
  if(m<s)return ["BELUM MULAI","ARGO BELUM JALAN",`Mulai ${settings.workStart}`,"off"];
  if(m>=e)return ["SELESAI","ARGO BERHENTI",`Selesai ${settings.workEnd}`,"off"];
  if(settings.breakEnabled && m>=mins(settings.breakStart)&&m<mins(settings.breakEnd))return ["ISTIRAHAT","ARGO BERHENTI",`Sampai ${settings.breakEnd}`,"break"];
  return ["ARGO","PENGHASILAN HARI INI","", "work"];
}
function render(){
  const now=new Date(), [title,sub,det,state]=statusAt(now), sec=paidSecondsAt(now), money=sec/3600*Number(settings.wage||0);
  app.style.background=state==="work"?"#0d5bd7":state==="break"?"#d11217":"#101114";
  statusTitle.textContent=title; earned.textContent=rupiah(money); earnedLabel.textContent=sub;
  workTime.textContent=state==="work"?duration(sec):duration(sec);
  rate.textContent=`Rp ${Number(settings.wage||0).toLocaleString("id-ID")} / JAM`;
  detail.textContent=det;
  clock.textContent=now.toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit",second:"2-digit"});
  schedule.textContent=`${settings.workStart}–${settings.workEnd}${settings.breakEnabled?"  •  Istirahat "+settings.breakStart+"–"+settings.breakEnd:""}`;
}
function loadForm(){
 $("wage").value=settings.wage;$("workStart").value=settings.workStart;$("workEnd").value=settings.workEnd;
 $("breakEnabled").checked=settings.breakEnabled;$("breakStart").value=settings.breakStart;$("breakEnd").value=settings.breakEnd;
}
$("settingsBtn").onclick=()=>{loadForm();dlg.showModal()}
$("settingsForm").addEventListener("submit",e=>{
 e.preventDefault();
 settings.wage=Number($("wage").value)||0;settings.workStart=$("workStart").value||DEFAULTS.workStart;settings.workEnd=$("workEnd").value||DEFAULTS.workEnd;
 settings.breakEnabled=$("breakEnabled").checked;settings.breakStart=$("breakStart").value||DEFAULTS.breakStart;settings.breakEnd=$("breakEnd").value||DEFAULTS.breakEnd;
 localStorage.setItem(KEY,JSON.stringify(settings));dlg.close();render();
});
setInterval(render,1000);render();

if("serviceWorker" in navigator) window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));
