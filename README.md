# Treningi przed kolokwiami: publiczna „skorupa”

Strona: https://tosca3.github.io/kon-treningi/

To repozytorium NIE zawiera treści treningów. Są one w prywatnym magazynie Supabase i dostaje je tylko zalogowane konto zaakceptowane przez administratora.

- `index.html`: spis treningów (wczytywany z magazynu po zalogowaniu), komunikat „czeka na akceptację”.
- `login.html`: logowanie i rejestracja (e-mail + hasło; nowe konto ma status „czeka”).
- `t.html?id=…`: pobiera trening z magazynu i wyświetla go w ramce.
- `admin.html`: panel akceptacji kont (tylko administrator).
- `auth.js`: wspólny moduł kont; `vendor/supabase.js`: biblioteka supabase-js (UMD); `shell.css`: wygląd.

Źródła treningów i skrypty SQL są w prywatnym repozytorium `TOSCA3/kon-treningi-tresci`.
