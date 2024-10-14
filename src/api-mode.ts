import express from 'express';

// Funktion för att starta API-servern
export function startServer() {
  const app = express();
  const port = process.env.PORT || 3000;

  // API Endpoint, t.ex. för att validera en YAML-fil
  app.get('/validate', (req, res) => {
    res.send('API-läge aktiverat! Validerar YAML-filer här...');
  });

  /*
        Open API schema för restinterfacet för RAP-LP
  */
    /*      - Gemensam funktionalitet?
            - Funktion för att invoka nuvarande kodbas för regelmotorn 
            - Funktion för att leverera resultat från Diagnostiseringen 

    */
  /*	Möjlighet till att specificera en URL för att kunna 
        peka ut en OpenApi Specifikation v. >3.0  för validering
        - Konstruera en enpoint för detta  (Routes också)
        - Funktion för att invoka URL(tredjeparts lib(typ axios)) (Medium) inkl. validering etc.
  */
  /*	Möjlighet till att specificera en fil för att kunna 
        peka ut en OpenApi Specifikation v. >3.0  för validering
        - Konstruera en enpoint för detta  (Routes också)

    	- Möjlighet till att specificera content för en 
        - Konstruera en enpoint för detta  (Routes också)
          OpenApi Specifikation v. >3.0 för validering 
  */
  // Starta servern
  app.listen(port, () => {
    console.log(`Servern körs på http://localhost:${port}`);
  });
}