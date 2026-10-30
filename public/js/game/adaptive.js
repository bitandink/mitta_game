// 실패 누적에 따라 단계적으로 완화. 완료하면 기록 초기화.
const MitttaAdaptive = (() => {
  const prefix = 'mitta-halloween-assist-v1-';
  function get(name) { try { return Math.max(0, Number(localStorage.getItem(prefix + name)) || 0); } catch { return 0; } }
  function fail(name) { const n = Math.min(20, get(name) + 1); try { localStorage.setItem(prefix + name, String(n)); } catch {} return n; }
  function clear(name) { try { localStorage.removeItem(prefix + name); } catch {} }
  function tier(name) { const n = get(name); return n >= 5 ? 2 : n >= 3 ? 1 : 0; }
  return { get, fail, clear, tier };
})();
