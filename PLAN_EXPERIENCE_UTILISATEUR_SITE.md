# Plan global d'organisation de l'experience utilisateur (UX)

## 1) Objectif de ce document

Organiser une experience utilisateur coherente sur tout le site CFM, en alignant:
- les intentions utilisateur (demander de l'aide, s'engager, suivre les actions, se connecter),
- les parcours de navigation,
- les pages de contenu,
- et les conversions (adhesion, don, contact, petition, live).

Ce plan est base sur l'analyse des pages visibles cote utilisateur et de leurs liens actuels.

## 2) Cartographie actuelle du site (partie visible)

### Navigation principale
- Accueil (`/`)
- A propos (`/a-propos`)
- Axes (`/axes`)
- Plaidoyer (`/plaidoyer`)
- Actions (`/actions`)
- Petitions (`/petitions`)
- Live (`/live`)
- S'engager (`/s-engager`)
- Presse (`/presse`)
- Contact (`/contact`)
- Espace membre (`/membre/connexion`)

### Navigation secondaire / footer
- A propos
- Plaidoyer
- S'engager
- Confidentialite (`/confidentialite`)
- Mentions legales (`/mentions-legales`)
- Newsletter
- Reseaux sociaux

### Pages detail
- Actualite detail (`/actualites/[slug]`)
- Petition detail (`/petitions/[slug]`)
- Live detail (`/live/[slug]`)

### Espace membre
- Connexion (`/membre/connexion`)
- Inscription (`/membre/inscription`)
- Mot de passe oublie (`/membre/mot-de-passe-oublie`)
- Tableau de bord (`/membre/tableau-de-bord`)
- Profil (`/membre/profil`)

## 3) Analyse globale UX (forces et points a structurer)

### Forces observees
- Architecture de pages riche et complete (institutionnel + action + communaute + live).
- Parcours conversion deja presents: aide, adhesion, don, petition, compte membre.
- Header/footer globalement coherents.
- Bonne base de credibilite: pages legales, presse, transparence.

### Points a structurer pour la coherence
- Plusieurs objectifs coexistent sans hierarchie explicite (aide, don, adhesion, petition, live).
- Certaines ancres/intentions ne sont pas rendues explicites dans le contenu (ex: type de contact en URL).
- La relation entre `Plaidoyer`, `Actualites` et `Petitions` merite une narration plus claire.
- Le parcours membre est present mais son role dans le site n'est pas encore assez "promis" aux visiteurs non connectes.
- Les CTA sont nombreux; il faut les prioriser selon le contexte de page pour eviter la dilution.

## 4) Principes UX directeurs proposes

1. **Un objectif principal par page**  
   Chaque page pousse une action principale unique + une action secondaire.

2. **Progression logique "Decouvrir -> Agir -> Suivre"**  
   - Decouvrir: Accueil, A propos, Axes, Plaidoyer, Actions, Presse  
   - Agir: Contact, S'engager, Petitions, Adhesion, Don  
   - Suivre: Live, Espace membre, Newsletter

3. **Coherence du langage d'action**  
   Standardiser les verbes CTA: `Demander de l'aide`, `Adherer`, `Faire un don`, `Signer une petition`, `Rejoindre le live`, `Se connecter`.

4. **Contexte visible avant formulaire**  
   Sur chaque section formulaire: expliquer "pour qui", "quoi", "delai", "resultat attendu".

5. **Boucles de confiance**  
   Toujours relier action -> preuve -> suivi: transparence, chiffres, temoignages, legal, statut des demandes.

## 5) Architecture cible des parcours utilisateur

## Parcours A - Personne en besoin d'aide
- Entree type: Accueil CTA aide / Contact
- Parcours cible:
  1. `Accueil` -> `Contact#aide`
  2. Comprendre confidentialite + delai de reponse
  3. Soumission formulaire aide
  4. Option creation compte membre pour suivi
  5. Consultation statut via tableau de bord membre

### Ajustement UX cle
- Mettre en avant un mini "A quoi vous attendre" juste avant/au-dessus du formulaire d'aide.

## Parcours B - Soutien/Donateur
- Entree type: Accueil, S'engager, Dashboard membre
- Parcours cible:
  1. `S-engager#don`
  2. Choix montant / devise / moyen paiement
  3. Confirmation de paiement
  4. Orientation vers transparence (`#transparence`) + impact

### Ajustement UX cle
- Clarifier les etapes post-don (recu, confirmation, usage des fonds).

