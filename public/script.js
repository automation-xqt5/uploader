// script.js
document.addEventListener('DOMContentLoaded', () => {
    const dropArea = document.getElementById('drop-area');
    const fileInput = document.getElementById('fileInput');
    const selectButton = document.getElementById('select-button');
    const uploadButton = document.getElementById('upload-button');
    const fileListContainer = document.getElementById('file-list-container');
    const statusMessage = document.getElementById('status-message');

    let filesToUpload = [];

    // Event-Listener für den Button zum Öffnen des Dateidialogs
    selectButton.addEventListener('click', () => {
        fileInput.click();
    });

    // Event-Listener für die Dateiauswahl
    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });

    // --- Drag and Drop Handling ---

    // Highlight-Effekt beim Überziehen
    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, (e) => {
            e.preventDefault();
            dropArea.classList.add('highlight');
        }, false);
    });

    // Highlight entfernen
    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, (e) => {
            e.preventDefault();
            dropArea.classList.remove('highlight');
        }, false);
    });

    // Datei ablegen (Drop)
    dropArea.addEventListener('drop', (e) => {
        e.preventDefault();
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    }, false);

    /**
     * @function handleFiles
     * @description Verarbeitet die ausgewählten/abgelegten Dateien.
     * @param {FileList} files - Die Dateiliste.
     */
    function handleFiles(files) {
        filesToUpload = Array.from(files);
        updateUI();
    }

    /**
     * @function updateUI
     * @description Aktualisiert die UI basierend auf den Dateien in filesToUpload.
     */
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

    // --- Upload Logic ---

    uploadButton.addEventListener('click', async () => {
        if (filesToUpload.length === 0 || uploadButton.disabled) return;

        statusMessage.className = 'status-message';
        statusMessage.textContent = 'Lade hoch... Bitte warten.';

        // Erstelle FormData für den Datei-Upload
        const formData = new FormData();
        // Hier wird nur die erste Datei gesendet, da server.js nur upload.single() verwendet.
        // Für mehrere Dateien müsste eine Schleife und upload.array() verwendet werden.
        formData.append('datei', filesToUpload[0]); 

        uploadButton.disabled = true;

        try {
            const response = await fetch('/upload', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            
            if (response.ok && data.erfolg) {
                statusMessage.textContent = data.nachricht; // "Datei erfolgreich hochgeladen und Webhook benachrichtigt."
                statusMessage.classList.add('success');
                // Zurücksetzen nach erfolgreichem Upload
                filesToUpload = [];
                updateUI();
            } else {
                // Fehler vom Server oder Webhook-Fehler
                statusMessage.textContent = `Upload-Fehler: ${data.nachricht || 'Unbekannter Serverfehler'}`;
                statusMessage.classList.add('error');
            }
        } catch (error) {
            // Netzwerkausfall oder anderer Fehler
            statusMessage.textContent = 'Netzwerkfehler: Konnte Server nicht erreichen.';
            statusMessage.classList.add('error');
        } finally {
            uploadButton.disabled = false;
        }
    });

    // Initialer UI-Zustand setzen
    updateUI();
});