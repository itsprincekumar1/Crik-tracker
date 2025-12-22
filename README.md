# Crik-Track

Mobile-first cricket scoring web app (HTML/CSS/JS) with a minimal Python server to serve files and save matches locally.

Quick start (Windows / PowerShell):

```powershell
python server.py
# Open http://localhost:8000/ in your phone or emulator
```

Notes:
- The app is offline-first in the browser and stores the current match state in memory; you can save the match with the "Save Match" button — this will POST to `/save` and create a JSON file under the `matches/` folder.
- No account or network login required.
