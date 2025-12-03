// public/script.js

document.addEventListener('DOMContentLoaded', () => {
    // *** WICHTIG: Ersetzen Sie DIESE URL durch Ihre n8n PRODUCTION Webhook URL ***
    // (Wird hier hartcodiert, da wir keinen Node.js-Server mehr als Proxy verwenden)
    const UPLOAD_ENDPOINT = '/api/upload';
    
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

           uploadButton.addEventListener('click', async () => {
        if (filesToUpload.length === 0 || uploadButton.disabled) return;

        statusMessage.className = 'status-message';
        statusMessage.textContent = 'Lade hoch... Bitte warten.';

        const formData = new FormData();
        formData.append('file', filesToUpload[0]); 

        uploadButton.disabled = true;

        try {
            // Sende an den lokalen Proxy-Endpunkt
            const response = await fetch(UPLOAD_ENDPOINT, {
                method: 'POST',
                body: formData 
            });

            const data = await response.json();
            
            // --- Solución 2: Mensaje de confirmación en alemán ---
            if (response.ok && data.erfolg) {
                statusMessage.textContent = 'Datei erfolgreich hochgeladen und an n8n weitergeleitet!';
                statusMessage.classList.add('success');
                // Zurücksetzen nach erfolgreichem Upload
                filesToUpload = [];
                updateUI();
            } else {
                // Fehler vom Proxy oder n8n
                statusMessage.textContent = `Upload-Fehler: ${data.nachricht || 'Unbekannter Serverfehler'}`;
                statusMessage.classList.add('error');
            }
        } catch (error) {
            statusMessage.textContent = 'Netzwerkfehler: Konnte Server nicht erreichen.';
            statusMessage.classList.add('error');
        } finally {
            uploadButton.disabled = false;
        }
    });

    updateUI();
});
