// Global variables
let currentTab = 'business';
let sessionId = null;
let isSessionActive = false;
let selectedFiles = [];

// API base URL - update this to your backend URL
const API_BASE = 'https://dev.app.rewardsy.one/rewardsy-data';

// Tab switching functionality
function switchTab(tabName, event) {
    // Remove active class from all tabs
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => tab.classList.remove('active'));

    // Add active class to clicked tab
    event.target.classList.add('active');

    // Hide all tab contents
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => content.style.display = 'none');

    // Show selected tab content
    document.getElementById(tabName + '-tab').style.display = 'block';

    // Show/hide chat area and adjust sidebar width based on tab
    const chatArea = document.getElementById('chatArea');
    const sidebar = document.querySelector('.sidebar');

    if (tabName === 'user') {
        chatArea.style.display = 'flex';
        sidebar.classList.remove('full-width');

        // Prefill business ID in user tab
        const businessId = document.getElementById('businessId').value.trim();
        const userBusinessId = document.getElementById('userBusinessId');
        if (businessId && userBusinessId) {
            userBusinessId.value = businessId;
        }
    } else {
        chatArea.style.display = 'none';
        sidebar.classList.add('full-width');
    }
}

function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    if (notification) {
        notification.textContent = message;
        notification.className = `notification ${type}`;
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    } else {
        console.log(`Notification (${type}): ${message}`);
    }
}

// Utility function to format file sizes
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// File management functions
function displayFileList() {
    const fileList = document.getElementById('fileList');
    if (!fileList) return;
    
    fileList.innerHTML = '';
    
    selectedFiles.forEach((file, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        
        // Create elements safely
        const fileInfo = document.createElement('div');
        const fileName = document.createElement('div');
        fileName.className = 'file-name';
        fileName.textContent = file.name; // Safe text content
        
        const fileSize = document.createElement('div');
        fileSize.className = 'file-size';
        fileSize.textContent = formatFileSize(file.size);
        
        fileInfo.appendChild(fileName);
        fileInfo.appendChild(fileSize);
        
        const removeBtn = document.createElement('button');
        removeBtn.textContent = 'Remove';
        removeBtn.style.cssText = 'background: #dc3545; color: white; border: none; border-radius: 5px; padding: 5px 10px; cursor: pointer;';
        removeBtn.addEventListener('click', () => removeFile(index));
        
        fileItem.appendChild(fileInfo);
        fileItem.appendChild(removeBtn);
        fileList.appendChild(fileItem);
    });
}

function removeFile(index) {
    selectedFiles.splice(index, 1);
    displayFileList();
}

