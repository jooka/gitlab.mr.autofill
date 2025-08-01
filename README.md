# GitLab MR Auto Fill - Chrome Rozšíření

Chrome rozšíření pro automatické vyplňování Assignee, Reviewers a Labels při vytváření merge requestu v GitLabu.

## Funkce

- **Automatické vyplňování Assignee** - Nastavte výchozí osobu, která bude přiřazena k merge requestu
- **Automatické vyplňování Reviewers** - Nastavte seznam reviewerů, kteří budou automaticky přidáni
- **Automatické vyplňování Labels** - Nastavte výchozí labely pro merge requesty
- **Jednoduchá konfigurace** - Přehledné rozhraní pro nastavení všech parametrů
- **Zapnutí/vypnutí** - Možnost rychle povolit nebo zakázat automatické vyplňování

## Instalace

### 1. Stáhněte nebo naklonujte tento repozitář

```bash
git clone <repository-url>
cd gitlab.extension
```

### 2. Ikony jsou již připravené

Ikony pro rozšíření jsou již vytvořeny a připravené k použití:
- `icons/icon16.png` - 16x16 pixelů
- `icons/icon48.png` - 48x48 pixelů  
- `icons/icon128.png` - 128x128 pixelů

### 3. Otevřete Chrome a přejděte na stránku rozšíření

1. Otevřete Chrome
2. Zadejte do adresního řádku: `chrome://extensions/`
3. Zapněte "Developer mode" (vývojářský režim) v pravém horním rohu

### 4. Načtěte rozšíření

1. Klikněte na "Load unpacked" (Načíst rozbalené)
2. Vyberte složku s tímto projektem
3. Rozšíření by se mělo objevit v seznamu

## Konfigurace

### 1. Otevřete nastavení rozšíření

1. Klikněte na ikonu rozšíření v Chrome liště
2. Otevře se popup s nastavením

### 2. Nastavte parametry

- **Povolit automatické vyplňování** - Zaškrtněte pro aktivaci
- **Assignee** - Zadejte uživatelské jméno osoby, která bude přiřazena k MR
- **Reviewers** - Zadejte uživatelská jména reviewerů (každé na nový řádek)
- **Labels** - Zadejte názvy labelů (každý na nový řádek)

### 3. Uložte nastavení

Klikněte na "Uložit nastavení" pro uložení konfigurace.

## Použití

1. Přejděte na GitLab projekt
2. Vytvořte nový merge request
3. Rozšíření automaticky vyplní nastavené hodnoty pro:
   - Assignee
   - Reviewers
   - Labels

## Podporované GitLab instance

- gitlab.com
- Vlastní GitLab instance (*.gitlab.com)

## Struktura souborů

```
gitlab.extension/
├── manifest.json          # Manifest rozšíření
├── content.js             # Content script pro automatické vyplňování
├── popup.html             # HTML pro popup nastavení
├── popup.js               # JavaScript pro popup
├── background.js          # Background service worker
├── icons/                 # Ikony rozšíření
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md              # Tento soubor
```

## Technické detaily

### Content Script
- Automaticky detekuje stránky pro vytváření merge requestů
- Používá různé CSS selektory pro kompatibilitu s různými verzemi GitLabu
- Sleduje změny v DOM pro SPA navigaci
- Simuluje uživatelské interakce pro výběr uživatelů a labelů

### Storage
- Konfigurace se ukládá do Chrome sync storage
- Automatická synchronizace mezi zařízeními
- Perzistentní nastavení

### Bezpečnost
- Rozšíření má přístup pouze k GitLab doménám
- Neposílá žádná data na externí servery
- Všechna data zůstávají lokálně v prohlížeči

## Řešení problémů

### Rozšíření nefunguje
1. Zkontrolujte, že jste na stránce pro vytváření merge requestu
2. Ověřte, že je rozšíření povoleno
3. Zkontrolujte konzoli prohlížeče pro chybové zprávy
4. Použijte tlačítko "Testovat na aktuální stránce" v popup rozšíření

### Debugging nástroje
- **Konzole prohlížeče**: Otevřete F12 a sledujte zprávy s prefixem `[GitLab MR Auto Fill]`
- **DOM Analyzer**: Otevřete `debug-gitlab.html` pro analýzu struktury GitLab stránky
- **Test selektorů**: Zkopírujte obsah `test-selectors.js` do konzole prohlížeče na GitLab stránce
- **Manuální test**: Použijte tlačítko "Testovat na aktuální stránce" v popup rozšíření

### Automatické vyplňování nefunguje
1. Zkontrolujte nastavení v popup rozšíření
2. Ověřte, že jsou zadané správné uživatelská jména a názvy labelů
3. Zkuste obnovit stránku

### GitLab se změnil
Rozšíření používá různé CSS selektory pro kompatibilitu. Pokud GitLab změní své rozhraní, může být potřeba aktualizace selektorů.

## Vývoj

### Přidání nových funkcí
1. Upravte `content.js` pro novou funkcionalitu
2. Aktualizujte `popup.html` a `popup.js` pro nová nastavení
3. Otestujte na různých GitLab instancích

### Testování
1. Načtěte rozšíření v Chrome
2. Přejděte na GitLab a vytvořte merge request
3. Ověřte, že se automaticky vyplní nastavené hodnoty

## Licence

Tento projekt je open source a dostupný pod MIT licencí.

## Přispívání

Příspěvky jsou vítány! Prosím:
1. Fork repozitáře
2. Vytvořte feature branch
3. Commit změny
4. Push do branch
5. Otevřete Pull Request 