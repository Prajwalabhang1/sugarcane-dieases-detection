# Iframe Integration Guide
## Embedding Sugarcane Disease Detection in Your Application

This guide explains how to embed the Sugarcane Disease Detection UI directly into your existing application using an iframe.

## Quick Start

### Basic Embedding

Once the application is deployed, embed it using:

```html
<iframe id="sugarcane-detector" 
        src="http://your-server-ip:5000" 
        width="100%" 
        height="800px"
        frameborder="0"
        allow="camera; microphone">
</iframe>
```

### Responsive Embedding

For better responsive design:

```html
<div class="iframe-container">
  <iframe src="http://your-server-ip:5000" 
          width="100%" 
          height="100%"
          frameborder="0"
          allow="camera; microphone">
  </iframe>
</div>

<style>
  .iframe-container {
    position: relative;
    width: 100%;
    height: 800px; /* or min-height: 100vh for full screen */
    overflow: hidden;
  }
  
  .iframe-container iframe {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border: none;
  }
</style>
```

## Configuration

### Environment Variables

In your `.env` file, configure:

```bash
# Allow all domains (for testing)
ALLOWED_IFRAME_PARENTS=*

# Or specify your domain (for production)
ALLOWED_IFRAME_PARENTS=https://yourdomain.com,https://www.yourdomain.com
```

### Security Headers

The application automatically sets these headers:

- **X-Frame-Options**: Removed when `ALLOWED_IFRAME_PARENTS=*`, set to `SAMEORIGIN` otherwise
- **Content-Security-Policy**: Set `frame-ancestors` to allowed domains
- **CORS headers**: Enabled for cross-origin requests

## Camera Access

### HTTPS Requirement

⚠️ **Important**: For camera functionality to work inside an iframe, your application **MUST** be served over HTTPS.

Browsers block camera/microphone access in cross-origin iframes unless:
1. The iframe is served over HTTPS
2. The `allow` attribute includes `camera` and `microphone`

### Local Development

For local testing without HTTPS:
- Access via `localhost` (not 127.0.0.1 or IP address)
- Or use a service like ngrok to create HTTPS tunnel

## Integration Examples

### React/Next.js

```jsx
export default function DiseaseDetection() {
  return (
    <div className="disease-detection-wrapper">
      <iframe 
        src={process.env.NEXT_PUBLIC_DISEASE_API_URL || "http://localhost:5000"}
        width="100%"
        height="800px"
        frameBorder="0"
        allow="camera; microphone"
        title="Sugarcane Disease Detection"
      />
    </div>
  );
}
```

### WordPress

Add to page or post:

```html
[iframe src="http://your-server-ip:5000" width="100%" height="800" allow="camera; microphone"]
```

Or using HTML block:

```html
<div class="sugarcane-detector">
  <iframe 
    src="http://your-server-ip:5000" 
    width="100%" 
    height="800px"
    frameborder="0"
    allow="camera; microphone">
  </iframe>
</div>
```

### PHP

```php
<?php
$apiUrl = getenv('DISEASE_API_URL') ?: 'http://localhost:5000';
?>
<iframe 
  src="<?php echo htmlspecialchars($apiUrl); ?>" 
  width="100%" 
  height="800px"
  frameborder="0"
  allow="camera; microphone">
</iframe>
```

## Advanced: Parent-Child Communication

If you need to communicate between your app and the embedded detection UI, you can use postMessage API:

### From Parent (Your App)

```javascript
const iframe = document.getElementById('sugarcane-detector');
iframe.contentWindow.postMessage({
  type: 'REQUEST_PREDICTION',
  imageData: 'base64-encoded-image'
}, 'http://your-server-ip:5000');
```

### Listen in Child (Detection App)

*Note: This requires adding postMessage handlers to the detection app's JavaScript*

## Troubleshooting

### Issue: Iframe Not Loading

**Check:**
- CORS headers are configured correctly
- `ALLOWED_IFRAME_PARENTS` includes your domain
- No X-Frame-Options blocking

**Solution:**
```bash
# In .env
ALLOWED_IFRAME_PARENTS=*
```

### Issue: Camera Not Working

**Check:**
- Application is served over HTTPS
- `allow="camera"` attribute is set
- Browser permissions granted

**Solution:**
- Deploy with SSL certificate
- Use localhost for local testing

### Issue: Mixed Content Warning

**Problem:** Your main app is HTTPS but iframe is HTTP

**Solution:**
- Deploy detection app with SSL/HTTPS
- Use same protocol for both apps

### Issue: Styling Conflicts

**Problem:** Iframe UI looks different than standalone

**Solution:**
- The iframe has its own isolated styling
- Use CSS to style the iframe container
- The embedded UI is fully self-contained

## Testing Checklist

- [ ] Iframe loads without errors
- [ ] Camera upload works in iframe
- [ ] File upload works in iframe
- [ ] Disease prediction returns results
- [ ] Responsive design works at different sizes
- [ ] No console errors
- [ ] Tested on Chrome, Firefox, Safari
- [ ] HTTPS works (for camera access)

## Production Deployment

1. Deploy app to VPS with HTTPS
2. Update `ALLOWED_IFRAME_PARENTS` with your domain
3. Test embedding from your production app
4. Verify camera access works
5. Monitor logs for any errors

## Support

For issues or questions:
- Check container logs: `docker-compose logs -f`
- Verify health endpoint: `http://your-server:5000/api/health`
- Review browser console for errors
