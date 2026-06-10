// Deep Haven Editor v2
var DATA={items:{},recipes:[],facilities:{},locations:{},disasters:{},events:{pos:[],neg:[],rare:[]},effects:{},system:{}};
var currentTab="items",selectedKey=null;
var CATEGORIES=["物资","加工品","武器","防具","设施","消耗品","食物","药品","书籍","工具"];
var editPanel=document.getElementById("edit-panel");
var FILES=["items","recipes","facilities","locations","disasters","events","effects","system"];
var loaded=0;

FILES.forEach(function(f){
  fetch("config/"+f+".json").then(function(r){return r.json()}).then(function(d){
    DATA[f]=d;
    if(f==="items")Object.values(d).forEach(function(v){if(v.category&&CATEGORIES.indexOf(v.category)<0)CATEGORIES.push(v.category)});
    loaded++;if(loaded===FILES.length){renderAll();msg("✅ 加载完成 ("+Object.keys(DATA.items).length+"物品, "+DATA.recipes.length+"配方)")}
  }).catch(function(e){loaded++;if(loaded===FILES.length)renderAll()});
});

function msg(m){var el=document.getElementById("status-msg");el.textContent=m;clearTimeout(el._t);el._t=setTimeout(function(){el.textContent="✅ 就绪"},4000)}

document.querySelectorAll(".tab").forEach(function(t){
  t.onclick=function(){
    document.querySelectorAll(".tab").forEach(function(x){x.classList.remove("active")});
    this.classList.add("active");currentTab=this.dataset.tab;selectedKey=null;renderAll();
  };
});

