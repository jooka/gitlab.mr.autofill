# Instalace GitLab MR Auto Fill rozšíření

## Krok 1: Ikony jsou již připravené

Ikony pro rozšíření jsou již vytvořeny a připravené k použití:
- `icons/icon16.png` - 16x16 pixelů
- `icons/icon48.png` - 48x48 pixelů  
- `icons/icon128.png` - 128x128 pixelů

Pokud byste chtěli vytvořit vlastní ikony, můžete použít soubor `create-icons.html`.

## Krok 2: Instalace v Chrome

### Metoda 1: Developer Mode (Doporučeno pro vývoj)

1. Otevřete Chrome
2. Zadejte do adresního řádku: `chrome://extensions/`
3. Zapněte "Developer mode" (vývojářský režim) v pravém horním rohu
4. Klikněte na "Load unpacked" (Načíst rozbalené)
5. Vyberte složku s tímto projektem (`gitlab.extension`)
6. Rozšíření by se mělo objevit v seznamu

### Metoda 2: Balíček .crx (Pro distribuci)

1. V Developer mode klikněte na "Pack extension"
2. Vyberte složku s projektem
3. Chrome vytvoří `.crx` soubor a `.pem` klíč
4. `.crx` soubor můžete distribuovat ostatním uživatelům

## Krok 3: Konfigurace

1. Klikněte na ikonu rozšíření v Chrome liště
2. Otevře se popup s nastavením
3. Nastavte:
   - **Povolit automatické vyplňování** - Zaškrtněte pro aktivaci
   - **Assignee** - Zadejte uživatelské jméno osoby, která bude přiřazena k MR
   - **Reviewers** - Zadejte uživatelská jména reviewerů (každé na nový řádek)
   - **Labels** - Zadejte názvy labelů (každý na nový řádek)
4. Klikněte na "Uložit nastavení"

## Krok 4: Testování

1. Přejděte na GitLab projekt
2. Vytvořte nový merge request
3. Rozšíření by mělo automaticky vyplnit nastavené hodnoty

## Řešení problémů

### Rozšíření se nezobrazuje
- Zkontrolujte, že jste správně načetli složku s projektem
- Ověřte, že `manifest.json` je v kořenové složce

### Ikony se nezobrazují
- Zkontrolujte, že ikony jsou ve složce `icons/`
- Ověřte, že názvy souborů odpovídají těm v `manifest.json`

### Automatické vyplňování nefunguje
- Zkontrolujte, že jste na stránce pro vytváření merge requestu
- Ověřte, že je rozšíření povoleno v nastavení
- Zkontrolujte konzoli prohlížeče pro chybové zprávy

### GitLab se změnil
- Rozšíření používá různé CSS selektory pro kompatibilitu
- Pokud GitLab změní rozhraní, může být potřeba aktualizace `content.js`

## Aktualizace rozšíření

1. Upravte soubory v projektu
2. V `chrome://extensions/` klikněte na "Reload" u rozšíření
3. Nebo klikněte na ikonu rozšíření a znovu uložte nastavení

## Odinstalace

1. Přejděte na `chrome://extensions/`
2. Najděte rozšíření "GitLab MR Auto Fill"
3. Klikněte na "Remove" (Odebrat)

## Podpora

Pokud máte problémy s instalací nebo používáním:

1. Zkontrolujte konzoli prohlížeče pro chybové zprávy
2. Ověřte, že používáte kompatibilní verzi Chrome
3. Zkuste rozšíření odinstalovat a znovu nainstalovat
4. Zkontrolujte, že všechny soubory jsou na správných místech 