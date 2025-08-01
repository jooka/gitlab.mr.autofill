// Background service worker
chrome.runtime.onInstalled.addListener(function() {
  console.log('GitLab MR Auto Fill rozšíření bylo nainstalováno');
  
  // Nastavení výchozí konfigurace
  chrome.storage.sync.get(['enabled'], function(result) {
    if (result.enabled === undefined) {
      chrome.storage.sync.set({
        enabled: true,
        assignee: '',
        reviewers: [],
        labels: []
      });
    }
  });
});

// Poslouchání zpráv z content scriptů
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'getConfig') {
    chrome.storage.sync.get(['enabled', 'assignee', 'reviewers', 'labels'], function(result) {
      sendResponse({
        enabled: result.enabled !== false,
        assignee: result.assignee || '',
        reviewers: result.reviewers || [],
        labels: result.labels || []
      });
    });
    return true; // Indikuje asynchronní odpověď
  }
});

// Aktualizace ikony rozšíření podle stavu
chrome.storage.onChanged.addListener(function(changes, namespace) {
  if (namespace === 'sync' && changes.enabled) {
    updateExtensionIcon(changes.enabled.newValue);
  }
});

function updateExtensionIcon(enabled) {
  const iconPath = enabled ? 'icons/icon48.png' : 'icons/icon48-disabled.png';
  chrome.action.setIcon({
    path: iconPath
  });
} 