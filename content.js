// Content script pro automatické vyplňování GitLab merge request formuláře
class GitLabMRAutoFill {
  constructor() {
    this.config = null;
    this.isProcessing = false; // Ochrana proti nekonečným smyčkám
    this.filledValues = new Set(); // Sledování již vyplněných hodnot
    this.lastAutoFillTime = 0; // Čas posledního automatického vyplnění
    this.autoFillTimeout = 5000; // 5 sekund po automatickém vyplnění se dropdowny zavírají
    this.init();
  }

  log(message, data = null) {
    // Debug logging je vypnut pro produkci
    // console.log(`[GitLab MR Auto Fill] ${message}`, data || '');
  }

  async init() {
    this.log('Inicializace rozšíření...');
    
    // Načtení konfigurace z Chrome storage
    this.config = await this.loadConfig();
    this.log('Konfigurace načtena:', this.config);
    
    // Počkáme na načtení stránky
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.fillForm());
    } else {
      this.fillForm();
    }

    // Sledujeme změny v DOM (GitLab používá SPA)
    this.observeDOMChanges();
  }

  async loadConfig() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['enabled', 'assignee', 'reviewers', 'labels'], (result) => {
        resolve({
          enabled: result.enabled !== false,
          assignee: result.assignee || '',
          reviewers: result.reviewers || [],
          labels: result.labels || []
        });
      });
    });
  }

  observeDOMChanges() {
    this.log('Spouštím sledování změn DOM...');
    
    // Sledujeme změny v DOM pro SPA navigaci
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          // Kontrolujeme, jestli jsme na stránce pro vytváření MR
          if (window.location.pathname.includes('/merge_requests/new')) {
            this.log('Detekována stránka pro vytváření MR, spouštím vyplňování...');
            // Přidáme ochranu proti nekonečným smyčkám
            if (!this.isProcessing) {
              this.fillForm();
            }
          }
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    // NEZAVÍRÁME dropdowny automaticky, takže není potřeba sledovat interakce
  }

  // ZAKOMENTOVÁNO - NEZAVÍRÁME DROPDOWNY AUTOMATICKY
  // observeDropdownInteractions() {
  //   // Sledujeme kliknutí na dropdown tlačítka
  //   document.addEventListener('click', (event) => {
  //     const target = event.target;
  //     
  //     // Kontrolujeme, jestli uživatel klikl na dropdown tlačítko
  //     if (target.matches('[data-testid="issuable-label-dropdown"], [data-testid="assignee-ids-dropdown-toggle"], .js-reviewer-search, .js-assignee-search')) {
  //       this.log('Uživatel ručně otevřel dropdown, resetuji časové okno');
  //       this.lastAutoFillTime = 0; // Resetujeme čas automatického vyplnění
  //     }
  //   });
  //   
  //   // Sledujeme otevření dropdownů pomocí klávesnice
  //   document.addEventListener('keydown', (event) => {
  //     if (event.key === 'Enter' || event.key === ' ') {
  //       const target = event.target;
  //       if (target.matches('[data-testid="issuable-label-dropdown"], [data-testid="assignee-ids-dropdown-toggle"], .js-reviewer-search, .js-assignee-search')) {
  //         this.log('Uživatel ručně otevřel dropdown pomocí klávesnice, resetuji časové okno');
  //         this.lastAutoFillTime = 0; // Resetujeme čas automatického vyplnění
  //       }
  //     }
  //   });
  // }

  async fillForm() {
    // Ochrana proti nekonečným smyčkám
    if (this.isProcessing) {
      this.log('Vyplňování již probíhá, přeskakuji...');
      return;
    }
    
    this.isProcessing = true;
    this.log('Spouštím vyplňování formuláře...');
    
    try {
      // Počkáme na načtení formuláře
      await this.waitForForm();
      
      // Kontrolujeme, jestli je automatické vyplňování povoleno
      if (!this.config.enabled) {
        this.log('Automatické vyplňování je zakázáno');
        return;
      }
      
      if (this.config.assignee) {
        this.log(`Vyplňuji assignee: ${this.config.assignee}`);
        await this.fillAssignee();
      }
      
      if (this.config.reviewers.length > 0) {
        this.log(`Vyplňuji reviewers: ${this.config.reviewers.join(', ')}`);
        await this.fillReviewers();
      }
      
      if (this.config.labels.length > 0) {
        this.log(`Vyplňuji labels: ${this.config.labels.join(', ')}`);
        await this.fillLabels();
      }
      
      // NEZAVÍRÁME dropdowny automaticky - necháme uživatele zavřít sám
      this.log('Všechny dropdowny ponechány otevřené pro uživatele');
    } finally {
      // Vždy resetujeme stav
      this.isProcessing = false;
      this.lastAutoFillTime = Date.now(); // Zaznamenáme čas automatického vyplnění
      this.log('Vyplňování dokončeno');
    }
  }

  async waitForForm() {
    this.log('Čekám na načtení formuláře...');
    
    // Počkáme na načtení formuláře (max 15 sekund)
    for (let i = 0; i < 150; i++) {
      if (this.isFormLoaded()) {
        this.log('Formulář načten');
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    this.log('Formulář nebyl nalezen po 15 sekundách');
  }

  isFormLoaded() {
    // Kontrolujeme, jestli je formulář načtený
    const selectors = [
      '.merge-request-form',
      '[data-testid="merge-request-form"]',
      '.js-merge-request-form',
      '.new-merge-request',
      '[data-testid="new-merge-request"]',
      '.merge-request-create-form'
    ];
    
    for (const selector of selectors) {
      if (document.querySelector(selector)) {
        this.log(`Formulář nalezen pomocí selektoru: ${selector}`);
        return true;
      }
    }
    
    return false;
  }

  async fillAssignee() {
    this.log('Hledám pole pro assignee...');
    
    // Kontrolujeme, jestli už byl assignee vyplněn
    const assigneeKey = `assignee_${this.config.assignee}`;
    if (this.filledValues.has(assigneeKey)) {
      this.log('Assignee již byl vyplněn, přeskakuji...');
      return;
    }
    
    // Hledáme pole pro assignee - specifičtější selektory pro assignee
    const assigneeSelectors = [
      '[data-testid="assignee-ids-dropdown-toggle"]',
      '.js-assignee-search',
      '[data-testid="issuable-assignee-dropdown"]',
      '[data-testid="assignee-dropdown"]',
      '[data-testid="assignee-input"]',
      '.assignee-dropdown',
      'input[name="assignee_ids[]"]',
      '.assignee-dropdown-toggle',
      '[data-testid="assignee-select"]',
      '.assignee-select',
      'input[placeholder*="assignee" i]',
      'input[placeholder*="přiřadit" i]',
      '.js-assignee-dropdown',
      '.assignee-dropdown-input'
    ];

    for (const selector of assigneeSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        // Ověříme, že to je skutečně assignee element, ne reviewer element
        const isAssigneeElement = element.getAttribute('data-testid') === 'assignee-ids-dropdown-toggle' ||
                                 element.classList.contains('js-assignee-search') ||
                                 element.closest('.js-assignee-search') ||
                                 element.getAttribute('data-testid')?.includes('assignee') ||
                                 element.textContent?.toLowerCase().includes('assignee') ||
                                 element.placeholder?.toLowerCase().includes('assignee') ||
                                 element.textContent?.toLowerCase().includes('unassigned') ||
                                 element.closest('[data-field-name*="assignee"]');
        
        if (isAssigneeElement) {
          this.log(`Assignee pole nalezeno: ${selector}`);
          await this.selectUser(element, this.config.assignee, 'assignee');
          // Označíme jako vyplněné
          this.filledValues.add(assigneeKey);
          return;
        } else {
          this.log(`Element nalezen, ale není to assignee element: ${selector}`);
        }
      }
    }
    
    this.log('Assignee pole nebylo nalezeno');
  }

  async fillReviewers() {
    this.log('Hledám pole pro reviewers...');
    
    // Kontrolujeme, jestli už byli reviewers vyplněni
    const reviewersKey = `reviewers_${this.config.reviewers.join(',')}`;
    if (this.filledValues.has(reviewersKey)) {
      this.log('Reviewers již byli vyplněni, přeskakuji...');
      return;
    }
    
    // Hledáme pole pro reviewers - specifičtější selektory pro reviewers
    const reviewerSelectors = [
      '.js-reviewer-search',
      '[data-testid="issuable-reviewer-dropdown"]',
      '[data-testid="reviewer-dropdown"]',
      '[data-testid="reviewer-input"]',
      '.reviewer-dropdown',
      'input[name="reviewer_ids[]"]',
      '.reviewer-dropdown-toggle',
      '[data-testid="reviewer-select"]',
      '.reviewer-select',
      'input[placeholder*="reviewer" i]',
      'input[placeholder*="revizor" i]',
      '.js-reviewer-dropdown',
      '.reviewer-dropdown-input'
    ];

    for (const selector of reviewerSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        // Ověříme, že to je skutečně reviewer element, ne assignee element
        const isReviewerElement = element.classList.contains('js-reviewer-search') ||
                                 element.closest('.js-reviewer-search') ||
                                 element.getAttribute('data-testid')?.includes('reviewer') ||
                                 element.textContent?.toLowerCase().includes('reviewer') ||
                                 element.placeholder?.toLowerCase().includes('reviewer') ||
                                 element.textContent?.toLowerCase().includes('select reviewers') ||
                                 element.closest('[data-field-name*="reviewer"]');
        
        if (isReviewerElement) {
          this.log(`Reviewer pole nalezeno: ${selector}`);
          
          // Pro reviewers používáme postupný výběr bez opětovného otevírání dropdownu
          for (let i = 0; i < this.config.reviewers.length; i++) {
            const reviewer = this.config.reviewers[i];
            
            if (i === 0) {
              // První reviewer - otevřeme dropdown a vybereme
              await this.selectUser(element, reviewer, 'reviewer');
            } else {
              // Další reviewery - vybereme bez opětovného otevírání dropdownu
              await this.selectAdditionalReviewer(reviewer);
            }
            
            // Počkáme mezi jednotlivými reviewery
            await new Promise(resolve => setTimeout(resolve, 1500));
          }
          // Označíme jako vyplněné
          this.filledValues.add(reviewersKey);
          return;
        } else {
          this.log(`Element nalezen, ale není to reviewer element: ${selector}`);
        }
      }
    }
    
    this.log('Reviewer pole nebylo nalezeno');
  }

  async fillLabels() {
    this.log('Hledám pole pro labels...');
    
    // Kontrolujeme, jestli už byly labely vyplněny
    const labelsKey = `labels_${this.config.labels.join(',')}`;
    if (this.filledValues.has(labelsKey)) {
      this.log('Labels již byly vyplněny, přeskakuji...');
      return;
    }
    
    // Hledáme pole pro labels - specifičtější selektory pro labels
    const labelSelectors = [
      '[data-testid="issuable-label-dropdown"]',
      '[data-testid="sidebar-labels"]',
      '.labels-select-wrapper',
      '.issuable-form-label-select-holder',
      '.js-label-select',
      '[data-testid="label-input"]',
      '.label-dropdown',
      'input[name="label_ids[]"]',
      '.label-dropdown-toggle',
      '[data-testid="label-select"]',
      '.label-select',
      'input[placeholder*="label" i]',
      'input[placeholder*="štítek" i]',
      '.js-label-dropdown',
      '.label-dropdown-input',
      '.labels-select'
    ];

    for (const selector of labelSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        // Ověříme, že to je skutečně label element, ne user element
        const isLabelElement = element.getAttribute('data-testid') === 'issuable-label-dropdown' ||
                              element.closest('[data-testid="sidebar-labels"]') ||
                              element.closest('.labels-select-wrapper') ||
                              element.textContent?.toLowerCase().includes('label') ||
                              element.placeholder?.toLowerCase().includes('label');
        
        if (isLabelElement) {
          this.log(`Label pole nalezeno: ${selector}`);
          for (const label of this.config.labels) {
            await this.selectLabel(element, label);
            // Počkáme mezi jednotlivými labely
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          // Označíme jako vyplněné
          this.filledValues.add(labelsKey);
          return;
        } else {
          this.log(`Element nalezen, ale není to label element: ${selector}`);
        }
      }
    }
    
    this.log('Label pole nebylo nalezeno');
  }

  async selectUser(element, username, userType = 'user') {
    return new Promise((resolve) => {
      this.log(`Vybírám ${userType}: ${username}`);
      
      try {
        // Pro GitLab dropdown tlačítka
        if (element.getAttribute('data-testid')?.includes('dropdown') || 
            element.classList.contains('js-assignee-search') ||
            element.classList.contains('js-reviewer-search') ||
            element.classList.contains('js-user-search')) {
          this.log('Klikám na dropdown tlačítko');
          element.click();
          
          // Počkáme na otevření dropdownu
          setTimeout(() => {
            this.selectUserFromDropdown(username, userType);
            resolve();
          }, 1000);
        } else {
          // Standardní přístup pro input pole
          element.click();
          element.focus();
          
          if (element.value !== undefined) {
            element.value = username;
            element.dispatchEvent(new Event('input', { bubbles: true }));
            element.dispatchEvent(new Event('change', { bubbles: true }));
            element.dispatchEvent(new Event('keyup', { bubbles: true }));
          }
          
          setTimeout(() => {
            this.selectUserFromDropdown(username, userType);
            resolve();
          }, 1500);
        }
      } catch (error) {
        this.log(`Chyba při výběru ${userType}: ${error.message}`);
        resolve();
      }
    });
  }

  selectUserFromDropdown(username, userType = 'user') {
    this.log(`Hledám ${userType} "${username}" v dropdownu`);
    
    // Hledáme dropdown s uživateli podle typu
    let dropdownSelectors = [];
    
    if (userType === 'assignee') {
      dropdownSelectors = [
        '.dropdown-menu-assignee.show',
        '.dropdown-menu.show:has(.dropdown-menu-user-link)',
        '.dropdown-menu.show:has([data-user-id])'
      ];
    } else if (userType === 'reviewer') {
      dropdownSelectors = [
        '.dropdown-menu-reviewer.show',
        '.dropdown-menu.show:has(.dropdown-menu-user-link)',
        '.dropdown-menu.show:has([data-user-id])'
      ];
    } else {
      // Fallback pro obecné user dropdowny
      dropdownSelectors = [
        '.dropdown-menu-user.show',
        '.dropdown-menu-assignee.show',
        '.dropdown-menu-reviewer.show',
        '.dropdown-menu.show:has(.dropdown-menu-user-link)',
        '.dropdown-menu.show:has([data-user-id])',
        '.gl-dropdown-menu.show:has(.dropdown-menu-user-link)',
        '.dropdown-menu:has(.dropdown-menu-user-link)',
        '.gl-dropdown-menu:has(.dropdown-menu-user-link)'
      ];
    }
    
    let dropdown = null;
    for (const selector of dropdownSelectors) {
      dropdown = document.querySelector(selector);
      if (dropdown) {
        this.log(`User dropdown nalezen: ${selector}`);
        break;
      }
    }
    
    // Fallback - hledáme dropdown, který obsahuje user-specifické elementy
    if (!dropdown) {
      const allDropdowns = document.querySelectorAll('.dropdown-menu.show, .gl-dropdown-menu.show');
      for (const dd of allDropdowns) {
        if (dd.querySelector('.dropdown-menu-user-link') || dd.querySelector('[data-user-id]')) {
          dropdown = dd;
          this.log('User dropdown nalezen pomocí fallback metody');
          break;
        }
      }
    }
    
    if (!dropdown) {
      this.log('Dropdown nebyl nalezen');
      return;
    }
    
    // Hledáme search input v dropdownu
    const searchInput = dropdown.querySelector('input[type="search"], input[placeholder*="Search"], .dropdown-input-field');
    if (searchInput) {
      this.log('Nalezen search input, zadávám uživatelské jméno');
      searchInput.value = username;
      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      searchInput.dispatchEvent(new Event('keyup', { bubbles: true }));
      
                  // Počkáme na filtrování a vybereme první výsledek
            setTimeout(() => {
              const success = this.clickFirstUserOption(dropdown, username);
              if (!success) {
                this.log(`Nepodařilo se vybrat uživatele: ${username}`);
              }
            }, 1000);
    } else {
      // Pokud není search input, hledáme přímo podle textu
      const success = this.clickFirstUserOption(dropdown, username);
      if (!success) {
        this.log(`Nepodařilo se vybrat uživatele: ${username}`);
      }
    }
  }

  clickFirstUserOption(dropdown, username) {
    // Hledáme user option podle textu - aktualizováno podle skutečné GitLab struktury
    const userOptions = dropdown.querySelectorAll('.dropdown-menu-user-link, .dropdown-item, .gl-dropdown-item, [role="menuitem"]');
    
    for (const option of userOptions) {
      const optionText = option.textContent?.trim();
      if (optionText && optionText.toLowerCase().includes(username.toLowerCase())) {
        this.log(`Nalezen user option: "${optionText}"`);
        option.click();
        this.log(`Uživatel "${username}" vybrán`);
        
        // Pro assignee a reviewers NEZAVÍRÁME dropdown automaticky
        // Uživatel může chtít vybrat více hodnot
        this.log('User dropdown ponechán otevřený pro možnost výběru dalších hodnot');
        return true; // Úspěšně vybrán
      }
    }
    
    // Pokud nenajdeme přesnou shodu, NEKLIKÁME na první dostupnou option
    // Místo toho logujeme chybu a pokračujeme
    this.log(`Uživatel "${username}" nebyl nalezen v dropdownu`);
    this.log('Dostupné options:', Array.from(userOptions).map(opt => opt.textContent?.trim()).filter(Boolean));
    
    // Vyčistíme search input pro další pokus
    const searchInput = dropdown.querySelector('input[type="search"], input[placeholder*="Search"], .dropdown-input-field');
    if (searchInput) {
      searchInput.value = '';
      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      searchInput.dispatchEvent(new Event('keyup', { bubbles: true }));
      this.log('Search input vyčištěn pro další pokus');
    }
    
    // NEZAVÍRÁME dropdown a nepokračujeme s výběrem
    return false; // Nenalezen
  }

  async selectAdditionalReviewer(username) {
    return new Promise((resolve) => {
      this.log(`Přidávám dalšího reviewer: ${username}`);
      
      try {
        // Hledáme otevřený reviewer dropdown
        const reviewerDropdown = document.querySelector('.dropdown-menu-reviewer.show, .dropdown-menu.show:has(.dropdown-menu-user-link)');
        
        if (reviewerDropdown) {
          this.log('Nalezen otevřený reviewer dropdown, přidávám dalšího reviewer');
          
          // Hledáme search input v dropdownu
          const searchInput = reviewerDropdown.querySelector('input[type="search"], input[placeholder*="Search"], .dropdown-input-field');
          if (searchInput) {
            this.log('Nalezen search input, zadávám uživatelské jméno');
            
            // Vyčistíme search input před zadáním nového jména
            searchInput.value = '';
            searchInput.dispatchEvent(new Event('input', { bubbles: true }));
            searchInput.dispatchEvent(new Event('keyup', { bubbles: true }));
            
            // Počkáme na vyčištění a pak zadáme nové jméno
            setTimeout(() => {
              searchInput.value = username;
              searchInput.dispatchEvent(new Event('input', { bubbles: true }));
              searchInput.dispatchEvent(new Event('keyup', { bubbles: true }));
              
              // Počkáme na filtrování a vybereme první výsledek
              setTimeout(() => {
                const success = this.clickFirstUserOption(reviewerDropdown, username);
                if (!success) {
                  this.log(`Nepodařilo se přidat reviewer: ${username}`);
                }
                resolve();
              }, 1000);
            }, 500);
          } else {
            // Pokud není search input, hledáme přímo podle textu
            const success = this.clickFirstUserOption(reviewerDropdown, username);
            if (!success) {
              this.log(`Nepodařilo se přidat reviewer: ${username}`);
            }
            resolve();
          }
        } else {
          this.log('Otevřený reviewer dropdown nebyl nalezen');
          resolve();
        }
      } catch (error) {
        this.log(`Chyba při přidávání reviewer: ${error.message}`);
        resolve();
      }
    });
  }

  async selectLabel(element, labelName) {
    return new Promise((resolve) => {
      this.log(`Vybírám label: ${labelName}`);
      
      try {
        // Pro GitLab labels dropdown - klikneme na dropdown tlačítko
        if (element.getAttribute('data-testid') === 'issuable-label-dropdown') {
          this.log('Klikám na label dropdown tlačítko');
          element.click();
          
          // Počkáme na otevření dropdownu
          setTimeout(() => {
            this.selectLabelFromDropdown(labelName);
            resolve();
          }, 1000);
        } else {
          // Standardní přístup pro input pole
          element.click();
          element.focus();
          
          if (element.value !== undefined) {
            element.value = labelName;
            element.dispatchEvent(new Event('input', { bubbles: true }));
            element.dispatchEvent(new Event('change', { bubbles: true }));
            element.dispatchEvent(new Event('keyup', { bubbles: true }));
          }
          
          setTimeout(() => {
            this.selectLabelFromDropdown(labelName);
            resolve();
          }, 1500);
        }
      } catch (error) {
        this.log(`Chyba při výběru labelu: ${error.message}`);
        resolve();
      }
    });
  }

  selectLabelFromDropdown(labelName) {
    this.log(`Hledám label "${labelName}" v dropdownu`);
    
    // Hledáme dropdown s labely - specifičtější selektory pro labels
    const dropdownSelectors = [
      '[data-testid="labels-select-dropdown-contents"]',
      '.dropdown-menu.show:has([data-testid="labels-list"])',
      '.dropdown-menu.show:has(.dropdown-label-box)',
      '.gl-dropdown-menu.show:has([data-testid="labels-list"])',
      '.dropdown-menu:has([data-testid="labels-list"])',
      '.gl-dropdown-menu:has([data-testid="labels-list"])'
    ];
    
    let dropdown = null;
    for (const selector of dropdownSelectors) {
      dropdown = document.querySelector(selector);
      if (dropdown) {
        this.log(`Label dropdown nalezen: ${selector}`);
        break;
      }
    }
    
    // Fallback - hledáme dropdown, který obsahuje label-specifické elementy
    if (!dropdown) {
      const allDropdowns = document.querySelectorAll('.dropdown-menu.show, .gl-dropdown-menu.show');
      for (const dd of allDropdowns) {
        if (dd.querySelector('[data-testid="labels-list"]') || dd.querySelector('.dropdown-label-box')) {
          dropdown = dd;
          this.log('Label dropdown nalezen pomocí fallback metody');
          break;
        }
      }
    }
    
    if (!dropdown) {
      this.log('Dropdown nebyl nalezen');
      return;
    }
    
    // Hledáme search input v dropdownu
    const searchInput = dropdown.querySelector('input[type="search"], input[placeholder*="Search"]');
    if (searchInput) {
      this.log('Nalezen search input, zadávám název labelu');
      searchInput.value = labelName;
      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      searchInput.dispatchEvent(new Event('keyup', { bubbles: true }));
      
      // Počkáme na filtrování a vybereme první výsledek
      setTimeout(() => {
        this.clickFirstLabelOption(dropdown, labelName);
      }, 1000);
    } else {
      // Pokud není search input, hledáme přímo podle textu
      this.clickFirstLabelOption(dropdown, labelName);
    }
  }

  clickFirstLabelOption(dropdown, labelName) {
    // Hledáme label option podle textu
    const labelOptions = dropdown.querySelectorAll('[data-testid="labels-list"], .dropdown-item, .gl-dropdown-item');
    
    for (const option of labelOptions) {
      const optionText = option.textContent?.trim();
      if (optionText && optionText.toLowerCase().includes(labelName.toLowerCase())) {
        this.log(`Nalezen label option: "${optionText}"`);
        option.click();
        this.log(`Label "${labelName}" vybrán`);
        
        // NEZAVÍRÁME dropdown automaticky - necháme uživatele zavřít sám
        this.log('Dropdown ponechán otevřený pro uživatele');
        return;
      }
    }
    
    // Pokud nenajdeme přesnou shodu, klikneme na první dostupnou option
    const firstOption = dropdown.querySelector('[data-testid="labels-list"], .dropdown-item, .gl-dropdown-item');
    if (firstOption) {
      this.log('Klikám na první dostupnou label option');
      firstOption.click();
      
      // NEZAVÍRÁME dropdown automaticky - necháme uživatele zavřít sám
      this.log('Dropdown ponechán otevřený pro uživatele');
    } else {
      this.log('Žádná label option nebyla nalezena');
    }
  }

  // ZAKOMENTOVÁNO - NEZAVÍRÁME DROPDOWNY AUTOMATICKY
  // closeDropdown(dropdown) {
  //   // Kontrolujeme, jestli jsme v časovém okně automatického vyplnění
  //   const timeSinceAutoFill = Date.now() - this.lastAutoFillTime;
  //   if (timeSinceAutoFill > this.autoFillTimeout) {
  //     this.log('Mimo časové okno automatického vyplnění, nezavírám dropdown');
  //     return;
  //   }
  //   
  //   // Kontrolujeme, jestli je to label dropdown
  //   const isLabelDropdown = dropdown.querySelector('[data-testid="labels-list"]') || 
  //                          dropdown.querySelector('.dropdown-label-box') ||
  //                          dropdown.getAttribute('data-testid') === 'labels-select-dropdown-contents';
  //   
  //   if (!isLabelDropdown) {
  //     this.log('Není to label dropdown, nezavírám');
  //     return;
  //   }
  //   
  //   this.log('Zavírám label dropdown');
  //   
  //   // Hledáme close tlačítko v dropdownu
  //   const closeButton = dropdown.querySelector('[data-testid="close-labels-dropdown-button"], .dropdown-menu-close, .dropdown-title-button, .dropdown-header-button');
  //   if (closeButton) {
  //     this.log('Klikám na close tlačítko');
  //     closeButton.click();
  //     return;
  //   }
  //   
  //   // Hledáme label dropdown toggle tlačítko a klikneme na něj pro zavření
  //   const labelDropdownToggle = document.querySelector('[data-testid="issuable-label-dropdown"]');
  //   if (labelDropdownToggle && labelDropdownToggle.getAttribute('aria-expanded') === 'true') {
  //     this.log('Klikám na label dropdown toggle pro zavření');
  //     labelDropdownToggle.click();
  //     return;
  //   }
  //   
  //   // Fallback - klikneme mimo dropdown
  //   this.log('Klikám mimo dropdown pro zavření');
  //   document.body.click();
  //   
  //   // Další fallback - stiskneme Escape klávesu
  //   setTimeout(() => {
  //     this.log('Stiskám Escape klávesu pro zavření dropdownu');
  //     document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  //   }, 100);
  // }

  // ZAKOMENTOVÁNO - NEZAVÍRÁME DROPDOWNY AUTOMATICKY
  // closeAllDropdowns() {
  //   // Kontrolujeme, jestli jsme v časovém okně automatického vyplnění
  //   const timeSinceAutoFill = Date.now() - this.lastAutoFillTime;
  //   if (timeSinceAutoFill > this.autoFillTimeout) {
  //     this.log('Mimo časové okno automatického vyplnění, nezavírám dropdowny');
  //     return;
  //   }
  //   
  //   this.log('Zavírám pouze label dropdowny');
  //   
  //   // Hledáme pouze label dropdowny
  //   const labelDropdowns = document.querySelectorAll('[data-testid="labels-select-dropdown-contents"], .dropdown-menu.show:has([data-testid="labels-list"]), .dropdown-menu.show:has(.dropdown-label-box)');
  //   
  //   if (labelDropdowns.length > 0) {
  //     this.log(`Nalezeno ${labelDropdowns.length} otevřených label dropdownů`);
  //     
  //       // Zavřeme každý label dropdown
  //       labelDropdowns.forEach((dropdown, index) => {
  //         setTimeout(() => {
  //           this.closeDropdown(dropdown);
  //         }, index * 200); // Postupně zavíráme s malým zpožděním
  //       });
  //     } else {
  //       this.log('Žádné otevřené label dropdowny nebyly nalezeny');
  //     }
  //     
  //     // NEZAVÍRÁME user dropdowny (assignee/reviewers) automaticky
  //     // Uživatel může chtít vybrat více hodnot
  //   }
}

// Spustíme automatické vyplňování
const autoFill = new GitLabMRAutoFill();

// Poslouchání zpráv z popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'reloadConfig') {
    autoFill.init();
  } else if (request.action === 'testFill') {
    autoFill.fillForm();
  }
}); 