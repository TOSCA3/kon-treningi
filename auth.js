// Wspólny moduł kont (Supabase) dla wszystkich treningów.
// Wymaga wcześniej załadowanego vendor/supabase.js. Bez niego (albo bez sieci) treningi działają w trybie gościa.
// Klucz publishable jest jawny z założenia: dostęp do danych pilnują reguły RLS w bazie (każdy widzi tylko swoje wiersze).
(function () {
  const SB_URL = 'https://bxxjimzwtueqfpmskvat.supabase.co';
  const SB_KEY = 'sb_publishable_HC01A5Z9R2TdDWRByxEXjw_UAweA1Vn';
  const me = document.currentScript ? document.currentScript.src : '';
  const root = me ? new URL('.', me).pathname : '/kon-treningi/';
  let sb = null;
  try { if (window.supabase && window.supabase.createClient) sb = window.supabase.createClient(SB_URL, SB_KEY); } catch (e) { console.warn('Supabase niedostępny', e); }

  const KT = { sb, root, user: null, profile: null };
  const warn = r => { if (r && r.error) console.warn(r.error); return r; };

  KT.ready = (async () => {
    if (!sb) return null;
    const { data: { session } } = await sb.auth.getSession();
    if (!session) return null;
    KT.user = session.user;
    const { data } = await sb.from('profiles').select('display_name').eq('id', KT.user.id).maybeSingle();
    const metaName = (KT.user.user_metadata && KT.user.user_metadata.display_name) || '';
    KT.profile = data || { display_name: metaName || KT.user.email.split('@')[0] };
    if (!data && metaName) warn(await sb.from('profiles').upsert({ id: KT.user.id, display_name: metaName }));
    return KT.user;
  })().catch(e => { console.warn(e); return null; });

  KT.name = () => (KT.profile && KT.profile.display_name) || '';
  KT.loginUrl = () => root + 'login.html?next=' + encodeURIComponent(location.pathname + location.search);
  KT.signOut = async () => { if (sb) await sb.auth.signOut(); location.reload(); };

  // Jedna próba = jedno rozwiązane zadanie (score 0–1).
  KT.saveAttempt = (training, task_id, score, gave_up) => {
    if (!KT.user) return Promise.resolve();
    return sb.from('attempts').insert({ training, task_id, score: Math.max(0, Math.min(1, score)), gave_up: !!gave_up }).then(warn);
  };
  // Wszystkie próby użytkownika w danym treningu (do statystyk i „zadań do poprawy”).
  KT.attempts = async training => {
    if (!KT.user) return [];
    let q = sb.from('attempts').select('training,task_id,score,gave_up,created_at').order('created_at', { ascending: true }).limit(5000);
    if (training) q = q.eq('training', training);
    const { data, error } = await q; if (error) { console.warn(error); return []; }
    return data || [];
  };
  // Ostatni wynik każdego zadania → zadania, których ostatnia próba nie była na 100%.
  KT.toReview = rows => { const last = {}; rows.forEach(r => { last[r.task_id] = r.score; }); return Object.keys(last).filter(k => last[k] < 0.999).map(Number); };

  // Stan sesji (do wznawiania na innym urządzeniu); zapis z opóźnieniem, żeby nie słać przy każdym kliknięciu.
  let timer = null;
  KT.saveProgress = (training, state) => {
    if (!KT.user) return;
    clearTimeout(timer);
    timer = setTimeout(() => sb.from('progress').upsert({ user_id: KT.user.id, training, state, updated_at: new Date().toISOString() }).then(warn), 800);
  };
  KT.loadProgress = async training => {
    if (!KT.user) return null;
    const { data, error } = await sb.from('progress').select('state,updated_at').eq('training', training).maybeSingle();
    if (error) { console.warn(error); return null; }
    return data;
  };

  // Mały pasek konta: „Zalogowany jako X · Wyloguj” albo „Zaloguj się”.
  KT.renderBar = async el => {
    if (!el) return;
    await KT.ready;
    const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    if (!sb) { el.innerHTML = '<span class="kt-mute">Konta są chwilowo niedostępne. Grasz jako gość.</span>'; return; }
    el.innerHTML = KT.user
      ? `<span>Zalogowany jako <b>${esc(KT.name())}</b></span><button type="button" class="kt-link" data-kt-out>Wyloguj</button>`
      : `<span class="kt-mute">Grasz jako gość: postęp zapisuje się tylko w tej przeglądarce.</span><a class="kt-link" href="${esc(KT.loginUrl())}">Zaloguj się</a>`;
    const out = el.querySelector('[data-kt-out]'); if (out) out.onclick = KT.signOut;
  };

  window.KT = KT;
})();