// Document upload functionality
async function uploadDocuments() {
    const businessIdInput = document.getElementById('businessId');
    const categoryInput = document.getElementById('category');
    
    if (!businessIdInput || !categoryInput) {
        showNotification('Required form elements not found', 'error');
        return;
    }
    
    const businessId = businessIdInput.value.trim();
    const category = categoryInput.value || 'general';
    
    if (!businessId) {
        showNotification('Please enter a business ID', 'error');
        return;
    }
    
    if (selectedFiles.length === 0) {
        showNotification('Please select files to upload', 'error');
        return;
    }
    
    const uploadBtn = document.getElementById('uploadBtn');
    if (uploadBtn) {
        uploadBtn.disabled = true;
        uploadBtn.textContent = 'Uploading...';
    }
    
    try {
        const formData = new FormData();
        formData.append('business_id', businessId);
        formData.append('category', category);
        
        selectedFiles.forEach(file => {
            formData.append('files', file);
        });
        
        const response = await fetch(`${API_BASE}/vector_search/documents/upload`, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok && response.status >= 500) {
            throw new Error(`Server error: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            const count = result.processed_documents || 0;
            showNotification(`Successfully uploaded ${count} documents!`);
            selectedFiles = [];
            displayFileList();
            businessIdInput.value = '';
            
            // Reset the file input element so subsequent uploads work
            const fileInput = document.getElementById('fileInput');
            if (fileInput) {
                fileInput.value = '';
            }
        } else {
            showNotification(result.detail || result.message || 'Upload failed', 'error');
        }
    } catch (error) {
        showNotification('Network error: ' + error.message, 'error');
    } finally {
        if (uploadBtn) {
            uploadBtn.disabled = false;
            uploadBtn.textContent = 'Upload Documents';
        }
    }
}

// Chat session management
async function startChatSession() {
    const businessIdInput = document.getElementById('userBusinessId');
    const userIdInput = document.getElementById('userId');
    
    if (!businessIdInput || !userIdInput) {
        showNotification('Required form elements not found', 'error');
        return;
    }
    
    const businessId = businessIdInput.value.trim();
    const userId = userIdInput.value.trim();
    
    if (!businessId || !userId) {
        showNotification('Please enter both business ID and user ID', 'error');
        return;
    }
    
    const startBtn = document.getElementById('startChatBtn');
    if (startBtn) {
        startBtn.disabled = true;
        startBtn.textContent = 'Starting...';
    }
    
    try {
        const response = await fetch(`${API_BASE}/rag-agent/session/get-or-create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_id: userId,
                business_id: businessId
            })
        });
        
        if (!response.ok && response.status >= 500) {
            throw new Error(`Server error: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            sessionId = result.session_id;
            isSessionActive = result.session_active;
            
            updateSessionStatus(true);
            enableChat();
            
            showNotification('Chat session started successfully!');
            
            // Load conversation history
            await loadChatHistory();
        } else {
            showNotification(result.message || 'Failed to start session', 'error');
        }
    } catch (error) {
        showNotification('Network error: ' + error.message, 'error');
    } finally {
        if (startBtn) {
            startBtn.disabled = false;
            startBtn.textContent = 'Start Chat Session';
        }
    }
}

function updateSessionStatus(active) {
    const statusIndicator = document.getElementById('sessionStatus');
    const sessionInfo = document.getElementById('sessionInfo');
    const chatSessionInfo = document.getElementById('chatSessionInfo');
    const userBusinessIdInput = document.getElementById('userBusinessId');
    
    if (active) {
        if (statusIndicator) {
            statusIndicator.className = 'status-indicator status-online';
        }
        if (sessionInfo) {
            sessionInfo.textContent = `Active session: ${sessionId}`;
        }
        if (chatSessionInfo && userBusinessIdInput) {
            chatSessionInfo.textContent = `Connected to business: ${userBusinessIdInput.value}`;
        }
    } else {
        if (statusIndicator) {
            statusIndicator.className = 'status-indicator status-offline';
        }
        if (sessionInfo) {
            sessionInfo.textContent = 'No active session';
        }
        if (chatSessionInfo) {
            chatSessionInfo.textContent = 'Start a session to begin chatting';
        }
    }
}

function enableChat() {
    const messageInput = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');
    
    if (messageInput) {
        messageInput.disabled = false;
    }
    if (sendBtn) {
        sendBtn.disabled = false;
    }
    
    // Clear welcome message
    const chatMessages = document.getElementById('chatMessages');
    if (chatMessages) {
        chatMessages.innerHTML = '';
    }
}

// Chat functionality
async function loadChatHistory() {
    const businessIdInput = document.getElementById('userBusinessId');
    if (!businessIdInput || !sessionId) return;
    
    const businessId = businessIdInput.value.trim();
    
    try {
        const response = await fetch(`${API_BASE}/rag-agent/session/${sessionId}/history?business_id=${businessId}`);
        
        if (!response.ok) {
            console.warn(`Failed to load chat history: ${response.status}`);
            return;
        }
        
        const result = await response.json();
        
        if (result.success && result.history) {
            const chatMessages = document.getElementById('chatMessages');
            if (chatMessages) {
                chatMessages.innerHTML = '';
                
                result.history.forEach(msg => {
                    addMessageToChat(msg.content, msg.role);
                });
            }
        }
    } catch (error) {
        console.error('Failed to load chat history:', error);
    }
}

function addMessageToChat(content, role) {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;
    
    const avatar = role === 'user' ? 'U' : 'AI';
    
    messageDiv.innerHTML = `
        ${role === 'assistant' ? `<div class="message-avatar">${avatar}</div>` : ''}
        <div class="message-content">${escapeHtml(content)}</div>
        ${role === 'user' ? `<div class="message-avatar">${avatar}</div>` : ''}
    `;
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Utility function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    if (!messageInput || !sessionId) return { success: false, error: 'Message input not found or no active session' };
    
    const message = messageInput.value.trim();
    if (!message) return { success: false, error: 'Message input not found or no active session' };
    
    const businessIdInput = document.getElementById('userBusinessId');
    const userIdInput = document.getElementById('userId');
    const searchTypeInput = document.getElementById('searchType');
    
    if (!businessIdInput || !userIdInput) {
        showNotification('Required form elements not found', 'error');
        return;
    }
    
    const businessId = businessIdInput.value.trim();
    const userId = userIdInput.value.trim();
    const searchType = searchTypeInput ? searchTypeInput.value : 'hybrid';
    
    // Add user message to chat
    addMessageToChat(message, 'user');
    messageInput.value = '';

    // Loading avatar
    const chatMessages = document.getElementById('chatMessages');
    const loadingAvatar = document.createElement('div');
    loadingAvatar.className = 'message assistant';
    loadingAvatar.id = 'loadingAvatar';
    loadingAvatar.innerHTML = `
      <div class="message-avatar" id="avatarLoader">AI</div>
      <div class="message-content">Thinking...</div>
    `;
    chatMessages.appendChild(loadingAvatar);

    let dotCount = 1;
    const avatarLoader = document.getElementById('avatarLoader');
    const loadingInterval = setInterval(() => {
        dotCount = (dotCount % 3) + 1;
        avatarLoader.textContent = '.'.repeat(dotCount);
    }, 500);

    // Disable send button
    const sendBtn = document.getElementById('sendBtn');
    if (sendBtn) {
        sendBtn.disabled = true;
        sendBtn.textContent = '...';
    }
    
    try {
        const response = await fetch(`${API_BASE}/rag-agent/chat/async`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: message,
                user_id: userId,
                business_id: businessId,
                session_id: sessionId,
                search_type: searchType
            })
        });
        
        if (!response.ok && response.status >= 500) {
            throw new Error(`Server error: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            addMessageToChat(result.response, 'assistant');
            sessionId = result.session_id; // Update session ID if changed
        } else {
            addMessageToChat('Sorry, I encountered an error. Please try again.', 'assistant');
            showNotification(result.detail || 'Chat failed', 'error');
        }
    } catch (error) {
        addMessageToChat('Sorry, I encountered a network error. Please try again.', 'assistant');
        showNotification('Network error: ' + error.message, 'error');
    } finally {
        // Clean up loading animation and avatar
        clearInterval(loadingInterval);
        const loadingAvatarElement = document.getElementById('loadingAvatar');
        if (loadingAvatarElement) {
            loadingAvatarElement.remove();
        }
        
        // Re-enable send button
        if (sendBtn) {
            sendBtn.disabled = false;
            sendBtn.textContent = '➤';
        }
    }
}

// Event listeners setup
document.addEventListener('DOMContentLoaded', function() {
    // File upload handling
    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
        fileInput.addEventListener('change', function(e) {
            selectedFiles = Array.from(e.target.files);
            displayFileList();
        });
    }

    // Drag and drop handling
    const fileUpload = document.querySelector('.file-upload');
    if (fileUpload) {
        fileUpload.addEventListener('dragover', function(e) {
            e.preventDefault();
            this.classList.add('dragover');
        });
        
        fileUpload.addEventListener('dragleave', function(e) {
            e.preventDefault();
            this.classList.remove('dragover');
        });
        
        fileUpload.addEventListener('drop', function(e) {
            e.preventDefault();
            this.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files) {
                selectedFiles = Array.from(files);
                displayFileList();
            }
        });
    }

    // Enter key to send message  
    const messageInput = document.getElementById('messageInput');
    if (messageInput) {
        messageInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }

    // Initialize session status
    updateSessionStatus(false);
});
