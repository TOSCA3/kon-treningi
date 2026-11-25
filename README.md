# Treningi przed kolokwiami

Interaktywne treningi do nauki (kierunek lekarski, UAFM Kraków), publikowane przez GitHub Pages.

- Strona: https://tosca3.github.io/kon-treningi/
- Każdy trening to jeden samodzielny plik `index.html` w osobnym folderze (np. `kon4-witaminy/`).
- Spis treningów jest w `index.html` w katalogu głównym, w tablicy `TRAININGS` (najnowsze na górze).
- Publikacja jest automatyczna: każdy push na gałąź `main` uruchamia `.github/workflows/pages.yml`.

## Konta (Supabase)

- `auth.js` to wspólny moduł kont (logowanie e-mail + hasło, postęp i wyniki w bazie). `vendor/supabase.js` to biblioteka supabase-js (UMD).
- `login.html` to logowanie i rejestracja. Bez konta wszystko działa w trybie gościa (postęp w przeglądarce).
- Tabele: `profiles`, `attempts` (każde rozwiązane zadanie), `progress` (stan sesji do wznowienia). Reguły RLS: każdy widzi tylko swoje dane.
- W nowym treningu dołącz `../vendor/supabase.js` i `../auth.js`, a potem używaj `KT.ready`, `KT.saveAttempt`, `KT.saveProgress`, `KT.loadProgress`, `KT.attempts`, `KT.renderBar`.

## Dodanie nowego treningu

1. Utwórz folder `nazwa-treningu/` i wrzuć do niego `index.html`.
2. Dopisz wpis na początku tablicy `TRAININGS` w głównym `index.html`.
3. Commit i push na `main`.

Treści są pomocą do nauki i nie zastępują podręcznika ani zajęć.
