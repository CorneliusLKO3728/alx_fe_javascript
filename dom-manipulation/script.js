document.addEventListener('DOMContentLoaded', () => {
  const quoteDisplay = document.getElementById('quoteDisplay');
  const showQuoteButton = document.getElementById('newQuote');
  const addQuoteButton = document.getElementById('addQuoteBtn');
  const newQuoteText = document.getElementById('newQuoteText');
  const newQuoteCategory = document.getElementById('newQuoteCategory');
  const exportBtn = document.getElementById('exportBtn');
  const importFile = document.getElementById('importFile');

  const LOCAL_KEY = 'quotesData';
  const SESSION_KEY = 'lastViewedQuote';
  let quotes = JSON.parse(localStorage.getItem(LOCAL_KEY)) || [
    { text: "The greatest glory in living lies not in never falling, but in rising every time we fall.", category: "Inspiration" },
    { text: "Life is what happens when you're busy making other plans.", category: "Life" },
    { text: "If you set your goals ridiculously high and it’s a failure, you will fail above everyone else’s success.", category: "Motivation" },
  ];
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function showRandomQuote() {
    if (!Array.isArray(quotes) || quotes.length === 0) {
      quoteDisplay.textContent = "No quotes available. Please add one below!";
      return;
    }
    const randomIndex = Math.floor(Math.random() * quotes.length);
    const selected = quotes[randomIndex];
    quoteDisplay.innerHTML = `
      <p>"${escapeHtml(selected.text)}"</p>
      <small><em>— ${escapeHtml(selected.category)}</em></small>
    `;
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(selected));
  }
  function createAddQuoteForm () {
    const text = newQuoteText.value.trim();
    const category = newQuoteCategory.value.trim();

    if (text === "" || category === "") {
      alert("Please enter both a quote and a category.");
      return;
    }

    const newQuote = { text, category };
    quotes.push(newQuote);
    localStorage.setItem(LOCAL_KEY, JSON.stringify(quotes));
    quoteDisplay.innerHTML = `
      <p>"${escapeHtml(text)}"</p>
      <small><em>— ${escapeHtml(category)}</em></small>
    `;
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(newQuote));
    newQuoteText.value = "";
    newQuoteCategory.value = "";
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
        const importedQuotes = JSON.parse(e.target.result);
        if (!Array.isArray(importedQuotes)) throw new Error("Invalid format");

        quotes.push(...importedQuotes);
        localStorage.setItem(LOCAL_KEY, JSON.stringify(quotes));
        alert("Quotes imported successfully!");
      } catch (error) {
        alert("Failed to import quotes. Please upload a valid JSON file.");
      }
    };
    reader.readAsText(file);
  }

  showQuoteButton.addEventListener('click', showRandomQuote);
  addQuoteButton.addEventListener('click', createAddQuoteForm);
  if (exportBtn) exportBtn.addEventListener('click', exportQuotes);
  if (importFile) importFile.addEventListener('change', importFromJsonFile);
  const lastViewed = sessionStorage.getItem(SESSION_KEY);
  if (lastViewed) {
    const quote = JSON.parse(lastViewed);
    quoteDisplay.innerHTML = `
      <p>"${escapeHtml(quote.text)}"</p>
      <small><em>— ${escapeHtml(quote.category)}</em></small>
    `;
  }
});
