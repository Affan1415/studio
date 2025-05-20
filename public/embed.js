// public/embed.js
(function() {
  // Find the script tag itself to read its attributes
  var scriptTag = document.currentScript || (function() {
    var scripts = document.getElementsByTagName('script');
    return scripts[scripts.length - 1];
  })();

  var sheetUrl = scriptTag.getAttribute('data-sheet-url');
  var widgetHost = scriptTag.src.substring(0, scriptTag.src.indexOf('/embed.js')); // Assumes script is at root/embed.js

  if (!sheetUrl) {
    console.error('SheetChat Embed Error: data-sheet-url attribute is missing on the script tag.');
    return;
  }

  // Create a container for the iframe
  var containerId = 'sheetchat-widget-container-' + Date.now();
  var container = document.createElement('div');
  container.id = containerId;
  container.style.width = '100%'; // Default width, can be overridden by user CSS
  container.style.maxWidth = '400px'; // Default max-width
  container.style.height = '500px'; // Default height
  container.style.position = 'fixed'; // Example: fixed position
  container.style.bottom = '20px';
  container.style.right = '20px';
  container.style.zIndex = '9999';
  container.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
  container.style.borderRadius = '8px';
  container.style.overflow = 'hidden';


  // Insert the container where the script tag is, or at the end of body
  if (scriptTag.parentNode) {
    scriptTag.parentNode.insertBefore(container, scriptTag);
  } else {
    document.body.appendChild(container);
  }
  
  // Create the iframe
  var iframe = document.createElement('iframe');
  var iframeSrc = widgetHost + '/chat-embed?sheetUrl=' + encodeURIComponent(sheetUrl);
  
  iframe.src = iframeSrc;
  iframe.style.width = '100%';
  iframe.style.height = '100%';
  iframe.style.border = 'none';
  iframe.title = 'SheetChat Widget';
  
  container.appendChild(iframe);

  // Optional: Add a close button or header to the container if not fixed position
  // This is a very basic example. A more robust solution would handle resizing, theming, etc.

  console.log('SheetChat widget initialized for sheet:', sheetUrl);
})();
