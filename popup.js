// Popup script pro správu konfigurace
document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('configForm');
  const enableCheckbox = document.getElementById('enableAutoFill');
  const assigneeInput = document.getElementById('assignee');
  const reviewersInput = document.getElementById('reviewers');
  const labelsInput = document.getElementById('labels');
  const saveBtn = document.getElementById('saveBtn');
  const testBtn = document.getElementById('testBtn');
  const statusDiv = document.getElementById('status');

  // Načtení uložené konfigurace
  loadConfig();

  // Uložení konfigurace při odeslání formuláře
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    saveConfig();
  });

  // Testování na aktuální stránce
  testBtn.addEventListener('click', function() {
    testOnCurrentPage();
  });



  // Načtení konfigurace z Chrome storage
  function loadConfig() {
    chrome.storage.sync.get(['enabled', 'assignee', 'reviewers', 'labels'], function(result) {
      enableCheckbox.checked = result.enabled !== false; // default true
      assigneeInput.value = result.assignee || '';
      reviewersInput.value = Array.isArray(result.reviewers) ? result.reviewers.join('\n') : '';
      labelsInput.value = Array.isArray(result.labels) ? result.labels.join('\n') : '';
    });
  }

  // Uložení konfigurace do Chrome storage
  function saveConfig() {
    const config = {
      enabled: enableCheckbox.checked,
      assignee: assigneeInput.value.trim(),
      reviewers: reviewersInput.value.split('\n').filter(item => item.trim()),
      labels: labelsInput.value.split('\n').filter(item => item.trim())
    };

    chrome.storage.sync.set(config, function() {
      showStatus('Nastavení bylo úspěšně uloženo!', 'success');
      
      // Aktualizace content scriptu na aktivní kartě
      updateActiveTab();
    });
  }

  // Zobrazení status zprávy
  function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
    statusDiv.style.display = 'block';
    
    setTimeout(() => {
      statusDiv.style.display = 'none';
    }, 3000);
  }

  // Aktualizace aktivní karty
  function updateActiveTab() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs[0] && tabs[0].url && tabs[0].url.includes('gitlab.com')) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'reloadConfig'
        });
      }
    });
  }

  // Testování na aktuální stránce
  function testOnCurrentPage() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs[0] && tabs[0].url && tabs[0].url.includes('gitlab.com')) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'testFill'
        });
        showStatus('Test spuštěn na aktuální stránce. Zkontrolujte konzoli prohlížeče.', 'success');
      } else {
        showStatus('Prosím otevřete GitLab stránku pro testování.', 'error');
      }
    });
  }



  // Poslouchání zpráv z content scriptu
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
}); 