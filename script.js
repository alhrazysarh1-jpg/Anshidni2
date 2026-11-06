/* script.js — المدن، تفاصيل الأماكن، التقييمات، الرحلات والدعم
   البيانات التجريبية تحفظ محليًا داخل المتصفح باستخدام localStorage.
========================================================= */
(() => {
  const KEYS = { user:'anshidni_user', comments:'anshidni_comments', memories:'anshidni_memories', trips:'anshidni_trips', memoryComments:'anshidni_memory_comments' };
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  // ===== التخزين والحسابات =====
  const ACC_KEY = 'anshidni_accounts', SESSION_KEY = 'anshidni_session';
  // بيانات خاصة بكل حساب (تُحفظ باسم الحساب)
  const PERSONAL = new Set(['anshidni_comments','anshidni_memories','anshidni_trips']);
  const rawRead = (key, fallback) => { try { const v=JSON.parse(localStorage.getItem(key)); return v ?? fallback; } catch { return fallback; } };
  const rawWrite = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch(e) { toast('مساحة التخزين ممتلئة. احذف بعض الصور القديمة ثم حاول مرة أخرى.'); return false; } };
  const session = () => { try { return localStorage.getItem(SESSION_KEY) || ''; } catch { return ''; } };
  const accounts = () => rawRead(ACC_KEY, {});
  const scoped = key => PERSONAL.has(key) && session() ? key + '::' + session() : key;
  function user(){ const s=session(); const a=s && accounts()[s]; if(!a) return null; const { passHash, ...pub } = a; return pub; }
  function saveUser(u){ const s=session(); if(!s || !u) return false; const all=accounts(); const { passHash, ...rest } = u; all[s] = { ...all[s], ...rest, email: all[s]?.email || s }; return rawWrite(ACC_KEY, all); }
  const read = (key, fallback) => key === KEYS.user ? (user() ?? fallback) : rawRead(scoped(key), fallback);
  const write = (key, value) => key === KEYS.user ? saveUser(value) : rawWrite(scoped(key), value);
  // نقل بيانات النسخة القديمة (حساب واحد) إلى نظام الحسابات
  (function migrateLegacy(){ try { const old=rawRead('anshidni_user', null); if(!old || !old.email) return; const id=old.email.trim().toLowerCase(); const all=accounts(); if(!all[id]){ all[id]={ ...old, email:id, joined: old.joined || new Date().toISOString().slice(0,10), passHash:null }; rawWrite(ACC_KEY, all); } ['anshidni_comments','anshidni_memories','anshidni_trips'].forEach(k=>{ const v=localStorage.getItem(k); if(v!==null && localStorage.getItem(k+'::'+id)===null) localStorage.setItem(k+'::'+id, v); localStorage.removeItem(k); }); if(!localStorage.getItem(SESSION_KEY)) localStorage.setItem(SESSION_KEY, id); localStorage.removeItem('anshidni_user'); localStorage.removeItem('anshidni_post_likes'); localStorage.removeItem('anshidni_follow_requests'); } catch {} })();
  const esc = (v='') => String(v).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[c]));
  const cityPages = {'جدة':'city-jeddah','الرياض':'city-riyadh','مكة':'city-makkah','مكة المكرمة':'city-makkah','المدينة':'city-madinah','المدينة المنورة':'city-madinah','أبها':'city-abha'};
  const navPages = {'الرئيسية':'home','المدن':'cities','الخريطة':'map','حسابي':'dashboard'};

  // كل مدينة: 3 مطاعم + 3 حدائق + 3 فعاليات/معالم.
  const cityData = {
    'city-jeddah': { city:'جدة', items:[
      ['restaurant','خيال','مطعم معروف بتجربة الطعام والأجواء المميزة.','مطعم خيال جدة',4.5],['restaurant','توينا للمأكولات البحرية','مطعم للمأكولات البحرية وله مواقع في جدة.','توينا جدة مطعم',4.3],['restaurant','البيك','وجبات سريعة وله فروع متعددة في جدة.','البيك جدة',4.2],
      ['park','حديقة الأمير ماجد','حديقة عامة ومساحات ترفيهية للعائلات.','حديقة الأمير ماجد جدة',4.4],['park','واجهة جدة البحرية','ممشى ومساحات مفتوحة على ساحل البحر الأحمر.','واجهة جدة البحرية',4.6],['park','حديقة الشلال','حديقة ومتنزه ترفيهي في جدة.','حديقة الشلال جدة',4.2],
      ['event','جدة التاريخية – البلد','منطقة تراثية للتجول واستكشاف المباني التاريخية.','جدة التاريخية البلد',4.7],['event','نادي جدة لليخوت','وجهة بحرية تضم مرافق ومطاعم وممشى.','نادي جدة لليخوت',4.5],['event','واجهة روشن البحرية','وجهة ساحلية للتنزه وأنشطة موسمية.','واجهة روشن البحرية جدة',4.3]
    ]},
    'city-riyadh': { city:'الرياض', items:[
      ['restaurant','قرية نجد','مطعم يقدم المأكولات النجدية والسعودية.','قرية نجد الرياض مطعم',4.4],['restaurant','لوسين','مطعم يقدم المأكولات الأرمنية.','لوسين الرياض مطعم',4.6],['restaurant','ميازو','مطعم للمأكولات اليابانية في الرياض.','ميازو الرياض مطعم',4.3],
      ['park','منتزه الملك عبدالله','منتزه عام ومساحات للتنزه في حي الملز.','منتزه الملك عبدالله الرياض',4.4],['park','منتزه السلام','مساحات خضراء وممرات للمشي.','منتزه السلام الرياض',4.2],['park','وادي حنيفة','وجهة طبيعية ومسارات للتنزه.','وادي حنيفة الرياض',4.6],
      ['event','بوليفارد سيتي','وجهة ترفيهية تستضيف فعاليات موسمية.','بوليفارد سيتي الرياض',4.7],['event','الدرعية – الطريف','وجهة تراثية وثقافية.','حي الطريف الدرعية',4.8],['event','المتحف الوطني السعودي','متحف ثقافي في مركز الملك عبدالعزيز التاريخي.','المتحف الوطني السعودي الرياض',4.6]
    ]},
    'city-makkah': { city:'مكة المكرمة', items:[
      ['restaurant','البيك','مطعم وجبات سريعة وله فروع في مكة.','البيك مكة المكرمة',4.2],['restaurant','الطازج','مطعم يقدم وجبات الدجاج وأطباقًا متنوعة.','الطازج مكة المكرمة',4.1],['restaurant','الرومانسية','مطعم يقدم المأكولات السعودية.','الرومانسية مكة المكرمة',4.3],
      ['park','حديقة الملك عبدالله','حديقة عامة ومساحات للتنزه.','حديقة الملك عبدالله الشرائع مكة',4.0],['park','حديقة الجعرانة','مساحات خضراء وممرات للمشي.','حديقة الجعرانة مكة',4.1],['park','حدائق الحسينية','مساحات وحدائق عامة جنوب مكة.','حدائق الحسينية مكة',3.9],
      ['event','حي حراء الثقافي','وجهة ثقافية بجوار جبل حراء.','حي حراء الثقافي مكة',4.7],['event','معرض عمارة الحرمين','معرض يعرض تاريخ وعمارة الحرمين.','معرض عمارة الحرمين الشريفين مكة',4.8],['event','متحف مكة المكرمة','متحف للتعرف على تاريخ مكة وتراثها.','متحف مكة المكرمة',4.5]
    ]},
    'city-madinah': { city:'المدينة المنورة', items:[
      ['restaurant','البيك','مطعم وجبات سريعة وله فروع في المدينة.','البيك المدينة المنورة',4.2],['restaurant','الرومانسية','مطعم يقدم المأكولات السعودية.','الرومانسية المدينة المنورة',4.3],['restaurant','مطاعم طيبة','خيارات طعام وتقييمات قريبة من موقعك.','مطاعم طيبة المدينة المنورة',4.0],
      ['park','حديقة الملك فهد المركزية','حديقة عامة ومساحات مفتوحة للتنزه.','حديقة الملك فهد المركزية المدينة المنورة',4.4],['park','حديقة جبل أحد','مساحات للتنزه في منطقة جبل أحد.','حديقة جبل أحد المدينة المنورة',4.2],['park','حدائق قباء','مساحات عامة للتنزه حول منطقة قباء.','حدائق قباء المدينة المنورة',4.3],
      ['event','متحف السيرة النبوية','وجهة ثقافية للتعرف على السيرة النبوية.','متحف السيرة النبوية المدينة المنورة',4.8],['event','متحف دار المدينة','متحف يعرّف بتاريخ المدينة وتراثها.','متحف دار المدينة',4.6],['event','مسجد قباء والمنطقة المحيطة','وجهة تاريخية وروحانية.','مسجد قباء المدينة المنورة',4.9]
    ]},
    'city-abha': { city:'أبها', items:[
      ['restaurant','البيك','مطعم وجبات سريعة وله فرع في أبها.','البيك أبها',4.1],['restaurant','الرومانسية','مطعم للمأكولات السعودية.','الرومانسية أبها',4.2],['restaurant','كودو','مطعم وجبات وسندويتشات.','كودو أبها',4.0],
      ['park','حديقة أبو خيال','حديقة ذات إطلالات طبيعية على المدينة.','حديقة أبو خيال أبها',4.5],['park','حديقة الأندلس','حديقة حضرية للتنزه والاستراحة.','حديقة الأندلس أبها',4.2],['park','منتزه عسير الوطني','وجهة طبيعية في منطقة عسير.','منتزه عسير الوطني أبها',4.7],
      ['event','قرية المفتاحة','وجهة للفنون والثقافة والمعارض.','قرية المفتاحة أبها',4.6],['event','شارع الفن','ممشى ووجهة فنية في أبها.','شارع الفن أبها',4.4],['event','المدينة العالية','إطلالات ومقاهٍ ومطاعم.','المدينة العالية أبها',4.5]
    ]}
  };
  // ===== الصور: صور حقيقية بترخيص حر من ويكيميديا كومنز (المصدر والمصوّر في IMG_CREDITS) =====
  // الصور محفوظة داخل مجلد images (مصدرها ويكيميديا كومنز — انظري IMG_CREDITS)
  const IMG = {
    jeddah: 'jeddah.jpg',
    riyadh: 'riyadh.jpg',
    kingdomCentre: 'kingdomCentre.jpg',
    makkah: 'makkah.jpg',
    makkahNight: 'makkahNight.jpg',
    madinah: 'madinah.jpg',
    abha: 'abha.jpg',
    abhaView: 'abhaView.jpg',
    saleeg: 'saleeg.jpg',
    seafood: 'seafood.jpg',
    albaikMeal: 'albaikMeal.jpg',
    jeddahPark: 'jeddahPark.jpg',
    corniche: 'corniche.jpg',
    shallal: 'shallal.jpg',
    balad: 'balad.jpg',
    mashrabiya: 'mashrabiya.jpg',
    yacht: 'yacht.jpg',
    cornicheLawn: 'cornicheLawn.jpg',
    kabsa: 'kabsa.jpg',
    armenian: 'armenian.jpg',
    sushi: 'sushi.jpg',
    kingAbdullahPark: 'kingAbdullahPark.jpg',
    salamPark: 'salamPark.jpg',
    wadiHanifa: 'wadiHanifa.jpg',
    boulevard: 'boulevard.jpg',
    turaif: 'turaif.jpg',
    nationalMuseum: 'nationalMuseum.jpg',
    albaikStore: 'albaikStore.jpg',
    tazaj: 'tazaj.jpg',
    romansiah: 'romansiah.jpg',
    greenPark: 'greenPark.jpg',
    domePark: 'domePark.jpg',
    hira: 'hira.jpg',
    haramainExhibition: 'haramainExhibition.jpg',
    haramAerial: 'haramAerial.jpg',
    albaikMadinah: 'albaikMadinah.jpg',
    mandi: 'mandi.jpg',
    arabicCoffee: 'arabicCoffee.jpg',
    kingFahdPark: 'kingFahdPark.jpg',
    uhud: 'uhud.jpg',
    qubaPalms: 'qubaPalms.jpg',
    nabawiAerial: 'nabawiAerial.jpg',
    darMadinah: 'darMadinah.jpg',
    quba: 'quba.jpg',
    friedChicken: 'friedChicken.jpg',
    chickenKabsa: 'chickenKabsa.jpg',
    kudu: 'kudu.jpg',
    abhaClouds: 'abhaClouds.jpg',
    andalusPark: 'andalusPark.jpg',
    soudah: 'soudah.jpg',
    muftaha: 'muftaha.jpg',
    abhaGreen: 'abhaGreen.jpg'
  };
  // مصادر الصور وتراخيصها (مطلوبة لتراخيص المشاع الإبداعي)
  const IMG_CREDITS = [
    ['Jeddah_Waterfront,_Western_Saudi_Arabia_(2026).jpg','CC BY-SA 4.0'],['Riyadh_Skyline.jpg','B.alotaby · CC BY-SA 4.0'],['Kingdom_Centre_Riyadh_2024.jpeg','Hamza A. Durrani · CC BY-SA 4.0'],
    ['Great_Mosque_of_Mecca1.jpg','Saudipics.com · CC BY-SA 4.0'],['Mecca_at_night.jpg','عباد ديرانية · CC BY-SA 3.0'],["Masjid_Nabawi_The_Prophet's_Mosque,_Madina.jpg",'Muhammad Mahdi Karim · GFDL 1.2'],
    ['Cable_car_in_Abha.jpg','Aiman Alhaddad · CC BY-SA 3.0'],['Abha_47.jpg','Aiman titi · CC BY-SA 3.0'],['The_Hijazi_Saleeg.jpg','Sayom · CC BY-SA 4.0'],
    ['Plateau_van_zeevruchten.jpg','Frits Hoogesteger · CC BY-SA 3.0'],['Al_Baik_broast_chicken_meal.jpg','Efren Rodriguez · CC BY 2.0'],['Park,_Jeddah_Corniche_-_panoramio.jpg','alimkasim · CC BY 3.0'],
    ['Jeddah_Corniche_36.jpg','Tahir mq · CC BY-SA 4.0'],['Al_Shallal_Roller_Coaster_as_seen_from_the_AlShallal_Marine_Lake.jpg','Haseeb1608 · CC BY-SA 3.0'],['Old_Jeddah_(Al_Balad)_architecture_3_Feb_2022.jpg','Francisco Anzola · CC BY 2.0'],
    ['Mashrabiya_in_old_houses_of_Jeddah,_Saudi_Arabia.jpg','Francisco Anzola · CC BY 2.0'],['Jeddah_Yacht_Club_3.jpg','Kolaiel · CC0'],['Jeddah_Corniche_5.jpg','Tahir mq · CC BY-SA 4.0'],
    ['Kabsa.jpg','Basel15 · Public domain'],['Yerevan,_Lamb_and_mutton_dishes,_Armenian_cuisine,_Armenia.jpg','Vyacheslav Argenberg · CC BY 4.0'],['Sushi_platter.jpg','chidorian · CC BY-SA 2.0'],
    ['King_Abdullah_Park_Riyadh_entrance.jpg','Derivator2017 · CC BY-SA 4.0'],['Families_Salam_Park_Riyadh.jpg','Hamza A. Durrani · CC BY 4.0'],['Wadi_Hanifa.jpg','Ahmedpictures12 · CC BY-SA 4.0'],
    ['Boulevard_Riyadh_City.jpg','Humanized · CC0'],["At-Turaif_District_in_ad-Dir'iyah_(12).jpg",'Radosław Botev · CC BY 3.0 pl'],['National_Museum_Riyadh_(6781666263).jpg','Sammy Six · CC BY 2.0'],
    ['ALBAIK_البيك_(5244462567).jpg','Basheer Olakara · CC BY 2.0'],['Al_Tazaj_Buraidah.JPG','Abodi009 · CC BY-SA 3.0'],['Al-Romansiah_-_Mar_2011.JPG','Abodi009 · CC BY-SA 4.0'],
    ['Island_park_-_panoramio.jpg','juhotski · CC BY-SA 3.0'],['Al-Shallal_park,_Jeddah_-_panoramio.jpg','alimkasim · CC BY 3.0'],['Jabbal_An-Nour_(2024).jpg','Kaliper1 · CC BY-SA 4.0'],
    ['The_Two_Holy_Mosques_Architecture_Exhibition.jpg','Yasser.Bakhsh · CC BY-SA 4.0'],['Edited_Great_Mosque_of_Mecca1_5-2019-ccsa4.0_(cropped).jpg','Saudipics.com · CC BY-SA 4.0'],['Al_Baik_in_Medina_1.jpg','Abodi009 · CC BY-SA 3.0'],
    ['Chicken_Mandi_Rice_مندي_دجاج.JPG','Miansari66 · CC0'],['A_dallah_a_traditional_Arabic_coffee_pot_with_cups_and_coffee_beans.jpg','Canbel · CC BY-SA 4.0'],['حديقة_الملك_فهد_المركزية.jpg','99Abdullah99 · CC BY-SA 4.0'],
    ['Jabal-e-Uhud.jpg','Bintladen · CC BY-SA 4.0'],['Quba_Mosque_(2024).jpg','Kaliper1 · CC BY-SA 4.0'],["Al-Masjid_An-Nabawi_(Bird's_Eye_View).jpg",'Konevi · CC0'],
    ['Dar_al-Madinah_Museum_(Medina)_-_Facade.jpg','Abuhamzah 28 · CC BY-SA 4.0'],['Masjid_Quba_Mosque.jpg','Muhammad Mahdi Karim · GFDL 1.2'],['Fried-Chicken-Set.jpg','Evan-Amos · CC0'],
    ['Chicken_Kabsa.jpg','Bhj028 · CC0'],['KUDU_Restaurant.JPG','haitham alfalah · CC BY 3.0'],['Abha_15.jpg','Aiman titi · CC BY-SA 3.0'],
    ['حديقة_الأندلس.jpg','OmarMnm · CC BY-SA 3.0'],['Al_Sowda_Hill_top_06.jpg','Irshadpp · CC BY-SA 4.0'],['المفتاحة.jpg','Heritage Commission · CC BY-SA 4.0'],['Abha_33.jpg','Aiman titi · CC BY-SA 3.0']
  ];
  const typeLabel = {restaurant:'🍽️ مطاعم', park:'🌳 حدائق', event:'🎟️ فعاليات'};
  const typePhoto = {restaurant:IMG.kabsa, park:IMG.greenPark, event:IMG.balad};
  // صورة كل مكان باسمه (من خريطة IMG أعلاه)
  const placeImages = {
    'جدة': {'خيال':IMG.saleeg,'توينا للمأكولات البحرية':IMG.seafood,'البيك':IMG.albaikMeal,'حديقة الأمير ماجد':IMG.jeddahPark,'واجهة جدة البحرية':IMG.corniche,'حديقة الشلال':IMG.shallal,'جدة التاريخية – البلد':IMG.balad,'نادي جدة لليخوت':IMG.yacht,'واجهة روشن البحرية':IMG.cornicheLawn},
    'الرياض': {'قرية نجد':IMG.kabsa,'لوسين':IMG.armenian,'ميازو':IMG.sushi,'منتزه الملك عبدالله':IMG.kingAbdullahPark,'منتزه السلام':IMG.salamPark,'وادي حنيفة':IMG.wadiHanifa,'بوليفارد سيتي':IMG.boulevard,'الدرعية – الطريف':IMG.turaif,'المتحف الوطني السعودي':IMG.nationalMuseum},
    'مكة المكرمة': {'البيك':IMG.albaikStore,'الطازج':IMG.tazaj,'الرومانسية':IMG.romansiah,'حديقة الملك عبدالله':IMG.greenPark,'حديقة الجعرانة':IMG.domePark,'حدائق الحسينية':IMG.kingFahdPark,'حي حراء الثقافي':IMG.hira,'معرض عمارة الحرمين':IMG.haramainExhibition,'متحف مكة المكرمة':IMG.haramAerial},
    'المدينة المنورة': {'البيك':IMG.albaikMadinah,'الرومانسية':IMG.mandi,'مطاعم طيبة':IMG.arabicCoffee,'حديقة الملك فهد المركزية':IMG.kingFahdPark,'حديقة جبل أحد':IMG.uhud,'حدائق قباء':IMG.qubaPalms,'متحف السيرة النبوية':IMG.nabawiAerial,'متحف دار المدينة':IMG.darMadinah,'مسجد قباء والمنطقة المحيطة':IMG.quba},
    'أبها': {'البيك':IMG.friedChicken,'الرومانسية':IMG.chickenKabsa,'كودو':IMG.kudu,'حديقة أبو خيال':IMG.abhaClouds,'حديقة الأندلس':IMG.andalusPark,'منتزه عسير الوطني':IMG.soudah,'قرية المفتاحة':IMG.muftaha,'شارع الفن':IMG.abhaGreen,'المدينة العالية':IMG.abhaView}
  };
  function toast(message) { let b=$('#toast'); if(!b){b=document.createElement('div');b.id='toast';b.className='toast';document.body.appendChild(b);} b.innerHTML=`<i class="fa-solid fa-circle-check"></i><span>${esc(message)}</span>`;b.classList.add('show');clearTimeout(b._timer);b._timer=setTimeout(()=>b.classList.remove('show'),2800); }
  function showPage(id) { const p=document.getElementById(id); if(!p)return; $$('.page').forEach(x=>x.classList.remove('active'));p.classList.add('active');const navMap={home:'الرئيسية',cities:'المدن',schedule:'جدولي',community:'آراء الناس',map:'الخريطة',dashboard:'حسابي'};$$('.navbar nav button').forEach(b=>b.classList.toggle('current',b.textContent.trim()===navMap[id]));window.scrollTo({top:0,behavior:'smooth'});if(id==='dashboard')renderDashboard();if(id==='community')renderFeed();if(id==='login'&&$('#registerForm'))setAuthMode('login');if(id==='schedule'){renderTrips();renderTripCalendar();}if(id==='map'&&mapState.map)setTimeout(()=>mapState.map.invalidateSize(),120); }
  function requireLogin(next) { if(!user()){sessionStorage.setItem('anshidni_after_login',next);showPage('login');toast('يجب عليك تسجيل الدخول أولًا.');return false;}return true; }
  function navigate(id) { if(id==='schedule'||id==='addActivity'){if(!requireLogin(id))return;}showPage(id); }
  const citySearchAliases = {
    'جدة':'جدة','jeddah':'جدة','jdh':'جدة',
    'الرياض':'الرياض','riyadh':'الرياض',
    'مكة':'مكة المكرمة','مكة المكرمة':'مكة المكرمة','makkah':'مكة المكرمة','mecca':'مكة المكرمة',
    'المدينة':'المدينة المنورة','المدينة المنورة':'المدينة المنورة','medina':'المدينة المنورة','madinah':'المدينة المنورة',
    'أبها':'أبها','ابها':'أبها','abha':'أبها'
  };
  function renderTripCalendar() {
    const box=$('#tripCalendarDays'); if(!box) return;
    const trips=read(KEYS.trips,[]); const dates=new Set(trips.map(t=>t.date));
    $$('span',box).forEach(day=>{ day.classList.remove('trip-calendar-day','has-trip'); const n=day.textContent.trim(); if(dates.has(`2026-10-${n.padStart(2,'0')}`)||dates.has(n)){day.classList.add('trip-calendar-day','has-trip');} });
  }
  function exportCalendar() {
    if(!requireLogin('schedule')) return;
    const trips=read(KEYS.trips,[]); if(!trips.length) return toast('جدولك فارغ. أضف نشاطًا أولًا.');
    const dt=(date,time='09:00')=>{const d=new Date(`${date}T${time||'09:00'}`);return isNaN(d)?'20261010T090000':d.toISOString().replace(/[-:]/g,'').split('.')[0]+'Z';};
    const events=trips.map(t=>`BEGIN:VEVENT\nUID:${t.id}@anshidni\nDTSTAMP:${dt(new Date().toISOString().slice(0,10))}\nDTSTART:${dt(t.date,(t.time||'').split(' - ')[0])}\nDTEND:${dt(t.date,(t.time||'').split(' - ')[1]||'10:00')}\nSUMMARY:${String(t.title).replace(/[;,]/g,' ')}\nLOCATION:${String(t.city||'').replace(/[;,]/g,' ')}\nDESCRIPTION:${String(t.notes||'').replace(/[;,]/g,' ')}\nEND:VEVENT`).join('\n');
    const blob=new Blob([`BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Anshidni//Trip Calendar//AR\nCALSCALE:GREGORIAN\n${events}\nEND:VCALENDAR`],{type:'text/calendar;charset=utf-8'});
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='anshidni-trip.ics';a.click();URL.revokeObjectURL(a.href);toast('تم تحميل ملف التقويم. افتحه من جوالك لإضافته إلى التقويم.');
  }
  function searchCity() {
    const input=$('#homeSearch'); const value=input?.value.trim().toLowerCase(); if(!value)return toast('اكتب اسم مدينة بالعربي أو بالإنجليزي.');
    const key=Object.keys(citySearchAliases).find(k=>k.toLowerCase()===value || value.includes(k.toLowerCase()));
    if(key) { const city=citySearchAliases[key]; showPage(cityPages[city]); input.blur(); }
    else toast('لم نجد هذه المدينة. جرّب: جدة، الرياض، مكة، المدينة، أبها.');
  }

  function populateCityPages() {
    Object.entries(cityData).forEach(([id,data])=>{const page=document.getElementById(id);const grid=page?.querySelector('.extra-city-grid');if(!grid)return;grid.innerHTML=data.items.map((item,index)=>{const [type,name,desc,query,rating]=item;const image=(placeImages[data.city]||{})[name]||typePhoto[type];const map='https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(query);return `<article class="extra-place" data-type="${type}" data-city="${esc(data.city)}" data-name="${esc(name)}" data-description="${esc(desc)}" data-rating="${rating}" data-image="${image}" data-query="${esc(query)}"><img class="extra-place-image" src="${image}" alt="صورة ${esc(name)}"><div class="extra-place-body"><span>${typeLabel[type]}</span><h3>${esc(name)}</h3><p>${esc(desc)}</p><div class="place-rating">★ ${rating}</div><div class="extra-place-actions"><button type="button" class="extra-details-btn">عرض التفاصيل</button><a target="_blank" rel="noopener noreferrer" href="${map}">عرض الموقع على الخريطة ↗️</a></div></div></article>`;}).join('');});
  }
  function bindCityCards(){ $$('.city-card,.large-city-card').forEach(card=>{const open=()=>{const name=card.querySelector('h2,h3')?.textContent.trim();showPage(cityPages[name]||'cities');};card.setAttribute('role','button');card.setAttribute('tabindex','0');card.addEventListener('click',open);card.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open();}});}); }
  function bindNavigation(){ const nav={'الرئيسية':'home','المدن':'cities','الخريطة':'map','حسابي':'dashboard'}; $$('.navbar nav button').forEach(b=>b.addEventListener('click',()=>{const t=b.textContent.trim();if(t==='جدولي')return navigate('schedule');if(t==='حسابي'&&!requireLogin('dashboard'))return;navigate(b.dataset.page||nav[t]||'home');}));$('.profile-btn')?.addEventListener('click',()=>navigate(user()?'dashboard':'login'));$$('.extra-city-back').forEach(b=>b.addEventListener('click',()=>showPage('cities')));$$('.back-btn').forEach(b=>b.addEventListener('click',()=>showPage(b.classList.contains('dark')?'city':'cities')));}
  function bindFilters(){ $$('.extra-city-page').forEach(page=>$$('.extra-filter',page).forEach(b=>b.addEventListener('click',()=>{const t=b.textContent.includes('مطاعم')?'restaurant':b.textContent.includes('حدائق')?'park':b.textContent.includes('فعاليات')?'event':'all';$$('.extra-filter',page).forEach(x=>x.classList.remove('active'));b.classList.add('active');$$('.extra-place',page).forEach(c=>c.style.display=t==='all'||c.dataset.type===t?'':'none');}))); }

  function ensureModal(){ if($('#detailModal'))return; const m=document.createElement('div');m.id='detailModal';m.className='detail-modal';m.innerHTML=`<div class="detail-modal-box" role="dialog" aria-modal="true"><button class="modal-close" type="button">×</button><div id="detailContent"></div></div>`;document.body.appendChild(m);m.addEventListener('click',e=>{if(e.target===m||e.target.closest('.modal-close'))m.classList.remove('open');}); }
  function openDetails(card){ ensureModal(); const name=card.dataset.name, city=card.dataset.city, type=card.dataset.type, rating=card.dataset.rating, desc=card.dataset.description, image=card.dataset.image; const comments=read(KEYS.comments,[]).filter(c=>c.place===name&&c.city===city);$('#detailContent').innerHTML=`<img class="detail-image" src="${image}" alt="${esc(name)}"><div class="detail-body"><span class="category">${typeLabel[type]}</span><h2>${esc(name)}</h2><p>${esc(desc)}</p><div class="detail-rating"><strong>★ ${rating}</strong><span>${comments.length} تعليق</span></div><div class="detail-comments">${comments.length?comments.map(c=>`<p><b>${esc(c.author||'مستخدم')}</b> · ${'★'.repeat(Number(c.rating))}<br>${esc(c.text)} <small>(${esc(c.privacy)})</small></p>`).join(''):'<p class="empty-state">لا توجد تعليقات على هذا المكان حتى الآن.</p>'}</div><div class="detail-actions"><button class="main-btn" data-detail-add>أضف إلى جدولك</button><a class="secondary-btn" target="_blank" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name+' '+city)}">عرض الموقع</a></div><form id="placeReviewForm" class="place-review-form"><h3>أضف تعليقك وتقييمك</h3><div class="star-rating" id="placeReviewRating" role="radiogroup" aria-label="اختر تقييمك"><input type="hidden" value="0"><button type="button" data-star="1" aria-label="نجمة واحدة">★</button><button type="button" data-star="2" aria-label="نجمتان">★</button><button type="button" data-star="3" aria-label="ثلاث نجوم">★</button><button type="button" data-star="4" aria-label="أربع نجوم">★</button><button type="button" data-star="5" aria-label="خمس نجوم">★</button></div><textarea id="placeReviewText" required placeholder="اكتب تجربتك..."></textarea><button class="main-btn" type="submit">حفظ التعليق</button></form></div>`;$('#detailModal').classList.add('open');$$('#placeReviewForm [data-star]').forEach(star=>star.addEventListener('click',()=>{const value=Number(star.dataset.star);$('#placeReviewRating input').value=value;$$('#placeReviewForm [data-star]').forEach(x=>x.classList.toggle('selected',Number(x.dataset.star)<=value));}));$('#detailModal [data-detail-add]').addEventListener('click',()=>{const place={name,city,type,description:desc,image};if(!user()){sessionStorage.setItem('anshidni_pending_place',JSON.stringify(place));showPage('login');toast('سجّل الدخول لإضافة المكان إلى جدولك.');return;}openTripForm(place);});$('#placeReviewForm').addEventListener('submit',e=>{e.preventDefault();if(!requireLogin('dashboard'))return;const u=user(),items=read(KEYS.comments,[]);const chosenRating=Number($('#placeReviewRating input')?.value||0);if(!chosenRating)return toast('اختر عدد النجوم أولًا.');items.unshift({id:Date.now(),place:name,city,category:typeLabel[type],rating:chosenRating,text:$('#placeReviewText').value.trim(),privacy:u.privacy||'خاص',author:u.name,date:new Date().toLocaleDateString('ar-SA')});write(KEYS.comments,items);toast('تم حفظ تعليقك حسب خصوصية حسابك.');$('#detailModal').classList.remove('open');}); }

  function openTripForm(place){ensureModal();$('#detailContent').innerHTML=`<div class="detail-body trip-form"><h2>إضافة «${esc(place.name)}» إلى جدولي</h2><p>${esc(place.city)} · ${typeLabel[place.type]}</p><label>التاريخ<input id="tripDate" type="date" required></label><div class="two-inputs"><label>وقت البداية<input id="tripStart" type="time"></label><label>وقت النهاية<input id="tripEnd" type="time"></label></div><label>ملاحظات<textarea id="tripNotes" placeholder="ملاحظاتك..."></textarea></label><button class="main-btn" id="saveTripBtn" type="button">حفظ في الجدول</button></div>`;$('#detailModal').classList.add('open');$('#saveTripBtn').addEventListener('click',()=>{if(!requireLogin('dashboard'))return;const trips=read(KEYS.trips,[]);trips.unshift({id:Date.now(),title:place.name,city:place.city,type:place.type,date:$('#tripDate').value||'بدون تاريخ',time:`${$('#tripStart').value||''} - ${$('#tripEnd').value||''}`,notes:$('#tripNotes').value.trim()});write(KEYS.trips,trips);$('#detailModal').classList.remove('open');renderDashboard();toast('تمت إضافة المكان إلى جدولك.');});}
  function openEditTrip(trip){openTripForm({...trip,name:trip.title});$('#tripDate').value=trip.date==='بدون تاريخ'?'':trip.date;const times=(trip.time||'').split(' - ');$('#tripStart').value=times[0]||'';$('#tripEnd').value=times[1]||'';$('#tripNotes').value=trip.notes||'';$('#saveTripBtn').textContent='حفظ التعديل';$('#saveTripBtn').onclick=()=>{const trips=read(KEYS.trips,[]).map(x=>x.id===trip.id?{...x,date:$('#tripDate').value||'بدون تاريخ',time:`${$('#tripStart').value||''} - ${$('#tripEnd').value||''}`,notes:$('#tripNotes').value.trim()}:x);write(KEYS.trips,trips);$('#detailModal').classList.remove('open');renderDashboard();toast('تم تعديل الرحلة.');};}

  function renderTrips(){
    const trips=read(KEYS.trips,[]), list=$('#accountItinerary');
    if(list){ $('#statActivities').textContent=trips.length; list.innerHTML=trips.length?trips.map(t=>`<div class="account-list-item"><span class="list-icon">📍</span><div><strong>${esc(t.title)}</strong><small>${esc(t.city||'')} · ${esc(t.date)} · ${esc(t.time||'')}</small></div><button class="delete-item edit-trip" data-edit-trip="${t.id}">تعديل</button><button class="delete-item" data-delete-trip="${t.id}">حذف</button></div>`).join(''):'<p class="empty-state">لم تُضف أماكن إلى جدولك حتى الآن.</p>'; }
    const schedule=$('.activities');
    if(schedule){ schedule.innerHTML=trips.length?trips.map(t=>`<div class="activity"><div class="list-icon">📍</div><div><small>${esc(t.date)}</small><h3>${esc(t.title)}</h3><span>${esc(t.time||'')}</span></div><div class="activity-actions"><button type="button" class="edit-trip" data-edit-trip="${t.id}">تعديل</button><button type="button" data-delete-trip="${t.id}">حذف</button></div></div>`).join(''):'<p class="empty-state">جدولك فارغ. أضف الأماكن من «عرض التفاصيل» ثم «أضف إلى جدولك».</p>'; }
  }

  function renderComments(){const list=$('#commentsList');if(!list)return;const a=read(KEYS.comments,[]);$('#statComments').textContent=a.length;list.innerHTML=a.length?a.map(c=>`<article class="saved-item"><div class="saved-item-head"><div><strong>${esc(c.place)}</strong><small>${esc(c.category)} · ${'★'.repeat(Number(c.rating))} · ${c.privacy==='عام'?'🌍 عام':'🔒 خاص'}</small></div><button class="delete-item" data-delete-comment="${c.id}">حذف</button></div><p>${esc(c.text)}</p><time>${esc(c.date)}</time></article>`).join(''):'<p class="empty-state">لا توجد تعليقات محفوظة.</p>';}
  function openMemoryDetails(memory) {
    ensureModal();
    const comments=read(KEYS.memoryComments,[]).filter(c=>c.memoryId===memory.id);
    const imgs=(memory.images||((memory.image)?[memory.image]:[])).map(src=>`<img class="memory-detail-image" src="${src}" alt="${esc(memory.title)}">`).join('');
    $('#detailContent').innerHTML=`<div class="detail-body memory-detail"><span class="category">${memory.privacy==='عام'?'🌍 ذكرى عامة':'🔒 ذكرى خاصة'}</span><h2>${esc(memory.title)}</h2><div class="memory-detail-gallery">${imgs||'<p class="empty-state">لا توجد صور لهذه الذكرى.</p>'}</div><p class="memory-detail-text">${esc(memory.text)}</p><small>${esc(memory.date)}</small>${memory.privacy==='عام'?`<div class="memory-comments"><h3>تعليقات الناس</h3>${comments.length?comments.map(c=>`<p><b>${esc(c.author||'مستخدم')}</b>: ${esc(c.text)}</p>`).join(''):'<p class="empty-state">كن أول من يعلق.</p>'}<form id="memoryCommentForm"><textarea id="memoryCommentText" required placeholder="اكتب تعليقًا..."></textarea><button class="main-btn" type="submit">إرسال التعليق</button></form></div>`:''}</div>`;
    $('#detailModal').classList.add('open');
    $('#memoryCommentForm')?.addEventListener('submit',e=>{e.preventDefault();if(!requireLogin('dashboard'))return;const u=user(),items=read(KEYS.memoryComments,[]);items.push({id:Date.now(),memoryId:memory.id,author:u.name,text:$('#memoryCommentText').value.trim(),date:new Date().toLocaleDateString('ar-SA')});write(KEYS.memoryComments,items);openMemoryDetails(memory);toast('تم نشر تعليقك.');});
  }
  function renderMemories(){const list=$('#memoriesList');if(!list)return;const a=read(KEYS.memories,[]);$('#statMemories').textContent=a.length;list.innerHTML=a.length?a.map(m=>`<article class="saved-item memory-item" data-memory-id="${m.id}">${(m.images||((m.image)?[m.image]:[])).slice(0,3).map(src=>`<img src="${src}" alt="${esc(m.title)}">`).join('')}<div class="saved-item-head"><div><strong>${esc(m.title)}</strong><small class="privacy-badge ${m.privacy==='عام'?'public':'private'}">${m.privacy==='عام'?'🌍 عامة · اضغط لعرض التعليقات':'🔒 خاصة · اضغط لفتح الذكرى'}</small></div><button class="delete-item" data-delete-memory="${m.id}">حذف</button></div><p>${esc(m.text)}</p><time>${esc(m.date)}</time></article>`).join(''):'<p class="empty-state">لا توجد ذكريات بعد.</p>';}

  function renderPrivacy(){const u=user();if(!u)return;$$('input[name="accountPrivacy"]').forEach(r=>r.checked=r.value===(u.privacy||'خاص'));const h=$('#privacyHint');if(h)h.textContent=(u.privacy||'خاص')==='عام'?'يمكن لأي شخص رؤية منشوراتك وذكرياتك العامة.':'منشوراتك وذكرياتك تظهر لمتابعيك المقبولين فقط.';}
  function letterAvatar(name,email){ const colors=['#0f7f93','#8e4fc0','#e85bb5','#1aa3b8','#d98c0b','#2e9b67','#3467b5']; const c=colors[[...String(email||name)].reduce((a,ch)=>a+ch.charCodeAt(0),0)%colors.length]; const l=String(name||'؟').trim().charAt(0)||'؟'; return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="${c}"/><text x="50" y="50" dy=".36em" text-anchor="middle" font-family="Tahoma,Arial" font-size="48" font-weight="700" fill="#fff">${l.replace(/[<&>]/g,'')}</text></svg>`); }
  function renderDashboard(){const u=user();if(!u)return showPage('login');$('#accountName').textContent=u.name||'';$('#accountEmail').textContent=u.email;$('#accountAvatar')?.setAttribute('src',u.avatar||letterAvatar(u.name,u.email));$$('[data-social="instagram"]').forEach(a=>a.href=u.instagram||'#');$$('[data-social="twitter"]').forEach(a=>a.href=u.twitter||'#');renderPrivacy();renderTrips();renderTripCalendar();renderComments();renderMemories();renderProfileExtras();}
  function editProfile(){const u=user();if(!u)return showPage('login');ensureModal();const cities=['جدة','الرياض','مكة المكرمة','المدينة المنورة','أبها','السعودية'];$('#detailContent').innerHTML=`<div class="detail-body profile-editor"><h2>تعديل الملف الشخصي</h2><label>الاسم<input id="profileName" value="${esc(u.name||'')}" required></label><label>نبذة عني<textarea id="profileBio" maxlength="160" placeholder="عرّف بنفسك في سطر">${esc(u.bio||'')}</textarea></label><label>مدينتي<select id="profileCity">${cities.map(c=>`<option ${c===(u.city||'السعودية')?'selected':''}>${c}</option>`).join('')}</select></label><label>رابط إنستغرام<input id="profileInstagram" type="url" value="${esc(u.instagram||'')}" placeholder="https://instagram.com/..."></label><label>رابط إكس / تويتر<input id="profileTwitter" type="url" value="${esc(u.twitter||'')}" placeholder="https://x.com/..."></label><label>الصورة الشخصية<input id="profileAvatar" type="file" accept="image/*"></label><label>صورة الغلاف<input id="profileCover" type="file" accept="image/*"></label><button class="main-btn" id="saveProfileBtn" type="button">حفظ الملف</button></div>`;$('#detailModal').classList.add('open');$('#saveProfileBtn').addEventListener('click',async()=>{const af=$('#profileAvatar').files?.[0],cf=$('#profileCover').files?.[0];const avatar=af?await compressImage(af,400,.82):(u.avatar||'');const cover=cf?await compressImage(cf,1400,.78):(u.cover||'');const next={...user(),name:$('#profileName').value.trim()||u.name,bio:$('#profileBio').value.trim(),city:$('#profileCity').value,instagram:$('#profileInstagram').value.trim(),twitter:$('#profileTwitter').value.trim(),avatar,cover};write(KEYS.user,next);$('#detailModal').classList.remove('open');renderDashboard();toast('تم تحديث ملفك.');});}
  function bindImagePreview(){
    const input = $('#memoryImages');
    const preview = $('#memoryPreview');
    const hint = $('#memoryImagesHint');
    if(!input || !preview) return;
    input.addEventListener('change', () => {
      preview.innerHTML = '';
      const files = [...input.files];
      if(!files.length){ if(hint) hint.textContent='حتى 8 صور، وتظهر معاينتها هنا قبل الحفظ.'; return; }
      if(hint) hint.textContent = `تم اختيار ${files.length} ${files.length === 1 ? 'صورة' : 'صور'}.`;
      files.slice(0, 8).forEach(file => {
        if(!file.type.startsWith('image/')) return;
        const url = URL.createObjectURL(file);
        const img = document.createElement('img');
        img.className = 'memory-preview-image';
        img.src = url;
        img.alt = file.name;
        img.onload = () => URL.revokeObjectURL(url);
        preview.appendChild(img);
      });
    });
  }
  function bindImageFallbacks(){
    document.addEventListener('error', e => {
      const image = e.target;
      if(image.tagName !== 'IMG' || image.dataset.fallbackApplied || image.closest('.leaflet-container')) return;
      if(!image.dataset.retried && !image.src.startsWith('data:')){ image.dataset.retried='1'; const src=image.getAttribute('src'); setTimeout(()=>{ image.src=src; },700); return; }
      image.dataset.fallbackApplied = '1';
      image.src = 'anshidni-icon-transparent.png';
      image.classList.add('image-fallback');
    }, true);
  }

  // ===== تسجيل الدخول وإنشاء الحساب =====
  async function hashPass(p){ const s='anshidni:'+p; try { const b=await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)); return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join(''); } catch { let h=5381; for(const c of s) h=((h<<5)+h+c.charCodeAt(0))|0; return 'h'+(h>>>0).toString(16); } }
  const validEmail = e => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);
  function authError(form, msg){ const box=$('.form-error', form); if(box){ box.textContent=msg; box.hidden=!msg; } if(msg) form.classList.remove('shake'), void form.offsetWidth, form.classList.add('shake'); }
  function setAuthMode(mode){ const reg=mode==='register'; $('#loginForm').hidden=reg; $('#registerForm').hidden=!reg; $$('.auth-tab').forEach(b=>b.classList.toggle('active',b.dataset.authMode===mode)); $('#authTitle').textContent=reg?'أنشئ حسابك':'مرحبًا بعودتك'; $('#authSubtitle').textContent=reg?'انضم إلى انشدني وشارك تجاربك في السعودية.':'سجّل الدخول لمتابعة رحلاتك.'; authError($('#loginForm'),''); authError($('#registerForm'),''); if(document.querySelector('#login.active')) $(reg?'#regName':'#email')?.focus({preventScroll:true}); }
  function startSession(email){ localStorage.setItem(SESSION_KEY, email); const pending=sessionStorage.getItem('anshidni_pending_place'); sessionStorage.removeItem('anshidni_pending_place'); const next=sessionStorage.getItem('anshidni_after_login')||'dashboard'; sessionStorage.removeItem('anshidni_after_login'); renderFeed(); updateAccountButton(); if(pending){ showPage('dashboard'); openTripForm(JSON.parse(pending)); } else showPage(next); }
  function logout(){ localStorage.removeItem(SESSION_KEY); updateAccountButton(); renderFeed(); showPage('home'); toast('تم تسجيل الخروج.'); }
  function updateAccountButton(){ const u=user(); $$('.navbar .profile-btn, .navbar [data-account-btn]').forEach(b=>{ b.title=u?`حسابي (${u.name})`:'تسجيل الدخول'; }); }
  function bindAuth(){
    $$('.auth-tab, [data-auth-mode]').forEach(b=>b.addEventListener('click',()=>setAuthMode(b.dataset.authMode)));
    $$('[data-toggle-pass]').forEach(b=>b.addEventListener('click',()=>{ const i=$(b.dataset.togglePass); const show=i.type==='password'; i.type=show?'text':'password'; b.innerHTML=show?'<i class="fa-regular fa-eye-slash"></i>':'<i class="fa-regular fa-eye"></i>'; b.setAttribute('aria-label',show?'إخفاء كلمة المرور':'إظهار كلمة المرور'); }));
    $('#loginForm')?.addEventListener('submit',async e=>{ e.preventDefault(); const f=e.target; const email=$('#email').value.trim().toLowerCase(), pass=$('#password').value;
      if(!validEmail(email)) return authError(f,'أدخل بريدًا إلكترونيًا صحيحًا.');
      if(!pass) return authError(f,'أدخل كلمة المرور.');
      const all=accounts(); const acc=all[email];
      if(!acc) return authError(f,'لا يوجد حساب بهذا البريد. يمكنك إنشاء حساب جديد.');
      const h=await hashPass(pass);
      if(acc.passHash && acc.passHash!==h) return authError(f,'كلمة المرور غير صحيحة.');
      if(!acc.passHash){ acc.passHash=h; rawWrite(ACC_KEY,all); }
      authError(f,''); f.reset(); startSession(email); toast(`أهلًا ${acc.name||''} 👋`); });
    $('#registerForm')?.addEventListener('submit',async e=>{ e.preventDefault(); const f=e.target; const name=$('#regName').value.trim(), email=$('#regEmail').value.trim().toLowerCase(), pass=$('#regPassword').value, pass2=$('#regPassword2').value;
      if(name.length<2) return authError(f,'أدخل اسمك (حرفان على الأقل).');
      if(!validEmail(email)) return authError(f,'أدخل بريدًا إلكترونيًا صحيحًا.');
      if(pass.length<6) return authError(f,'كلمة المرور يجب أن تكون 6 أحرف على الأقل.');
      if(pass!==pass2) return authError(f,'كلمتا المرور غير متطابقتين.');
      const all=accounts(); if(all[email]) return authError(f,'هذا البريد مسجّل مسبقًا. سجّل الدخول بدلًا من ذلك.');
      all[email]={ name, email, passHash: await hashPass(pass), privacy:'عام', city:'السعودية', joined:new Date().toISOString().slice(0,10) };
      if(!rawWrite(ACC_KEY,all)) return; authError(f,''); f.reset(); sessionStorage.setItem('anshidni_after_login', sessionStorage.getItem('anshidni_after_login')||'dashboard'); startSession(email); toast('تم إنشاء حسابك بنجاح 🎉'); });
  }
  function bindForms(){ bindAuth();$('#memoryForm')?.addEventListener('submit',async e=>{e.preventDefault();const files=[...($('#memoryImages')?.files||[])];if(files.length>8)return toast('الحد الأقصى 8 صور.');const images=await Promise.all(files.filter(f=>f.type.startsWith('image/')).map(f=>compressImage(f)));const a=read(KEYS.memories,[]);a.unshift({id:Date.now(),title:$('#memoryTitle').value.trim(),text:$('#memoryText').value.trim(),privacy:$('input[name="memoryPrivacy"]:checked')?.value||'خاص',images,date:new Date().toLocaleDateString('ar-SA')});write(KEYS.memories,a);e.target.reset();renderMemories();toast('تم حفظ الذكرى مع صورها.');});;$('#commentForm')?.addEventListener('submit',e=>{e.preventDefault();const u=user();if(!u)return showPage('login');const a=read(KEYS.comments,[]);a.unshift({id:Date.now(),place:$('#commentPlace').value.trim(),city:'',category:$('#commentCategory').value,rating:$('#commentRating').value,text:$('#commentText').value.trim(),privacy:u.privacy||'خاص',author:u.name,date:new Date().toLocaleDateString('ar-SA')});write(KEYS.comments,a);e.target.reset();renderComments();toast('تم حفظ تعليقك.');});$('#logoutBtn')?.addEventListener('click',logout);$$('input[name="accountPrivacy"]').forEach(r=>r.addEventListener('change',()=>{const u=user();if(!u)return;u.privacy=r.value;write(KEYS.user,u);renderPrivacy();renderProfileExtras();renderFeed();toast(r.value==='عام'?'أصبح حسابك عامًا 🌍':'أصبح حسابك خاصًا 🔒');}));}

  let mapState = { map:null, markers:[] };
  const cityCenters = { 'جدة':[21.5433,39.1728], 'الرياض':[24.7136,46.6753], 'مكة المكرمة':[21.3891,39.8579], 'المدينة المنورة':[24.5247,39.5692], 'أبها':[18.2164,42.5053] };
  const markerColors = { restaurant:['#d94f4f','#e8753f','#bd3b74'], park:['#2e9b67','#168a91','#73a942'], event:['#6e55c5','#3467b5','#b04b91'] };
  function markerIcon(type, index) { const color=markerColors[type][index%3]; return L.divIcon({className:'custom-map-marker',html:`<span style="background:${color};border-color:${color}"></span>`,iconSize:[28,38],iconAnchor:[14,38],popupAnchor:[0,-35]}); }
  function initializeMap() {
    if (!window.L || !$('#realMap')) return;
    mapState.map = L.map('realMap',{zoomControl:true,minZoom:4,maxZoom:17}).setView([23.8859,45.0792], 5);
    // خريطة أساسية مضمّنة تعمل حتى بدون إنترنت
    if(window.ANSHIDNI_BASEMAP){ L.geoJSON(window.ANSHIDNI_BASEMAP,{interactive:false,style:f=>f.properties.sa?{color:'#0f7f93',weight:1.6,fillColor:'#e3f4f1',fillOpacity:1}:{color:'#c9d6d9',weight:1,fillColor:'#f6f3ec',fillOpacity:1}}).addTo(mapState.map); }
    Object.entries(cityCenters).forEach(([name,c])=>L.marker(c,{interactive:false,icon:L.divIcon({className:'city-label',html:`<span class="${name==='جدة'?'lbl-west':name==='مكة المكرمة'?'lbl-east':''}">${esc(name)}</span>`,iconSize:null})}).addTo(mapState.map));
    // طبقة OpenStreetMap التفصيلية عند توفر الإنترنت، وإن لم تتوفر تبقى الخريطة الأساسية
    let tileErrors=0, tileOk=false;
    const tiles=L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap',className:'osm-tiles'});
    tiles.on('tileload',()=>{tileOk=true;}).on('tileerror',()=>{ if(!tileOk && ++tileErrors>=3 && mapState.map.hasLayer(tiles)) mapState.map.removeLayer(tiles); });
    tiles.addTo(mapState.map);
    Object.values(cityData).forEach(data => {
      const center=cityCenters[data.city]||[23.8859,45.0792];
      data.items.forEach((item,i)=>{
        const [type,name,desc,query,rating]=item; const sameTypeIndex=data.items.slice(0,i).filter(x=>x[0]===type).length;
        const coords=[center[0]+(i%3-1)*.012+(Math.floor(i/3)*.004), center[1]+(i%3-1)*.014];
        const marker=L.marker(coords,{icon:markerIcon(type,sameTypeIndex)}).addTo(mapState.map);
        marker._type=type; marker._name=name; marker._city=data.city;
        marker.bindPopup(`<strong>${esc(name)}</strong><br><small>${typeLabel[type]} · ★ ${rating}</small><br><button class="map-detail-link" data-map-place="${esc(name)}" data-map-city="${esc(data.city)}">عرض التفاصيل</button>`);
        mapState.markers.push(marker);
      });
    });
    mapState.map.on('popupopen', e => { const btn=e.popup.getElement()?.querySelector('[data-map-place]'); if(btn) btn.addEventListener('click',()=>{const card=$$(`.extra-place[data-name="${CSS.escape(btn.dataset.mapPlace)}"]`)[0]; if(card) openDetails(card);}); });
  }
  function filterMap(type) { mapState.markers.forEach(marker=>{const visible=type==='all'||marker._type===type;if(visible)marker.addTo(mapState.map);else mapState.map.removeLayer(marker);}); }
  function focusMapSearch() { const q=$('#mapSearch')?.value.trim(); if(!q)return; const marker=mapState.markers.find(m=>m._name.includes(q)||m._city.includes(q)); if(marker){mapState.map.setView(marker.getLatLng(),14);marker.openPopup();}else toast('لم أجد هذا المكان على الخريطة.'); }

  function bindActions(){document.addEventListener('click',e=>{const card=e.target.closest('.extra-place');if(card&&e.target.closest('.extra-details-btn'))return openDetails(card);const del=e.target.closest('[data-delete-comment],[data-delete-memory],[data-delete-trip]');if(del){const key=del.dataset.deleteComment?'comments':del.dataset.deleteMemory?'memories':'trips',id=del.dataset.deleteComment||del.dataset.deleteMemory||del.dataset.deleteTrip;write(KEYS[key],read(KEYS[key],[]).filter(x=>String(x.id)!==id));renderDashboard();toast('تم الحذف.');}const memory=e.target.closest('[data-memory-id]');if(memory&&!e.target.closest('[data-delete-memory]')){const m=read(KEYS.memories,[]).find(x=>String(x.id)===memory.dataset.memoryId);if(m)openMemoryDetails(m);}const edit=e.target.closest('[data-edit-trip]');if(edit){const t=read(KEYS.trips,[]).find(x=>String(x.id)===edit.dataset.editTrip);if(t)openEditTrip(t);}});$('#editProfileBtn')?.addEventListener('click',editProfile);$('.search-box button')?.addEventListener('click',searchCity);$('#homeSearch')?.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();searchCity();}});$$('.schedule-header .main-btn,.calendar .secondary-btn').forEach(b=>b.addEventListener('click',()=>navigate('addActivity')));$('[data-export-calendar]')?.addEventListener('click',exportCalendar);$$('[data-map-filter]').forEach(b=>b.addEventListener('click',()=>filterMap(b.dataset.mapFilter)));$('#mapSearch')?.addEventListener('keydown',e=>{if(e.key==='Enter')focusMapSearch();});$('#addActivity .main-btn')?.addEventListener('click',()=>{if(!requireLogin('addActivity'))return;const trips=read(KEYS.trips,[]);trips.unshift({id:Date.now(),title:$('.selected-place h3')?.textContent.trim()||'نشاط جديد',city:'جدة',type:'event',date:$('#activityDate').value||'بدون تاريخ',time:`${$('#startTime').value||''} - ${$('#endTime').value||''}`,notes:$('#activityNotes').value.trim()});write(KEYS.trips,trips);showPage('success');});}

  /* =========================================================
     الحسابات، الملف الشخصي، المتابعة، وآراء الناس
  ========================================================= */
  const SKEYS = { posts:'anshidni_posts', likes:'anshidni_post_likes', postComments:'anshidni_post_comments', follows:'anshidni_follows' };
  const DAY = 864e5;
  const demoUsers = {
    sara:  { id:'sara',  name:'سارة العتيبي', handle:'sara.travels', privacy:'عام', city:'جدة', bio:'أحب البحر والقهوة والأماكن القديمة 🌊☕ أشارك تجاربي في جدة والرياض.', cover:IMG.corniche, color:'#1aa3b8', joined:'2025-03-10', followers:214, following:96,
      memories:[{id:'sm1',title:'مغرب على الكورنيش',text:'أجمل غروب شفته هذي السنة، والجو كان رائع.',privacy:'عام',images:[IMG.corniche,IMG.cornicheLawn],date:'2026-09-12'},{id:'sm2',title:'يوم في البلد',text:'تمشيت بين البيوت القديمة والرواشين.',privacy:'عام',images:[IMG.balad,IMG.mashrabiya],date:'2026-08-02'},{id:'sm3',title:'عشاء العائلة',text:'ليلة حلوة مع الأهل.',privacy:'خاص',images:[],date:'2026-07-01'}] },
    fahad: { id:'fahad', name:'فهد الشهري', handle:'fahad.abha', privacy:'عام', city:'أبها', bio:'من أبها 🏔️ أحب الجبال والضباب والأكل الشعبي.', cover:IMG.abhaView, color:'#8e4fc0', joined:'2024-11-21', followers:389, following:142,
      memories:[{id:'fm1',title:'التلفريك',text:'ركبنا التلفريك والسحاب تحتنا!',privacy:'عام',images:[IMG.abha,IMG.abhaClouds],date:'2026-08-20'}] },
    noura: { id:'noura', name:'نورة القحطاني', handle:'noura.q', privacy:'خاص', city:'الرياض', bio:'رحلاتي ويومياتي ✈️', cover:IMG.riyadh, color:'#e85bb5', joined:'2025-06-05', followers:57, following:61,
      memories:[{id:'nm1',title:'بوليفارد',text:'سهرة مع البنات.',privacy:'عام',images:[IMG.boulevard],date:'2026-10-01'}] }
  };
  const seedPosts = [
    {id:'p1',authorId:'sara',city:'جدة',type:'park',place:'واجهة جدة البحرية',rating:5,text:'الممشى نظيف ومرتب، أنصح فيه وقت المغرب. فيه أماكن جلوس كثيرة ومناسب للعوائل.',images:[IMG.corniche],ago:1,likes:24},
    {id:'p2',authorId:'fahad',city:'أبها',type:'event',place:'قرية المفتاحة',rating:5,text:'المكان فيه معارض فنية وألوان تراثية حلوة، والجو في أبها خيالي هالأيام.',images:[IMG.muftaha,IMG.abhaGreen],ago:2,likes:31},
    {id:'p3',authorId:'sara',city:'جدة',type:'restaurant',place:'البيك',rating:4,text:'الوجبة ما تتغير، دايمًا لذيذة 😋 الزحمة كانت خفيفة وقت الظهر.',images:[IMG.albaikMeal],ago:3,likes:18},
    {id:'p4',authorId:'fahad',city:'الرياض',type:'event',place:'الدرعية – الطريف',rating:5,text:'زيارة الطريف تجربة لازم تسويها، التصاميم النجدية القديمة تاخذ العقل.',images:[IMG.turaif],ago:5,likes:42},
    {id:'p5',authorId:'noura',city:'الرياض',type:'restaurant',place:'لوسين',rating:5,text:'أطباق أرمنية لذيذة والخدمة ممتازة، أكيد بنرجع له.',images:[IMG.armenian],ago:2,likes:9},
    {id:'p6',authorId:'sara',city:'الرياض',type:'park',place:'منتزه السلام',rating:4,text:'مساحات خضراء واسعة، مناسب للمشي مع الأطفال.',images:[IMG.salamPark],ago:8,likes:12}
  ];
  const seedComments = [
    {id:'c1',postId:'p1',authorId:'fahad',text:'صدقتي، الكورنيش وقت المغرب شي ثاني 👌',ago:1},
    {id:'c2',postId:'p2',authorId:'sara',text:'ودي أزورها الشتاء الجاي!',ago:2},
    {id:'c3',postId:'p4',authorId:'sara',text:'أفضل مكان زرته في الرياض.',ago:4}
  ];
  const palette=['#0f7f93','#8e4fc0','#e85bb5','#1aa3b8','#d98c0b','#2e9b67','#3467b5'];
  const colorFor = s => palette[[...String(s)].reduce((a,c)=>a+c.charCodeAt(0),0)%palette.length];
  const handleOf = email => String(email||'user').split('@')[0].toLowerCase();
  function accountProfile(email){ const a=accounts()[email]; if(!a) return null; return { id:email===session()?'me':'acc:'+email, email, name:a.name||handleOf(email), handle:handleOf(email), privacy:a.privacy||'خاص', city:a.city||'السعودية', bio:a.bio||'', cover:a.cover||'', avatar:a.avatar||'', color:colorFor(email), joined:a.joined||'', instagram:a.instagram, twitter:a.twitter, memories:rawRead('anshidni_memories::'+email,[]) }; }
  const ME = () => session() ? accountProfile(session()) : null;
  const authorIdFor = email => !email ? null : email===session() ? 'me' : accounts()[email] ? 'acc:'+email : null;
  const idToEmail = id => id==='me' ? session() : String(id).startsWith('acc:') ? id.slice(4) : null;
  const getUser = id => id==='me' ? ME() : String(id).startsWith('acc:') ? accountProfile(id.slice(4)) : demoUsers[id];
  const isOwner = id => id==='me' && !!session();
  // المتابعة: {from: بريد المتابِع, to: معرّف الحساب (بريد أو حساب مقترح), status: accepted | pending}
  const follows = () => rawRead(SKEYS.follows,[]);
  const targetKey = id => idToEmail(id) || id;
  const followStatus = (fromEmail, id) => { if(!fromEmail) return null; const t=targetKey(id); return follows().find(f=>f.from===fromEmail&&f.to===t)?.status || null; };
  const followerCount = id => { const p=getUser(id); const t=targetKey(id); return (p?.followers||0)+follows().filter(f=>f.to===t&&f.status==='accepted').length; };
  const followingCount = id => { const p=getUser(id); const e=idToEmail(id); return (p?.following||0)+(e?follows().filter(f=>f.from===e&&f.status==='accepted').length:0); };
  // الخصوصية: محتوى الحساب الخاص يراه صاحبه والمتابعون المقبولون فقط
  const canSeeContent = (profile, viewerIsOwner) => viewerIsOwner || profile.privacy==='عام' || followStatus(session(), profile.id)==='accepted';

  function timeAgo(ts){ const d=Math.max(0,Date.now()-ts), m=Math.floor(d/6e4), h=Math.floor(m/60), dd=Math.floor(h/24);
    if(m<1) return 'الآن'; if(m<60) return `منذ ${m} دقيقة`; if(h<24) return `منذ ${h} ساعة`; if(dd===1) return 'أمس'; if(dd<30) return `منذ ${dd} يوم`; return new Date(ts).toLocaleDateString('ar-SA'); }
  function joinedText(d){ if(!d) return 'انضم حديثًا'; const dt=new Date(d); return isNaN(dt)?'انضم حديثًا':'انضم في '+dt.toLocaleDateString('ar-SA-u-ca-gregory',{month:'long',year:'numeric'}); }
  function avatarHTML(p, cls='avatar-badge'){ if(!p) return `<span class="${cls}"><i class="fa-solid fa-user"></i></span>`; if(p.avatar) return `<img class="${cls}" src="${p.avatar}" alt="${esc(p.name)}">`; return `<span class="${cls}" style="--av:${p.color||'#0f7f93'}">${esc((p.name||'؟').trim().charAt(0))}</span>`; }
  function starsHTML(n){ n=Number(n)||0; return `<span class="post-stars" aria-label="${n} من 5">${'★'.repeat(n)}<span class="off">${'★'.repeat(5-n)}</span></span>`; }
  const safeWrite = (key, value) => write(key, value);
  // تصغير الصور قبل الحفظ
  function compressImage(file, max=1000, q=.78){ return new Promise(resolve=>{ const fr=new FileReader(); fr.onload=()=>{ const im=new Image(); im.onload=()=>{ const s=Math.min(1,max/Math.max(im.width,im.height)); const c=document.createElement('canvas'); c.width=Math.round(im.width*s); c.height=Math.round(im.height*s); c.getContext('2d').drawImage(im,0,0,c.width,c.height); resolve(c.toDataURL('image/jpeg',q)); }; im.onerror=()=>resolve(fr.result); im.src=fr.result; }; fr.readAsDataURL(file); }); }

  function allPosts(){
    const local=rawRead(SKEYS.posts,[]).map(p=>({...p,authorId:authorIdFor(p.authorEmail)})).filter(p=>p.authorId);
    const seeds=seedPosts.map((p,i)=>({...p,ts:Date.now()-p.ago*DAY-(i+1)*36e5}));
    return [...local,...seeds].sort((a,b)=>b.ts-a.ts);
  }
  function postComments(postId){
    const seeds=seedComments.filter(c=>c.postId===postId).map(c=>({...c,ts:Date.now()-c.ago*DAY+36e5}));
    const local=rawRead(SKEYS.postComments,[]).filter(c=>c.postId===postId).map(c=>({...c,authorId:authorIdFor(c.authorEmail)}));
    return [...seeds,...local].sort((a,b)=>a.ts-b.ts);
  }
  function postVisible(p){ const a=getUser(p.authorId); if(!a) return false; return canSeeContent(a, isOwner(p.authorId)); }
  function likesOf(postId){ return rawRead('anshidni_post_likes_all',{})[postId]||[]; }

  function postCardHTML(p, opts={}){
    const a=getUser(p.authorId)||{name:'مستخدم',handle:'user'};
    const likers=likesOf(p.id); const liked=!!session()&&likers.includes(session()); const likeCount=(p.likes||0)+likers.length;
    const comments=postComments(p.id); const mine=p.authorId==='me' && !opts.readonly;
    const imgs=(p.images||[]).slice(0,4);
    const ownPrivate = p.authorId==='me' && !opts.readonly && a.privacy==='خاص';
    return `<article class="post-card" data-post-id="${p.id}">
      <header class="post-head">
        <button class="post-author" type="button" data-open-profile="${esc(p.authorId)}">${avatarHTML(a)}<span><strong>${esc(a.name)}</strong><small>@${esc(a.handle)} · ${timeAgo(p.ts)}</small></span></button>
        ${mine?`<button class="delete-item" type="button" data-delete-post="${p.id}">حذف</button>`:''}
      </header>
      ${ownPrivate?'<p class="post-private-note">🔒 يظهر لمتابعيك فقط</p>':''}
      <div class="post-place"><span class="category">${typeLabel[p.type]||''}</span> <b>${esc(p.place)}</b> · <span>${esc(p.city)}</span> ${starsHTML(p.rating)}</div>
      <p class="post-text">${esc(p.text)}</p>
      ${imgs.length?`<div class="post-images n${imgs.length}">${imgs.map(src=>`<img src="${src}" alt="صورة من ${esc(p.place)}" data-zoom>`).join('')}</div>`:''}
      <footer class="post-actions">
        <button type="button" class="like-btn ${liked?'liked':''}" data-like="${p.id}" aria-pressed="${liked}" aria-label="إعجاب"><i class="fa-${liked?'solid':'regular'} fa-heart"></i> <span>${likeCount}</span></button>
        <button type="button" class="comment-toggle" data-toggle-comments="${p.id}" aria-label="الردود"><i class="fa-regular fa-comment"></i> <span>${comments.length}</span></button>
      </footer>
      <div class="post-comments" ${opts.openComments?'':'hidden'}>
        ${comments.map(c=>{const ca=c.authorId?getUser(c.authorId):null;const name=ca?ca.name:(c.author||'مستخدم');return `<div class="post-comment">${avatarHTML(ca||{name,color:'#5b7d8a'},'avatar-badge small')}<div><b>${esc(name)}</b> <small>${timeAgo(c.ts)}</small><p>${esc(c.text)}</p></div></div>`;}).join('')||'<p class="empty-state">لا توجد ردود بعد.</p>'}
        <form class="post-comment-form" data-comment-form="${p.id}"><input required maxlength="300" placeholder="اكتب ردًّا..." aria-label="اكتب ردًّا"><button class="main-btn" type="submit">رد</button></form>
      </div>
    </article>`;
  }

  const feedState = { type:'all', city:'all' };
  function renderFeed(){
    const list=$('#feedList'); if(!list) return;
    const posts=allPosts().filter(postVisible).filter(p=>(feedState.type==='all'||p.type===feedState.type)&&(feedState.city==='all'||p.city===feedState.city));
    list.innerHTML=posts.length?posts.map(p=>postCardHTML(p)).join(''):'<p class="empty-state">لا توجد منشورات في هذا التصنيف حتى الآن.</p>';
    const me=ME(); const av=$('#composerAvatar'); if(av) av.outerHTML=avatarHTML(me,'avatar-badge').replace('class="avatar-badge"','id="composerAvatar" class="avatar-badge"');
    const vis=$('#postVisibility'); if(vis) vis.textContent=!me?'سجّل الدخول لمشاركة تجربتك.':me.privacy==='عام'?'🌍 يظهر للجميع':'🔒 يظهر لمتابعيك فقط';
    renderSuggested();
  }
  function renderSuggested(){
    const box=$('#demoAccounts'); if(!box) return;
    const locals=Object.keys(accounts()).filter(e=>e!==session()).map(accountProfile);
    const list=[...locals,...Object.values(demoUsers)];
    box.innerHTML=list.map(u=>`<button type="button" class="demo-account" data-open-profile="${esc(u.id)}">${avatarHTML(u)}<span><strong>${esc(u.name)}</strong><small>@${esc(u.handle)}</small></span><em class="privacy-pill ${u.privacy==='عام'?'public':'private'}">${u.privacy==='عام'?'🌍 عام':'🔒 خاص'}</em></button>`).join('');
  }
  function renderMyPosts(){
    const box=$('#myPostsList'); if(!box) return;
    const mine=allPosts().filter(p=>p.authorId==='me');
    const st=$('#statPosts'); if(st) st.textContent=mine.length;
    box.innerHTML=mine.length?mine.map(p=>postCardHTML(p)).join(''):'<p class="empty-state">لا توجد منشورات بعد. شارك أول تجربة لك من صفحة «آراء الناس».</p>';
  }
  function renderFollowRequests(){
    const box=$('#followRequests'); if(!box) return; const me=session();
    const reqs=follows().filter(f=>f.to===me&&f.status==='pending');
    box.hidden=!reqs.length;
    box.innerHTML=reqs.length?`<strong><i class="fa-solid fa-user-clock"></i> طلبات المتابعة (${reqs.length})</strong>`+reqs.map(r=>{const p=accountProfile(r.from)||{name:r.from,handle:handleOf(r.from)};return `<div class="follow-request">${avatarHTML(p,'avatar-badge small')}<span><b>${esc(p.name)}</b> <small>@${esc(p.handle)}</small></span><button class="main-btn" type="button" data-accept-follow="${esc(r.from)}">قبول</button><button class="secondary-btn" type="button" data-decline-follow="${esc(r.from)}">رفض</button></div>`;}).join(''):'';
    const fc=$('#statFollowers'); if(fc) fc.textContent=followerCount('me'); const fg=$('#statFollowing'); if(fg) fg.textContent=followingCount('me');
  }

  function followBtnHTML(id,p){ const st=followStatus(session(),id); if(st==='accepted') return `<button class="secondary-btn" type="button" data-follow="${esc(id)}">✓ تتابعه</button>`; if(st==='pending') return `<button class="secondary-btn" type="button" data-follow="${esc(id)}">⏳ بانتظار الموافقة</button>`; return `<button class="main-btn" type="button" data-follow="${esc(id)}">${p.privacy==='خاص'?'طلب متابعة':'متابعة'}</button>`; }

  // صفحة ملف شخص آخر (أو ملفي كما يراه الآخرون)
  function openProfile(id, asVisitor=false){
    if(id==='me' && !asVisitor && session()) return showPage('dashboard');
    if(id==='me' && !session()) return requireLogin('dashboard');
    const p=getUser(id); if(!p) return;
    const owner = isOwner(id) && !asVisitor;
    const visible = asVisitor ? p.privacy==='عام' : canSeeContent(p, owner);
    const posts=allPosts().filter(x=>x.authorId===id);
    const memories = id==='me' ? read(KEYS.memories,[]) : (p.memories||[]);
    const publicMemories = memories.filter(m=>m.privacy==='عام');
    const box=$('#profileViewContent');
    box.innerHTML=`
      ${asVisitor?`<div class="visitor-banner"><i class="fa-regular fa-eye"></i> أنت تشاهد ملفك كما يظهر للآخرين. <button type="button" class="text-btn" data-page="dashboard">رجوع إلى حسابي</button></div>`:''}
      <div class="profile-cover" style="${p.cover?`background-image:url('${p.cover}')`:''}"><span class="profile-cover-shine"></span></div>
      <div class="profile-head">
        <div class="profile-avatar-wrap">${avatarHTML(p,'profile-avatar')}</div>
        <div class="profile-actions">
          ${id==='me'?'':followBtnHTML(id,p)}
          <button class="secondary-btn" type="button" data-page="community"><i class="fa-solid fa-arrow-right"></i> آراء الناس</button>
        </div>
      </div>
      <div class="profile-info">
        <h1>${esc(p.name)} <span class="privacy-pill ${p.privacy==='عام'?'public':'private'}">${p.privacy==='عام'?'🌍 عام':'🔒 خاص'}</span></h1>
        <p class="profile-handle">@${esc(p.handle)}</p>
        ${p.bio?`<p class="profile-bio">${esc(p.bio)}</p>`:''}
        <div class="profile-meta"><span><i class="fa-solid fa-location-dot"></i> ${esc(p.city||'السعودية')}</span><span><i class="fa-regular fa-calendar"></i> ${joinedText(p.joined)}</span></div>
        <div class="account-stats profile-stats">
          <div class="account-stat"><strong>${followerCount(id)}</strong><span>متابِع</span></div>
          <div class="account-stat"><strong>${followingCount(id)}</strong><span>يتابع</span></div>
          <div class="account-stat"><strong>${visible?posts.length:'—'}</strong><span>منشورات</span></div>
        </div>
      </div>
      ${visible?`
        <nav class="profile-tabs" role="tablist"><button class="profile-tab active" type="button" data-tab="v-posts">المنشورات</button><button class="profile-tab" type="button" data-tab="v-memories">الذكريات</button><span class="profile-tab-indicator"></span></nav>
        <div class="profile-panels">
          <section class="profile-panel active" data-panel="v-posts"><div class="feed-list">${posts.length?posts.map(x=>postCardHTML(x,{readonly:asVisitor})).join(''):'<p class="empty-state">لا توجد منشورات بعد.</p>'}</div></section>
          <section class="profile-panel" data-panel="v-memories"><div class="memory-grid">${publicMemories.length?publicMemories.map(m=>`<article class="memory-tile" data-demo-memory="${esc(id)}|${m.id}">${(m.images||[])[0]?`<img src="${m.images[0]}" alt="${esc(m.title)}">`:'<div class="memory-tile-empty">📝</div>'}<div><strong>${esc(m.title)}</strong><small>${esc(m.date||'')}</small></div></article>`).join(''):'<p class="empty-state">لا توجد ذكريات منشورة.</p>'}</div></section>
        </div>`:`
        <div class="locked-profile">
          <div class="lock-icon"><i class="fa-solid fa-lock"></i></div>
          <h2>هذا الحساب خاص</h2>
          <p>تابِع @${esc(p.handle)} لرؤية منشوراته وذكرياته بعد موافقته على طلبك.</p>
        </div>`}`;
    showPage('profileView'); bindTabs(box);
  }

  function bindTabs(root){
    $$('.profile-tabs',root).forEach(nav=>{ const ind=$('.profile-tab-indicator',nav); const move=b=>{ if(!ind||!b) return; ind.style.width=b.offsetWidth+'px'; ind.style.transform=`translateX(${b.offsetLeft-nav.offsetWidth+b.offsetWidth}px)`; };
      $$('.profile-tab',nav).forEach(b=>b.onclick=()=>{ $$('.profile-tab',nav).forEach(x=>x.classList.toggle('active',x===b)); $$('.profile-panel',root).forEach(p=>p.classList.toggle('active',p.dataset.panel===b.dataset.tab)); move(b); });
      setTimeout(()=>move($('.profile-tab.active',nav)),30); });
  }

  function renderProfileExtras(){
    const p=ME(); if(!p) return;
    const cover=$('#accountCover'); if(cover) cover.style.backgroundImage=`url('${p.cover||IMG.jeddah}')`;
    const av=$('#accountAvatar'); if(av && p.avatar) av.src=p.avatar;
    const h=$('#accountHandle'); if(h) h.textContent='@'+p.handle;
    const bio=$('#accountBio'); if(bio){ bio.textContent=p.bio||'أضف نبذة تعريفية من «تعديل الملف».'; bio.classList.toggle('muted',!p.bio); }
    const c=$('#accountCity span'); if(c) c.textContent=p.city||'السعودية';
    const j=$('#accountJoined span'); if(j) j.textContent=joinedText(p.joined);
    const badge=$('#accountPrivacyBadge'); if(badge){ badge.className='privacy-pill '+(p.privacy==='عام'?'public':'private'); badge.textContent=p.privacy==='عام'?'🌍 عام':'🔒 خاص'; }
    renderMyPosts(); renderFollowRequests(); bindTabs($('#dashboard'));
  }

  function bindSocial(){
    $$('#postRating [data-star]').forEach(star=>star.addEventListener('click',()=>{const v=Number(star.dataset.star);$('#postRating input').value=v;$$('#postRating [data-star]').forEach(x=>x.classList.toggle('selected',Number(x.dataset.star)<=v));}));
    $('#postImages')?.addEventListener('change',e=>{const box=$('#postPreview');box.innerHTML='';[...e.target.files].slice(0,4).forEach(f=>{if(!f.type.startsWith('image/'))return;const u=URL.createObjectURL(f);box.insertAdjacentHTML('beforeend',`<img class="memory-preview-image" src="${u}" alt="">`);});if(e.target.files.length>4)toast('يمكن نشر 4 صور كحد أقصى في المنشور الواحد.');});
    $('#postForm')?.addEventListener('submit',async e=>{
      e.preventDefault(); if(!requireLogin('community')) return;
      const rating=Number($('#postRating input').value||0); if(!rating) return toast('اختر تقييمك بالنجوم.');
      const files=[...($('#postImages').files||[])].filter(f=>f.type.startsWith('image/')).slice(0,4);
      const images=await Promise.all(files.map(f=>compressImage(f)));
      const posts=rawRead(SKEYS.posts,[]);
      posts.unshift({id:'u'+Date.now(),authorEmail:session(),city:$('#postCity').value,type:$('#postType').value,place:$('#postPlace').value.trim(),rating,text:$('#postText').value.trim(),images,ts:Date.now(),likes:0});
      if(!rawWrite(SKEYS.posts,posts)) return;
      e.target.reset(); $('#postPreview').innerHTML=''; $('#postRating input').value=0; $$('#postRating [data-star]').forEach(x=>x.classList.remove('selected'));
      renderFeed(); toast('تم النشر 🎉');
    });
    $$('[data-feed-type]').forEach(b=>b.addEventListener('click',()=>{feedState.type=b.dataset.feedType;$$('[data-feed-type]').forEach(x=>x.classList.toggle('active',x===b));renderFeed();}));
    $('#feedCity')?.addEventListener('change',e=>{feedState.city=e.target.value;renderFeed();});
    $('#viewAsVisitorBtn')?.addEventListener('click',()=>openProfile('me',true));

    document.addEventListener('click',e=>{
      const nav=e.target.closest('[data-page]'); if(nav && !nav.closest('.navbar')){ const id=nav.dataset.page; if(id==='dashboard'&&!requireLogin('dashboard'))return; return navigate(id); }
      const prof=e.target.closest('[data-open-profile]'); if(prof) return openProfile(prof.dataset.openProfile);
      const like=e.target.closest('[data-like]'); if(like){ if(!requireLogin('community')) return; const all=rawRead('anshidni_post_likes_all',{}); const id=like.dataset.like; const arr=all[id]||[]; const on=!arr.includes(session()); all[id]=on?[...arr,session()]:arr.filter(x=>x!==session()); rawWrite('anshidni_post_likes_all',all); const n=$('span',like); n.textContent=Number(n.textContent)+(on?1:-1); like.classList.toggle('liked',on); like.setAttribute('aria-pressed',on); $('i',like).className=`fa-${on?'solid':'regular'} fa-heart`; if(on){like.classList.remove('pop');void like.offsetWidth;like.classList.add('pop');} return; }
      const tog=e.target.closest('[data-toggle-comments]'); if(tog){ const box=tog.closest('.post-card').querySelector('.post-comments'); box.hidden=!box.hidden; if(!box.hidden) $('input',box)?.focus(); return; }
      const del=e.target.closest('[data-delete-post]'); if(del){ rawWrite(SKEYS.posts,rawRead(SKEYS.posts,[]).filter(p=>p.id!==del.dataset.deletePost)); renderFeed(); renderMyPosts(); toast('تم حذف المنشور.'); return; }
      const fol=e.target.closest('[data-follow]'); if(fol){ if(!requireLogin('community')) return; const id=fol.dataset.follow; const p=getUser(id); const t=targetKey(id); let list=follows(); const cur=list.find(f=>f.from===session()&&f.to===t);
        if(cur){ list=list.filter(f=>f!==cur); toast(cur.status==='pending'?'تم إلغاء طلب المتابعة.':'تم إلغاء المتابعة.'); }
        else { const st=p.privacy==='خاص'?'pending':'accepted'; list.push({from:session(),to:t,status:st,ts:Date.now()}); toast(st==='pending'?'تم إرسال طلب المتابعة.':`أنت الآن تتابع ${p.name}.`); }
        rawWrite(SKEYS.follows,list); openProfile(id); return; }
      const acc=e.target.closest('[data-accept-follow],[data-decline-follow]'); if(acc){ const from=acc.dataset.acceptFollow||acc.dataset.declineFollow; let list=follows(); const r=list.find(f=>f.from===from&&f.to===session()); if(r){ if(acc.dataset.acceptFollow){ r.status='accepted'; toast('تم قبول طلب المتابعة.'); } else { list=list.filter(f=>f!==r); toast('تم رفض الطلب.'); } rawWrite(SKEYS.follows,list); } renderFollowRequests(); return; }
      const dm=e.target.closest('[data-demo-memory]'); if(dm){ const [uid,mid]=dm.dataset.demoMemory.split('|'); const owner=getUser(uid); const list=uid==='me'?read(KEYS.memories,[]):(owner?.memories||[]); const m=list.find(x=>String(x.id)===mid); if(m){ ensureModal(); $('#detailContent').innerHTML=`<div class="detail-body memory-detail"><span class="category">🌍 ${esc(owner?.name||'')}</span><h2>${esc(m.title)}</h2><div class="memory-detail-gallery">${(m.images||[]).map(s=>`<img class="memory-detail-image" src="${s}" alt="">`).join('')}</div><p class="memory-detail-text">${esc(m.text)}</p></div>`; $('#detailModal').classList.add('open'); } return; }
      const zoom=e.target.closest('[data-zoom]'); if(zoom){ ensureModal(); $('#detailContent').innerHTML=`<img class="detail-image zoomed" src="${zoom.src}" alt="${esc(zoom.alt)}">`; $('#detailModal').classList.add('open'); return; }
      const cr=e.target.closest('[data-image-credits]'); if(cr){ ensureModal(); $('#detailContent').innerHTML=`<div class="detail-body credits"><h2>مصادر الصور</h2><p>صور المدن والأماكن من ويكيميديا كومنز وفق تراخيصها الحرة.</p><ul>${IMG_CREDITS.map(([f,a])=>`<li><a target="_blank" rel="noopener" href="https://commons.wikimedia.org/wiki/File:${encodeURIComponent(f)}">${esc(f.replace(/_/g,' '))}</a> — ${esc(a)}</li>`).join('')}</ul></div>`; $('#detailModal').classList.add('open'); return; }
      const mail=e.target.closest('.email-link'); if(mail){ const addr=mail.dataset.email; try{ navigator.clipboard?.writeText(addr).then(()=>toast('تم نسخ البريد: '+addr)).catch(()=>{}); }catch{} }
    });
    document.addEventListener('submit',e=>{
      const f=e.target.closest('[data-comment-form]'); if(!f) return; e.preventDefault(); if(!requireLogin('community')) return;
      const input=$('input',f); const text=input.value.trim(); if(!text) return; const all=rawRead(SKEYS.postComments,[]);
      all.push({id:'pc'+Date.now(),postId:f.dataset.commentForm,author:user()?.name,authorEmail:session(),text,ts:Date.now()}); if(!rawWrite(SKEYS.postComments,all)) return;
      const card=f.closest('.post-card'); const p=allPosts().find(x=>x.id===f.dataset.commentForm); if(card&&p){ card.outerHTML=postCardHTML(p,{openComments:true}); }
      toast('تم نشر ردّك.');
    });
  }

  document.addEventListener('DOMContentLoaded',()=>{setTimeout(()=>$('#siteLoader')?.classList.add('hidden'),900);if(!localStorage.getItem('anshidni_schedule_v2_empty')){localStorage.removeItem(KEYS.trips);localStorage.setItem('anshidni_schedule_v2_empty','1');}populateCityPages();initializeMap();bindCityCards();bindNavigation();bindFilters();bindImagePreview();bindImageFallbacks();bindForms();bindActions();bindSocial();renderFeed();if(user())renderDashboard();updateAccountButton();});
})();
