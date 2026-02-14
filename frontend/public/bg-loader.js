(async function(){
  const candidates = ['/background.webp','/background.jpg'];
  for (const path of candidates) {
    try {
      const res = await fetch(path, { method: 'HEAD' });
      if (res.ok) {
        document.documentElement.style.setProperty('--bg-url', `url('${path}')`);
        document.body.classList.add('has-bg');
        console.debug('[bg-loader] using', path);
        break;
      }
    } catch (e) {
      // ignore
    }
  }
})();
