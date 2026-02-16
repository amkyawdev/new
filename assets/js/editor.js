// assets/js/editor.js
import { db } from '../../config/firebase-config.js';
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { initThreeScene } from '../three/scene.js';

class CodeEditor {
    constructor() {
        this.projectId = new URLSearchParams(window.location.search).get('id');
        this.project = null;
        this.currentFile = 'index.html';
        this.editors = {};
        this.init();
    }

    async init() {
        if (!this.projectId) {
            window.location.href = '/dashboard.html';
            return;
        }
        
        await this.loadProject();
        this.initEditors();
        this.initFileTree();
        this.initPreview();
        this.initEventListeners();
    }

    async loadProject() {
        const docRef = doc(db, 'projects', this.projectId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            this.project = { id: docSnap.id, ...docSnap.data() };
            document.getElementById('project-name').textContent = this.project.name;
        }
    }

    initEditors() {
        // Initialize CodeMirror editors for each file type
        const files = this.project.files || {};
        
        Object.keys(files).forEach(filename => {
            const ext = filename.split('.').pop();
            const mode = this.getModeForExtension(ext);
            
            const textarea = document.createElement('textarea');
            textarea.id = `editor-${filename}`;
            textarea.value = files[filename];
            document.getElementById('editor-container').appendChild(textarea);
            
            this.editors[filename] = CodeMirror.fromTextArea(textarea, {
                lineNumbers: true,
                mode: mode,
                theme: 'material',
                autoCloseTags: true,
                autoCloseBrackets: true,
                lineWrapping: true
            });
            
            this.editors[filename].on('change', () => {
                this.updatePreview();
            });
        });
        
        this.showFile(this.currentFile);
    }

    getModeForExtension(ext) {
        const modes = {
            'html': 'htmlmixed',
            'css': 'css',
            'js': 'javascript',
            'json': 'application/json',
            'md': 'markdown'
        };
        return modes[ext] || 'text/plain';
    }

    initFileTree() {
        const fileTree = document.getElementById('file-tree');
        const files = this.project.files || {};
        
        fileTree.innerHTML = Object.keys(files).map(filename => `
            <div class="file-item ${filename === this.currentFile ? 'active' : ''}" data-file="${filename}">
                <i class="fas ${this.getFileIcon(filename)}"></i>
                <span>${filename}</span>
            </div>
        `).join('');
        
        fileTree.querySelectorAll('.file-item').forEach(item => {
            item.addEventListener('click', () => {
                this.showFile(item.dataset.file);
            });
        });
    }

    getFileIcon(filename) {
        const ext = filename.split('.').pop();
        const icons = {
            'html': 'fa-html5',
            'css': 'fa-css3-alt',
            'js': 'fa-js',
            'json': 'fa-file-code',
            'md': 'fa-markdown'
        };
        return icons[ext] || 'fa-file';
    }

    showFile(filename) {
        this.currentFile = filename;
        
        // Update active state
        document.querySelectorAll('.file-item').forEach(item => {
            item.classList.toggle('active', item.dataset.file === filename);
        });
        
        // Show appropriate editor
        Object.keys(this.editors).forEach(f => {
            const container = this.editors[f].getWrapperElement();
            container.style.display = f === filename ? 'block' : 'none';
        });
    }

    initPreview() {
        this.previewFrame = document.getElementById('preview-frame');
        this.updatePreview();
    }

    updatePreview() {
        if (!this.previewFrame) return;
        
        const files = this.project.files || {};
        const html = files['index.html'] || '';
        const css = files['style.css'] || '';
        const js = files['script.js'] || '';
        
        const previewContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>${css}</style>
            </head>
            <body>
                ${html}
                <script>${js}<\/script>
            </body>
            </html>
        `;
        
        this.previewFrame.srcdoc = previewContent;
    }

    async saveProject() {
        // Update files from editors
        Object.keys(this.editors).forEach(filename => {
            this.project.files[filename] = this.editors[filename].getValue();
        });
        
        this.project.updatedAt = new Date().toISOString();
        
        const docRef = doc(db, 'projects', this.projectId);
        await updateDoc(docRef, {
            files: this.project.files,
            updatedAt: this.project.updatedAt
        });
        
        app.showNotification('Project saved successfully!', 'success');
    }

    initEventListeners() {
        // Save shortcut (Ctrl+S)
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                this.saveProject();
            }
        });
        
        document.getElementById('save-btn').addEventListener('click', () => {
            this.saveProject();
        });
        
        document.getElementById('run-btn').addEventListener('click', () => {
            this.updatePreview();
        });
    }
}

// Initialize editor when on editor page
if (window.location.pathname.includes('editor.html')) {
    window.editor = new CodeEditor();
}
