const data=[
 {name:"Far LED față",car:"Audi A4 B9",condition:"Nou",price:"1.450 lei",meta:"2016–2020 • cod OEM",icon:"💡"},
 {name:"Motor 2.0 TDI",car:"VW Passat B8",condition:"Second-hand",price:"8.900 lei",meta:"150 CP • verificat",icon:"⚙️"},
 {name:"Bară față",car:"BMW Seria 3 F30",condition:"Second-hand",price:"650 lei",meta:"2012–2015 • stare bună",icon:"🚗"},
 {name:"Cutie automată",car:"Mercedes C-Class",condition:"Second-hand",price:"5.500 lei",meta:"2015 • 7G-Tronic",icon:"🔩"},
 {name:"Alternator",car:"Dacia Logan",condition:"Nou",price:"720 lei",meta:"1.5 dCi • compatibil",icon:"🔋"},
 {name:"Scaun șofer",car:"Skoda Octavia III",condition:"Second-hand",price:"450 lei",meta:"2013–2019 • textil",icon:"💺"},
 {name:"Etrier frână",car:"Ford Focus",condition:"Nou",price:"380 lei",meta:"față • stânga",icon:"🛑"},
 {name:"Aripă dreapta",car:"Opel Astra K",condition:"Second-hand",price:"300 lei",meta:"2016–2021",icon:"🔧"}
];
let current="";
function render(q="",filter=current){
 const box=document.getElementById("listings"),empty=document.getElementById("empty");
 const s=q.toLowerCase();
 const items=data.filter(x=>(!filter||x.condition===filter)&&(!s||(x.name+" "+x.car+" "+x.meta).toLowerCase().includes(s)));
 box.innerHTML=items.map(x=>`<article class="card"><div class="pic">${x.icon}</div><div class="card-body"><span class="badge">${x.condition}</span><h3>${x.name}</h3><div class="meta">${x.car}</div><div class="meta">${x.meta}</div><div class="price">${x.price}</div><button class="contact" onclick="contact('${x.name}')">Contactează vânzătorul</button></div></article>`).join("");
 empty.hidden=items.length>0;
}
function contact(name){alert("În versiunea următoare conectăm fiecare anunț la telefon și WhatsApp. Piesa: "+name);}
function quickSearch(q){document.getElementById("search").value=q;document.getElementById("anunturi").scrollIntoView({behavior:"smooth"});render(q,current);}
function setFilter(f){current=f;document.querySelectorAll(".filter").forEach(b=>b.classList.remove("active"));event.currentTarget.classList.add("active");render(document.getElementById("search").value,f);}
document.getElementById("searchForm").addEventListener("submit",e=>{e.preventDefault();render(document.getElementById("search").value,document.getElementById("condition").value);document.getElementById("anunturi").scrollIntoView({behavior:"smooth"});});
function openPost(){document.getElementById("postModal").classList.add("show");}
function closePost(){document.getElementById("postModal").classList.remove("show");}
render();