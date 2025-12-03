// public/script.js

document.addEventListener('DOMContentLoaded', () => {
    // *** WICHTIG: Ersetzen Sie DIESE URL durch Ihre n8n PRODUCTION Webhook URL ***
    // (Wird hier hartcodiert, da wir keinen Node.js-Server mehr als Proxy verwenden)
    const N8N_WEBHOOK_URL = 'https://n8n.xqtfive.cloud/webhook-test/0f6844ab-7e43-424f-840f-b4d80c1c80cf';
    
    const dropArea = document.getElementById('drop-area');
    const fileInput = document.getElementById('fileInput');
    const selectButton = document.getElementById('select-button');
    const uploadButton = document.getElementById('upload-button');
    const fileListContainer = document.getElementById('file-list-container');
    const statusMessage = document.getElementById('status-message');

    let filesToUpload = [];
    
    selectButton.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, (e) => {
            e.preventDefault();
            dropArea.classList.add('highlight');
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, (e) => {
            e.preventDefault();
            dropArea.classList.remove('highlight');
        }, false);
    });

    dropArea.addEventListener('drop', (e) => {
        e.preventDefault();
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    }, false);

    function handleFiles(files) {
        // WICHTIG: Für den Webhook-Upload senden wir nur die erste Datei.
        filesToUpload = Array.from(files).slice(0, 1); 
        updateUI();
    }

    function updateUI() {
        fileListContainer.innerHTML = '';
        statusMessage.textContent = '';
        
        if (filesToUpload.length > 0) {
            filesToUpload.forEach(file => {
                const item = document.createElement('div');
                item.className = 'file-item';
                item.textContent = `✅ ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
                fileListContainer.appendChild(item);
            });
            uploadButton.classList.add('active');
            uploadButton.disabled = false;
        } else {
            uploadButton.classList.remove('active');
            uploadButton.disabled = true;
            fileListContainer.textContent = 'Keine Dateien ausgewählt.';
        }
    }

   

    uploadButton.addEventListener('click', async () => {
        if (filesToUpload.length === 0 || uploadButton.disabled) return;

        statusMessage.className = 'status-message';
        statusMessage.textContent = 'Lade hoch... Bitte warten.';

        // Erstelle FormData für den Datei-Upload
        const formData = new FormData();
        
        // Füge die Datei hinzu. Der Feldname 'file' ist eine gängige Konvention.
        // n8n wird dies als Binärdaten erkennen.
        formData.append('file', filesToUpload[0]); 

        uploadButton.disabled = true;

        try {
            // Sende direkt an die n8n Webhook URL
            const response = await fetch(N8N_WEBHOOK_URL, {
                method: 'POST',
                body: formData // Wichtig: FormData wird automatisch als multipart/form-data gesendet
            });

            // Da n8n standardmäßig eine leere 200/204-Antwort sendet, 
            // prüfen wir nur den Statuscode.
            if (response.ok) {
                statusMessage.textContent = 'Datei erfolgreich hochgeladen und an n8n gesendet!';
                statusMessage.classList.add('success');
                // Zurücksetzen nach erfolgreichem Upload
                filesToUpload = [];
                updateUI();
            } else {
                // Fehler vom n8n-Server
                statusMessage.textContent = `Upload-Fehler: n8n antwortete mit Status ${response.status}.`;
                statusMessage.classList.add('error');
            }
        } catch (error) {
            // Netzwerkausfall oder anderer Fehler
            statusMessage.textContent = 'Netzwerkfehler: Konnte n8n nicht erreichen.';
            statusMessage.classList.add('error');
        } finally {
            uploadButton.disabled = false;
        }
    });

    updateUI();
});
