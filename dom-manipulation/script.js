
document.addEventListener('DOMContentLoaded', () => {
  const quotes = [
    { text: "The greatest glory in living lies not in never falling, but in rising every time we fall.", category: "Inspiration" },
    { text: "Life is what happens when you're busy making other plans.", category: "Life" },
    { text: "If you set your goals ridiculously high and it’s a failure, you will fail above everyone else’s success.", category: "Motivation" },
  ];
  const quoteDisplay = document.getElementById('quoteDisplay');
  const showQuoteButton = document.getElementById('newQuote');
  const addQuoteButton = document.getElementById('addQuoteBtn');
  const newQuoteText = document.getElementById('newQuoteText');
  const newQuoteCategory = document.getElementById('newQuoteCategory');
  function displayRandomQuote() {
    if (!Array.isArray(quotes) || quotes.length === 0) {
      quoteDisplay.textContent = "No quotes available. Please add one below!";
      return;
    }
    const randomIndex = Math.floor(Math.random() * quotes.length);
    const selected = quotes[randomIndex];
    const text = selected && selected.text ? selected.text : "(No text)";
    const category = selected && selected.category ? selected.category : "Uncategorized";
    quoteDisplay.innerHTML = `
      <p>"${escapeHtml(text)}"</p>
      <small><em>— ${escapeHtml(category)}</em></small>
    `;
  }
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
  function addQuote() {
    const text = newQuoteText.value.trim();
    const category = newQuoteCategory.value.trim();

    if (text === "" || category === "") {
      alert("Please enter both a quote and a category.");
      return;
    }
    quotes.push({ text, category });

    quoteDisplay.innerHTML = `
      <p>"${escapeHtml(text)}"</p>
      <small><em>— ${escapeHtml(category)}</em></small>
    `;
    newQuoteText.value = "";
    newQuoteCategory.value = "";
  }

  showQuoteButton.addEventListener('click', showRandomQuote);
  addQuoteButton.addEventListener('click', addQuote);
});
