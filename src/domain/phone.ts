/**
 * Normalisation des numéros de téléphone (RDC) vers la forme E.164.
 *
 * Module VOLONTAIREMENT PUR : aucun import, pas d'alias `@/`, pas de
 * `server-only`. C'est la condition pour qu'un SEUL algorithme serve partout —
 * schémas Zod, deux branches du repository (PG et JSON), composant client
 * d'inscription, script de backfill (via `tsx`) et tests. Il n'existe donc
 * jamais de « version SQL » de la normalisation, seule protection réelle contre
 * la dérive entre la colonne `phone_e164` et cette fonction.
 *
 * Le brut n'est jamais perdu : `users.phone` conserve la saisie d'origine ;
 * `users.phone_e164` reçoit cette forme canonique (ou reste NULL).
 *
 * Parti pris : STRICT. On refuse plutôt que de deviner. Un numéro tapé de
 * travers, accepté en silence, produit un membre qui ne pourra jamais se
 * connecter et que personne ne pourra diagnostiquer. Un refus immédiat, sous le
 * champ, se corrige en trois secondes avec la fiche papier sous les yeux.
 */

/**
 * Normalise un numéro saisi en RDC vers E.164, ou `null` s'il est inexploitable.
 *
 * Accepte : formes locales (`0812345678`, `812345678`), indicatif `243…`,
 * composition internationale (`00243…`, `011243…`, `+243…`), le zéro de transit
 * résiduel (`+243 0 81…`), les séparateurs usuels (espace, point, tiret,
 * parenthèses, barre, espaces insécables) et les numéros de la diaspora (repris
 * tels quels, sans validation du plan de numérotation étranger).
 *
 * Refuse : lettres/annotations (`0812… (papa)`, `O81…`), fixes RDC (préfixe
 * autre que 8/9), longueurs incorrectes, chiffres non ASCII.
 */
export function normalizePhoneRdc(raw: string | null | undefined): string | null {
  if (typeof raw !== "string") return null;

  // 1. Retirer les séparateurs de saisie usuels. `\s` couvre déjà en JS les
  //    espaces insécables et fines : inutile de les lister à la main.
  let s = raw.trim().replace(/[\s.()/-]/g, "");

  // Une lettre restante trahit une annotation (« … (papa) ») ou une confusion
  // O/0 : on refuse, pour que l'opérateur corrige plutôt qu'on ne devine. Le
  // « + » de tête n'est pas une lettre et reste toléré.
  if (/[a-z]/i.test(s)) return null;

  const plus = s.startsWith("+");
  s = s.replace(/\D/g, "");
  if (!s) return null;

  // 2. Préfixes de composition internationale.
  let intl = plus;
  if (!intl && s.startsWith("00")) {
    s = s.slice(2);
    intl = true;
  } else if (!intl && s.startsWith("011")) {
    s = s.slice(3);
    intl = true;
  }

  let nsn: string;
  if (intl) {
    if (s.startsWith("243")) {
      nsn = s.slice(3);
    } else {
      // Diaspora (Belgique, Afrique du Sud, France…) : accepté tel quel, sans
      // validation d'un plan de numérotation étranger.
      return s.length >= 8 && s.length <= 15 ? `+${s}` : null;
    }
  } else if (s.startsWith("243") && s.length === 12) {
    nsn = s.slice(3);
  } else if (s.startsWith("0") && s.length === 10) {
    nsn = s.slice(1);
  } else if (s.length === 9) {
    nsn = s;
  } else {
    return null;
  }

  // 3. Zéro de transit résiduel (« +243 0 81 … »), faute de saisie fréquente.
  if (nsn.length === 10 && nsn.startsWith("0")) nsn = nsn.slice(1);

  // 4. Plan RDC mobile : 9 chiffres commençant par 8 ou 9.
  return /^[89]\d{8}$/.test(nsn) ? `+243${nsn}` : null;
}
