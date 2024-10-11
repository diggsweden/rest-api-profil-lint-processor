import express from 'express';

// Funktion för att starta API-servern
export function startServer() {
  const app = express();
  const port = process.env.PORT || 3000;

  // API Endpoint, t.ex. för att validera en YAML-fil
  app.get('/validate', (req, res) => {
    res.send('API-läge aktiverat! Validerar YAML-filer här...');
  });

  // Starta servern
  app.listen(port, () => {
    console.log(`Servern körs på http://localhost:${port}`);
  });
}