// server.js
import express from 'express';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config'; 

// Umgebungsvariablen
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL; // Die URL des n8n-Webhooks (aus Coolify)
const PORT = process.env.PORT || 3000;

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 1. Dient statische Dateien aus dem 'public'-Ordner
// Kommentar: Stellt die UI (HTML, CSS, JS) bereit
app.use(express.static(join(__dirname, 'public')));

// 2. Proxy-Endpunkt für den Upload
// Kommentar: Empfängt die Datei und leitet sie an den n8n-Webhook weiter
app.post('/api/upload', async (req, res) => {
    if (!N8N_WEBHOOK_URL) {
        console.error('FEHLER: N8N_WEBHOOK_URL nicht konfiguriert.');
        return res.status(500).json({ 
            erfolg: false, 
            nachricht: 'Interner Fehler: Webhook-Ziel fehlt.' 
        });
    }

    try {
        // Leitet die gesamte multipart/form-data-Anfrage direkt an n8n weiter
        // req.rawHeaders enthält die Header, req enthält den Body (die Datei)
        const response = await fetch(N8N_WEBHOOK_URL, {
            method: 'POST',
            // WICHTIG: Verwenden Sie den rohen Body der Anfrage, um die Datei weiterzuleiten
            body: req, 
            headers: {
                // Kopiert alle Header, um den multipart/form-data-Typ beizubehalten
                'Content-Type': req.headers['content-type'], 
                'Content-Length': req.headers['content-length'],
            },
            // NEU: Erforderlich für das Streaming des Bodies in Node.js fetch
            duplex: 'half', 
        });

        // Leitet die Antwort von n8n an den Client weiter
        if (response.ok) {
            // Erfolgsnachricht im Body (für den Client)
            return res.status(200).json({ 
                erfolg: true, 
                nachricht: 'Datei erfolgreich an n8n gesendet.' 
            });
        } else {
            // Fehler von n8n
            const n8nBody = await response.text();
            return res.status(response.status).json({ 
                erfolg: false, 
                nachricht: `Fehler von n8n: Status ${response.status}. ${n8nBody}` 
            });
        }

    } catch (error) {
        console.error('FEHLER beim Weiterleiten an n8n:', error);
        return res.status(500).json({ 
            erfolg: false, 
            nachricht: `Interner Proxy-Fehler: ${error.message}` 
        });
    }
});

// WICHTIG: Express muss den rohen Body für den Proxy verwenden.
// Wir verwenden hier KEIN body-parser/multer, damit der Body unverändert an n8n weitergeleitet wird.
app.use(express.raw({ type: 'application/octet-stream', limit: '10mb' })); 

// Server starten
app.listen(PORT, () => {
    console.log(`Server läuft auf Port ${PORT}.`);
    console.log(`N8N Webhook-URL: ${N8N_WEBHOOK_URL ? 'Konfiguriert' : 'FEHLT!'}`);
});
