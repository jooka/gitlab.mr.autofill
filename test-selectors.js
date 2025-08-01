// Test selektorů pro GitLab MR Auto Fill
// Zkopírujte a vložte tento kód do konzole prohlížeče na GitLab stránce

console.log('=== TEST SELEKTORŮ GITLAB MR AUTO FILL ===');

// Test formuláře
function testFormSelectors() {
  console.log('\n--- TEST FORMULÁŘE ---');
  const formSelectors = [
    '.merge-request-form',
    '[data-testid="merge-request-form"]',
    '.js-merge-request-form',
    '.new-merge-request',
    '[data-testid="new-merge-request"]',
    '.merge-request-create-form'
  ];
  
  for (const selector of formSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      console.log(`✅ Formulář: ${selector}`);
      console.log('Element:', element);
    } else {
      console.log(`❌ Formulář: ${selector}`);
    }
  }
}

// Test assignee selektorů
function testAssigneeSelectors() {
  console.log('\n--- TEST ASSIGNEE ---');
  const assigneeSelectors = [
    '[data-testid="assignee-ids-dropdown-toggle"]',
    '.js-assignee-search',
    '.js-user-search',
    '[data-testid="issuable-assignee-dropdown"]',
    '[data-testid="assignee-dropdown"]',
    '[data-testid="assignee-input"]',
    '.assignee-dropdown',
    'input[name="assignee_ids[]"]',
    '.assignee-dropdown-toggle'
  ];
  
  for (const selector of assigneeSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      console.log(`✅ Assignee: ${selector}`);
      console.log('Element:', element);
      element.style.border = '2px solid red';
    } else {
      console.log(`❌ Assignee: ${selector}`);
    }
  }
}

// Test reviewer selektorů
function testReviewerSelectors() {
  console.log('\n--- TEST REVIEWER ---');
  const reviewerSelectors = [
    '.js-reviewer-search',
    '.js-user-search',
    '[data-testid="issuable-reviewer-dropdown"]',
    '[data-testid="reviewer-dropdown"]',
    '[data-testid="reviewer-input"]',
    '.reviewer-dropdown',
    'input[name="reviewer_ids[]"]',
    '.reviewer-dropdown-toggle'
  ];
  
  for (const selector of reviewerSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      console.log(`✅ Reviewer: ${selector}`);
      console.log('Element:', element);
      element.style.border = '2px solid blue';
    } else {
      console.log(`❌ Reviewer: ${selector}`);
    }
  }
}

// Test label selektorů
function testLabelSelectors() {
  console.log('\n--- TEST LABELS ---');
  const labelSelectors = [
    '[data-testid="issuable-label-dropdown"]',
    '[data-testid="sidebar-labels"]',
    '.labels-select-wrapper',
    '.issuable-form-label-select-holder',
    '.js-label-select',
    '[data-testid="label-input"]',
    '.label-dropdown'
  ];
  
  for (const selector of labelSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      console.log(`✅ Label: ${selector}`);
      console.log('Element:', element);
      element.style.border = '2px solid green';
    } else {
      console.log(`❌ Label: ${selector}`);
    }
  }
}

// Test dropdown selektorů
function testDropdownSelectors() {
  console.log('\n--- TEST DROPDOWN ---');
  
  // Test user dropdown selektorů
  console.log('\n--- USER DROPDOWNS ---');
  const userDropdownSelectors = [
    '.dropdown-menu-user.show',
    '.dropdown-menu-assignee.show',
    '.dropdown-menu-reviewer.show',
    '.dropdown-menu.show:has(.dropdown-menu-user-link)',
    '.dropdown-menu.show:has([data-user-id])'
  ];
  
  for (const selector of userDropdownSelectors) {
    const elements = document.querySelectorAll(selector);
    if (elements.length > 0) {
      console.log(`✅ User Dropdown: ${selector} (${elements.length} elementů)`);
      elements.forEach((el, index) => {
        console.log(`  Element ${index + 1}:`, el);
        el.style.border = '2px solid blue';
      });
    } else {
      console.log(`❌ User Dropdown: ${selector}`);
    }
  }
  
  // Test label dropdown selektorů
  console.log('\n--- LABEL DROPDOWNS ---');
  const labelDropdownSelectors = [
    '[data-testid="labels-select-dropdown-contents"]',
    '.dropdown-menu.show:has([data-testid="labels-list"])',
    '.dropdown-menu.show:has(.dropdown-label-box)'
  ];
  
  for (const selector of labelDropdownSelectors) {
    const elements = document.querySelectorAll(selector);
    if (elements.length > 0) {
      console.log(`✅ Label Dropdown: ${selector} (${elements.length} elementů)`);
      elements.forEach((el, index) => {
        console.log(`  Element ${index + 1}:`, el);
        el.style.border = '2px solid green';
      });
    } else {
      console.log(`❌ Label Dropdown: ${selector}`);
    }
  }
}

// Test search input selektorů
function testSearchInputSelectors() {
  console.log('\n--- TEST SEARCH INPUT ---');
  const searchSelectors = [
    'input[type="search"]',
    'input[placeholder*="Search"]',
    'input[placeholder*="search"]',
    '[data-testid="dropdown-input-field"]',
    '.dropdown-input-field'
  ];
  
  for (const selector of searchSelectors) {
    const elements = document.querySelectorAll(selector);
    if (elements.length > 0) {
      console.log(`✅ Search Input: ${selector} (${elements.length} elementů)`);
      elements.forEach((el, index) => {
        console.log(`  Element ${index + 1}:`, el);
        el.style.border = '2px solid purple';
      });
    } else {
      console.log(`❌ Search Input: ${selector}`);
    }
  }
}

// Spuštění všech testů
function runAllTests() {
  testFormSelectors();
  testAssigneeSelectors();
  testReviewerSelectors();
  testLabelSelectors();
  testDropdownSelectors();
  testSearchInputSelectors();
  
  console.log('\n=== TEST DOKONČEN ===');
  console.log('Zkontrolujte stránku pro zvýrazněné elementy:');
  console.log('- Červený border = Assignee');
  console.log('- Modrý border = Reviewer');
  console.log('- Zelený border = Labels');
  console.log('- Oranžový border = Dropdown');
  console.log('- Fialový border = Search Input');
}

// Spuštění testů
runAllTests();

// Funkce pro manuální test
window.testGitLabSelectors = {
  testForm: testFormSelectors,
  testAssignee: testAssigneeSelectors,
  testReviewer: testReviewerSelectors,
  testLabels: testLabelSelectors,
  testDropdown: testDropdownSelectors,
  testSearch: testSearchInputSelectors,
  runAll: runAllTests
};

console.log('\nPro spuštění jednotlivých testů použijte:');
console.log('window.testGitLabSelectors.testForm()');
console.log('window.testGitLabSelectors.testAssignee()');
console.log('window.testGitLabSelectors.testReviewer()');
console.log('window.testGitLabSelectors.testLabels()');
console.log('window.testGitLabSelectors.testDropdown()');
console.log('window.testGitLabSelectors.testSearch()'); 