## Parcours C - Candidat adhesion / benevole
- Entree type: S'engager, Header membre
- Parcours cible:
  1. `S-engager` (explication des 3 types)
  2. Choix: `Inscription membre` ou `Adhesion rapide`
  3. Confirmation
  4. Activation espace membre

### Ajustement UX cle
- Eviter la confusion entre "adherer sans compte" et "inscription compte membre" avec un tableau comparatif simple.

## Parcours D - Citoyen mobilise (petition/plaidoyer)
- Entree type: Plaidoyer, Home actualites, Petitions
- Parcours cible:
  1. `Plaidoyer` -> campagne ou actualite
  2. `Petition detail` -> signature
  3. Proposition de rejoindre newsletter / compte membre

### Ajustement UX cle
- Afficher l'impact de signature (objectif, progression, suite de la campagne).

## Parcours E - Audience live
- Entree type: Home live bloc, page Live
- Parcours cible:
  1. `Live` liste -> `Live detail`
  2. Abonnement alertes push
  3. Interaction chat/sondage
  4. Retour vers engagement (petition/don/contact)

### Ajustement UX cle
- Ajouter CTA "Prochaine action" contextualise en bas de live (signer/faire don/s'engager).

## 6) Plan de coherence des liens inter-pages

### Regles de coherence proposees
- Chaque page doit avoir:
  - 1 lien de retour vers son hub parent,
  - 1 CTA action principal,
  - 1 CTA de continuation.

### Matrice simplifiee
- `Accueil` -> aide, engagement, live, plaidoyer
- `A propos` -> transparence, engagement
- `Axes` -> actions, contact
- `Plaidoyer` -> petitions, actualites, contact
- `Actions` -> contact, s'engager
- `Petitions` -> detail petition -> compte membre / newsletter
- `Live` -> live detail -> engagement
- `S-engager` -> inscription, connexion, don, partenariat
- `Contact` -> aide / contact general -> membre si suivi
- `Presse` -> contact presse, a propos

## 7) Priorisation UX (roadmap)

## Phase 1 - Clarifier la proposition de valeur (rapide)
- Definir message principal du site (1 phrase centrale, stable).
- Harmoniser libelles CTA dans toutes les pages.
- Renforcer les "ponts" entre pages proches (Plaidoyer <-> Petitions <-> Actualites).

## Phase 2 - Simplifier les conversions
- Rendre explicite le choix "Inscription compte" vs "Adhesion rapide".
- Standardiser les messages de succes/erreur de formulaires.
- Ajouter les attentes de delai et prochaines etapes apres soumission.

## Phase 3 - Renforcer confiance et suivi
- Mettre en avant transparence/impact apres les actions sensibles (don, aide).
- Structurer un mini parcours "mon suivi" depuis l'espace membre.
- Harmoniser footer legal + contact + preuve sociale.

## Phase 4 - Optimisation continue
- Definir KPI UX (taux clic CTA, completion formulaires, conversion petition->membre, etc.).
- Mettre en place revue mensuelle des parcours et ajustements contenu.

## 8) KPI UX recommandes

- Taux de clic CTA principal par page
- Taux completion formulaires:
  - aide
  - contact
  - adhesion
  - don
- Taux conversion:
  - visiteur -> membre
  - lecteur plaidoyer -> signataire petition
  - live viewer -> action (don/petition/contact)
- Taux retour membre (usage tableau de bord)
- Abonnement newsletter / notifications live

## 9) Standards editoriaux UX

- Ton: empathique, clair, digne, orienté action.
- Structure de page: probleme -> solution CFM -> preuve -> action.
- Microcopy formulaires:
  - champs obligatoires explicites
  - messages d'erreur concrets
  - confirmation avec prochaine etape
- Consistance FR/EN sur les memes intentions d'action.

## 10) Verifications de coherence a faire avant execution

- Verifier que toutes les ancres utilisees dans les CTA correspondent a une section visible.
- Verifier que chaque page de detail renvoie bien vers son hub parent.
- Verifier que le visiteur peut toujours:
  - demander de l'aide en <= 2 clics,
  - faire un don en <= 2 clics,
  - signer une petition en <= 3 clics,
  - acceder a la connexion membre en <= 1 clic.

## 11) Contexte confirme (integre)

- Priorite principale: `Live`
- Public principal: `Mixte`
- Positionnement accueil: `Equilibre credibilite + action`
- Role espace membre: `Mixte (suivi + communaute + gestion)`
- Priorite device: `Equilibre mobile/desktop`

### Implications directes sur l'UX
- Le menu et la home doivent rendre le live visible sans ecraser les autres missions.
- Le site doit parler a plusieurs audiences, avec messages differencies par sections.
- Les CTA live doivent etre relis a l'action (petition, don, adhésion, contact) pour transformer l'audience.
- L'espace membre doit devenir une "plateforme de suivi et participation", pas seulement un espace compte.
- Les choix UX ne doivent pas etre uniquement mobile-first ni desktop-first: meme niveau de clarté sur les deux.

## 12) V2 operationnelle - Blueprint navigation final

### Header (ordre recommande)
- Accueil
- Live (mis en avant visuellement)
- Plaidoyer
- Petitions
- Actions
- S'engager
- A propos
- Contact
- Membre (connexion/profil selon etat)

### Footer (ordre recommande)
- Bloc "Agir maintenant": `Rejoindre live`, `Signer petition`, `Faire un don`
- Liens institutionnels: `A propos`, `Presse`, `Mentions legales`, `Confidentialite`
- Liens relationnels: `Contact`, `Newsletter`, reseaux sociaux
- Mini preuve de confiance: rappel transparence + partenaires

### Regles cross-links globales
- Chaque page inclut:
  - 1 CTA principal (objectif page),
  - 1 CTA secondaire (continuation du parcours),
  - 1 lien de retour contextuel (hub parent).
- Chaque page "contenu" (A propos, Plaidoyer, Actions, Presse) pointe vers au moins 1 action utilisateur.
- Chaque page "action" (Live, Petitions, S'engager, Contact) pointe vers un mecanisme de suivi (membre/newsletter).

## 13) Priorisation CTA page par page (V2)

- `Accueil`: principal `Rejoindre le live`; secondaire `Demander de l'aide`
- `Live`: principal `Rejoindre le live en cours`; secondaire `Signer une petition`
- `Live detail`: principal `Participer (chat/sondage)`; secondaire `Faire un don` ou `S'engager`
- `Plaidoyer`: principal `Signer une petition liee`; secondaire `Contacter CFM`
- `Actualite detail`: principal `Voir la campagne/petition associee`; secondaire `Retour Plaidoyer`
- `Petitions`: principal `Signer`; secondaire `Creer un compte membre`
- `Petition detail`: principal `Valider la signature`; secondaire `Recevoir les prochaines mobilisations`
- `Actions`: principal `Voir les actions de ma province`; secondaire `Demander de l'aide`
- `S-engager`: principal `Choisir son mode d'engagement`; secondaire `Connexion membre`
- `Contact`: principal `Envoyer demande d'aide`; secondaire `Contact general`
- `A propos`: principal `Voir transparence`; secondaire `S'engager`
- `Presse`: principal `Contacter presse`; secondaire `En savoir plus sur CFM`
- `Membre tableau de bord`: principal `Suivre mes demandes`; secondaire `Actions citoyennes (petitions/dons/live)`

## 14) Backlog UX par sprint (execution)

### Sprint 1 (quick wins - 1 a 2 semaines)
- Harmoniser tous les labels CTA selon le lexique unique.
- Mettre `Live` en priorite visuelle dans header + hero home.
- Ajouter un bloc "Prochaine action recommandee" en bas des pages `Live` et `Live detail`.
- Clarifier sur `S-engager` la difference:
  - `Inscription compte membre`
  - `Adhesion rapide`
- Standardiser les messages de confirmation formulaire:
  - accusé de reception,
  - delai de traitement,
  - etape suivante.

### Sprint 2 (coherence parcours - 2 semaines)
- Construire un maillage explicite:
  - `Plaidoyer` -> `Petitions`
  - `Actualites` -> `Petitions/Campagnes`
  - `Live` -> `Petitions`/`Don`
- Ajouter sur `Contact#aide` un encart fixe "confidentialite + delai + suivi".
- Ajouter une section "Pourquoi creer un compte membre ?" apres actions critiques.
- Renforcer la page membre pour qu'elle centralise:
  - suivi aide,
  - historique dons,
  - prochaines actions citoyennes.

### Sprint 3 (preuve et confiance - 2 semaines)
- Renforcer la page `S-engager#transparence` avec preuves d'impact lisibles.
- Ajouter "preuve sociale utile" (temoignages, chiffres) apres conversion live/don/petition.
- Aligner structure narrative de pages:
  - contexte,
  - preuve,
  - action principale,
  - action de continuation.

### Sprint 4 (optimisation continue - mensuel)
- Instrumenter les KPI prioritaires.
- Review mensuelle UX basee sur donnees reels.
- Ajuster CTA/pages sous-performantes selon taux de completion.

## 15) Definition de done (par chantier UX)

- Navigation: aucun parcours critique casse; 100% des liens cibles verifies.
- CTA: chaque page a 1 principal + 1 secondaire, sans ambiguite.
- Formulaires: message succes/erreur coherent et comprehensible.
- Parcours Live: chemin complet live -> action -> suivi disponible.
- Parcours Membre: valeur percue explicite pour visiteur non connecte.

## 16) Matrice de verification finale (pre-production)

- Parcours aide: `Accueil` -> `Contact#aide` -> confirmation -> suivi membre
- Parcours live: `Accueil` -> `Live` -> `Live detail` -> action
- Parcours mobilisation: `Plaidoyer` -> `Petition detail` -> signature
- Parcours engagement: `S-engager` -> choix canal -> confirmation
- Parcours confiance: action effectuee -> transparence/preuve -> prochaine etape

## 17) Risques UX et garde-fous

- Risque: surcharge CTA -> Garde-fou: 1 CTA principal/page.
- Risque: Live capte tout -> Garde-fou: CTA secondaire adapte au contexte de mission.
- Risque: confusion adhesion/inscription -> Garde-fou: comparaison explicite des 2 chemins.
- Risque: perte de contexte apres action -> Garde-fou: ecran de continuation systematique.

## 18) Plan de gouvernance UX

- Revue hebdomadaire (produit + contenu + operationnel) sur:
  - pages les plus visitees,
  - formulaires critiques,
  - conversions live vers action.
- Revue mensuelle avec decision de priorites:
  - conserver,
  - iterer,
  - supprimer.

---

## 19) V3 ultra-actionnable — Checklist execution equipe

### Legende

| Champ | Signification |
|-------|---------------|
| **P1** | Critique — bloque la coherence UX ou la priorite Live |
| **P2** | Important — ameliore conversion et clarte |
| **P3** | Utile — optimisation et polish |
| **Owner** | Role recommande (adapter a votre equipe reelle) |

**Owners types :**
- `UX/Produit` — arbitrage, copy, priorisation
- `Frontend` — pages, composants, navigation
- `Contenu` — textes, i18n, CMS admin
- `Ops` — live, formulaires, suivi operationnel
- `QA` — verification parcours

---

### Sprint 1 — Quick wins (semaine 1-2)

| ID | Ticket | P | Owner | Pages / fichiers | Criteres d'acceptation |
|----|--------|---|-------|------------------|------------------------|
| UX-001 | Harmoniser le lexique CTA sur tout le site | P1 | Contenu + Frontend | `Header`, `Footer`, `page.tsx` (home), i18n `fr.json` / `en.json` | Tous les CTA utilisent exclusivement : `Demander de l'aide`, `Adherer`, `Faire un don`, `Signer une petition`, `Rejoindre le live`, `Se connecter` |
| UX-002 | Mettre Live en evidence dans le header | P1 | Frontend | `Header.tsx` | Item Live visuellement distinct (badge, couleur ou position) ; ordre nav conforme section 12 |
| UX-003 | Inverser CTA hero accueil : Live principal, Aide secondaire | P1 | Frontend + Contenu | `src/app/(site)/page.tsx` | Hero : CTA 1 = live (ou live actif), CTA 2 = aide ; libelles i18n mis a jour |
| UX-004 | Bloc "Prochaine action" en bas de `/live` | P1 | Frontend + Contenu | `live/page.tsx` | Section avec 2 boutons : petition + don ou s'engager ; visible sans scroll excessif mobile |
| UX-005 | Bloc "Prochaine action" en bas de `/live/[slug]` | P1 | Frontend + Contenu | `live/[slug]/page.tsx` | Meme logique que UX-004 ; CTA contextualise selon evenement actif |
| UX-006 | Tableau comparatif Inscription vs Adhesion rapide | P1 | Frontend + Contenu | `s-engager/page.tsx` | Tableau 3 colonnes : objectif, delai, suivi ; liens vers `/membre/inscription` et `#adhesion` |
| UX-007 | Messages succes formulaires standardises | P2 | Frontend + Contenu | `HelpRequestForm`, `ContactForm`, `MembershipForm`, `DonationForm`, `PetitionSignForm` | Chaque succes affiche : accusé, delai, etape suivante (lien si pertinent) |
| UX-008 | Verifier ancres CTA existantes | P1 | QA | Toutes pages avec `#` | `#aide`, `#don`, `#transparence`, `#adhesion`, `#partenaire` existent et sont visibles (`scroll-mt` OK) |

**Checklist Sprint 1 (cocher a la livraison) :**
- [x] UX-001
- [x] UX-002
- [x] UX-003
- [x] UX-004
- [x] UX-005
- [x] UX-006
- [x] UX-007
- [x] UX-008

---

### Sprint 2 — Coherence parcours (semaine 3-4)

| ID | Ticket | P | Owner | Pages / fichiers | Criteres d'acceptation |
|----|--------|---|-------|------------------|------------------------|
| UX-009 | Pont Plaidoyer → Petitions en haut de page | P1 | Frontend + Contenu | `plaidoyer/page.tsx` | Bandeau ou lien visible "Voir toutes les petitions" vers `/petitions` |
| UX-010 | CTA campagne sur fiche actualite | P2 | Frontend + Contenu | `actualites/[slug]/page.tsx` | Si campagne/petition liee en base : CTA principal vers petition ; sinon CTA vers plaidoyer |
| UX-011 | Encart confidentialite + delai sur Contact#aide | P1 | Frontend + Contenu | `contact/page.tsx`, `HelpRequestForm.tsx` | Encart fixe au-dessus du formulaire : confidentialite, delai 7 jours, option suivi membre |
| UX-012 | Section "Pourquoi un compte membre ?" post-signature petition | P2 | Frontend + Contenu | `petitions/[slug]/page.tsx` | Apres succes signature : bloc avec lien inscription + benefices (suivi, mobilisations) |
| UX-013 | Section "Pourquoi un compte membre ?" post-adhesion rapide | P2 | Frontend + Contenu | `s-engager/page.tsx` ou `MembershipForm` | Apres succes : invitation a creer compte pour suivi |
| UX-014 | Dashboard membre : bloc "Prochaines actions citoyennes" | P1 | Frontend + Contenu | `MemberDashboard.tsx` | Carte dediee : liens live actif, petitions ouvertes, don ; visible comptes actifs |
| UX-015 | Footer : bloc "Agir maintenant" | P2 | Frontend + Contenu | `Footer.tsx` | 3 liens : Live, Petitions, Don (`/s-engager#don`) ; au-dessus des liens institutionnels |
| UX-016 | Reordonner navigation header selon blueprint | P2 | Frontend | `Header.tsx` | Ordre section 12 ; Axes/Presse accessibles (footer ou sous-menu si surcharge) |
| UX-017 | Contact presse : pre-remplir type partenariat | P3 | Frontend | `contact/page.tsx`, `ContactForm.tsx` | Query `?type=partenariat` depuis `s-engager#partenaire` preselectionne le type |

**Checklist Sprint 2 :**
- [x] UX-009
- [x] UX-010
- [x] UX-011
- [x] UX-012
- [x] UX-013
- [x] UX-014
- [x] UX-015
- [x] UX-016
- [x] UX-017

---

### Sprint 3 — Confiance et preuve (semaine 5-6)

| ID | Ticket | P | Owner | Pages / fichiers | Criteres d'acceptation |
|----|--------|---|-------|------------------|------------------------|
| UX-018 | Renforcer `#transparence` avec impact lisible | P2 | Contenu + Frontend | `s-engager/page.tsx`, `DonationTransparency.tsx` | Chiffres ou graphique + texte "a quoi servent vos dons" ; lien depuis A propos conserve |
| UX-019 | CTA transparence + engagement sur A propos | P2 | Frontend | `a-propos/page.tsx` | Aside ou fin de page : 2 CTA conformes section 13 |
| UX-020 | CTA province + aide sur Actions | P2 | Frontend + Contenu | `ActionsPageClient.tsx` | Bandeau sous la carte : "Besoin d'aide dans votre province ?" → `/contact#aide` |
| UX-021 | CTA axes → actions sur page Axes | P3 | Frontend | `axes/page.tsx` | Fin de page : lien vers `/actions` et `/contact#aide` |
| UX-022 | Ecran continuation post-don (demo + prod) | P2 | Frontend + Ops | `DonationForm.tsx`, page retour paiement si existe | Apres paiement : message impact + liens transparence + membre |
| UX-023 | Newsletter apres conversion live | P2 | Frontend | `live/[slug]/page.tsx` | Bloc newsletter ou push en fin de page live (en plus du bouton existant) |
| UX-024 | Aligner structure narrative 4 blocs | P3 | Contenu | Plaidoyer, Actions, Presse, S'engager | Chaque page suit : contexte → preuve → action → continuation |
| UX-025 | i18n FR/EN : parite des CTA et microcopy | P2 | Contenu | Dictionnaires i18n | Memes intentions d'action dans les 2 langues ; revue par native si possible |

**Checklist Sprint 3 :**
- [x] UX-018
- [x] UX-019
- [x] UX-020
- [x] UX-021
- [x] UX-022
- [x] UX-023
- [ ] UX-024
- [x] UX-025

---

### Sprint 4 — Mesure et optimisation (continu)

| ID | Ticket | P | Owner | Pages / fichiers | Criteres d'acceptation |
|----|--------|---|-------|------------------|------------------------|
| UX-026 | Instrumenter clics CTA principaux | P1 | Frontend + Ops | Events sur boutons critiques | Events nommes : `cta_live`, `cta_aide`, `cta_don`, `cta_petition`, `cta_adhesion` |
| UX-027 | Dashboard KPI UX mensuel | P2 | Ops + UX/Produit | Notion/Sheet ou admin | 5 metriques section 8 suivies chaque mois |
| UX-028 | Test parcours critiques pre-release | P1 | QA | Matrice section 16 | 5 parcours passes sur mobile + desktop avant chaque release |
| UX-029 | Revue pages sous-performantes | P3 | UX/Produit | Donnees analytics | 1 iteration/mois sur la page au plus faible taux de completion formulaire |
| UX-030 | Audit liens morts et ancres | P2 | QA | Site complet | 0 lien interne casse ; 100% ancres `#` valides |

**Checklist Sprint 4 :**
- [x] UX-026
- [ ] UX-027
- [ ] UX-028
- [ ] UX-029
- [ ] UX-030

---

## 20) Matrice owner x domaine (qui fait quoi)

| Domaine | Owner principal | Support |
|---------|-----------------|---------|
| Navigation / Header / Footer | Frontend | UX/Produit valide l'ordre |
| Copy / CTA / i18n | Contenu | UX/Produit valide le lexique |
| Formulaires et confirmations | Frontend | Ops valide delais reels |
| Live et conversion audience | Ops | Frontend implemente les blocs |
| Espace membre | Frontend | Ops valide parcours suivi |
| Transparence / preuve sociale | Contenu | Admin CMS alimente les donnees |
| QA parcours | QA | UX/Produit fournit la matrice |

---

## 21) Ordre d'execution recommande (si ressources limitees)

**Semaine 1 (minimum viable coherence) :**
1. UX-008 (verifier ancres)
2. UX-001 (lexique CTA)
3. UX-002 + UX-003 (Live visible)
4. UX-004 + UX-005 (prochaine action live)

**Semaine 2 :**
5. UX-006 (inscription vs adhesion)
6. UX-011 (encart aide)
7. UX-014 (dashboard membre actions)

**Semaine 3-4 :**
8. UX-009, UX-015, UX-016 (maillage + footer + nav)
9. UX-007, UX-012, UX-013 (confirmations + compte membre)

**Ensuite :** Sprint 3 et 4 selon capacite.

---

## 22) Template ticket (copier-coller pour votre outil)

```markdown
### [UX-XXX] Titre du ticket

**Priorite:** P1 | P2 | P3
**Sprint:** 1 | 2 | 3 | 4
**Owner:** Frontend | Contenu | Ops | QA | UX/Produit

**Contexte:**
Pourquoi ce ticket existe (lien avec priorite Live / public mixte).

**Perimetre:**
- Fichiers: ...
- Pages: ...

**Taches:**
- [ ] ...
- [ ] ...

**Criteres d'acceptation:**
- [ ] ...
- [ ] ...

**Tests manuels:**
1. ...
2. ...

**Dependances:** UX-XXX (si applicable)
```

---

## 23) Synthese V3 — 30 tickets, 4 sprints

| Sprint | Tickets | P1 | P2 | P3 |
|--------|---------|----|----|-----|
| S1 | UX-001 → UX-008 | 6 | 1 | 1 |
| S2 | UX-009 → UX-017 | 3 | 5 | 1 |
| S3 | UX-018 → UX-025 | 0 | 6 | 2 |
| S4 | UX-026 → UX-030 | 2 | 2 | 1 |
| **Total** | **30** | **11** | **14** | **5** |

**Point de depart immediat :** lancer UX-008, UX-001, UX-002, UX-003 en parallele (1-2 jours, impact maximal sur coherence Live + navigation).
