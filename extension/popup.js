document.querySelector('#copy').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.url || !/^https?:/.test(tab.url)) return;
  await navigator.clipboard.writeText(tab.url);
  document.querySelector('#status').textContent = 'URL disalin. Tidak ada data yang dikirim.';
});