function renderAll(){renderList();renderEdit()}
function h(s){return String(s||"").replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;")}
function q(s){return String(s||"").replace(/'/g,"\\'")}

function itemOpts(id,t){var o=t?"<option value=\'\'>"+t+"</option>":"";Object.entries(DATA.items).forEach(function(e){o+="<option value=\'"+e[0]+"\'"+(e[0]===id?" selected":"")+">"+e[1].name+" ("+e[0]+")</option>"});return o}
function effOpts(id){var o="<option value=\'\'>— 选择 —</option>";Object.entries(DATA.effects).forEach(function(e){o+="<option value=\'"+e[0]+"\'"+(e[0]===id?" selected":"")+">"+e[1].name+" ("+e[0]+")</option>"});return o}
function toggleCat(el){var it=el.nextElementSibling;if(it)it.style.display=it.style.display==="none"?"":"none"}
function rmKv(el){el.closest(".kv-row").remove()}

function toggleList(){
  var list=document.getElementById("list-panel"),btn=document.getElementById("collapse-btn");
  list.classList.toggle("collapsed");btn.classList.toggle("collapsed");
  btn.textContent=list.classList.contains("collapsed")?"▶":"◀";
}

function renderList(){
  var h2="",d=DATA[currentTab];
  if(currentTab==="items"){
    var cats={};CATEGORIES.forEach(function(c){cats[c]=[]});
    Object.entries(d).forEach(function(e){var cat=e[1].category||"物资";if(!cats[cat])cats[cat]=[];cats[cat].push(e[0])});
    h2+="<div style=\"padding:4px 0;font-size:10px;margin-bottom:4px\"><button class=\"btn-sm green\" onclick=\"addItem()\">＋ 新建物品</button></div>";
    Object.entries(cats).forEach(function(ce){if(!ce[1].length)return;
      h2+="<div class=\"cat-header\" onclick=\"toggleCat(this)\"><span class=\"ct-name\">▾ 📁 "+ce[0]+" ("+ce[1].length+")</span></div><div class=\"cat-items\">";
      ce[1].forEach(function(k){var it=d[k];h2+="<div class=\"list-item"+(selectedKey===k?" sel":"")+"\" onclick=\"sel(\'"+q(k)+"\')\"><span class=\"li-name\">"+(it.name||k)+"</span><span class=\"li-meta\">"+(it.stats?"⚡":"")+"</span></div>"});
      h2+="<div style=\"padding:2px 8px;font-size:10px\"><button class=\"btn-sm\" onclick=\"addItemToCat(\'"+q(ce[0])+"\')\">＋ 物品</button></div></div>";
    });
  }
  else if(currentTab==="recipes"){
    h2+="<div style=\"padding:4px 0;font-size:10px;margin-bottom:4px\"><button class=\"btn-sm green\" onclick=\"addRecipe()\">＋ 新建配方</button></div>";
    d.forEach(function(r,i){var out=r.output?"> "+h(DATA.items[r.output]?.name||r.output):"";h2+="<div class=\"list-item"+(selectedKey===i?" sel":"")+"\" onclick=\"sel("+i+")\"><span class=\"li-name\">"+(r.name||r.id)+"</span><span class=\"li-meta\">"+out+"</span></div>"});
  }
  else if(currentTab==="facilities"){
    h2+="<div style=\"padding:4px 0;font-size:10px;margin-bottom:4px\"><button class=\"btn-sm green\" onclick=\"addFacility()\">＋ 新建设施</button></div>";
    Object.entries(d).forEach(function(e){h2+="<div class=\"list-item"+(selectedKey===e[0]?" sel":"")+"\" onclick=\"sel(\'"+q(e[0])+"\')\"><span class=\"li-name\">"+e[1].name+"</span><span class=\"li-meta\">"+e[1].lvs.length+"级</span></div>"});
  }
  else if(currentTab==="locations"){
    h2+="<div style=\"padding:4px 0;font-size:10px;margin-bottom:4px\"><button class=\"btn-sm green\" onclick=\"addLocation()\">＋ 新建地点</button></div>";
    d.forEach(function(l,i){h2+="<div class=\"list-item"+(selectedKey===i?" sel":"")+"\" onclick=\"sel("+i+")\"><span class=\"li-name\">"+l.name+"</span><span class=\"li-meta\">"+"★".repeat(l.danger||1)+"</span></div>"});
  }
  else if(currentTab==="disasters"){
    for(var m=1;m<=12;m++){var ds=d[String(m)]||{};h2+="<div class=\"list-item"+(selectedKey===m?" sel":"")+"\" onclick=\"sel("+m+")\"><span class=\"li-name\">"+m+"月 "+(ds.name||"未定义")+"</span></div>"};
  }
  else if(currentTab==="events"){
    ["pos","neg","rare"].forEach(function(t){var arr=d[t]||[],icon=t==="pos"?"✅":t==="neg"?"⚠️":"💎";
      h2+="<div class=\"cat-header\"><span class=\"ct-name\">"+icon+" "+(t==="pos"?"正面":t==="neg"?"负面":"稀有")+" ("+arr.length+")</span><button class=\"btn-sm green\" onclick=\"addEvent(\'"+t+"\')\">＋</button></div><div class=\"cat-items\">";
      arr.forEach(function(ev,i){h2+="<div class=\"list-item"+(selectedKey===t+":"+i?" sel":"")+"\" onclick=\"sel(\'"+t+":"+i+"\')\"><span class=\"li-name\" style=\"font-size:10px\">"+(ev.text||"").substring(0,32)+"...</span></div>"});
      h2+="</div>";
    });
  }
  else if(currentTab==="effects"){
    h2+="<div style=\"padding:4px 0;font-size:10px;margin-bottom:4px\"><button class=\"btn-sm green\" onclick=\"addEffect()\">＋ 新建效果</button></div>";
    Object.entries(d).forEach(function(e){h2+="<div class=\"list-item"+(selectedKey===e[0]?" sel":"")+"\" onclick=\"sel(\'"+q(e[0])+"\')\"><span class=\"li-name\">"+e[1].name+"</span><span class=\"li-meta\">"+e[0]+"</span></div>"});
  }
  else if(currentTab==="system"){
    Object.entries(d).forEach(function(e){h2+="<div class=\"list-item"+(selectedKey===e[0]?" sel":"")+"\" onclick=\"sel(\'"+q(e[0])+"\')\"><span class=\"li-name\">"+e[1].name+"</span><span class=\"li-meta\">Lv."+(e[1].current||1)+"/"+e[1].levels.length+"</span></div>"});
  }
  document.getElementById("list-panel").innerHTML=h2||"<div class=\"empty-hint\" style=\"font-size:12px;padding:20px\">无数据</div>";
}

function sel(k){selectedKey=k;renderAll()}

function renderEdit(){
  if(selectedKey===null){editPanel.innerHTML="<div class=\"empty-hint\">← 选择条目编辑</div>";return}
  if(currentTab==="items")R_items();
  else if(currentTab==="recipes")R_recipes();
  else if(currentTab==="facilities")R_facilities();
  else if(currentTab==="locations")R_locations();
  else if(currentTab==="disasters")R_disasters();
  else if(currentTab==="events")R_events();
  else if(currentTab==="effects")R_effects();
  else if(currentTab==="system")R_system();
}

function addItem(){selectedKey="__new__";renderAll()}
function addItemToCat(c){selectedKey="__new__:"+c;renderAll()}

function R_items(){
  var k=selectedKey,isNew=(k==="__new__"||String(k).startsWith("__new__"));
  var it=isNew?{name:"",category:isNew?String(k).split(":")[1]||"物资":"物资",size:1,stack:999}:DATA.items[k]||{};
  var stats=it.stats||{};
  var h2="<h3 style=\"color:var(--accent);margin-bottom:12px\">"+(isNew?"📦 新建物品":"📦 编辑: "+h(k))+"</h3>";
  h2+="<div class=\"field-row\"><div class=\"field\"><label>ID</label><input id=\"f-id\" value=\""+(isNew?"":h(k))+"\""+(isNew?"":" readonly")+"></div>";
  h2+="<div class=\"field wide\"><label>名称</label><input id=\"f-name\" value=\""+h(it.name||"")+"\"></div></div>";
  h2+="<div class=\"field-row\"><div class=\"field wide\"><label>分类</label><select id=\"f-cat\">"+CATEGORIES.map(function(c){return"<option value=\""+c+"\""+(c===it.category?" selected":"")+">"+c+"</option>"}).join("")+"</select></div>";
  h2+="<div class=\"field\"><label>体积 (升)</label><input id=\"f-size\" type=\"number\" value=\""+(it.size||1)+"\" min=\"0\"></div><div class=\"field\"><label>堆叠上限</label><input id=\"f-stack\" type=\"number\" value=\""+(it.stack||999)+"\" min=\"1\"></div></div>";
  h2+="<div class=\"section-title\">⚡ 属性 (有=成品, 无=纯物资)</div><div id=\"stats-area\">";
  Object.entries(stats).forEach(function(se){h2+=kvEff(se[0],se[1])});
  h2+="</div><button class=\"btn-sm green\" onclick=\"addStat()\" style=\"margin-top:4px\">＋ 添加属性</button>";
  var relR=DATA.recipes.filter(function(r){return r.output===k||Object.keys(r.inputs||{}).indexOf(k)>=0});
  if(relR.length){h2+="<div class=\"section-title\">🔗 关联配方 ("+relR.length+")</div>";relR.forEach(function(r){h2+="<div style=\"font-size:11px;color:var(--dim);padding:2px 0\">🔨 "+h(r.name||r.id)+"</div>"})}
  h2+="<div style=\"margin-top:16px;display:flex;gap:8px\">";
  h2+="<button class=\"btn save\" onclick=\"S_items(\'"+q(k)+"\')\">💾 保存</button>";
  if(!isNew)h2+="<button class=\"btn danger\" onclick=\"D_items(\'"+q(k)+"\')\">🗑 删除</button>";
  h2+="<button class=\"btn\" onclick=\"goRecipe(\'"+q(k)+"\')\">🔨 创建配方</button></div>";
  editPanel.innerHTML=h2;
}

function kvEff(key,val){return"<div class=\"kv-row\"><select class=\"stat-key\">"+effOpts(key)+"</select><input type=\"number\" class=\"stat-val\" value=\""+(val||0)+"\" step=\"any\"><span class=\"kv-remove\" onclick=\"rmKv(this)\">✕</span></div>"}
function addStat(){document.getElementById("stats-area").insertAdjacentHTML("beforeend",kvEff("",0))}

function S_items(oldKey){
  var id=document.getElementById("f-id").value.trim(),nm=document.getElementById("f-name").value.trim();
  if(!id){msg("❌ ID不能为空");return}
  var stats={},sks=document.querySelectorAll(".stat-key"),svs=document.querySelectorAll(".stat-val");
  for(var i=0;i<sks.length;i++){if(sks[i].value)stats[sks[i].value]=parseFloat(svs[i].value)||0}
  var item={name:nm||id,category:document.getElementById("f-cat").value,size:parseInt(document.getElementById("f-size").value)||1,stack:parseInt(document.getElementById("f-stack").value)||999};
  if(Object.keys(stats).length)item.stats=stats;
  if(oldKey!==id){delete DATA.items[oldKey]}DATA.items[id]=item;
  if(CATEGORIES.indexOf(item.category)<0)CATEGORIES.push(item.category);
  selectedKey=id;renderAll();msg("✅ 已保存: "+id);
}
function D_items(k){if(confirm("确定删除物品 \""+k+"\"？")){delete DATA.items[k];selectedKey=null;renderAll();msg("🗑 已删除")}}
function goRecipe(k){var rid=DATA.recipes.length;DATA.recipes.push({id:"recipe_"+rid,name:DATA.items[k]?.name+"配方",inputs:{},output:k,station:"workbench",level:1});document.querySelectorAll(".tab").forEach(function(t){t.classList.remove("active")});document.querySelector(".tab[data-tab=\"recipes\"]").classList.add("active");currentTab="recipes";selectedKey=rid;renderAll();msg("🔨 已创建配方")}

function addRecipe(){selectedKey=DATA.recipes.length;renderAll()}
function R_recipes(){
  var i=selectedKey,isNew=(i>=DATA.recipes.length);
  var r=isNew?{id:"",name:"",inputs:{},output:"",station:"workbench",level:1}:DATA.recipes[i]||{};
  var h2="<h3 style=\"color:var(--accent);margin-bottom:12px\">"+(isNew?"🔨 新建配方":"🔨 编辑: "+h(r.name||r.id))+"</h3>";
  h2+="<div class=\"field-row\"><div class=\"field\"><label>ID</label><input id=\"f-id\" value=\""+h(r.id||"")+"\"></div><div class=\"field wide\"><label>名称</label><input id=\"f-name\" value=\""+h(r.name||"")+"\"></div></div>";
  h2+="<div class=\"field-row\"><div class=\"field wide\"><label>工坊</label><select id=\"f-station\"><option value=\"workbench\""+(r.station==="workbench"?" selected":"")+">workbench</option><option value=\"furnace\""+(r.station==="furnace"?" selected":"")+">furnace</option></select></div><div class=\"field\"><label>工坊等级</label><input id=\"f-level\" type=\"number\" value=\""+(r.level||1)+"\" min=\"1\"></div></div>";
  h2+="<div class=\"section-title\">📥 输入材料</div><div id=\"inp-area\">";
  Object.entries(r.inputs||{}).forEach(function(ie){h2+=kvInp(ie[0],ie[1])});
  h2+="</div><div class=\"kv-row\"><select class=\"inp-key\">"+itemOpts("","— 添加材料 —")+"</select><input type=\"number\" class=\"inp-val\" value=\"1\" min=\"1\" onchange=\"addInpAuto(this)\"><span class=\"kv-remove\" onclick=\"rmKv(this)\">✕</span></div>";
  h2+="<div class=\"section-title\">📤 产出</div><div class=\"field\"><label>产出物品</label><select id=\"f-output\">"+itemOpts(r.output||"","— 选择 —")+"</select></div>";
  h2+="<div style=\"margin-top:16px;display:flex;gap:8px\"><button class=\"btn save\" onclick=\"S_recipes("+i+")\">💾 保存</button>";
  if(!isNew)h2+="<button class=\"btn danger\" onclick=\"D_recipes("+i+")\">🗑 删除</button>";
  h2+="</div>";editPanel.innerHTML=h2;
}

function kvInp(key,val){return"<div class=\"kv-row\"><select class=\"inp-key\">"+itemOpts(key,"— 选择 —")+"</select><input type=\"number\" class=\"inp-val\" value=\""+(val||1)+"\" min=\"1\"><span class=\"kv-remove\" onclick=\"rmKv(this)\">✕</span></div>"}
function addInpAuto(el){if(el.value&&el.value!==""){el.closest(".kv-row").insertAdjacentHTML("beforebegin",kvInp("",""))}}
function S_recipes(i){
  var inp={},iks=document.querySelectorAll(".inp-key"),ivs=document.querySelectorAll(".inp-val");
  for(var j=0;j<iks.length;j++){if(iks[j].value)inp[iks[j].value]=(parseInt(ivs[j].value)||1)}
  var r={id:document.getElementById("f-id").value.trim(),name:document.getElementById("f-name").value.trim(),station:document.getElementById("f-station").value,level:parseInt(document.getElementById("f-level").value)||1,output:document.getElementById("f-output").value,inputs:inp};
  if(!r.id){msg("❌ ID不能为空");return}
  if(i>=DATA.recipes.length)DATA.recipes.push(r);else DATA.recipes[i]=r;
  selectedKey=i;renderAll();msg("✅ 配方已保存");
}
function D_recipes(i){if(confirm("确定删除？")){DATA.recipes.splice(i,1);selectedKey=null;renderAll();msg("🗑 已删除")}}

function addFacility(){var n="new_fac_"+Date.now();DATA.facilities[n]={name:"新设施",lvs:[],sp:[],cost:{},effects:{}};selectedKey=n;renderAll()}
function R_facilities(){
  var fid=selectedKey,f=DATA.facilities[fid]||{};
  var h2="<h3 style=\"color:var(--accent);margin-bottom:12px\">🏗️ 编辑设施: "+h(fid)+"</h3>";
  h2+="<div class=\"field\"><label>名称</label><input id=\"f-name\" value=\""+h(f.name||"")+"\"></div>";
  h2+="<div class=\"section-title\">📊 等级配置</div><div id=\"lv-area\">";
  for(var li=0;li<(f.lvs?.length||0);li++){h2+=lvBlock(fid,li,f)}
  h2+="</div><button class=\"btn-sm green\" onclick=\"addLv()\" style=\"margin-top:4px\">＋ 添加等级</button>";
  h2+="<div style=\"margin-top:16px;display:flex;gap:8px\"><button class=\"btn save\" onclick=\"S_facilities(\'"+q(fid)+"\')\">💾 保存</button><button class=\"btn danger\" onclick=\"D_facilities(\'"+q(fid)+"\')\">🗑 删除</button></div>";
  editPanel.innerHTML=h2;
}

function lvBlock(fid,li,f){
  var lv=li+1,h2="<div class=\"lv-block\"><div class=\"lv-title\">Lv."+lv+"</div>";
  h2+="<div class=\"field\"><label>等级名</label><input class=\"lv-name\" value=\""+h(f.lvs[li]||"")+"\"></div>";
  h2+="<div class=\"field\"><label>SP花费</label><input type=\"number\" class=\"lv-sp\" value=\""+(f.sp?.[li]||0)+"\"></div>";
  h2+="<div style=\"font-size:11px;color:var(--dim);margin:4px 0\">建造成本:</div>";
  Object.entries(f.cost||{}).forEach(function(ce){h2+="<div class=\"kv-row\"><select class=\"lv-"+li+"-ck\">"+itemOpts(ce[0])+"</select><input type=\"number\" class=\"lv-"+li+"-cv\" value=\""+(ce[1]?.[li]||0)+"\" min=\"0\"><span class=\"kv-remove\" onclick=\"rmKv(this)\">✕</span></div>"});
  h2+="<div class=\"kv-row\"><select class=\"lv-"+li+"-ck\">"+itemOpts("","— 添加 —")+"</select><input type=\"number\" class=\"lv-"+li+"-cv\" value=\"0\" min=\"0\"><span class=\"kv-remove\" onclick=\"rmKv(this)\">✕</span></div>";
  h2+="<div style=\"font-size:11px;color:var(--dim);margin:4px 0\">效果:</div>";
  Object.entries(f.effects||{}).forEach(function(ee){h2+="<div class=\"kv-row\"><select class=\"lv-"+li+"-ek\">"+effOpts(ee[0])+"</select><input type=\"number\" class=\"lv-"+li+"-ev\" value=\""+(ee[1]?.[li]||0)+"\" step=\"any\"><span class=\"kv-remove\" onclick=\"rmKv(this)\">✕</span></div>"});
  h2+="<div class=\"kv-row\"><select class=\"lv-"+li+"-ek\">"+effOpts("")+"</select><input type=\"number\" class=\"lv-"+li+"-ev\" value=\"0\" step=\"any\"><span class=\"kv-remove\" onclick=\"rmKv(this)\">✕</span></div></div>";
  return h2;
}

function addLv(){var f=DATA.facilities[selectedKey];if(!f.lvs)f.lvs=[];if(!f.sp)f.sp=[];f.lvs.push("");f.sp.push(0);renderEdit()}
function S_facilities(fid){
  var f=DATA.facilities[fid];f.name=document.getElementById("f-name").value.trim();
  var nms=document.querySelectorAll(".lv-name"),sps=document.querySelectorAll(".lv-sp");
  f.lvs=[];f.sp=[];nms.forEach(function(e){f.lvs.push(e.value)});sps.forEach(function(e){f.sp.push(parseInt(e.value)||0)});
  f.cost={};f.effects={};
  for(var li=0;li<f.lvs.length;li++){
    var cks=document.querySelectorAll(".lv-"+li+"-ck"),cvs=document.querySelectorAll(".lv-"+li+"-cv");
    for(var ci=0;ci<cks.length;ci++){if(!cks[ci].value)continue;if(!f.cost[cks[ci].value])f.cost[cks[ci].value]=Array(f.lvs.length).fill(0);f.cost[cks[ci].value][li]=parseInt(cvs[ci].value)||0}
    var eks=document.querySelectorAll(".lv-"+li+"-ek"),evs=document.querySelectorAll(".lv-"+li+"-ev");
    for(var ei=0;ei<eks.length;ei++){if(!eks[ei].value)continue;if(!f.effects[eks[ei].value])f.effects[eks[ei].value]=Array(f.lvs.length).fill(0);f.effects[eks[ei].value][li]=parseFloat(evs[ei].value)||0}
  }
  msg("✅ 设施已保存");
}
function D_facilities(fid){if(confirm("确定删除？")){delete DATA.facilities[fid];selectedKey=null;renderAll();msg("🗑 已删除")}}

function addLocation(){DATA.locations.push({id:"",name:"",danger:1,loot:[],event_rate:0.25});selectedKey=DATA.locations.length-1;renderAll()}
function R_locations(){
  var i=selectedKey,l=DATA.locations[i]||{};
  var h2="<h3 style=\"color:var(--accent);margin-bottom:12px\">🗺️ 编辑地点</h3>";
  h2+="<div class=\"field-row\"><div class=\"field\"><label>ID</label><input id=\"f-id\" value=\""+h(l.id||"")+"\"></div><div class=\"field wide\"><label>名称</label><input id=\"f-name\" value=\""+h(l.name||"")+"\"></div></div>";
  h2+="<div class=\"field-row\"><div class=\"field wide\"><label>危险度 (1-5)</label><input id=\"f-danger\" type=\"number\" value=\""+(l.danger||1)+"\" min=\"1\" max=\"5\"></div><div class=\"field\"><label>事件概率</label><input id=\"f-rate\" type=\"number\" value=\""+(l.event_rate||0.25)+"\" min=\"0\" max=\"1\" step=\"0.01\"></div></div>";
  h2+="<div class=\"field\"><label>特产描述</label><input id=\"f-special\" value=\""+h(l.special||"")+"\"></div>";
  h2+="<div class=\"section-title\">📦 掉落表</div><div id=\"lt-area\">";
  (l.loot||[]).forEach(function(lt){h2+=kvLoot(lt.item,lt.min,lt.max)});
  h2+="</div><div class=\"kv-row\"><select class=\"lt-item\" onchange=\"addLtAuto(this)\">"+itemOpts("","— 添加掉落 —")+"</select><input type=\"number\" class=\"lt-min\" value=\"1\" min=\"0\"><input type=\"number\" class=\"lt-max\" value=\"3\" min=\"0\"><span class=\"kv-remove\" onclick=\"rmKv(this)\">✕</span></div>";
  h2+="<div style=\"margin-top:16px;display:flex;gap:8px\"><button class=\"btn save\" onclick=\"S_locations("+i+")\">💾 保存</button><button class=\"btn danger\" onclick=\"D_locations("+i+")\">🗑 删除</button></div>";
  editPanel.innerHTML=h2;
}
function kvLoot(item,min,max){return"<div class=\"kv-row\"><select class=\"lt-item\">"+itemOpts(item,"— 选择 —")+"</select><input type=\"number\" class=\"lt-min\" value=\""+(min||0)+"\" min=\"0\"><input type=\"number\" class=\"lt-max\" value=\""+(max||0)+"\" min=\"0\"><span class=\"kv-remove\" onclick=\"rmKv(this)\">✕</span></div>"}
function addLtAuto(el){if(el.value&&el.value!==""){el.closest(".kv-row").insertAdjacentHTML("beforebegin",kvLoot("","1","3"))}}
function S_locations(i){
  var loot=[],its=document.querySelectorAll(".lt-item"),mis=document.querySelectorAll(".lt-min"),mas=document.querySelectorAll(".lt-max");
  for(var j=0;j<its.length;j++){if(its[j].value)loot.push({item:its[j].value,min:parseInt(mis[j].value)||0,max:parseInt(mas[j].value)||0})}
  DATA.locations[i]={id:document.getElementById("f-id").value.trim(),name:document.getElementById("f-name").value.trim(),danger:parseInt(document.getElementById("f-danger").value)||1,event_rate:parseFloat(document.getElementById("f-rate").value)||0.25,special:document.getElementById("f-special").value.trim()||null,loot:loot};
  renderAll();msg("✅ 地点已保存");
}
function D_locations(i){if(confirm("确定删除？")){DATA.locations.splice(i,1);selectedKey=null;renderAll();msg("🗑 已删除")}}

function R_disasters(){
  var m=selectedKey,d=DATA.disasters[String(m)]||{name:"",penalty:"",bonus:""};
  var h2="<h3 style=\"color:var(--accent);margin-bottom:12px\">🌪️ "+m+"月天灾</h3>";
  h2+="<div class=\"field\"><label>名称</label><input id=\"f-name\" value=\""+h(d.name||"")+"\"></div><div class=\"field\"><label>惩罚</label><input id=\"f-penalty\" value=\""+h(d.penalty||"")+"\"></div><div class=\"field\"><label>奖励</label><input id=\"f-bonus\" value=\""+h(d.bonus||"")+"\"></div>";
  h2+="<div style=\"margin-top:16px\"><button class=\"btn save\" onclick=\"S_disasters("+m+")\">💾 保存</button></div>";
  editPanel.innerHTML=h2;
}
function S_disasters(m){DATA.disasters[String(m)]={name:document.getElementById("f-name").value.trim(),penalty:document.getElementById("f-penalty").value.trim(),bonus:document.getElementById("f-bonus").value.trim()};msg("✅ 天灾已保存")}

function addEvent(type){var arr=DATA.events[type]||[];arr.push({text:"新事件",r:{}});selectedKey=type+":"+(arr.length-1);renderAll()}
function R_events(){
  var parts=String(selectedKey).split(":"),type=parts[0],i=parseInt(parts[1]);
  var ev=(DATA.events[type]||[])[i]||{text:"",r:{}};
  var h2="<h3 style=\"color:var(--accent);margin-bottom:12px\">"+(type==="pos"?"✅":type==="neg"?"⚠️":"💎")+" 编辑事件</h3>";
  h2+="<div class=\"field\"><label>文本</label><textarea id=\"f-text\">"+h(ev.text||"")+"</textarea></div>";
  h2+="<div class=\"section-title\">📊 效果 (sp/health/food/water/物品ID...)</div><div id=\"r-area\">";
  Object.entries(ev.r||{}).forEach(function(re){h2+=kvReward(re[0],re[1])});
  h2+="</div><div class=\"kv-row\"><input class=\"r-key\" placeholder=\"key\"><input type=\"number\" class=\"r-val\" value=\"0\" step=\"any\" onchange=\"addRewAuto(this)\"><span class=\"kv-remove\" onclick=\"rmKv(this)\">✕</span></div>";
  if(type==="rare")h2+="<div class=\"field\"><label>附注</label><textarea id=\"f-note\">"+h(ev.note||"")+"</textarea></div>";
  h2+="<div style=\"margin-top:16px;display:flex;gap:8px\"><button class=\"btn save\" onclick=\"S_events(\'"+type+"\',"+i+")\">💾 保存</button><button class=\"btn danger\" onclick=\"D_events(\'"+type+"\',"+i+")\">🗑 删除</button></div>";
  editPanel.innerHTML=h2;
}
function kvReward(key,val){return"<div class=\"kv-row\"><input class=\"r-key\" value=\""+key+"\" placeholder=\"key\"><input type=\"number\" class=\"r-val\" value=\""+(val||0)+"\" step=\"any\"><span class=\"kv-remove\" onclick=\"rmKv(this)\">✕</span></div>"}
function addRewAuto(el){if(el.value&&el.value!==""){el.closest(".kv-row").insertAdjacentHTML("beforebegin",kvReward("",""))}}
function S_events(type,i){
  var r={},rks=document.querySelectorAll(".r-key"),rvs=document.querySelectorAll(".r-val");
  for(var j=0;j<rks.length;j++){if(rks[j].value)r[rks[j].value]=parseFloat(rvs[j].value)||0}
  var ev={text:document.getElementById("f-text").value.trim(),r:r};
  var noteEl=document.getElementById("f-note");if(noteEl)ev.note=noteEl.value.trim();
  if(i>=DATA.events[type].length)DATA.events[type].push(ev);else DATA.events[type][i]=ev;
  selectedKey=type+":"+i;renderAll();msg("✅ 事件已保存");
}
function D_events(type,i){if(confirm("确定删除？")){DATA.events[type].splice(i,1);selectedKey=null;renderAll();msg("🗑 已删除")}}

function addEffect(){var n="new_effect_"+Date.now();DATA.effects[n]={name:"新效果",desc:""};selectedKey=n;renderAll()}
function R_effects(){
  var eid=selectedKey,ef=DATA.effects[eid]||{};
  var h2="<h3 style=\"color:var(--accent);margin-bottom:12px\">⚡ 编辑效果</h3>";
  h2+="<div class=\"field\"><label>ID</label><input id=\"f-id\" value=\""+h(eid)+"\" readonly></div>";
  h2+="<div class=\"field\"><label>名称</label><input id=\"f-name\" value=\""+h(ef.name||"")+"\"></div>";
  h2+="<div class=\"field\"><label>描述</label><input id=\"f-desc\" value=\""+h(ef.desc||"")+"\"></div>";
  h2+="<div style=\"margin-top:16px;display:flex;gap:8px\"><button class=\"btn save\" onclick=\"S_effects(\'"+q(eid)+"\')\">💾 保存</button><button class=\"btn danger\" onclick=\"D_effects(\'"+q(eid)+"\')\">🗑 删除</button></div>";
  editPanel.innerHTML=h2;
}
function S_effects(eid){DATA.effects[eid]={name:document.getElementById("f-name").value.trim(),desc:document.getElementById("f-desc").value.trim()};renderAll();msg("✅ 效果已保存")}
function D_effects(eid){if(confirm("确定删除？")){delete DATA.effects[eid];selectedKey=null;renderAll();msg("🗑 已删除")}}

function R_system(){
  var sid=selectedKey,sys=DATA.system[sid]||{};
  var h2="<h3 style=\"color:var(--accent);margin-bottom:12px\">⚙️ "+h(sys.name||sid)+"</h3>";
  h2+="<div class=\"field\"><label>名称</label><input id=\"f-name\" value=\""+h(sys.name||"")+"\"></div>";
  h2+="<div class=\"field\"><label>描述</label><input id=\"f-desc\" value=\""+h(sys.desc||"")+"\"></div>";
  h2+="<div class=\"section-title\">📊 等级配置</div>";
  (sys.levels||[]).forEach(function(lv,li){
    var attrs=[];Object.entries(lv).forEach(function(ve){if(ve[0]!=="level"&&ve[0]!=="cost")attrs.push(ve)});
    h2+="<div class=\"lv-block\"><div class=\"lv-title\">Lv."+lv.level+"</div>";
    h2+="<div class=\"field-row\">";
    attrs.forEach(function(a){h2+="<div class=\"field\"><label>"+a[0]+"</label><input class=\"lv-"+li+"-a\" data-key=\""+a[0]+"\" type=\"number\" value=\""+(a[1]||0)+"\" step=\"any\"></div>"});
    h2+="</div>";
    h2+="<div style=\"font-size:10px;color:var(--dim);margin:4px 0\">升级消耗:</div>";
    Object.entries(lv.cost||{}).forEach(function(ce){h2+="<div class=\"kv-row\"><select class=\"lv-"+li+"-ck\">"+itemOpts(ce[0])+"</select><input type=\"number\" class=\"lv-"+li+"-cv\" value=\""+ce[1]+"\" min=\"0\"><span class=\"kv-remove\" onclick=\"rmKv(this)\">✕</span></div>"});
    h2+="<div class=\"kv-row\"><select class=\"lv-"+li+"-ck\">"+itemOpts("","— 添加 —")+"</select><input type=\"number\" class=\"lv-"+li+"-cv\" value=\"0\" min=\"0\"><span class=\"kv-remove\" onclick=\"rmKv(this)\">✕</span></div></div>";
  });
  h2+="<div style=\"margin-top:16px\"><button class=\"btn save\" onclick=\"S_system(\'"+q(sid)+"\')\">💾 保存</button></div>";
  editPanel.innerHTML=h2;
}
function S_system(sid){
  var sys=DATA.system[sid];
  sys.name=document.getElementById("f-name").value.trim();sys.desc=document.getElementById("f-desc").value.trim();
  for(var li=0;li<sys.levels.length;li++){
    var lv=sys.levels[li];
    document.querySelectorAll(".lv-"+li+"-a").forEach(function(el){lv[el.dataset.key]=parseFloat(el.value)||0});
    lv.cost={};var cks=document.querySelectorAll(".lv-"+li+"-ck"),cvs=document.querySelectorAll(".lv-"+li+"-cv");
    for(var ci=0;ci<cks.length;ci++){if(cks[ci].value)lv.cost[cks[ci].value]=parseInt(cvs[ci].value)||0}
  }
  msg("✅ 系统已保存");
}

function saveAll(){
  var count=0,errs=[];
  msg("💾 正在保存...");
  FILES.forEach(function(f){
    fetch("/api/save",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({file:f+".json",content:JSON.stringify(DATA[f],null,2)})})
      .then(function(r){return r.json()}).then(function(d){if(d.ok)count++;else errs.push(f+": "+d.error);if(count+errs.length===FILES.length)finish()})
      .catch(function(e){errs.push(f+": "+e.message);if(count+errs.length===FILES.length)finish()});
  });
  function finish(){if(errs.length)msg("❌ "+errs.length+"失败: "+errs.join("; "));else msg("✅ 已保存 "+count+" 个文件")}
}
function exportAll(){
  FILES.forEach(function(f){
    var b=new Blob([JSON.stringify(DATA[f],null,2)],{type:"application/json"});
    var a=document.createElement("a");a.href=URL.createObjectURL(b);a.download=f+".json";a.click();
    setTimeout(function(){URL.revokeObjectURL(a.href)},1000);
  });
  msg("📥 导出完成");
}
