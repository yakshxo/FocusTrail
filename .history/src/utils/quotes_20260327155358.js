const quotes = [
  "Small progress is still progress.",
  "Focus on the step in front of you, not the whole staircase.",
  "Discipline creates the results motivation talks about.",
  "One focused session can change your whole day.",
  "Your future self will thank you for studying today.",
  "Consistency beats intensity when it comes to learning.",
  "Start where you are. Use what you have. Do what you can.",
  "The best study session is the one you actually begin.",
  "You do not need more time. You need more focus.",
  "Stay patient. Real progress takes repeated effort.",
  "A calm mind learns better.",
  "Focus is your superpower in a distracted world."
];

export function getRandomQuote() {
  const randomIndex = Math.floor(Math.random() * quotes.length);
  return quotes[randomIndex];
}