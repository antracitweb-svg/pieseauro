const $=s=>document.querySelector(s), $$=s=>document.querySelectorAll(s);
const modal=$("#modal");
function openModal(){modal.classList.remove("hidden")}
function closeModal(){modal.classList.add("hidden")}
$("#openModal").onclick=openModal; $("#openModal2").onclick=openModal; $("#closeModal").onclick=closeModal;
modal.addEventListener("click",e=>{if(e.target===modal)closeModal()});

function search(value){
  const q=value.trim().toLowerCase();
  const cards=$$(".listing");
  let shown=0;
  cards.forEach(c=>{
    const ok=!q || c.dataset.title.toLowerCase().includes(q);
    c.style.display=ok?"":"none"; if(ok)shown++;
  });
  $("#noResults").classList.toggle("hidden",shown!==0);
  location.hash="anunturi";
}
$("#searchBtn").onclick=()=>search($("#searchInput").value);
$("#searchInput").addEventListener("keydown",e=>{if(e.key==="Enter")search(e.target.value)});
$$("[data-search]").forEach(b=>b.onclick=()=>{$("#searchInput").value=b.dataset.search;search(b.dataset.search)});

$$(".filter").forEach(btn=>btn.onclick=()=>{
  $$(".filter").forEach(x=>x.classList.remove("active")); btn.classList.add("active");
  const f=btn.dataset.filter; let shown=0;
  $$(".listing").forEach(c=>{const ok=f==="all"||c.dataset.type===f;c.style.display=ok?"":"none";if(ok)shown++});
  $("#noResults").classList.toggle("hidden",shown!==0);
});

$("#listingForm").onsubmit=e=>{
  e.preventDefault();
  const type=$("#type").value, title=$("#title").value, price=$("#price").value, desc=$("#description").value||"Anunț nou";
  const article=document.createElement("article"); article.className="listing"; article.dataset.type=type; article.dataset.title=title;
  article.innerHTML=`<div class="listing-photo">${type==="masina"?"🚗":"🔧"}</div><div class="listing-body"><span class="tag ${type==="masina"?"car":""}">${type==="masina"?"MAȘINĂ":"PIESĂ"}</span><h3>${title}</h3><p>${desc}</p><strong>${price}</strong></div>`;
  $("#listingGrid").prepend(article); closeModal(); e.target.reset(); location.hash="anunturi";
};