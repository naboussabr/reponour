# Suivi Assistante Maternelle

Application web de suivi des presences et de facturation mensuelle pour une
assistante maternelle agreee, consultable en ligne par les parents.

## Fonctionnalites

- **Espace assistante maternelle** (prive, protege par identifiants) :
  - Fiche par enfant garde (parent, contrat, tarifs).
  - Calendrier mensuel cliquable pour saisir chaque jour : present (avec
    heures et repas fourni), absent, conge, ferie, maladie.
  - Contrat configurable : facturation horaire ou mensualisee, taux horaire,
    indemnite de repas par jour, indemnite d'entretien par jour ou forfait
    mensuel, planning hebdomadaire habituel (pour pre-remplir les heures).
  - Generation automatique de la facture/note de frais mensuelle detaillant
    frais de garde, frais de repas et frais d'entretien, avec suivi de
    statut (brouillon / envoyee / payee) et impression / export PDF via le
    navigateur.
  - Lien personnel + code PIN a transmettre a chaque parent.

- **Espace parent** (en ligne, lecture seule, sans creation de compte) :
  - Acces via un lien unique par enfant + code PIN a 4 chiffres.
  - Visualisation du calendrier de presences / absences / conges du mois.
  - Visualisation et impression de la facture mensuelle (garde, repas,
    entretien, total).

## Stack technique

- [Next.js 14](https://nextjs.org/) (App Router) + TypeScript
- [Prisma](https://www.prisma.io/) + SQLite (facilement remplacable par
  PostgreSQL en production, cf. plus bas)
- Tailwind CSS
- Sessions par cookie signe (JWT via `jose`), mots de passe haches avec
  `bcryptjs`

## Installation locale

Prerequis : Node.js 18+.

```bash
npm install
cp .env.example .env
# Editez .env : SESSION_SECRET (chaine aleatoire longue),
# ADMIN_EMAIL / ADMIN_PASSWORD / ADMIN_NAME pour le premier compte.

npx prisma db push      # cree la base SQLite locale (dev.db)
npm run prisma:seed     # cree le compte assistante maternelle

npm run dev             # http://localhost:3000
```

Connectez-vous sur `/login` avec l'email/mot de passe definis dans `.env`,
puis ajoutez vos premiers enfants depuis le tableau de bord `/admin`.

## Calcul de la facturation

Pour chaque enfant, un contrat definit :

- **Frais de garde** : soit au reel (heures presentes x taux horaire), soit
  mensualise (salaire mensuel fixe, avec deduction proportionnelle en cas
  d'absence non justifiee, sur la base du planning hebdomadaire).
- **Frais de repas** : indemnite par jour de presence ou un repas a ete
  fourni.
- **Frais d'entretien** : indemnite par jour de presence, ou un forfait
  mensuel fixe si renseigne dans le contrat.

Le detail du calcul est affiche sur la facture, pour une transparence totale
avec les parents.

## Deploiement en ligne

Le plus simple est [Vercel](https://vercel.com/) (createur de Next.js) :

1. Poussez ce depot sur GitHub/GitLab et importez-le dans Vercel.
2. Remplacez la base SQLite par une base PostgreSQL geree (Vercel Postgres,
   Neon, Supabase...) : changez `provider = "sqlite"` en `"postgresql"`
   dans `prisma/schema.prisma` et definissez `DATABASE_URL` en consequence.
3. Definissez les variables d'environnement `DATABASE_URL`,
   `SESSION_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME`.
4. Lancez les migrations (`npx prisma migrate deploy`) et le seed lors du
   premier deploiement.

L'application fonctionne aussi sur tout hebergeur Node.js classique
(`npm run build` puis `npm run start`).

## Securite

- Chaque enfant a un lien d'acces parent unique (`accessToken`) et un code
  PIN a 4 chiffres, regenerable a tout moment depuis l'espace admin.
- Les sessions parent et admin sont des cookies HTTP-only signes,
  independantes les unes des autres.
- L'application n'utilise pas `next/image` ni l'API d'optimisation d'images
  de Next.js ; l'avis de securite concernant cette fonctionnalite (present
  dans `npm audit` sur certaines versions de Next.js/PostCSS) ne s'applique
  donc pas a l'usage reel de cette application. Pensez neanmoins a garder
  les dependances a jour (`npm outdated`, `npm audit`).
- Pensez a changer `SESSION_SECRET` et le mot de passe admin par defaut
  avant toute mise en ligne.
