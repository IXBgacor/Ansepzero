/* Pembungkus localStorage yang aman: tidak pernah melempar galat ke pemanggil. */
(function (M) {
  let ok = true;
  try { localStorage.setItem('mph.__t', '1'); localStorage.removeItem('mph.__t'); } catch (e) { ok = false; }
  M.Store = {
    get available() { return ok; },
    get(k) { if (!ok) return null; try { return localStorage.getItem(k); } catch (e) { ok = false; return null; } },
    set(k, v) { if (!ok) return false; try { localStorage.setItem(k, v); return true; } catch (e) { return false; } },
    remove(k) { if (!ok) return false; try { localStorage.removeItem(k); return true; } catch (e) { return false; } }
  };
})(window.MPH);
