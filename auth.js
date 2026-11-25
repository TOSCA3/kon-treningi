// Wspólny moduł kont (Supabase) dla strony i treningów.
// Klucz publishable jest jawny z założenia. Dostępu pilnują reguły w bazie:
// treningi (prywatny bucket „trainings”) może pobrać tylko konto zaakceptowane przez administratora.
(function () {
  const SB_URL = 'https://bxxjimzwtueqfpmskvat.supabase.co';
  const SB_KEY = 'sb_publishable_HC01A5Z9R2TdDWRByxEXjw_UAweA1Vn';
  const me = document.currentScript ? document.currentScript.src : '';
  const root = me ? new URL('.', me).pathname : '/kon-treningi/';
  const top = (() => { try { return window.top.location.href && window.top; } catch (e) { return window; } })();
  let sb = null;
  try { if (window.supabase && window.supabase.createClient) sb = window.supabase.createClient(SB_URL, SB_KEY); } catch (e) { console.warn('Supabase niedostępny', e); }

  const KT = { sb, root, user: null, member: null };
  const warn = r => { if (r && r.error) console.warn(r.error); return r; };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  KT.esc = esc;

  KT.ready = (async () => {
    if (!sb) return null;
    const { data: { session } } = await sb.auth.getSession();
    if (!session) return null;
    KT.user = session.user;
    const { data, error } = await sb.from('members').select('status,is_admin,display_name,email').eq('user_id', KT.user.id).maybeSingle();
    if (error) console.warn(error);
    KT.member = data || { status: 'pending', is_admin: false, display_name: null };
    return KT.user;
  })().catch(e => { console.warn(e); return null; });

  KT.name = () => (KT.member && KT.member.display_name) || (KT.user && KT.user.user_metadata && KT.user.user_metadata.display_name) || (KT.user ? KT.user.email.split('@')[0] : '');
  KT.approved = () => !!(KT.member && KT.member.status === 'approved');
  KT.isAdmin = () => !!(KT.member && KT.member.is_admin);
  KT.loginUrl = () => root + 'login.html?next=' + encodeURIComponent(top.location.pathname + top.location.search);
  KT.signOut = async () => { if (sb) await sb.auth.signOut(); top.location.href = root + 'login.html'; };

  // Strona wymagająca konta: bez sesji → logowanie; bez akceptacji → strona główna (tam komunikat).
  KT.guard = async ({ needApproved = true, needAdmin = false } = {}) => {
    await KT.ready;
    if (!sb) return false;
    if (!KT.user) { top.location.replace(KT.loginUrl()); return false; }
    if (needAdmin && !KT.isAdmin()) { top.location.replace(root); return false; }
    if (needApproved && !KT.approved()) { if (top.location.pathname !== root) top.location.replace(root); return false; }
    return true;
  };

  // Treści z prywatnego magazynu
  KT.catalog = async () => {
    const { data, error } = await sb.storage.from('trainings').download('catalog.json');
    if (error) { console.warn(error); return null; }
    return JSON.parse(await data.text());
  };
  KT.training = async id => {
    if (!/^[a-z0-9-]+$/.test(id)) return null;
    const { data, error } = await sb.storage.from('trainings').download(id + '/index.html');
    if (error) { console.warn(error); return null; }
    return await data.text();
  };

  // Wyniki i postęp
  KT.saveAttempt = (training, task_id, score, gave_up) => {
    if (!KT.user || !KT.approved()) return Promise.resolve();
    return sb.from('attempts').insert({ training, task_id, score: Math.max(0, Math.min(1, score)), gave_up: !!gave_up }).then(warn);
  };
  KT.attempts = async training => {
    if (!KT.user) return [];
    let q = sb.from('attempts').select('training,task_id,score,gave_up,created_at').order('created_at', { ascending: true }).limit(5000);
    if (training) q = q.eq('training', training);
    const { data, error } = await q; if (error) { console.warn(error); return []; }
    return data || [];
  };
  KT.toReview = rows => { const last = {}; rows.forEach(r => { last[r.task_id] = r.score; }); return Object.keys(last).filter(k => last[k] < 0.999).map(Number); };
  let timer = null;
  KT.saveProgress = (training, state) => {
    if (!KT.user || !KT.approved()) return;
    clearTimeout(timer);
    timer = setTimeout(() => sb.from('progress').upsert({ user_id: KT.user.id, training, state, updated_at: new Date().toISOString() }).then(warn), 800);
  };
  KT.loadProgress = async training => {
    if (!KT.user) return null;
    const { data, error } = await sb.from('progress').select('state,updated_at').eq('training', training).maybeSingle();
    if (error) { console.warn(error); return null; }
    return data;
  };

  // Pasek konta
  KT.renderBar = async el => {
    if (!el) return;
    await KT.ready;
    if (!sb) { el.innerHTML = '<span class="kt-mute">Serwer kont jest chwilowo niedostępny.</span>'; return; }
    if (!KT.user) { el.innerHTML = `<a class="kt-link" href="${esc(KT.loginUrl())}" target="_top">Zaloguj się</a>`; return; }
    el.innerHTML = `<a class="kt-link" href="${esc(root)}" target="_top">Spis treningów</a>` +
      (KT.isAdmin() ? `<a class="kt-link" href="${esc(root)}admin.html" target="_top">Panel akceptacji</a>` : '') +
      `<span>Zalogowany jako <b>${esc(KT.name())}</b></span><button type="button" class="kt-link" data-kt-out>Wyloguj</button>`;
    const out = el.querySelector('[data-kt-out]'); if (out) out.onclick = KT.signOut;
  };

  window.KT = KT;
})();
