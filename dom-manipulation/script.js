
document.addEventListener('DOMContentLoaded', () => {
  const SERVER_URL = 'https://example.com/api/quotes'; 

  const quoteDisplay = document.getElementById('quoteDisplay');
  const showQuoteButton = document.getElementById('newQuote');
  const addQuoteButton = document.getElementById('addQuoteBtn');
  const newQuoteText = document.getElementById('newQuoteText');
  const newQuoteCategory = document.getElementById('newQuoteCategory');
  const exportBtn = document.getElementById('exportBtn');
  const importFile = document.getElementById('importFile');
  const categoryFilter = document.getElementById('categoryFilter');

  const syncNotification = document.getElementById('syncNotification');
  const syncMessage = document.getElementById('syncMessage');
  const acceptServerBtn = document.getElementById('acceptServerBtn');
  const keepLocalBtn = document.getElementById('keepLocalBtn');
  const viewConflictsBtn = document.getElementById('viewConflictsBtn');
  const conflictsModal = document.getElementById('conflictsModal');
  const conflictsList = document.getElementById('conflictsList');
  const closeConflictsBtn = document.getElementById('closeConflictsBtn');

  const LOCAL_KEY = 'quotesData';
  const SESSION_KEY = 'lastViewedQuote';
  const FILTER_KEY = 'selectedCategory';
  let quotes = JSON.parse(localStorage.getItem(LOCAL_KEY)) || [
    { text: "The greatest glory in living lies not in never falling, but in rising every time we fall.", category: "Inspiration" },
    { text: "Life is what happens when you're busy making other plans.", category: "Life" },
    { text: "If you set your goals ridiculously high and it’s a failure, you will fail above everyone else’s success.", category: "Motivation" },
  ];

  let lastSyncConflicts = null; 
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function saveLocalQuotes() {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(quotes));
  }

  function populateCategories() {
    if (!categoryFilter) return;
    const uniqueCategories = [...new Set(quotes.map(q => q.category))];
    const savedCategory = localStorage.getItem(FILTER_KEY) || 'all';
    categoryFilter.innerHTML = `<option value="all">All Categories</option>`;
    uniqueCategories.forEach(cat => {
      const option = document.createElement('option');
      option.value = cat;
      option.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
      if (cat === savedCategory) option.selected = true;
      categoryFilter.appendChild(option);
    });
  }

  function showRandomQuote() {
    let filtered = quotes;
    const selectedCategory = categoryFilter ? categoryFilter.value : 'all';
    if (selectedCategory && selectedCategory !== 'all') filtered = quotes.filter(q => q.category === selectedCategory);
    if (!Array.isArray(filtered) || filtered.length === 0) {
      quoteDisplay.innerHTML = "<p>No quotes available in this category.</p>";
      return;
    }
    const idx = Math.floor(Math.random() * filtered.length);
    const selected = filtered[idx];
    quoteDisplay.innerHTML = `
      <p>"${escapeHtml(selected.text)}"</p>
      <small><em>— ${escapeHtml(selected.category)}</em></small>
    `;
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(selected));
  }

  function createAddQuoteForm() {
    const text = newQuoteText.value.trim();
    const category = newQuoteCategory.value.trim();
    if (!text || !category) { alert("Please enter both a quote and a category."); return; }

    const newQuote = { text, category };
    quotes.push(newQuote);
    saveLocalQuotes();
    populateCategories();
    newQuoteText.value = "";
    newQuoteCategory.value = "";
    quoteDisplay.innerHTML = `<p>"${escapeHtml(text)}"</p><small><em>— ${escapeHtml(category)}</em></small>`;
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(newQuote));
  }
  function exportQuotes() {
    const data = JSON.stringify(quotes, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'quotes.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }
  function importFromJsonFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        if (!Array.isArray(imported)) throw new Error('Invalid');
        const valid = imported.filter(it => it && typeof it.text === 'string' && typeof it.category === 'string');
        if (valid.length === 0) { alert('No valid quotes found.'); return; }
        quotes.push(...valid);
        saveLocalQuotes();
        populateCategories();
        alert(`Imported ${valid.length} quotes.`);
      } catch (err) {
        alert('Import failed: invalid JSON.');
      }
    };
    reader.readAsText(file);
  }
  function normalizeQuote(q) {
    return `${(q.text || '').trim()}||${(q.category || '').trim()}`.toLowerCase();
  }

  function detectConflicts(serverQuotes, localQuotes) {
    const sMap = new Map();
    serverQuotes.forEach(q => sMap.set(normalizeQuote(q), q));

    const lMap = new Map();
    localQuotes.forEach(q => lMap.set(normalizeQuote(q), q));

    const serverOnly = [];
    const localOnly = [];
    sMap.forEach((val, key) => { if (!lMap.has(key)) serverOnly.push(val); });
    lMap.forEach((val, key) => { if (!sMap.has(key)) localOnly.push(val); });

    return { serverOnly, localOnly };
  }

  async function fetchQuotesFromServer() {
    if (!SERVER_URL || SERVER_URL.includes('example.com')) {
      return;
    }

    try {
      const resp = await fetch(SERVER_URL, { cache: 'no-store' });
      if (!resp.ok) throw new Error('Network error');
      const serverQuotes = await resp.json();
      if (!Array.isArray(serverQuotes)) throw new Error('Invalid server data');
      const diff = detectConflicts(serverQuotes, quotes);
      const hasConflicts = diff.serverOnly.length > 0 || diff.localOnly.length > 0;

      if (!hasConflicts) {
        if (JSON.stringify(serverQuotes) !== JSON.stringify(quotes)) {
          quotes = serverQuotes.slice();
          saveLocalQuotes();
          populateCategories();
          showSyncNotification('Data synced from server (no conflicts).', false);
        }
        return;
      }
      lastSyncConflicts = diff;
      const msgParts = [];
      if (diff.serverOnly.length) msgParts.push(`${diff.serverOnly.length} quote(s) from server`);
      if (diff.localOnly.length) msgParts.push(`${diff.localOnly.length} local-only quote(s)`);
      showSyncNotification(`Sync detected changes: ${msgParts.join(' and ')}.`, true);
      quotes = serverQuotes.slice();
      saveLocalQuotes();
      populateCategories();
    } catch (err) {
      console.error('Sync failed:', err);
    }
  }

  function showSyncNotification(message, hasConflicts) {
    if (!syncNotification) return;
    syncMessage.textContent = message;
    syncNotification.style.display = 'block';
    viewConflictsBtn.style.display = hasConflicts ? 'inline-block' : 'none';
  }

  function hideSyncNotification() {
    if (!syncNotification) return;
    syncNotification.style.display = 'none';
  }

  acceptServerBtn && acceptServerBtn.addEventListener('click', () => {
    hideSyncNotification();
    if (lastSyncConflicts) {
      lastSyncConflicts = null;
    } else {
      syncWithServer();
    }
    populateCategories();
    showRandomOrLast();
  });

  keepLocalBtn && keepLocalBtn.addEventListener('click', () => {
    hideSyncNotification();
    lastSyncConflicts = null;
    saveLocalQuotes(); 
    populateCategories();
    showRandomOrLast();
  });

  viewConflictsBtn && viewConflictsBtn.addEventListener('click', () => {
    conflictsList.innerHTML = '';
    const c = lastSyncConflicts;
    if (!c) {
      conflictsList.textContent = 'No conflicts to show.';
    } else {
      const makeSection = (title, arr) => {
        const h = document.createElement('h4'); h.textContent = `${title} (${arr.length})`; conflictsList.appendChild(h);
        if (arr.length === 0) {
          const p = document.createElement('p'); p.textContent = 'None'; conflictsList.appendChild(p); return;
        }
        arr.forEach(q => {
          const div = document.createElement('div');
          div.style.padding = '6px 0';
          div.innerHTML = `<strong>${escapeHtml(q.text)}</strong> <small>— ${escapeHtml(q.category)}</small>`;
          conflictsList.appendChild(div);
        });
      };
      makeSection('Server-only quotes', c.serverOnly);
      makeSection('Local-only quotes', c.localOnly);
    }
    conflictsModal.style.display = 'block';
  });

  closeConflictsBtn && closeConflictsBtn.addEventListener('click', () => {
    conflictsModal.style.display = 'none';
  });
  function showRandomOrLast() {
    const last = sessionStorage.getItem(SESSION_KEY);
    if (last) {
      try {
        const q = JSON.parse(last);
        quoteDisplay.innerHTML = `<p>"${escapeHtml(q.text)}"</p><small><em>— ${escapeHtml(q.category)}</em></small>`;
        return;
      } catch {}
    }
    showRandomQuote();
  }
  async function syncNow() {
    await fetchQuotesFromServer();
    populateCategories();
    showRandomOrLast();
  }
  const SYNC_INTERVAL_MS = 60 * 1000;
  let syncTimer = null;
  function startAutoSync() {
    if (syncTimer) clearInterval(syncTimer);
    syncTimer = setInterval(() => fetchQuotesFromServer(), SYNC_INTERVAL_MS);
  }
  if (showQuoteButton) showQuoteButton.addEventListener('click', showRandomQuote);
  if (addQuoteButton) addQuoteButton.addEventListener('click', createAddQuoteForm);
  if (exportBtn) exportBtn.addEventListener('click', exportQuotes);
  if (importFile) importFile.addEventListener('change', importFromJsonFile);
  if (categoryFilter) categoryFilter.addEventListener('change', () => {
    localStorage.setItem(FILTER_KEY, categoryFilter.value);
    showRandomOrLast();
  });
  populateCategories();
  showRandomOrLast();
  if (SERVER_URL && !SERVER_URL.includes('example.com')) {
    syncNow();
    startAutoSync();
  } else {
    console.info('Server sync disabled: set SERVER_URL to enable auto-sync.');
  }
});
