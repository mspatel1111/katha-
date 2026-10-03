# KATHA: laptop installation

## Hindi quick guide

1. Laptop par Git aur Node.js 22 (22.13 ya newer) install karein. Naya PowerShell window kholein.
2. Neeche ke commands run karein. Agar ZIP use kar rahe hain, pehle ZIP extract karein aur extracted `katha-` folder mein PowerShell kholein; clone/cd commands skip karein.

```powershell
git clone https://github.com/mspatel1111/katha-.git
cd katha-
npm.cmd ci
npm.cmd run db:local
npm.cmd run dev
```

Terminal mein jo localhost link aaye use browser mein kholein. Server stop karne ke liye Ctrl+C. Images repo/ZIP mein already optimized hain; normal installation mein dobara image conversion ki zarurat nahi hai.

## Build aur test

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd test
npm.cmd start
```

`npm start` local built preview hai, live website publish nahi karta. `db:local` sirf laptop ka database update karta hai. Production database aur customer orders ZIP mein nahi hain.

## GitHub par future updates

GitHub authentication aapke PC par successful hona zaroori hai. Password/PAT chat mein mat bhejein. Upar diye clone command se banaye gaye folder mein `origin` GitHub repository hota hai. Us copy mein changes karne ke baad:

```powershell
git status
git add .
git commit -m "Update KATHA"
git push origin main
git ls-remote origin refs/heads/main
git rev-parse HEAD
```

Last two commands ki commit IDs match honi chahiye. Agar authentication fail ho, GitHub Desktop mein apne account se sign in karke cloned repository add karein, ya Git ke normal secure browser sign-in flow ko complete karein. Repo ko force-push ya delete nahi karein.

Purana Sites checkout alag history aur Sites `origin` rakhta hai. GitHub import exact source snapshot hai; purane checkout ko GitHub branch par force-push nahi karein. GitHub updates ke liye fresh GitHub clone use karein. ZIP mein Git history nahi hoti.

## Admin aur launch note

Hosted `/admin` ka login abhi Sites-managed owner identity use karta hai; local clone mein normal admin sign-in gateway available nahi hai. GitHub account admin account nahi banata. GitHub Pages is project ka database/API host nahi kar sakta.

Existing live site/access settings is source upload se change nahi hote. Independent Cloudflare hosting ke liye verified authentication, production D1/R2, secrets, migrations/backups aur launch verification alag se chahiye. Real Cashfree payment abhi enable nahi kiya gaya hai. Complete technical details aur safeguards: [README](README.md).
