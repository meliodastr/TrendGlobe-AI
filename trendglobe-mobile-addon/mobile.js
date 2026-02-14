/**
 * TrendGlobe Mobile Controller - Supabase Edition
 * Bu dosya mobile.html ile birlikte çalışır.
 */

// --- SUPABASE BAĞLANTISI ---
const SUPABASE_URL = 'https://vcd6z_anjrrylfklscn.supabase.co';
const SUPABASE_KEY = 'sb_publishable_vcD6Z_aNjRRyLfklScn_Bw_R9xkKkIr';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

function $(sel){ return document.querySelector(sel); }
function $all(sel){ return Array.from(document.querySelectorAll(sel)); }

function formatNow(){
  const now = new Date();
  return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function safeParseInt(txt){
  const n = parseInt(String(txt).replace(/[^0-9]/g,''), 10);
  return Number.isFinite(n) ? n : 0;
}

function toast(message, type='info'){
  const el = document.createElement('div');
  el.className = `fixed top-20 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full ${type==='success' ? 'bg-green-600' : type==='warn' ? 'bg-amber-600' : 'bg-slate-800'} text-white text-sm font-medium z-[100] transition-all shadow-xl`;
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(()=>el.remove(), 2200);
}

class TrendGlobeMobile {
  constructor(){
    this.cards = [];
    this.touchStartX = 0;
    this.touchEndX = 0;
    this.maxCards = 10;
  }

  async init(){
    this.setupClock();
    this.setupPullToRefresh();
    this.setupInstallPrompt();
    this.setupBottomNav();
    await this.loadCards();
    this.startLiveActivity();
  }

  setupClock(){
    const clockEl = $('#clock');
    if(clockEl) {
        clockEl.textContent = formatNow();
        setInterval(()=> clockEl.textContent = formatNow(), 30_000);
    }
  }

  async loadCards(){
    const stack = $('#swipe-stack');
    // Skeleton (Yükleniyor) Ekranı
    stack.innerHTML = `
      <div class="absolute inset-0 bg-slate-800 rounded-3xl p-6 border border-slate-700 animate-pulse"></div>
    `;

    try {
      // SUPABASE'DEN VERİ ÇEKME
      const { data: trends, error } = await _supabase
        .from('trends')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(this.maxCards);

      if (error) throw error;

      this.cards = trends.map((t) => ({
        id: t.id,
        term: t.title,
        category: t.category || 'Global',
        confidence: t.growth_rate ? t.growth_rate.replace(/\D/g,'') : '85',
        image: t.image_url || emojiForCategory(t.category),
        video: t.video_url,
        desc: t.ai_analysis || 'AI analizi hazırlanıyor...',
        locked: false,
        sources: ['TikTok', 'AI Insights'],
        velocity: t.growth_rate || '+100%'
      }));

      this.renderCards();
      const countEl = $('#prediction-count');
      if(countEl) countEl.textContent = `${this.cards.length} trend hazır`;

    } catch (e){
      console.error(e);
      stack.innerHTML = `<div class="absolute inset-0 flex items-center justify-center text-center p-6"><div><div class="text-3xl mb-2">⚠️</div><div class="font-bold text-white">Veriler yüklenemedi</div><div class="text-sm text-slate-400">Supabase bağlantısını kontrol edin.</div></div></div>`;
      toast('Bağlantı hatası!', 'warn');
    }
  }

  renderCards(){
    const container = $('#swipe-stack');
    if(!this.cards.length) return this.showNoMoreCards();

    container.innerHTML = this.cards.map((card, i) => `
        <div class="swipe-card absolute inset-0 bg-slate-800 rounded-3xl overflow-hidden shadow-2xl border border-slate-700 flex flex-col ${i === 0 ? 'z-10' : 'z-0 scale-95 opacity-50'}"
             data-index="${i}" style="transform: translateY(${i * 10}px) scale(${1 - i * 0.05})">
          
          <div class="relative flex-1 bg-black">
            ${card.video ? 
              `<video src="${card.video}" class="w-full h-full object-cover opacity-60" loop muted playsinline autoplay></video>` :
              `<img src="${card.image}" class="w-full h-full object-cover opacity-50">`
            }
            <div class="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>
            
            <div class="absolute bottom-6 left-6 right-6 text-left">
                <div class="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1">${card.category}</div>
                <h3 class="text-2xl font-black text-white mb-2">${card.term}</h3>
                <div class="flex items-center gap-3">
                    <div class="px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-lg">
                        <span class="text-emerald-400 font-bold text-lg">${card.confidence}%</span>
                    </div>
                    <span class="text-xs text-slate-400 font-medium leading-tight text-white/70">Büyüme<br>Potansiyeli</span>
                </div>
            </div>
          </div>

          <div class="p-4 bg-slate-900/80 backdrop-blur-md flex justify-between text-[10px] text-slate-500 font-bold uppercase tracking-tighter">
            <span>Sola: Geç</span>
            <span>Sağa: Kaydet</span>
          </div>
        </div>
    `).join('');

    this.setupCardGestures();
  }

  // --- JESTLER VE DİĞER FONKSİYONLAR ---
  setupCardGestures(){
    const cards = $all('.swipe-card');
    cards.forEach(card => {
      card.addEventListener('touchstart', (e)=>{ this.touchStartX = e.changedTouches[0].screenX; }, { passive:true });
      card.addEventListener('touchend', (e)=>{ this.touchEndX = e.changedTouches[0].screenX; this.handleSwipe(card); }, { passive:true });
      card.addEventListener('click', () => this.showDetail(card));
    });
  }

  handleSwipe(cardEl){
    const diff = this.touchStartX - this.touchEndX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) this.swipe('left', cardEl);
      else this.swipe('right', cardEl);
    }
  }

  swipe(direction, cardElement){
    const card = cardElement || $('.swipe-card[data-index="0"]');
    if (!card) return;
    if (direction === 'left') {
      card.style.transform = "translateX(-150%) rotate(-20deg)";
      card.style.opacity = "0";
      this.vibrate([10]);
      setTimeout(()=>this.nextCard(), 300);
    } else if (direction === 'right') {
      card.style.transform = "translateX(150%) rotate(20deg)";
      card.style.opacity = "0";
      this.vibrate([10, 30, 10]);
      this.addPoints(15);
      setTimeout(()=>this.nextCard(), 300);
    }
  }

  nextCard(){
    this.cards.shift();
    if (!this.cards.length) return this.showNoMoreCards();
    this.renderCards();
  }

  showNoMoreCards(){
    $('#swipe-stack').innerHTML = `
      <div class="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-slate-900 rounded-3xl">
        <div class="text-6xl mb-4">✨</div>
        <h3 class="text-xl font-black text-white mb-2">Tüm Trendler Bitti!</h3>
        <p class="text-sm text-slate-400 mb-6">Yeni trendler AI tarafından hazırlanıyor.</p>
        <button onclick="location.reload()" class="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-500/20">Yenile</button>
      </div>
    `;
  }

  showDetail(cardEl){
    const idx = parseInt(cardEl.dataset.index, 10);
    const card = this.cards[idx];
    
    // mobile.html'deki Bottom Sheet'i tetikle
    const sheet = $('#detail-sheet');
    const content = $('#sheet-content');
    
    if(!sheet || !content) return;

    content.innerHTML = `
        <div class="p-2">
            <h2 class="text-2xl font-black text-white mb-4">${card.term}</h2>
            <div class="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl mb-6">
                <p class="text-xs font-bold text-indigo-400 uppercase mb-2">AI STRATEJİSİ</p>
                <p class="text-slate-200 text-sm leading-relaxed">"${card.desc}"</p>
            </div>
            <div class="grid grid-cols-2 gap-4 mb-6">
                <div class="bg-slate-800 p-3 rounded-xl">
                    <span class="block text-[10px] text-slate-500 font-bold uppercase">Hız</span>
                    <span class="text-emerald-400 font-bold">${card.velocity}</span>
                </div>
                <div class="bg-slate-800 p-3 rounded-xl">
                    <span class="block text-[10px] text-slate-500 font-bold uppercase">Kategori</span>
                    <span class="text-indigo-400 font-bold">${card.category}</span>
                </div>
            </div>
            <button onclick="closeSheet()" class="w-full py-4 bg-white text-black rounded-2xl font-black">ANLADIM</button>
        </div>
    `;

    sheet.classList.remove('hidden');
    setTimeout(()=> sheet.querySelector('.bottom-sheet').classList.remove('closed'), 10);
  }

  closeSheet(){
    const sheet = $('#detail-sheet');
    if(!sheet) return;
    sheet.querySelector('.bottom-sheet').classList.add('closed');
    setTimeout(()=> sheet.classList.add('hidden'), 300);
  }

  setupPullToRefresh(){
    // Pull to refresh mantığı (basitleştirilmiş)
    let startY = 0;
    const main = $('#main-scroll');
    if(!main) return;

    main.addEventListener('touchstart', (e) => startY = e.touches[0].pageY, {passive: true});
    main.addEventListener('touchend', (e) => {
        const diff = e.changedTouches[0].pageY - startY;
        if(diff > 150 && main.scrollTop === 0) {
            toast('Trendler yenileniyor...', 'success');
            this.loadCards();
        }
    }, {passive: true});
  }

  setupInstallPrompt(){
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        window.deferredPrompt = e;
        $('#install-prompt')?.classList.remove('hidden');
    });
  }

  setupBottomNav(){
    window.closeSheet = () => this.closeSheet();
  }

  addPoints(amount){
    const el = $('#user-points');
    if(el) {
        const cur = safeParseInt(el.textContent);
        el.textContent = (cur + amount).toLocaleString();
        toast(`+${amount} puan!`, 'success');
    }
  }

  startLiveActivity(){
    const feed = $('#activity-feed');
    if(!feed) return;
    const msgs = ['Yeni trend analiz edildi', 'TikTok verisi güncellendi', 'Pro sinyali yakalandı'];
    setInterval(() => {
        const msg = msgs[Math.floor(Math.random()*msgs.length)];
        const item = document.createElement('div');
        item.className = "text-[10px] text-slate-500 font-medium mb-1 animate-pulse";
        item.innerHTML = `• ${msg}`;
        feed.prepend(item);
        if(feed.children.length > 3) feed.lastChild.remove();
    }, 5000);
  }

  vibrate(pattern){ if(navigator.vibrate) navigator.vibrate(pattern); }
}

function emojiForCategory(cat){
  const c = String(cat||'').toLowerCase();
  if(c.includes('tech') || c.includes('ai')) return '🤖';
  if(c.includes('sports')) return '⚽';
  if(c.includes('finance')) return '📈';
  if(c.includes('culture')) return '🎭';
  return '✨';
}

function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

// --- BAŞLAT ---
const tgMobile = new TrendGlobeMobile();
document.addEventListener('DOMContentLoaded', () => tgMobile.init());