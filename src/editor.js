// Deep Haven Editor v2
var DATA={items:{},recipes:[],facilities:{},locations:{},disasters:{},events:{pos:[],neg:[],rare:[]},effects:{},system:{}};
var currentTab="items",selectedKey=null;
var CATEGORIES=["物资","加工品","武器","防具","设施","消耗品","食物","药品","书籍","工具"];
var editPanel=document.getElementById("edit-panel");
var FILES=["items","recipes","facilities","locations","disasters","events","system"];
var loaded=0;

FILES.forEach(function(f){
  fetch("config/"+f+".json?t="+Date.now(),{cache:"no-cache"}).then(function(r){return r.json()}).then(function(d){
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

// ==================== 双下拉选物品 ====================
function getCatList(){var cats=[];CATEGORIES.forEach(function(c){var p=c.split("/")[0];if(cats.indexOf(p)<0)cats.push(p)});return cats;}
function getItemsByCat(cat){
  var list=[];
  Object.entries(DATA.items).forEach(function(e){
    var c=e[1].category||"物资";
    if(c===cat||c.startsWith(cat+"/"))list.push(e[0]);
  });
  return list;
}
function catItemHTML(selKey,prefix,extraOpts){
  var cats=getCatList();
  var selCat="";
  if(selKey&&DATA.items[selKey])selCat=(DATA.items[selKey].category||"物资").split("/")[0];
  var h="<select class=\""+prefix+"-cat\" onchange=\"updateCatSel(this)\" style=\"flex:1;min-width:70px\">";
  if(extraOpts)h+=extraOpts;
  cats.forEach(function(c){h+="<option value=\""+c+"\""+(c===selCat?" selected":"")+">📁 "+c+"</option>"});
  h+="</select>";
  h+="<select class=\""+prefix+"-item\" style=\"flex:1.5;min-width:80px\">";
  var items=getItemsByCat(selCat||cats[0]||"物资");
  items.forEach(function(k){h+="<option value=\""+k+"\""+(k===selKey?" selected":"")+">"+DATA.items[k].name+"</option>"});
  h+="</select>";
  return h;
}
function updateCatSel(catSel){
  var prefix=catSel.className.replace("-cat","");
  var itemSel=catSel.parentElement.querySelector("."+prefix+"-item");
  if(!itemSel)return;
  var items=getItemsByCat(catSel.value);
  itemSel.innerHTML="";
  items.forEach(function(k){itemSel.innerHTML+="<option value=\""+k+"\">"+DATA.items[k].name+"</option>"});
}
// Get value from dual dropdown (second select)
function catItemVal(prefix,container){
  var c=container||document;
  var sel=c.querySelector("."+prefix+"-item");
  return sel?sel.value:"";
}
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
    // Build a real tree from categories (using / as separator)
    var tree={}; // {name: {_items:[], _sub:{}}}
    function ensure(catPath,itemKey){
      if(!catPath)catPath="物资";
      var parts=catPath.split("/"),node=tree;
      for(var p=0;p<parts.length;p++){
        var part=parts[p].trim();if(!part)continue;
        if(!node[part])node[part]={_items:[],_sub:{}};
        if(p===parts.length-1&&itemKey)node[part]._items.push(itemKey);
        node=node[part]._sub;
      }
    }
    Object.entries(d).forEach(function(e){ensure(e[1].category||"物资",e[0])});
    CATEGORIES.forEach(function(c){ensure(c,null)});

    h2+="<div style=\"padding:4px 0;font-size:10px;margin-bottom:4px\"><button class=\"btn-sm green\" onclick=\"addItem()\">＋ 新建物品</button> <button class=\"btn-sm\" onclick=\"addCategory()\">＋ 新建分类</button></div>";

    function renderTree(node,depth,parentPath){
      var h3="";parentPath=parentPath||"";
      Object.keys(node).sort().forEach(function(k){
        var n=node[k],cnt=n._items.length,hasKids=Object.keys(n._sub).length>0;
        var pad="padding-left:"+(depth*16+4)+"px";
        var fullPath=depth?parentPath+"/"+k:k;
        h3+="<div class=\"cat-header\" onclick=\"toggleCat(this)\" style=\"padding-left:"+(depth*16+4)+"px\"><span class=\"ct-name\">▾ 📁 "+k+(cnt||hasKids?" ("+cnt+")":"")+"</span><span class=\"ct-actions\"><button class=\"btn-sm\" onclick=\"event.stopPropagation();renameCategory(\'"+q(fullPath)+"\')\">✏️</button> <button class=\"btn-sm danger\" onclick=\"event.stopPropagation();deleteCategory(\'"+q(fullPath)+"\')\">🗑</button></span></div>";
        h3+="<div class=\"cat-items\">";
        n._items.forEach(function(ik){var it=d[ik];h3+="<div class=\"list-item"+(selectedKey===ik?" sel":"")+"\" onclick=\"sel(\'"+q(ik)+"\')\"><span class=\"li-name\">"+(it.name||ik)+"</span><span class=\"li-meta\">"+(it.stats?"⚡":"")+"</span></div>"});
        if(hasKids)h3+=renderTree(n._sub,depth+1,fullPath);
        h3+="<div style=\"padding:2px 8px;font-size:10px;padding-left:"+(depth*16+4)+"px\"><button class=\"btn-sm\" onclick=\"addItemToCat(\'"+q(fullPath)+"\')\">＋ 物品</button> <button class=\"btn-sm\" onclick=\"addSubCat(\'"+q(fullPath)+"\')\">＋ 子分类</button></div></div>";
      });
      return h3;
    }
    h2+=renderTree(tree,0,"");
  }
  else if(currentTab==="recipes"){
    h2+="<div style=\"padding:4px 0;font-size:10px;margin-bottom:4px\"><button class=\"btn-sm green\" onclick=\"addRecipe()\">＋ 新建配方</button></div>";
    d.forEach(function(r,i){var outKs=Object.keys(r.output||{});var out=outKs.length?"> "+outKs.map(function(k){return h(DATA.items[k]?.name||k)+(r.output[k]>1?" x"+r.output[k]:"")}).join("+"):(r.output_facility?"> 🏗️ "+h(DATA.facilities[r.output_facility]?.name||r.output_facility):"");h2+="<div class=\"list-item"+(selectedKey===i?" sel":"")+"\" onclick=\"sel("+i+")\"><span class=\"li-name\">"+(r.name||r.id)+"</span><span class=\"li-meta\">"+out+"</span><button class=\"btn-sm danger\" onclick=\"event.stopPropagation();D_recipes("+i+")\" title=\"删除\" style=\"padding:0 5px;font-size:10px;line-height:1.4\">🗑</button></div>"});
  }
  else if(currentTab==="facilities"){
    h2+="<div style=\"padding:4px 0;font-size:10px;margin-bottom:4px\"><button class=\"btn-sm green\" onclick=\"addFacility()\">＋ 新建设施</button></div>";
    Object.entries(d).forEach(function(e){h2+="<div class=\"list-item"+(selectedKey===e[0]?" sel":"")+"\" onclick=\"sel(\'"+q(e[0])+"\')\"><span class=\"li-name\">"+e[1].name+"</span><span class=\"li-meta\">"+e[1].lvs.length+"级</span><button class=\"btn-sm danger\" onclick=\"event.stopPropagation();D_facilities(\'"+q(e[0])+"\')\" title=\"删除\" style=\"padding:0 5px;font-size:10px;line-height:1.4\">🗑</button></div>"});
  }
  else if(currentTab==="locations"){
    h2+="<div style=\"padding:4px 0;font-size:10px;margin-bottom:4px\"><button class=\"btn-sm green\" onclick=\"addLocation()\">＋ 新建地点</button></div>";
    d.forEach(function(l,i){h2+="<div class=\"list-item"+(selectedKey===i?" sel":"")+"\" onclick=\"sel("+i+")\"><span class=\"li-name\">"+l.name+"</span><span class=\"li-meta\">"+"★".repeat(l.danger||1)+"</span><button class=\"btn-sm danger\" onclick=\"event.stopPropagation();D_locations("+i+")\" title=\"删除\" style=\"padding:0 5px;font-size:10px;line-height:1.4\">🗑</button></div>"});
  }
  else if(currentTab==="disasters"){
    for(var m=1;m<=12;m++){var ds=d[String(m)]||{};h2+="<div class=\"list-item"+(selectedKey===m?" sel":"")+"\" onclick=\"sel("+m+")\"><span class=\"li-name\">"+m+"月 "+(ds.name||"未定义")+"</span></div>"};
  }
  else if(currentTab==="events"){
    ["pos","neg","rare"].forEach(function(t){var arr=d[t]||[],icon=t==="pos"?"✅":t==="neg"?"⚠️":"💎";
      h2+="<div class=\"cat-header\"><span class=\"ct-name\">"+icon+" "+(t==="pos"?"正面":t==="neg"?"负面":"稀有")+" ("+arr.length+")</span><button class=\"btn-sm green\" onclick=\"addEvent(\'"+t+"\')\">＋</button></div><div class=\"cat-items\">";
      arr.forEach(function(ev,i){h2+="<div class=\"list-item"+(selectedKey===t+":"+i?" sel":"")+"\" onclick=\"sel(\'"+t+":"+i+"\')\"><span class=\"li-name\" style=\"font-size:10px\">"+(ev.text||"").substring(0,32)+"...</span><button class=\"btn-sm danger\" onclick=\"event.stopPropagation();D_events(\'"+t+"\',"+i+")\" title=\"删除\" style=\"padding:0 5px;font-size:10px;line-height:1.4\">🗑</button></div>"});
      h2+="</div>";
    });
  }
  else if(currentTab==="system"){
    Object.entries(d).forEach(function(e){var meta=e[1].levels?"Lv."+(e[1].current||1)+"/"+e[1].levels.length:(e[1].fields?e[1].fields.length+"项":"");h2+="<div class=\"list-item"+(selectedKey===e[0]?" sel":"")+"\" onclick=\"sel(\'"+q(e[0])+"\')\"><span class=\"li-name\">"+e[1].name+"</span><span class=\"li-meta\">"+meta+"</span></div>"});
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
  else if(currentTab==="system")R_system();
}

function addItem(){selectedKey="__new__";renderAll()}
function addItemToCat(c){selectedKey="__new__:"+c;renderAll()}

function ask(t,def,cb){var h2="<div style=\"max-width:380px;margin:0 auto;padding:20px\"><h3>"+t+"</h3>";h2+="<input id=\"ask-input\" value=\""+h(def||"")+"\" style=\"width:100%;padding:8px;background:var(--bg);border:1px solid var(--border);color:var(--text);font-size:13px;border-radius:5px;margin-bottom:10px\">";h2+="<button class=\"btn-sm green\" onclick=\"closeAsk(true)\" style=\"padding:6px 20px;font-size:12px;margin-right:6px\">确认</button>";h2+="<button class=\"btn-sm\" onclick=\"closeAsk(false)\" style=\"padding:6px 20px;font-size:12px\">取消</button></div>";editPanel.innerHTML=h2;window._askCb=cb;}
function closeAsk(ok){var v=ok?document.getElementById("ask-input").value.trim():null;renderEdit();if(window._askCb)window._askCb(v);}

function addCategory(){
  ask("新建分类名称：","",function(v){if(!v)return;
    if(CATEGORIES.indexOf(v)>=0){msg("⚠ 分类已存在");return}
    CATEGORIES.push(v);renderList();msg("✅ 已添加分类: "+v);
  });
}
function addSubCat(parent){
  ask("在「"+parent+"」下新建子分类：","",function(v){if(!v)return;
    var full=parent+"/"+v;
    if(CATEGORIES.indexOf(full)>=0){msg("⚠ 分类已存在");return}
    CATEGORIES.push(full);renderList();msg("✅ 已添加子分类: "+full);
  });
}
function renameCategory(oldName){
  ask("重命名分类：",oldName,function(v){if(!v||v===oldName)return;
    if(CATEGORIES.indexOf(v)>=0){msg("⚠ 分类名已存在");return}
    CATEGORIES[CATEGORIES.indexOf(oldName)]=v;
    Object.keys(DATA.items).forEach(function(k){
      if(DATA.items[k].category===oldName)DATA.items[k].category=v;
      if(DATA.items[k].category&&DATA.items[k].category.startsWith(oldName+"/"))DATA.items[k].category=DATA.items[k].category.replace(oldName+"/",v+"/");
    });
    renderList();msg("✅ 已重命名");
  });
}
function deleteCategory(name){
  var count=Object.values(DATA.items).filter(function(v){return v.category===name||(v.category||"").startsWith(name+"/")}).length;
  if(count>0&&!confirm("分类「"+name+"」下有 "+count+" 个物品，确定删除？"))return;
  Object.keys(DATA.items).forEach(function(k){
    if(DATA.items[k].category===name||(DATA.items[k].category||"").startsWith(name+"/"))delete DATA.items[k];
  });
  CATEGORIES=CATEGORIES.filter(function(c){return c!==name&&!c.startsWith(name+"/")});
  renderAll();msg("🗑 已删除分类: "+name);
}

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

function statOpts(id){var keys=["atk","def","range","speed","ammo","heal","thirst","hunger"];return keys.map(function(k){return"<option value=\""+k+"\""+(k===id?" selected":"")+">"+k+"</option>"}).join("")}
function kvEff(key,val){return"<div class=\"kv-row\"><input class=\"stat-key\" value=\""+h(key||"")+"\" placeholder=\"属性名\" style=\"flex:1;min-width:60px;padding:4px 6px;background:var(--bg);border:1px solid var(--border);color:var(--text);font-size:12px;border-radius:4px\" list=\"stat-list\"><datalist id=\"stat-list\">"+statOpts(key)+"</datalist><input type=\"number\" class=\"stat-val\" value=\""+(val||0)+"\" step=\"any\"><span class=\"kv-remove\" onclick=\"rmKv(this)\">✕</span></div>"}
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
  selectedKey=id;renderAll();saveOne("items",function(){msg("✅ 已保存: "+id)},function(e){msg("❌ 保存失败: "+e)});
}
function D_items(k){if(confirm("确定删除物品 \""+k+"\"？")){delete DATA.items[k];selectedKey=null;renderAll();saveOne("items");msg("🗑 已删除")}}
function goRecipe(k){var rid=DATA.recipes.length;DATA.recipes.push({id:"recipe_"+rid,name:DATA.items[k]?.name+"配方",inputs:{},output:{},station:"workbench",level:1});document.querySelectorAll(".tab").forEach(function(t){t.classList.remove("active")});document.querySelector(".tab[data-tab=\"recipes\"]").classList.add("active");currentTab="recipes";selectedKey=rid;renderAll();msg("🔨 已创建配方")}

function addRecipe(){selectedKey=DATA.recipes.length;renderAll()}
function R_recipes(){
  var i=selectedKey,isNew=(i>=DATA.recipes.length);
    var r=isNew?{id:"",name:"",inputs:{},output:{},station:"workbench",level:1}:DATA.recipes[i]||{};
  if(typeof r.output==="string")r.output={[r.output]:r.outQty||1};
  var isFac=r.output_facility?true:false;
  var h2="<h3 style=\"color:var(--accent);margin-bottom:12px\">"+(isNew?"🔨 新建配方":"🔨 编辑: "+h(r.name||r.id))+"</h3>";
  h2+="<div class=\"field-row\"><div class=\"field\"><label>ID</label><input id=\"f-id\" value=\""+h(r.id||"")+"\"></div><div class=\"field wide\"><label>名称</label><input id=\"f-name\" value=\""+h(r.name||"")+"\"></div></div>";
  h2+="<div class=\"field-row\"><div class=\"field wide\"><label>工坊</label><select id=\"f-station\">"+Object.keys(DATA.facilities).map(function(fk){return"<option value=\""+fk+"\""+(r.station===fk?" selected":"")+">"+h(DATA.facilities[fk].name||fk)+"</option>"}).join("")+"</select></div><div class=\"field\"><label>工坊等级</label><input id=\"f-level\" type=\"number\" value=\""+(r.level||1)+"\" min=\"1\"></div></div>";
  h2+="<div class=\"section-title\">📥 输入材料</div><div id=\"inp-area\">";
  Object.entries(r.inputs||{}).forEach(function(ie){h2+=kvInp(ie[0],ie[1])});
      h2+="</div>"+addBtn("inp-area","inp","添加材料");
      h2+="<div class=\"section-title\">📤 产出</div>";
      h2+="<div style=\"display:flex;gap:12px;margin-bottom:8px;font-size:12px\"><label><input type=\"radio\" name=\"out-type\" onchange=\"toggleOutType()\" value=\"item\""+(isFac?"":" checked")+"> 物品</label><label><input type=\"radio\" name=\"out-type\" onchange=\"toggleOutType()\" value=\"facility\""+(isFac?" checked":"")+"> 设施</label></div>";
      h2+="<div id=\"out-item-wrap\" style=\"display:"+(isFac?"none":"block")+"\"><div id=\"out-area\">";
  Object.entries(r.output||{}).forEach(function(oe){h2+=kvOut(oe[0],oe[1])});
      h2+="</div>"+addBtn("out-area","out","添加产出")+"</div>";
      h2+="<div id=\"out-fac-wrap\" style=\"display:"+(isFac?"block":"none")+"\"><select id=\"f-out-fac\">"+Object.keys(DATA.facilities).map(function(fk){return"<option value=\""+fk+"\""+(r.output_facility===fk?" selected":"")+">"+h(DATA.facilities[fk].name||fk)+"</option>"}).join("")+"</select></div>";
  h2+="<div style=\"margin-top:16px;display:flex;gap:8px\"><button class=\"btn save\" onclick=\"S_recipes("+i+")\">💾 保存</button>";
  if(!isNew)h2+="<button class=\"btn danger\" onclick=\"D_recipes("+i+")\">🗑 删除</button>";
  h2+="</div>";editPanel.innerHTML=h2;
}

function kvInp(key,val){return"<div class=\"kv-row\">"+catItemHTML(key,"inp")+"<input type=\"number\" class=\"inp-val\" value=\""+(val||1)+"\" min=\"1\" style=\"flex:0.6;min-width:45px\"><span class=\"kv-remove\" onclick=\"rmKv(this)\">✕</span></div>"}
function kvOut(key,val){return"<div class=\"kv-row\">"+catItemHTML(key,"out")+"<input type=\"number\" class=\"out-val\" value=\""+(val||1)+"\" min=\"1\" style=\"flex:0.6;min-width:45px\"><span class=\"kv-remove\" onclick=\"rmKv(this)\">✕</span></div>"}

// Generic add-row button system
function addInpRow(areaId,type,li){
  var row="";
  if(type==="inp") row=kvInp("","");
  else if(type==="out") row=kvOut("","");
  else if(type==="cost") row="<div class=\"kv-row\">"+catItemHTML("","lv-"+li+"-")+"<input type=\"number\" class=\"lv-"+li+"-cv\" value=\"1\" min=\"0\" style=\"flex:0.6;min-width:45px\"><span class=\"kv-remove\" onclick=\"rmKv(this)\">\u2715</span></div>";
  else if(type==="do") row="<div class=\"kv-row\">"+catItemHTML("","lv-"+li+"-do-")+"<input type=\"number\" class=\"lv-"+li+"-dov\" value=\"1\" min=\"0\" style=\"flex:0.6;min-width:45px\"><span class=\"kv-remove\" onclick=\"rmKv(this)\">\u2715</span></div>";
  else if(type==="loot") row=kvLoot("","","");
  else if(type==="rew") row=eventRewRow();
  else if(type==="syscost") row="<div class=\"kv-row\">"+catItemHTML("","lv-"+li+"-")+"<input type=\"number\" class=\"lv-"+li+"-cv\" value=\"1\" min=\"0\" style=\"flex:0.6;min-width:45px\"><span class=\"kv-remove\" onclick=\"rmKv(this)\">\u2715</span></div>";
  var area=document.getElementById(areaId);if(area)area.insertAdjacentHTML("beforeend",row);
}
function addBtn(areaId,type,label,li){
  var l=li||0;
  return"<button class=\"btn-sm green\" onclick=\"addInpRow('"+areaId+"','"+type+"',"+l+")\" style=\"margin-top:4px\">＋ "+label+"</button>";
}
function S_recipes(i){
  var inp={},iks=document.querySelectorAll(".inp-item"),ivs=document.querySelectorAll(".inp-val");
  for(var j=0;j<iks.length;j++){if(iks[j].value)inp[iks[j].value]=(parseInt(ivs[j].value)||1)}
  var isFac=document.querySelector("input[name=\"out-type\"]:checked")?.value==="facility";
  var r={id:document.getElementById("f-id").value.trim(),name:document.getElementById("f-name").value.trim(),station:document.getElementById("f-station").value,level:parseInt(document.getElementById("f-level").value)||1,inputs:inp};
  if(isFac){r.output_facility=document.getElementById("f-out-fac").value;delete r.output;}
  else{var out={},oks=document.querySelectorAll(".out-item"),ovs=document.querySelectorAll(".out-val");for(var j=0;j<oks.length;j++){if(oks[j].value)out[oks[j].value]=(parseInt(ovs[j].value)||1)}r.output=out;delete r.output_facility;}
  if(!r.id){msg("❌ ID不能为空");return}
  if(i>=DATA.recipes.length)DATA.recipes.push(r);else DATA.recipes[i]=r;
  selectedKey=i;renderAll();saveOne("recipes",function(){msg("✅ 配方已保存")},function(e){msg("❌ 配方保存失败: "+e)});
}
function toggleOutType(){renderEdit()}
function D_recipes(i){if(confirm("确定删除？")){DATA.recipes.splice(i,1);selectedKey=null;renderAll();saveOne("recipes");msg("🗑 已删除")}}

function addFacility(){var n="new_fac_"+Date.now();DATA.facilities[n]={name:"新设施",lvs:[],sp:[],cost:{}};selectedKey=n;renderAll()}
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
  h2+="<div style=\"font-size:11px;color:var(--dim);margin:4px 0\">建造成本:</div><div id=\"lv-cost-"+li+"\">";
  Object.entries(f.cost||{}).forEach(function(ce){h2+="<div class=\"kv-row\">"+catItemHTML(ce[0],"lv-"+li+"-")+"<input type=\"number\" class=\"lv-"+li+"-cv\" value=\""+(ce[1]?.[li]||0)+"\" min=\"0\" style=\"flex:0.6;min-width:45px\"><span class=\"kv-remove\" onclick=\"rmKv(this)\">✕</span></div>"});
  h2+="</div>"+addBtn("lv-cost-"+li,"cost","添加成本",li);
  h2+="<div style=\"font-size:11px;color:var(--dim);margin:4px 0\">每日产出:</div><div id=\"lv-out-"+li+"\">";
  Object.entries(f.daily_output||{}).forEach(function(de){h2+="<div class=\"kv-row\">"+catItemHTML(de[0],"lv-"+li+"-do-")+"<input type=\"number\" class=\"lv-"+li+"-dov\" value=\""+(de[1]?.[li]||0)+"\" min=\"0\" style=\"flex:0.6;min-width:45px\"><span class=\"kv-remove\" onclick=\"rmKv(this)\">✕</span></div>"});
  h2+="</div>"+addBtn("lv-out-"+li,"do","添加产出",li);
  h2+="<div class=\"field\" style=\"margin-top:6px\"><label>每日使用上限 (0=不限)</label><input type=\"number\" class=\"lv-limit\" value=\""+(f.daily_limit?.[li]||0)+"\" min=\"0\"></div>";
  h2+="</div>";
  return h2;
}

function addLv(){var f=DATA.facilities[selectedKey];if(!f.lvs)f.lvs=[];f.lvs.push("");renderEdit()}
function S_facilities(fid){
  var f=DATA.facilities[fid];f.name=document.getElementById("f-name").value.trim();
  var nms=document.querySelectorAll(".lv-name");
  f.lvs=[];nms.forEach(function(e){f.lvs.push(e.value)});
  f.cost={};f.daily_output={};f.daily_limit=[];
  for(var li=0;li<f.lvs.length;li++){
  cks=document.querySelectorAll(".lv-"+li+"--item"),cvs=document.querySelectorAll(".lv-"+li+"-cv");
    for(var ci=0;ci<cks.length;ci++){if(!cks[ci].value)continue;if(!f.cost[cks[ci].value])f.cost[cks[ci].value]=Array(f.lvs.length).fill(0);f.cost[cks[ci].value][li]=parseInt(cvs[ci].value)||0}
    var dks=document.querySelectorAll(".lv-"+li+"-do--item"),dvs=document.querySelectorAll(".lv-"+li+"-dov");
    for(var di=0;di<dks.length;di++){if(!dks[di].value)continue;if(!f.daily_output[dks[di].value])f.daily_output[dks[di].value]=Array(f.lvs.length).fill(0);f.daily_output[dks[di].value][li]=parseInt(dvs[di].value)||0}
    var lmt=document.querySelectorAll(".lv-limit")[li];if(lmt)f.daily_limit[li]=parseInt(lmt.value)||0;
  }
  saveOne("facilities",function(){msg("✅ 设施已保存")},function(e){msg("❌ 设施保存失败: "+e)});
}
function D_facilities(fid){if(confirm("确定删除？")){delete DATA.facilities[fid];selectedKey=null;renderAll();saveOne("facilities");msg("🗑 已删除")}}

function addLocation(){DATA.locations.push({id:"",name:"",danger:1,loot:[],event_rate:0.25});selectedKey=DATA.locations.length-1;renderAll()}
function R_locations(){
  var i=selectedKey,l=DATA.locations[i]||{};
  var h2="<h3 style=\"color:var(--accent);margin-bottom:12px\">🗺️ 编辑地点</h3>";
  h2+="<div class=\"field-row\"><div class=\"field\"><label>ID</label><input id=\"f-id\" value=\""+h(l.id||"")+"\"></div><div class=\"field wide\"><label>名称</label><input id=\"f-name\" value=\""+h(l.name||"")+"\"></div></div>";
  h2+="<div class=\"field-row\"><div class=\"field wide\"><label>危险度 (1-5)</label><input id=\"f-danger\" type=\"number\" value=\""+(l.danger||1)+"\" min=\"1\" max=\"5\"></div><div class=\"field\"><label>事件概率</label><input id=\"f-rate\" type=\"number\" value=\""+(l.event_rate||0.25)+"\" min=\"0\" max=\"1\" step=\"0.01\"></div></div>";
  h2+="<div class=\"field\"><label>特产描述</label><input id=\"f-special\" value=\""+h(l.special||"")+"\"></div>";
  h2+="<div class=\"section-title\">📦 掉落表</div><div id=\"lt-area\">";
  (l.loot||[]).forEach(function(lt){h2+=kvLoot(lt.item,lt.min,lt.max)});
    h2+="</div>"+addBtn("lt-area","loot","添加掉落")+"</div>";
  h2+="<div style=\"margin-top:16px;display:flex;gap:8px\"><button class=\"btn save\" onclick=\"S_locations("+i+")\">💾 保存</button><button class=\"btn danger\" onclick=\"D_locations("+i+")\">🗑 删除</button></div>";
  editPanel.innerHTML=h2;
}
function kvLoot(item,min,max){return"<div class=\"kv-row\">"+catItemHTML(item,"lt")+"<input type=\"number\" class=\"lt-min\" value=\""+(min||0)+"\" min=\"0\" style=\"flex:0.4;min-width:35px\" placeholder=\"min\"><input type=\"number\" class=\"lt-max\" value=\""+(max||0)+"\" min=\"0\" style=\"flex:0.4;min-width:35px\" placeholder=\"max\"><span class=\"kv-remove\" onclick=\"rmKv(this)\">✕</span></div>"}
function S_locations(i){
  var loot=[],its=document.querySelectorAll(".lt-item"),mis=document.querySelectorAll(".lt-min"),mas=document.querySelectorAll(".lt-max");
  for(var j=0;j<its.length;j++){if(its[j].value)loot.push({item:its[j].value,min:parseInt(mis[j].value)||0,max:parseInt(mas[j].value)||0})}
  DATA.locations[i]={id:document.getElementById("f-id").value.trim(),name:document.getElementById("f-name").value.trim(),danger:parseInt(document.getElementById("f-danger").value)||1,event_rate:parseFloat(document.getElementById("f-rate").value)||0.25,special:document.getElementById("f-special").value.trim()||null,loot:loot};
  renderAll();saveOne("locations",function(){msg("✅ 地点已保存")},function(e){msg("❌ 地点保存失败: "+e)});
}
function D_locations(i){if(confirm("确定删除？")){DATA.locations.splice(i,1);selectedKey=null;renderAll();saveOne("locations");msg("🗑 已删除")}}

function R_disasters(){
  var m=selectedKey,d=DATA.disasters[String(m)]||{name:"",penalty:"",bonus:""};
  var h2="<h3 style=\"color:var(--accent);margin-bottom:12px\">🌪️ "+m+"月天灾</h3>";
  h2+="<div class=\"field\"><label>名称</label><input id=\"f-name\" value=\""+h(d.name||"")+"\"></div><div class=\"field\"><label>惩罚</label><input id=\"f-penalty\" value=\""+h(d.penalty||"")+"\"></div><div class=\"field\"><label>奖励</label><input id=\"f-bonus\" value=\""+h(d.bonus||"")+"\"></div>";
  h2+="<div style=\"margin-top:16px\"><button class=\"btn save\" onclick=\"S_disasters("+m+")\">💾 保存</button></div>";
  editPanel.innerHTML=h2;
}
function S_disasters(m){DATA.disasters[String(m)]={name:document.getElementById("f-name").value.trim(),penalty:document.getElementById("f-penalty").value.trim(),bonus:document.getElementById("f-bonus").value.trim()};saveOne("disasters",function(){msg("✅ 天灾已保存")},function(e){msg("❌ 天灾保存失败: "+e)})}

function addEvent(type){var arr=DATA.events[type]||[];arr.push({text:"新事件",r:{}});selectedKey=type+":"+(arr.length-1);renderAll()}
function R_events(){
  var parts=String(selectedKey).split(":"),type=parts[0],i=parseInt(parts[1]);
  var ev=(DATA.events[type]||[])[i]||{text:"",r:{}};
  var h2="<h3 style=\"color:var(--accent);margin-bottom:12px\">"+(type==="pos"?"✅":type==="neg"?"⚠️":"💎")+" 编辑事件</h3>";
  h2+="<div class=\"field\"><label>文本</label><textarea id=\"f-text\">"+h(ev.text||"")+"</textarea></div>";
  h2+="<div class=\"section-title\">📊 效果</div><div id=\"r-area\">";
  Object.entries(ev.r||{}).forEach(function(re){h2+=eventRewRow(re[0],re[1])});
    h2+="</div>"+addBtn("r-area","rew","添加效果");
  if(type==="rare")h2+="<div class=\"field\"><label>附注</label><textarea id=\"f-note\">"+h(ev.note||"")+"</textarea></div>";
  h2+="<div style=\"margin-top:16px;display:flex;gap:8px\"><button class=\"btn save\" onclick=\"S_events(\'"+type+"\',"+i+")\">💾 保存</button><button class=\"btn danger\" onclick=\"D_events(\'"+type+"\',"+i+")\">🗑 删除</button></div>";
  editPanel.innerHTML=h2;
}
// Event reward row: type selector + +/- toggle + value/item picker
function eventRewRow(key,val){
  var isSpecial=["sp","health","food","water","energy"].indexOf(key)>=0;
  var op=val>=0?"+":"-",absVal=Math.abs(val||0);
  var h2="<div class=\"kv-row\" style=\"gap:3px;font-size:11px\">";
  h2+="<select class=\"rew-type\" onchange=\"updateRewType(this)\" style=\"flex:0.7;min-width:55px\">";
  h2+="<option value=\"sp\""+(key==="sp"?" selected":"")+">💰 SP</option>";
  h2+="<option value=\"health\""+(key==="health"?" selected":"")+">❤️ HP</option>";
  h2+="<option value=\"food\""+(key==="food"?" selected":"")+">🍞 Food</option>";
  h2+="<option value=\"water\""+(key==="water"?" selected":"")+">💧 Water</option>";
  h2+="<option value=\"energy\""+(key==="energy"?" selected":"")+">⚡ Energy</option>";
  h2+="<option value=\"\" disabled>————</option>";
  h2+="<option value=\"__item__\""+(!isSpecial&&key?" selected":"")+">📦 物品</option>";
  h2+="</select>";
  h2+="<select class=\"rew-op\" style=\"flex:0.25;min-width:36px\"><option value=\"+\""+(op==="+"?" selected":"")+">➕</option><option value=\"-\""+(op==="-"?" selected":"")+">➖</option></select>";
  if(isSpecial||!key){h2+="<input type=\"number\" class=\"rew-val\" value=\""+absVal+"\" min=\"0\" style=\"flex:0.6;min-width:45px\">"}
  else{h2+=catItemHTML(key,"rew")+"<input type=\"number\" class=\"rew-qty\" value=\""+absVal+"\" min=\"1\" style=\"flex:0.35;min-width:35px\">"}
  h2+="<span class=\"kv-remove\" onclick=\"rmKv(this)\" style=\"flex:none;padding:0 2px\">✕</span></div>";
  return h2;
}
function updateRewType(el){
  var row=el.closest(".kv-row"),isItem=el.value==="__item__";
  var itemArea=row.querySelector(".rew-item,.rew-cat");
  if(isItem&&!itemArea){
    // Replace the value input with dual dropdown
    var valEl=row.querySelector(".rew-val");
    if(valEl){
      var catHTML=catItemHTML("","rew");
      var qtyHTML="<input type=\"number\" class=\"rew-qty\" value=\"1\" min=\"1\" style=\"flex:0.35;min-width:35px\">";
      valEl.insertAdjacentHTML("beforebegin",catHTML+qtyHTML);
      valEl.remove();
    }
  }else if(!isItem&&itemArea){
    // Replace dual dropdown with simple value input
    var cat=row.querySelector(".rew-cat"),item=row.querySelector(".rew-item"),qty=row.querySelector(".rew-qty");
    if(cat)cat.remove();if(item)item.remove();if(qty)qty.remove();
    if(!row.querySelector(".rew-val")){
      itemArea.parentElement.insertBefore(document.createElement("input"),itemArea);
      var inp=itemArea.previousElementSibling;
      inp.className="rew-val";inp.type="number";inp.value="1";inp.min="0";
      inp.style.cssText="flex:0.6;min-width:45px";
      itemArea.remove();if(cat)cat.remove();
    }
    // Clean up: remove remaining cat/qty/item elements  
    row.querySelectorAll(".rew-cat,.rew-item,.rew-qty").forEach(function(e){e.remove()});
    if(!row.querySelector(".rew-val")){
      var newInp=document.createElement("input");
      newInp.type="number";newInp.className="rew-val";newInp.value="1";newInp.min="0";
      newInp.style.cssText="flex:0.6;min-width:45px";
      var opEl=row.querySelector(".rew-op");
      if(opEl)opEl.after(newInp);
    }
  }
}
// Remove old kvReward - replaced by eventRewRow above
function S_events(type,i){
  var r={},rows=document.querySelectorAll("#r-area .kv-row");
  for(var j=0;j<rows.length;j++){
    var row=rows[j],typeSel=row.querySelector(".rew-type");
    if(!typeSel||!typeSel.value)continue;
    var op=(row.querySelector(".rew-op")||{}).value||"+";
    var key=typeSel.value;
    if(key==="__item__"){
      var isel=row.querySelector(".rew-item");if(!isel||!isel.value)continue;
      key=isel.value;
      var qty=row.querySelector(".rew-qty");var v=parseInt(qty?qty.value:1)||1;
      r[key]=(op==="-"?-v:v);
    }else{
      var vel=row.querySelector(".rew-val");var v=parseInt(vel?vel.value:0)||0;
      r[key]=(op==="-"?-v:v);
    }
  }
  var ev={text:document.getElementById("f-text").value.trim(),r:r};
  var noteEl=document.getElementById("f-note");if(noteEl)ev.note=noteEl.value.trim();
  if(i>=DATA.events[type].length)DATA.events[type].push(ev);else DATA.events[type][i]=ev;
  selectedKey=type+":"+i;renderAll();saveOne("events",function(){msg("✅ 事件已保存")},function(e){msg("❌ 事件保存失败: "+e)});
}
function D_events(type,i){if(confirm("确定删除？")){DATA.events[type].splice(i,1);selectedKey=null;renderAll();saveOne("events");msg("🗑 已删除")}}

function R_system(){
  var sid=selectedKey,sys=DATA.system[sid]||{};
  var h2="<h3 style=\"color:var(--accent);margin-bottom:12px\">⚙️ "+h(sys.name||sid)+"</h3>";
  h2+="<div class=\"field\"><label>名称</label><input id=\"f-name\" value=\""+h(sys.name||"")+"\"></div>";
  h2+="<div class=\"field\"><label>描述</label><input id=\"f-desc\" value=\""+h(sys.desc||"")+"\"></div>";
  // Flat fields mode
  if(sys.fields){
    h2+="<div class=\"section-title\">📝 参数配置</div><div id=\"sys-fields\">";
    sys.fields.forEach(function(fe){h2+="<div class=\"field-row\"><div class=\"field wide\"><label>"+h(fe.label||fe.key)+"</label><input class=\"sys-fv\" data-key=\""+fe.key+"\" type=\"number\" value=\""+fe.value+"\" step=\"any\"></div></div>"});
    h2+="</div>";
  }
  // Levels mode
  else if(sys.levels){
    h2+="<div class=\"section-title\">📊 等级配置</div>";
    (sys.levels||[]).forEach(function(lv,li){
      var attrs=[];Object.entries(lv).forEach(function(ve){if(ve[0]!=="level"&&ve[0]!=="cost"&&ve[0]!=="sp_cost")attrs.push(ve)});
      h2+="<div class=\"lv-block\"><div class=\"lv-title\">Lv."+lv.level+"</div>";
      h2+="<div class=\"field\" style=\"margin-bottom:6px\"><label>SP消耗</label><input type=\"number\" class=\"lv-"+li+"-sp\" value=\""+(lv.sp_cost||0)+"\" min=\"0\"></div>";
      h2+="<div class=\"field-row\">";
      attrs.forEach(function(a){h2+="<div class=\"field\"><label>"+a[0]+"</label><input class=\"lv-"+li+"-a\" data-key=\""+a[0]+"\" type=\"number\" value=\""+(a[1]||0)+"\" step=\"any\"></div>"});
      h2+="</div>";
      h2+="<div style=\"font-size:10px;color:var(--dim);margin:4px 0\">材料消耗:</div><div id=\"sys-cost-"+li+"\">";
      Object.entries(lv.cost||{}).forEach(function(ce){h2+="<div class=\"kv-row\">"+catItemHTML(ce[0],"lv-"+li+"-")+"<input type=\"number\" class=\"lv-"+li+"-cv\" value=\""+ce[1]+"\" min=\"0\" style=\"flex:0.6;min-width:45px\"><span class=\"kv-remove\" onclick=\"rmKv(this)\">✕</span></div>"});
      h2+="</div>"+addBtn("sys-cost-"+li,"syscost","添加消耗",li)+"</div></div>";
    });
  }
  h2+="<div style=\"margin-top:16px\"><button class=\"btn save\" onclick=\"S_system(\'"+q(sid)+"\')\">💾 保存</button></div>";
  editPanel.innerHTML=h2;
}
function S_system(sid){
  var sys=DATA.system[sid];
  sys.name=document.getElementById("f-name").value.trim();sys.desc=document.getElementById("f-desc").value.trim();
  if(sys.fields){
    document.querySelectorAll(".sys-fv").forEach(function(el){var f=sys.fields.find(function(x){return x.key===el.dataset.key});if(f)f.value=parseFloat(el.value)||0});
  }
  else if(sys.levels){
    for(var li=0;li<sys.levels.length;li++){
      var lv=sys.levels[li];
      var spEl=document.querySelectorAll(".lv-"+li+"-sp")[0];if(spEl)lv.sp_cost=parseInt(spEl.value)||0;
      document.querySelectorAll(".lv-"+li+"-a").forEach(function(el){lv[el.dataset.key]=parseFloat(el.value)||0});
      lv.cost={};var cks=document.querySelectorAll(".lv-"+li+"--item"),cvs=document.querySelectorAll(".lv-"+li+"-cv");
      for(var ci=0;ci<cks.length;ci++){if(cks[ci].value)lv.cost[cks[ci].value]=parseInt(cvs[ci].value)||0}
    }
  }
  saveOne("system",function(){msg("✅ 系统已保存")},function(e){msg("❌ 系统保存失败: "+e)});
}

function saveAll(){
  var count=0,errs=[];
  msg("💾 正在保存...");
  FILES.forEach(function(f){saveOne(f,function(){count++;if(count+errs.length===FILES.length)finish()},function(e){errs.push(f+": "+e);if(count+errs.length===FILES.length)finish()})});
  function finish(){if(errs.length)msg("❌ "+errs.length+"失败: "+errs.join("; "));else msg("✅ 已保存 "+count+" 个文件")}
}
function saveOne(f,okCb,errCb){
  fetch("/api/save",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({file:f+".json",content:JSON.stringify(DATA[f],null,2)})})
    .then(function(r){return r.json()}).then(function(d){if(d.ok&&okCb)okCb();else if(errCb)errCb(d.error||"unknown")})
    .catch(function(e){if(errCb)errCb(e.message)});
}
function exportAll(){
  FILES.forEach(function(f){
    var b=new Blob([JSON.stringify(DATA[f],null,2)],{type:"application/json"});
    var a=document.createElement("a");a.href=URL.createObjectURL(b);a.download=f+".json";a.click();
    setTimeout(function(){URL.revokeObjectURL(a.href)},1000);
  });
  msg("📥 导出完成");
}
