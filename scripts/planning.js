/* CEB : planning public 2026–2027 à partir d'une source structurée et versionnée */
(function(){
  'use strict';
  const panel=document.getElementById('planning');
  if(!panel)return;
  const days=['lundi','mardi','mercredi','jeudi','vendredi','samedi','dimanche'];
  const shortDays=['Lun.','Mar.','Mer.','Jeu.','Ven.','Sam.','Dim.'];
  const categories=[['tous','Toutes les activités'],['jeunes','Jeunes'],['adultes','Adultes'],['competition','Compétition'],['para','Para-escalade'],['libre','Accès libre']];
  let chosenDay='tous',chosenType='tous',data=null;
  const byId=(id)=>document.getElementById(id);
  const el=(tag,cls,content)=>{
    const node=document.createElement(tag);
    if(cls)node.className=cls;
    if(content!==undefined)node.textContent=content;
    return node;
  };
  const pretty=(time)=>time.replace(/^0/,'').replace(':','h');
  function pills(target,options,current,onChange){
    const root=byId(target);root.replaceChildren();
    for(const [value,label] of options){
      const button=el('button','planning-chip',label);
      button.type='button';button.setAttribute('aria-pressed',String(value===current));
      button.addEventListener('click',()=>onChange(value));
      root.append(button);
    }
  }
  function slotCard(s){
    const article=el('article','planning-slot planning-slot--'+s.type);
    article.append(el('span','planning-time',pretty(s.start)+' – '+pretty(s.end)));
    article.append(el('div','planning-type',data.types[s.type] || s.type));
    article.append(el('h3','',s.title));
    if(s.age)article.append(el('p','',s.age));
    if(s.groupesSimultanes)article.append(el('p','',s.groupesSimultanes+' groupes en parallèle'));
    if(s.description)article.append(el('p','',s.description));
    if(s.disciplines)article.append(el('p','',s.disciplines.join(' · ')));
    if(s.condition)article.append(el('p','planning-condition',s.condition));
    return article;
  }
  function render(){
    if(!data)return;
    pills('planning-days',[['tous','Toute la semaine'],...days.map((d,i)=>[d,shortDays[i]])],chosenDay,v=>{chosenDay=v;render()});
    pills('planning-types',categories,chosenType,v=>{chosenType=v;render()});
    const visible=data.sessions.filter(s=>(chosenType==='tous'||s.type===chosenType)&&(chosenDay==='tous'||s.day===chosenDay));
    byId('planning-count').textContent=visible.length+' créneau'+(visible.length!==1?'x':'')+' affiché'+(visible.length!==1?'s':'')+' · Saison '+data.season;
    const grid=byId('planning-grid');grid.replaceChildren();
    const shownDays=chosenDay==='tous'?days:[chosenDay];
    for(const day of shownDays){
      const items=visible.filter(s=>s.day===day).sort((a,b)=>a.start.localeCompare(b.start)||a.end.localeCompare(b.end));
      const column=el('section','planning-day');
      column.setAttribute('aria-label',day);
      const header=el('div','planning-day-header');
      header.append(el('span','',day.charAt(0).toUpperCase()+day.slice(1)),el('small','',items.length+' créneau'+(items.length!==1?'x':'')));
      column.append(header);
      const list=el('div','planning-slot-list');
      if(!items.length)list.append(el('p','planning-empty','Aucun créneau pour ce filtre.'));
      for(const s of items)list.append(slotCard(s));
      column.append(list);grid.append(column);
    }
  }
  function makeNotes(id,heading,items){
    const target=byId(id),title=el('h3','',heading),list=el('ul');
    items.forEach(item=>list.append(el('li','',item)));
    target.replaceChildren(title,list);
  }
  function renderDemo(members){
    const target=byId('planning-admin-preview');if(!target)return;
    const groups=['5–6 ans','7–9 ans','10–13 ans','14–18 ans','Adultes débutants','Adultes accès libre'];
    const figures=el('div','planning-demo-figures');
    groups.forEach(group=>{
      const matches=members.filter(m=>m.groupe===group),tile=el('div','planning-demo-figure');
      tile.append(el('strong','',String(matches.length)),el('span','',group));
      figures.append(tile);
    });
    const title=el('h3','','Planning : répartition des profils fictifs');
    const intro=el('p','','Ces totaux regroupent 45 profils de démonstration par catégorie. Ils ne représentent pas des inscriptions sur un horaire précis, ni des places disponibles.');
    target.replaceChildren(title,intro,figures);
  }
  Promise.all([fetch('./data/planning.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('Planning non disponible');return r.json()}),fetch('./data/demo.json',{cache:'no-store'}).then(r=>r.ok?r.json():null).catch(()=>null)])
    .then(([planning,demo])=>{
      data=planning;
      if(!Array.isArray(data.sessions)||!Array.isArray(data.days))throw Error('Données de planning invalides');
      render();
      makeNotes('planning-important','À savoir avant de venir',data.important);
      makeNotes('planning-verify','Points à confirmer auprès du club',data.aConfirmer);
      if(demo?.adherents)renderDemo(demo.adherents);
    }).catch(err=>{
      console.error('Planning CEB :',err);
      byId('planning-count').textContent='Le planning est temporairement indisponible. Consultez le site officiel du CEB.';
    });
})();
