
document.addEventListener('DOMContentLoaded', () => {
  const SERVER_URL = 'https://jsonplaceholder.typicode.com/posts';

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
    if (selectedCategory !== 'all') filtered = quotes.filter(q => q.category === selectedCategory);
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
    if (!text || !category) {
      alert("Please enter both a quote and a category.");
      return;
    }

    const newQuote = { text, category };
    quotes.push(newQuote);
    saveLocalQuotes();
    populateCategories();
    quoteDisplay.innerHTML = `<p>"${escapeHtml(text)}"</p><small><em>— ${escapeHtml(category)}</em></small>`;
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(newQuote));
    postQuoteToServer(newQuote);
  }

  async function postQuoteToServer(quote) {
    try {
      await fetch(SERVER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quote)
      });
      console.log('Quote synced to server:', quote);
    } catch (error) {
      console.warn('Failed to sync new quote:', error);
    }
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
    try {
      const response = await fetch(SERVER_URL);
      const data = await response.json();
      const serverQuotes = data.slice(0, 10).map(p => ({
        text: p.title,
        category: "Server"
      }));

      const diff = detectConflicts(serverQuotes, quotes);
      const hasConflicts = diff.serverOnly.length > 0 || diff.localOnly.length > 0;

      if (hasConflicts) {
        lastSyncConflicts = diff;
        showSyncNotification(`Conflicts detected: ${diff.serverOnly.length} from server, ${diff.localOnly.length} local.`, true);
      } else {
        quotes = serverQuotes.slice();
        saveLocalQuotes();
        populateCategories();
        showSyncNotification("Quotes synced with server!", false);
      }
    } catch (err) {
      console.error("Error fetching from server:", err);
    }
  }

  async function syncQuotes() {
    await fetchQuotesFromServer();
    populateCategories();
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

  acceptServerBtn?.addEventListener('click', () => {
    hideSyncNotification();
    if (lastSyncConflicts) {
      quotes = quotes.concat(lastSyncConflicts.serverOnly);
      saveLocalQuotes();
      lastSyncConflicts = null;
    }
    showRandomQuote();
  });

  keepLocalBtn?.addEventListener('click', () => {
    hideSyncNotification();
    lastSyncConflicts = null;
    saveLocalQuotes();
    showRandomQuote();
  });

  viewConflictsBtn?.addEventListener('click', () => {
    conflictsList.innerHTML = '';
    if (!lastSyncConflicts) {
      conflictsList.textContent = 'No conflicts.';
    } else {
      const { serverOnly, localOnly } = lastSyncConflicts;
      conflictsList.innerHTML += `<h4>Server-only Quotes (${serverOnly.length})</h4>`;
      serverOnly.forEach(q => conflictsList.innerHTML += `<p>${escapeHtml(q.text)} — ${escapeHtml(q.category)}</p>`);
      conflictsList.innerHTML += `<h4>Local-only Quotes (${localOnly.length})</h4>`;
      localOnly.forEach(q => conflictsList.innerHTML += `<p>${escapeHtml(q.text)} — ${escapeHtml(q.category)}</p>`);
    }
    conflictsModal.style.display = 'block';
  });

  closeConflictsBtn?.addEventListener('click', () => {
    conflictsModal.style.display = 'none';
  });

  setInterval(syncQuotes, 60000);

  showQuoteButton?.addEventListener('click', showRandomQuote);
  addQuoteButton?.addEventListener('click', createAddQuoteForm);
  exportBtn?.addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(quotes)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'quotes.json';
    a.click();
    URL.revokeObjectURL(url);
  });
  importFile?.addEventListener('change', e => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      const imported = JSON.parse(reader.result);
      quotes.push(...imported);
      saveLocalQuotes();
      populateCategories();
    };
    reader.readAsText(file);
  });

  populateCategories();
  showRandomQuote();
  syncQuotes();
});
