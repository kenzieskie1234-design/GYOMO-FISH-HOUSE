

/* ===== GYOMO SUPABASE CONFIGURATION ===== */
const GYOMO_SUPABASE_URL = "https://zsrhefcnfiejkfdnzrrj.supabase.co";
const GYOMO_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpzcmhlZmNuZmllamtmZG56cnJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTUwOTc2MjAsImV4cCI6MjExMDY3MzYyMH0.TBeYP95oL6snghsz9ctl3VOfKPyDAMl1NXmy19ItWKs";

/* ===== WEBSITE JAVASCRIPT ===== */
const nav=document.getElementById('nav');
document.getElementById('menuToggle').addEventListener('click',()=>nav.classList.toggle('open'));
nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>nav.classList.remove('open')));

const filters=document.querySelectorAll('.filter');
const cards=document.querySelectorAll('.menu-card');
filters.forEach(btn=>btn.addEventListener('click',()=>{
  filters.forEach(f=>f.classList.remove('active'));
  btn.classList.add('active');
  const category=btn.dataset.filter;
  cards.forEach(card=>card.classList.toggle('hidden',category!=='all'&&card.dataset.category!==category));
}));

const form=document.getElementById('reservationForm');
const date=document.getElementById('date');
const toast=document.getElementById('toast');
const now=new Date();
const today=new Date(now.getTime()-now.getTimezoneOffset()*60000).toISOString().slice(0,10);
date.min=today;
form.addEventListener('submit',e=>{
  e.preventDefault();
  if(!form.reportValidity())return;
  const name=new FormData(form).get('name').trim();
  toast.textContent=`Terima kasih, ${name}. Permintaan reservasi demo berhasil diisi.`;
  toast.classList.add('show');
  form.reset();date.min=today;
  setTimeout(()=>toast.classList.remove('show'),3500);
});

/* Supabase URL and anon key are configured once at the top of this file. */
const defaultGyomoSettings = {
  announcement_active: false,
  announcement_title: "This week's live cutting",
  announcement_message: "Join us for a special seafood experience at Gyomo Fish House.",
  announcement_link: "",
  announcement_link_text: "MORE INFO",
  fish_name: "BLUEFIN TUNA",
  fish_weight: "EST. 129 KG",
  event_day: 6,
  event_hour: 19,
  event_minute: 0
};
let gyomoSettings = {...defaultGyomoSettings};
let supabaseClient = null;
let currentAdmin = null;

const $ = id => document.getElementById(id);
const toastEl = $('toast');
function showToast(message) {
  if (!toastEl) return;
  toastEl.textContent = message;
  toastEl.classList.add('show');
  setTimeout(() => toastEl.classList.remove('show'), 3200);
}
function supabaseReady() {
  return window.supabase && GYOMO_SUPABASE_URL.startsWith('https://') &&
    !GYOMO_SUPABASE_URL.includes('PASTE_') &&
    GYOMO_SUPABASE_ANON_KEY.length > 20 &&
    !GYOMO_SUPABASE_ANON_KEY.includes('PASTE_');
}
if (supabaseReady()) {
  supabaseClient = window.supabase.createClient(GYOMO_SUPABASE_URL, GYOMO_SUPABASE_ANON_KEY);
} else {
  $('adminSetupNotice').hidden = false;
  $('adminSetupNotice').textContent = 'Setup belum selesai: developer perlu mengisi Supabase Project URL dan anon key di konfigurasi JavaScript, lalu menjalankan SQL setup.';
}

function renderAnnouncement() {
  const bar = $('announcementBar');
  if (!bar) return;
  const visible = Boolean(gyomoSettings.announcement_active);
  bar.hidden = !visible;
  if (!visible) return;
  $('announcementTitle').textContent = gyomoSettings.announcement_title || 'Announcement';
  $('announcementMessage').textContent = gyomoSettings.announcement_message || '';
  const link = $('announcementLink');
  const href = (gyomoSettings.announcement_link || '').trim();
  link.hidden = !href;
  if (href) {
    link.href = href;
    link.textContent = (gyomoSettings.announcement_link_text || 'MORE INFO') + ' ↗';
  }
}
$('closeAnnouncement').addEventListener('click', () => $('announcementBar').hidden = true);

