/* pincode.niveshsahayak.in: PIN checker, post office search, list filter. Runs in the browser. */
(function () {
  'use strict';
  var d = document, N = window.NSL, esc = N.esc, $ = function (s, r) { return (r || d).querySelector(s); }, $$ = function (s, r) { return [].slice.call((r || d).querySelectorAll(s)); };
  var TYPE = { HO: 'Head Office', PO: 'Sub Office', SO: 'Sub Office', BO: 'Branch Office' };
  var cache = {};
  function get(url) { return cache[url] || (cache[url] = N.json(url).catch(function (e) { delete cache[url]; throw e; })); }

  /* PIN checker */
  var form = $('[data-pin-form]'), out = $('[data-pin-out]');
  function say(html) { out.innerHTML = '<div class="result rise">' + html + '</div>'; }
  function check(raw, quiet) {
    var pin = String(raw || '').replace(/\D/g, '');
    if (!pin) { if (!quiet) say('<h2>Type a PIN code first</h2><p>A PIN code has 6 digits, for example 141001.</p>'); return; }
    if (pin.length !== 6 || pin.charAt(0) === '0') { say('<h2>This is not a PIN code</h2><p class="big">' + esc(pin) + '</p><p>' + (pin.length !== 6 ? 'It has ' + pin.length + (pin.length === 1 ? ' digit' : ' digits') + '; a PIN code has exactly 6.' : 'A PIN code never begins with 0.') + '</p>'); return; }
    out.innerHTML = '<div class="shim" style="height:150px;margin-top:14px"></div>';
    get('/data/p/' + pin.slice(0, 3) + '.json').then(function (j) {
      var r = j[pin];
      if (!r) { say('<h2>PIN code not found</h2><p class="big">' + pin + '</p><p>No post office has this PIN code in India Post\'s list. Check the digits; one wrong digit is the usual reason.</p>'); return; }
      var offs = r[3], where = r[0] !== r[1] ? r[0] + ', ' + r[1] : r[1];
      say('<h2>' + esc(where) + '</h2><p class="big">' + pin + '</p><dl class="facts"><dt>District</dt><dd><a href="' + r[2] + '">' + esc(r[0]) + '</a></dd><dt>State</dt><dd>' + esc(r[1]) + '</dd>' +
        '<dt>Post offices</dt><dd>' + offs.slice(0, 8).map(function (o) { return esc(o[0]) + ' <small>(' + (TYPE[o[1]] || 'Post Office') + (o[2] ? '' : ', no delivery') + ')</small>'; }).join('<br>') + (offs.length > 8 ? '<br>and ' + (offs.length - 8) + ' more' : '') + '</dd></dl>' +
        '<div class="acts"><button class="btn" type="button" data-copy="' + pin + '" data-done="' + pin + ' copied">Copy PIN code</button>' +
        '<button class="btn ghost" type="button" data-share="PIN code ' + pin + ': ' + esc(offs[0][0] + ', ' + where) + '" data-url="https://pincode.niveshsahayak.in/pin/' + pin + '/">Share</button>' +
        '<a class="btn ghost" href="/pin/' + pin + '/">Full details</a></div>');
      N.recent('nsl-pin', { u: pin, t: where });
      recent();
    }).catch(function (e) {
      if (String(e && e.message) === '404') say('<h2>PIN code not found</h2><p class="big">' + pin + '</p><p>No PIN code in India begins with ' + pin.slice(0, 3) + '. Check the digits.</p>');
      else say('<h2>The data did not load</h2><p>Check your internet connection and try again.</p>');
    });
  }
  function recent() {
    var box = $('[data-recent]'), list = N.recent('nsl-pin');
    if (!box || !list.length) return;
    box.innerHTML = '<p class="hint">PIN codes you looked up lately (kept only in this browser): ' + list.map(function (x) { return '<a href="/pin/' + esc(x.u) + '/" class="mono" title="' + esc(x.t) + '">' + esc(x.u) + '</a>'; }).join(' · ') + '</p>';
  }
  if (form) {
    form.addEventListener('submit', function (e) { e.preventDefault(); check(form.pin.value); });
    var m = /[?&]pin=(\d{6})/.exec(location.search);
    if (m) { form.pin.value = m[1]; check(m[1], true); }
    recent();
  }

  /* post office search: names are kept in small files by their first two letters */
  var pq = $('[data-po-search]'), po = $('[data-po-out]'), timer;
  if (pq) pq.addEventListener('input', function () {
    clearTimeout(timer);
    timer = setTimeout(function () {
      var q = pq.value.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim(), key = q.replace(/[^a-z]/g, '').slice(0, 2);
      if (q.replace(/ /g, '').length < 3 || key.length < 2) { po.innerHTML = ''; return; }
      po.innerHTML = '<div class="shim" style="margin-top:10px"></div>';
      get('/data/n/' + key + '.json').then(function (list) {
        if (pq.value.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim() !== q) return;
        var a = [], b = [];
        for (var i = 0; i < list.length; i++) {
          var n = list[i][0].toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ');
          if (n.indexOf(q) === 0) a.push(list[i]); else if (n.replace(/ /g, '').indexOf(q.replace(/ /g, '')) === 0) b.push(list[i]);
        }
        var hits = a.concat(b), show = hits.slice(0, 40);
        po.innerHTML = show.length ? '<div class="tbl rise" style="margin-top:12px"><table class="stack"><thead><tr><th>Post office</th><th>PIN code</th><th>District</th><th>State</th></tr></thead><tbody>' +
          show.map(function (h) { return '<tr><td data-l="Post office">' + esc(h[0]) + '</td><td class="mono" data-l="PIN code"><a href="/pin/' + h[1] + '/">' + h[1] + '</a></td><td data-l="District">' + esc(h[2]) + '</td><td data-l="State">' + esc(h[3]) + '</td></tr>'; }).join('') +
          '</tbody></table></div>' + (hits.length > 40 ? '<p class="hint">Showing 40 of ' + hits.length + '. Type more letters to narrow it down.</p>' : '')
          : '<p class="hint">No post office begins with "' + esc(pq.value.trim()) + '". Check the spelling, try the name of the nearest post office, or choose your state and district.</p>';
      }).catch(function (e) {
        po.innerHTML = String(e && e.message) === '404' ? '<p class="hint">No post office begins with those letters.</p>' : '<p class="hint">The list did not load. Check your connection and try again.</p>';
      });
    }, 250);
  });

  /* filter the rows of a district's table */
  var rf = $('[data-row-filter]');
  if (rf) {
    var rows = $$('[data-rows] tbody tr'), text = null, note = $('[data-filter-n]'), first = note ? note.textContent : '';
    rf.addEventListener('input', function () {
      if (!text) text = rows.map(function (r) { return r.textContent.toLowerCase(); });
      var words = rf.value.toLowerCase().split(/\s+/).filter(Boolean), n = 0;
      rows.forEach(function (r, i) { var ok = words.every(function (w) { return text[i].indexOf(w) > -1; }); r.hidden = !ok; if (ok) n++; });
      if (note) note.textContent = words.length ? (n ? n + (n === 1 ? ' post office matches.' : ' post offices match.') : 'Nothing on this page matches. Check the spelling, or try fewer letters.') : first;
    });
  }
})();
