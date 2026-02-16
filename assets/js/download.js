// assets/js/download.js
export function initDownload() {
    // Request file system permission
    document.getElementById('request-permission')?.addEventListener('click', async () => {
        try {
            // Check if File System Access API is supported
            if ('showDirectoryPicker' in window) {
                const dirHandle = await window.showDirectoryPicker();
                localStorage.setItem('project-directory', JSON.stringify({
                    id: dirHandle.name,
                    permission: 'granted'
                }));
                app.showNotification('Permission granted! You can now save files.', 'success');
            } else {
                // Fallback for browsers that don't support File System Access API
                app.showNotification('Using fallback download method', 'info');
            }
        } catch (error) {
            app.showNotification('Permission denied', 'error');
        }
    });
}

export async function downloadProject(project) {
    const { name, files } = project;
    
    try {
        // Check if we have directory permission
        const savedDir = localStorage.getItem('project-directory');
        
        if (savedDir && 'showDirectoryPicker' in window) {
            // Use File System Access API
            const dirHandle = await window.showDirectoryPicker();
            
            for (const [filename, content] of Object.entries(files)) {
                const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
                const writable = await fileHandle.createWritable();
                await writable.write(content);
                await writable.close();
            }
            
            app.showNotification('Project saved to your computer!', 'success');
        } else {
            // Fallback: Create ZIP file
            const JSZip = await import('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js');
            const zip = new JSZip.default();
            
            Object.entries(files).forEach(([filename, content]) => {
                zip.file(filename, content);
            });
            
            const blob = await zip.generateAsync({ type: 'blob' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${name}.zip`;
            a.click();
            URL.revokeObjectURL(url);
            
            app.showNotification('Project downloaded as ZIP!', 'success');
        }
    } catch (error) {
        app.showNotification('Error saving project: ' + error.message, 'error');
    }
}

export async function uploadProject() {
    try {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.zip';
        input.multiple = false;
        
        input.onchange = async (e) => {
            const file = e.target.files[0];
            const JSZip = await import('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js');
            const zip = await JSZip.default.loadAsync(file);
            
            const files = {};
            zip.forEach((relativePath, zipEntry) => {
                if (!zipEntry.dir) {
                    zipEntry.async('string').then(content => {
                        files[relativePath] = content;
                    });
                }
            });
            
            // Create new project with uploaded files
            const projectName = file.name.replace('.zip', '');
            app.createNewProject(projectName, 'uploaded');
        };
        
        input.click();
    } catch (error) {
        app.showNotification('Error uploading project: ' + error.message, 'error');
    }
}