function getNextLiveEvent(now = new Date()) {
  // Hitung countdown berdasarkan jam WIB, bukan zona waktu perangkat pengunjung.
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone:'Asia/Jakarta', year:'numeric', month:'2-digit', day:'2-digit',
    hour:'2-digit', minute:'2-digit', second:'2-digit', hourCycle:'h23'
  }).formatToParts(now).reduce((a,p)=>(a[p.type]=p.value,a),{});
  const wibNow = new Date(`${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}+07:00`);
  const target = new Date(wibNow);
  target.setHours(Number(gyomoSettings.event_hour || 19), Number(gyomoSettings.event_minute || 0), 0, 0);
  const day = Number(gyomoSettings.event_day ?? 6);
  let daysUntil = (day - target.getDay() + 7) % 7;
  target.setDate(target.getDate() + daysUntil);
  if (target <= wibNow) target.setDate(target.getDate() + 7);
  return new Date(target.getTime() - 7 * 60 * 60 * 1000);
}
function updateLiveCutting() {
  $('featuredFish').textContent = gyomoSettings.fish_name || defaultGyomoSettings.fish_name;
  $('featuredWeight').textContent = gyomoSettings.fish_weight || '';
  const dayNames = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
  const hour = String(gyomoSettings.event_hour ?? 19).padStart(2,'0');
  const minute = String(gyomoSettings.event_minute ?? 0).padStart(2,'0');
  $('eventSchedule').textContent = `Setiap ${dayNames[Number(gyomoSettings.event_day ?? 6)]} · ${hour}.${minute} WIB`;
  const distance = Math.max(0, getNextLiveEvent().getTime() - Date.now());
  const units = {
    days: Math.floor(distance / 86400000),
    hours: Math.floor((distance % 86400000) / 3600000),
    minutes: Math.floor((distance % 3600000) / 60000),
    seconds: Math.floor((distance % 60000) / 1000)
  };
  Object.entries(units).forEach(([id,value]) => $(id).textContent = String(value).padStart(2,'0'));
}
async function loadGyomoSettings() {
  if (!supabaseClient) { renderAnnouncement(); updateLiveCutting(); return; }
  const {data,error} = await supabaseClient.from('gyomo_settings').select('*').eq('id',1).maybeSingle();
  if (!error && data) gyomoSettings = {...defaultGyomoSettings,...data};
  renderAnnouncement();
  updateLiveCutting();
}
function fillAdminForm() {
  $('announcementActive').checked = !!gyomoSettings.announcement_active;
  $('announcementTitleInput').value = gyomoSettings.announcement_title || '';
  $('announcementMessageInput').value = gyomoSettings.announcement_message || '';
  $('announcementLinkInput').value = gyomoSettings.announcement_link || '';
  $('announcementLinkTextInput').value = gyomoSettings.announcement_link_text || 'MORE INFO';
  $('fishNameInput').value = gyomoSettings.fish_name || '';
  $('fishWeightInput').value = gyomoSettings.fish_weight || '';
  $('eventDayInput').value = String(gyomoSettings.event_day ?? 6);
  $('eventTimeInput').value = `${String(gyomoSettings.event_hour ?? 19).padStart(2,'0')}:${String(gyomoSettings.event_minute ?? 0).padStart(2,'0')}`;
}
async function verifyAdmin(user) {
  const {data,error} = await supabaseClient.from('gyomo_admins').select('user_id').eq('user_id',user.id).maybeSingle();
  if (error || !data) return false;
  return true;
}
function setAdminView(isAdmin) {
  $('adminLoginForm').hidden = isAdmin;
  $('adminControls').hidden = !isAdmin;
  $('adminSetupNotice').hidden = !!supabaseClient;
  if (isAdmin) $('adminLoggedAs').textContent = `SIGNED IN · ${currentAdmin.email || 'ADMIN'}`;
}
async function openGyomoAdmin() {
  $('adminModal').classList.add('open');
  $('adminModal').setAttribute('aria-hidden','false');
  if (!supabaseClient) { setAdminView(false); return; }
  const {data:{session}} = await supabaseClient.auth.getSession();
  if (session?.user && await verifyAdmin(session.user)) {
    currentAdmin = session.user; setAdminView(true); fillAdminForm(); await loadAdminMenu();
  } else {
    setAdminView(false);
  }
}
$('openAdmin').addEventListener('click', openGyomoAdmin);

