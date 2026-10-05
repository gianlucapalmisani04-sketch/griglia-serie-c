# Griglia Serie C 2026/27 — guida alla pubblicazione

Il sito è composto da questi file:

| File | Cosa contiene |
|---|---|
| `index.html` | La pagina del sito |
| `app.js` | Tutta la logica (griglia, previsione, statistiche…) |
| `data.js` | Dati iniziali: 22 arbitri, 13 osservatori, 12 squadre, 132 gare |
| `config.js` | **L'unico file da modificare**: i codici di Supabase |
| `setup.sql` | Script da eseguire una volta su Supabase |

Costo totale: **0 €**. Supabase (database) e GitHub Pages (hosting) hanno piani gratuiti più che sufficienti.

---

## Passo 1 — Database su Supabase (≈5 minuti)

1. Vai su **supabase.com** → *Start your project* → registrati (va bene anche "Continue with GitHub").
2. *New project*: nome `griglia-serie-c`, scegli una password (salvala), regione **Central EU (Frankfurt)** → *Create*.
3. Menu a sinistra → **SQL Editor** → *New query* → incolla tutto il contenuto di `setup.sql` → **Run**. Deve comparire "Success".
   > Lo script consente di scrivere solo all'email `gianlucapalmisani04@gmail.com`. Se vuoi usare un'altra email, cambiala nelle 3 righe dove compare prima di premere Run.
4. **Authentication → Users → Add user → Create new user**: inserisci la stessa email e una password, spunta **Auto Confirm User** → *Create*.
5. **Authentication → Sign In / Providers**: disattiva **Allow new users to sign up** → *Save*. Così nessun altro può registrarsi.
6. **Project Settings → API Keys** (o *Data API*): copia
   - **Project URL** (tipo `https://abcd1234.supabase.co`)
   - la chiave **anon public** (oppure **publishable**, che inizia con `sb_publishable_`)
7. Apri `config.js` con il Blocco note e incolla i due valori tra le virgolette:
   ```js
   SUPABASE_URL: "https://abcd1234.supabase.co",
   SUPABASE_ANON_KEY: "eyJhbGciOi...",
   ```
   La chiave *anon/publishable* è fatta per stare in un sito pubblico: la protezione la fanno le regole create da `setup.sql`. **Non usare mai la chiave `service_role` / `secret`.**

## Passo 2 — Pubblicazione su GitHub Pages (≈5 minuti)

1. Registrati su **github.com**.
2. In alto a destra **+ → New repository**: nome `griglia-serie-c`, **Public** → *Create repository*.
3. Clicca **uploading an existing file**, trascina i 5 file (`index.html`, `app.js`, `data.js`, `config.js`, `setup.sql`) → *Commit changes*.
4. **Settings → Pages** → *Source*: **Deploy from a branch** → Branch **main**, cartella **/(root)** → *Save*.
5. Dopo 1–2 minuti il sito è online su:
   **`https://TUO-NOME-UTENTE.github.io/griglia-serie-c/`**

Questo è il link da mandare ai colleghi: lo aprono da telefono o PC senza account.

## Passo 3 — Uso

- Apri il sito → **Accedi** (in alto a destra) con email e password del passo 1.4.
- **Giornate**: per ogni partita scegli 1° e 2° arbitro, osservatore e voti. Si salva da solo.
- **Griglia**: la vista dell'Excel, con i colori delle fasce di voto.
- **Previsione**: partita più probabile e probabilità di riposo per la giornata successiva.
- **Gestione**: città degli arbitri (da completare!), playoff/playout, regole, backup ed esportazione in Excel.

## Da sapere

- Il progetto Supabase gratuito **va in pausa dopo 7 giorni senza attività**. I dati restano: basta entrare su supabase.com e premere *Restore*. Durante la stagione, con le visite settimanali, normalmente non succede.
- Ogni salvataggio conserva la versione precedente (tabella `griglia_storico` su Supabase). In più puoi scaricare un backup dalla sezione Gestione.
- Per modificare il sito in futuro basta sostituire il file su GitHub (*Add file → Upload files*).
- Senza i codici in `config.js` il sito funziona in **modalità demo**: puoi provarlo aprendo `index.html` sul computer, ma i dati restano solo in quel browser.
