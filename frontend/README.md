# RAG Agent Frontend

This folder contains the organized frontend files for the RAG Agent Smart Document Chat System.

## File Structure

```
frontend/
├── index.html          # Main HTML structure
├── styles.css          # All CSS styles and design
├── script.js           # JavaScript functionality
├── demo_data.txt       # Sample document for testing
└── README.md           # This documentation file
```

## Files Description

### `index.html`
- **Purpose**: Main HTML structure and layout
- **Features**: 
  - Semantic HTML structure
  - Links to external CSS and JavaScript files
  - Responsive meta tags
  - Clean separation of concerns

### `styles.css`
- **Purpose**: All styling and visual design
- **Features**:
  - Modern responsive design
  - Purple gradient theme
  - Smooth animations and transitions
  - Mobile-first approach
  - Clean component-based styling

### `script.js`
- **Purpose**: All interactive functionality
- **Features**:
  - Tab switching logic
  - File upload and drag-drop handling
  - API communication with backend
  - Chat functionality
  - Session management
  - Notification system
  - Event listeners and DOM manipulation

### `demo_data.txt`
- **Purpose**: Sample document for testing uploads
- **Content**: Company FAQ document with common questions and answers

## Setup Instructions

1. **Ensure Backend is Running**: The JavaScript connects to `http://localhost:8000`
2. **Serve Files**: Use any web server to serve these files, or the FastAPI backend serves them automatically
3. **Test Upload**: Use the `demo_data.txt` file to test document upload functionality

## Key Features

### Business Side
- Document upload with drag-and-drop
- Category selection
- File preview and management
- Real-time upload feedback

### User Side
- Chat session management
- Multiple search types (hybrid/vector)
- Real-time messaging
- Session status indicators
- Chat history loading

## Browser Compatibility

- **Modern Browsers**: Chrome 80+, Firefox 75+, Safari 13+, Edge 80+
- **Features Used**:
  - CSS Grid and Flexbox
  - ES6+ JavaScript (async/await, arrow functions)
  - Fetch API for HTTP requests
  - CSS Custom Properties (variables)

## Development Notes

### Styling Architecture
- Component-based CSS with clear naming conventions
- Consistent spacing and color scheme
- Mobile-responsive breakpoints
- Hover and focus states for accessibility

### JavaScript Architecture
- Modular functions with clear responsibilities
- Error handling for all API calls
- Event-driven programming
- DOM manipulation using modern APIs

### API Integration
- RESTful API communication
- FormData for file uploads
- JSON for chat communication
- Proper error handling and user feedback

## Customization

### Changing API URL
Update the `API_BASE` constant in `script.js`:
```javascript
const API_BASE = 'http://your-backend-url:port';
```

### Styling Modifications
All styles are centralized in `styles.css`. Key customization points:
- Color scheme: Update CSS custom properties
- Layout: Modify flexbox and grid properties
- Animations: Adjust transition durations and effects

### Adding Features
- Add new HTML elements in `index.html`
- Style them in `styles.css`
- Add functionality in `script.js`
- Follow existing patterns for consistency

## Testing

### File Upload Testing
1. Switch to Business tab
2. Enter a business ID (e.g., "test-company")
3. Upload the provided `demo_data.txt` file
4. Verify success notification

### Chat Testing
1. Switch to User tab
2. Enter the same business ID used for upload
3. Enter a user ID (e.g., "test-user")
4. Start chat session
5. Ask questions about the uploaded document

## Performance Considerations

- **File Sizes**: 
  - CSS: ~11KB (minified would be ~8KB)
  - JavaScript: ~13KB (minified would be ~9KB)
  - HTML: ~4KB
  - Total: ~28KB (very lightweight)

- **Loading Strategy**:
  - CSS loaded in `<head>` for immediate styling
  - JavaScript loaded at end of `<body>` for faster rendering
  - Images are emoji-based (no external assets)

## Security Considerations

- **Input Validation**: Client-side validation with server-side verification
- **File Upload**: Limited to specific file types
- **API Calls**: Proper error handling prevents information leakage
- **XSS Prevention**: No direct HTML insertion, using `textContent` where appropriate 