// Admin access is not displayed in the public interface.
// Owner can open the login modal with Ctrl+Shift+A or by adding ?admin=1.
document.addEventListener('keydown', event => {
  if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'a') {
    event.preventDefault(); openGyomoAdmin();
  }
});
if (new URLSearchParams(window.location.search).get('admin') === '1') {
  window.addEventListener('load', () => openGyomoAdmin(), {once:true});
}
function closeAdmin() {
  $('adminModal').classList.remove('open');
  $('adminModal').setAttribute('aria-hidden','true');
}
$('closeAdmin').addEventListener('click',closeAdmin);
$('adminBackdrop').addEventListener('click',closeAdmin);

$('adminLoginForm').addEventListener('submit', async e => {
  e.preventDefault();
  if (!supabaseClient) { $('loginStatus').textContent = 'Supabase belum dikonfigurasi.'; return; }
  $('loginStatus').textContent = 'Memeriksa akun...';
  const {data,error} = await supabaseClient.auth.signInWithPassword({
    email:$('adminEmail').value.trim(), password:$('adminPassword').value
  });
  if (error) { $('loginStatus').textContent = 'Login gagal: ' + error.message; return; }
  const allowed = await verifyAdmin(data.user);
  if (!allowed) {
    await supabaseClient.auth.signOut();
    $('loginStatus').textContent = 'Akun berhasil login, tetapi belum diberi akses admin.';
    return;
  }
  currentAdmin = data.user;
  setAdminView(true); fillAdminForm(); await loadAdminMenu();
  $('loginStatus').textContent = '';
});
$('adminLogout').addEventListener('click', async () => {
  if (supabaseClient) await supabaseClient.auth.signOut();
  currentAdmin = null; setAdminView(false);
  $('adminLoginForm').reset();
  $('loginStatus').textContent = 'Anda sudah logout.';
});
$('adminSettingsForm').addEventListener('submit', async e => {
  e.preventDefault();
  if (!supabaseClient || !currentAdmin) { $('saveStatus').textContent = 'Silakan login sebagai admin.'; return; }
  const [hour,minute] = $('eventTimeInput').value.split(':').map(Number);
  const payload = {
    id:1,
    announcement_active:$('announcementActive').checked,
    announcement_title:$('announcementTitleInput').value.trim(),
    announcement_message:$('announcementMessageInput').value.trim(),
    announcement_link:$('announcementLinkInput').value.trim(),
    announcement_link_text:$('announcementLinkTextInput').value.trim() || 'MORE INFO',
    fish_name:$('fishNameInput').value.trim().toUpperCase(),
    fish_weight:$('fishWeightInput').value.trim(),
    event_day:Number($('eventDayInput').value),
    event_hour:hour,
    event_minute:minute,
    updated_at:new Date().toISOString()
  };
  $('saveStatus').textContent = 'Menyimpan perubahan...';
  const {error} = await supabaseClient.from('gyomo_settings').upsert(payload,{onConflict:'id'});
  if (error) { $('saveStatus').textContent = 'Gagal menyimpan: ' + error.message; return; }
  gyomoSettings = {...defaultGyomoSettings,...payload};
  renderAnnouncement(); updateLiveCutting();
  $('saveStatus').textContent = 'Berhasil dipublikasikan. Pengunjung akan menerima perubahan otomatis.';
  showToast('Pengaturan Gyomo berhasil diperbarui.');
});

