let bootPromise;

export async function loadWorkspace() {
  const response = await fetch('/api/react/workspace', { cache: 'no-store' });
  if (!response.ok) throw new Error(`Backend returned ${response.status}. Start server.py on port 5002.`);
  const doc = new DOMParser().parseFromString(await response.text(), 'text/html');
  // Load the copied theme styles in their established cascade order.
  for (const original of doc.head.querySelectorAll('link[rel="stylesheet"]')) {
    const link = document.createElement('link');
    for (const attr of original.attributes) link.setAttribute(attr.name, attr.value);
    document.head.appendChild(link);
  }
  const scripts = [...doc.querySelectorAll('script')]
    .filter(script => script.getAttribute('src')?.startsWith('/static/'))
    .map(script => script.getAttribute('src'));
  for (const script of doc.body.querySelectorAll('script')) script.remove();
  return { body: doc.body.innerHTML, scripts };
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Could not load ${src}`));
    document.body.appendChild(script);
  });
}

export function bootControllers(workspace) {
  if (bootPromise) return bootPromise;
  bootPromise = (async () => {
    const response = await fetch('/api/status');
    if (!response.ok) throw new Error('The sensor backend is unavailable.');
    const state = await response.json();
    window.ACTIVE_DATA_SOURCE = state.data_source || 'serial';
    // Modules historically register on DOMContentLoaded. Capture just those
    // registrations during their sequential load, then initialize once after
    // React has mounted every canvas and dialog. Never redispatch the global event.
    const ready = [];
    const original = document.addEventListener;
    document.addEventListener = function(type, listener, options) {
      if (type === 'DOMContentLoaded') ready.push(listener);
      else original.call(this, type, listener, options);
    };
    try {
      for (const src of workspace.scripts) await loadScript(src);
    } finally {
      document.addEventListener = original;
    }
    for (const listener of ready) listener.call(document, new Event('DOMContentLoaded'));
    document.body.dataset.reactReady = 'true';
  })();
  return bootPromise;
}
