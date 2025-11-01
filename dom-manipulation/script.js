
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
    if (quotes.length === 0) {
      quoteDisplay.textContent = "No quotes available. Please add one below!";
      return;
    }

    const randomIndex = Math.floor(Math.random() * quotes.length);
    const randomQuote = quotes[randomIndex];

    quoteDisplay.innerHTML = `
      <p>"${randomQuote.text}"</p>
      <small><em>— ${randomQuote.category}</em></small>
    `;
  }
  function addQuote() {
    const text = newQuoteText.value.trim();
    const category = newQuoteCategory.value.trim();

    if (text === "" || category === "") {
      alert("Please fill in both the quote and category fields!");
      return;
    }
    quotes.push({ text, category });
    newQuoteText.value = "";
    newQuoteCategory.value = "";
    quoteDisplay.innerHTML = `
      <p>"${text}"</p>
      <small><em>— ${category}</em></small>
    `;

    alert("Quote added successfully!");
  }
  showQuoteButton.addEventListener('click', displayRandomQuote);
  addQuoteButton.addEventListener('click', addQuote);
});
