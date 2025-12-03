// public/script.js

document.addEventListener('DOMContentLoaded', () => {
    
    const UPLOAD_ENDPOINT = '/api/upload'; 

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
        // WICHTIG: Wir senden nur die erste Datei.
        filesToUpload = Array.from(files).slice(0, 1);
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

    // --- Upload Logic (Verwendet den Proxy Local) ---

    uploadButton.addEventListener('click', async () => {
        if (filesToUpload.length === 0 || uploadButton.disabled) return;

        statusMessage.className = 'status-message';
        statusMessage.textContent = 'Lade hoch... Bitte warten.';

        const formData = new FormData();
        // Füge die Datei hinzu. Der Feldname 'file' muss mit dem Backend-Proxy übereinstimmen.
        formData.append('file', filesToUpload[0]); 

        uploadButton.disabled = true;

        try {
            // Sende an den lokalen Proxy-Endpunkt
            const response = await fetch(UPLOAD_ENDPOINT, {
                method: 'POST',
                body: formData 
            });

            const data = await response.json();
            
            
            if (response.ok && data.erfolg) {
                statusMessage.textContent = 'Datei erfolgreich hochgeladen und an n8n weitergeleitet!';
                statusMessage.classList.add('success');
                // Zurücksetzen nach erfolgreichem Upload
                filesToUpload = [];
                updateUI();
                return res.status(200).json({ 
                    erfolg: true, 
                    nachricht: 'Datei erfolgreich an n8n gesendet.' 
                });
            } else {
                // Fehler vom Proxy oder n8n
                statusMessage.textContent = `Upload-Fehler: ${data.nachricht || 'Unbekannter Serverfehler'}`;
                statusMessage.classList.add('error');
                const n8nBody = await response.text();
                return res.status(response.status).json({ 
                    erfolg: false, 
                    nachricht: `Fehler von n8n: Status ${response.status}. ${n8nBody}` 
                });
            }
        } catch (error) {
            statusMessage.textContent = 'Netzwerkfehler: Konnte Server nicht erreichen.';
            statusMessage.classList.add('error');
        } finally {
            uploadButton.disabled = false;
        }
    });

    // Initialer UI-Zustand setzen
    updateUI();
});