// ===== PUBLIC MENU FROM SUPABASE =====
function escapeHtml(value='') {
  return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function renderPublicMenu(items) {
  const grid=document.querySelector('.menu-grid');
  if(!grid || !items?.length) return;
  grid.innerHTML=items.map((item,index)=>`
    <article class="menu-card" data-category="${escapeHtml(item.category)}">
      <div class="food-photo"><img src="${escapeHtml(item.image_url)}" alt="${escapeHtml(item.name)}" loading="lazy"><span class="food-no">${String(index+1).padStart(2,'0')} / ${escapeHtml((item.category||'MENU').toUpperCase())}</span></div>
      <div class="food-info"><div><h3>${escapeHtml(item.name)}</h3><p>${escapeHtml(item.description||'Gyomo Fish House selection')}</p></div><strong>${escapeHtml(item.price)}</strong></div>
    </article>`).join('');
  applyCurrentMenuFilter();
}
let currentMenuFilter='all';
function applyCurrentMenuFilter() {
  document.querySelectorAll('.menu-card').forEach(card=>card.classList.toggle('hidden',currentMenuFilter!=='all'&&card.dataset.category!==currentMenuFilter));
}
filters.forEach(btn=>btn.addEventListener('click',()=>{
  currentMenuFilter=btn.dataset.filter;
  applyCurrentMenuFilter();
}));
async function loadPublicMenu() {
  if(!supabaseClient)return;
  const {data,error}=await supabaseClient.from('gyomo_menu').select('*').eq('is_available',true).order('sort_order',{ascending:true}).order('created_at',{ascending:false});
  if(error){console.warn('Gyomo menu could not be loaded:',error.message);return;}
  if(data?.length)renderPublicMenu(data);
}

// ===== ADMIN MENU CRUD + PHOTO UPLOAD =====
let editingMenuImageUrl='';
const menuFileInput=$('menuImageInput');
menuFileInput.addEventListener('change',()=>{
  const file=menuFileInput.files[0];
  const preview=$('menuImagePreview');
  if(!file){preview.hidden=true;return;}
  if(file.size>5*1024*1024){$('menuFormStatus').textContent='Ukuran foto maksimal 5 MB.';menuFileInput.value='';preview.hidden=true;return;}
  if(!['image/jpeg','image/png','image/webp'].includes(file.type)){$('menuFormStatus').textContent='Gunakan JPG, PNG, atau WebP.';menuFileInput.value='';preview.hidden=true;return;}
  preview.src=URL.createObjectURL(file);preview.hidden=false;
});
function resetMenuEditor(){
  $('adminMenuForm').reset();$('menuEditId').value='';editingMenuImageUrl='';
  $('menuImagePreview').hidden=true;$('menuSubmitButton').textContent='ADD MENU ITEM';
  $('menuCancelEdit').hidden=true;$('menuFormStatus').textContent='';
}
$('menuCancelEdit').addEventListener('click',resetMenuEditor);

async function loadAdminMenu(){
  if(!supabaseClient||!currentAdmin)return;
  const list=$('adminMenuList');list.innerHTML='<p class="admin-status">Loading menu...</p>';
  const {data,error}=await supabaseClient.from('gyomo_menu').select('*').order('created_at',{ascending:false});
  if(error){list.innerHTML=`<p class="admin-status">Gagal memuat menu: ${escapeHtml(error.message)}</p>`;return;}
  if(!data?.length){list.innerHTML='<p class="admin-status">Belum ada menu tambahan. Tambahkan menu pertama di atas.</p>';return;}
  list.innerHTML=data.map(item=>`
    <div class="admin-menu-row">
      <img src="${escapeHtml(item.image_url||'')}" alt="">
      <div><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.price)} · ${escapeHtml(item.category)} · ${item.is_available?'Published':'Hidden'}</small></div>
      <div class="admin-menu-actions">
        <button type="button" data-edit-menu="${item.id}">EDIT</button>
        <button type="button" class="delete" data-delete-menu="${item.id}">DELETE</button>
      </div>
    </div>`).join('');
  list.querySelectorAll('[data-edit-menu]').forEach(button=>button.addEventListener('click',()=>{
    const item=data.find(row=>row.id===button.dataset.editMenu);if(!item)return;
    $('menuEditId').value=item.id;$('menuNameInput').value=item.name;$('menuDescriptionInput').value=item.description||'';
    $('menuPriceInput').value=item.price;$('menuCategoryInput').value=item.category;
    editingMenuImageUrl=item.image_url||'';$('menuImagePreview').src=editingMenuImageUrl;$('menuImagePreview').hidden=!editingMenuImageUrl;
    $('menuSubmitButton').textContent='SAVE MENU CHANGES';$('menuCancelEdit').hidden=false;
    $('menuFormStatus').textContent='Edit data menu, lalu simpan perubahan.';
    $('adminMenuForm').scrollIntoView({behavior:'smooth',block:'start'});
  }));
  list.querySelectorAll('[data-delete-menu]').forEach(button=>button.addEventListener('click',async()=>{
    const item=data.find(row=>row.id===button.dataset.deleteMenu);if(!item)return;
    if(!confirm(`Hapus menu "${item.name}"?`))return;
    const {error}=await supabaseClient.from('gyomo_menu').delete().eq('id',item.id);
    if(error){showToast('Gagal menghapus menu: '+error.message);return;}
    await loadAdminMenu();await loadPublicMenu();showToast('Menu berhasil dihapus.');
  }));
}
$('adminMenuForm').addEventListener('submit',async e=>{
  e.preventDefault();
  if(!supabaseClient||!currentAdmin){$('menuFormStatus').textContent='Silakan login sebagai admin.';return;}
  const file=menuFileInput.files[0];
  if(file && (file.size>5*1024*1024||!['image/jpeg','image/png','image/webp'].includes(file.type))){
    $('menuFormStatus').textContent='Foto harus JPG, PNG, atau WebP dengan ukuran maksimal 5 MB.';return;
  }
  $('menuSubmitButton').disabled=true;$('menuFormStatus').textContent='Menyimpan menu dan foto...';
  let imageUrl=editingMenuImageUrl;
  if(file){
    const extension=file.name.split('.').pop().toLowerCase();
    const filePath=`${Date.now()}-${crypto.randomUUID()}.${extension}`;
    const {error:uploadError}=await supabaseClient.storage.from('gyomo-menu').upload(filePath,file,{cacheControl:'3600',upsert:false,contentType:file.type});
    if(uploadError){$('menuFormStatus').textContent='Upload foto gagal: '+uploadError.message;$('menuSubmitButton').disabled=false;return;}
    imageUrl=supabaseClient.storage.from('gyomo-menu').getPublicUrl(filePath).data.publicUrl;
  }
  if(!imageUrl){$('menuFormStatus').textContent='Pilih foto untuk menu ini.';$('menuSubmitButton').disabled=false;return;}
  const payload={
    name:$('menuNameInput').value.trim(),
    description:$('menuDescriptionInput').value.trim(),
    price:$('menuPriceInput').value.trim(),
    category:$('menuCategoryInput').value,
    image_url:imageUrl,
    is_available:true,
    updated_at:new Date().toISOString()
  };
  const editId=$('menuEditId').value;
  const query=editId
    ?supabaseClient.from('gyomo_menu').update(payload).eq('id',editId)
    :supabaseClient.from('gyomo_menu').insert(payload);
  const {error}=await query;
  $('menuSubmitButton').disabled=false;
  if(error){$('menuFormStatus').textContent='Gagal menyimpan menu: '+error.message;return;}
  resetMenuEditor();await loadAdminMenu();await loadPublicMenu();
  showToast(editId?'Menu berhasil diperbarui.':'Menu baru berhasil ditambahkan.');
});

if (supabaseClient) {
  loadGyomoSettings();
  loadPublicMenu();
  // Pengunjung lain menerima perubahan admin maksimal sekitar 20 detik.
  setInterval(loadGyomoSettings,20000);
  setInterval(loadPublicMenu,20000);
} else {
  renderAnnouncement(); updateLiveCutting();
}
setInterval(updateLiveCutting,1000);

(()=>{
  const intro=document.getElementById('gyomo-intro');
  if(!intro)return;
  let pageReady=document.readyState==='complete';
  let minTime=false,closed=false;
  const close=()=>{if(closed||!pageReady||!minTime)return;closed=true;intro.classList.add('is-leaving');setTimeout(()=>intro.remove(),1000);};
  window.addEventListener('load',()=>{pageReady=true;close();},{once:true});
  setTimeout(()=>{minTime=true;close();},3600);
  // Safety fallback for unusually slow external resources.
  setTimeout(()=>{pageReady=true;minTime=true;close();},5200);
})();
