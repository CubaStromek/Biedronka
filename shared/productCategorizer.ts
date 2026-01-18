/**
 * Auto-kategorizace produktů podle názvu
 * Pravidla pro polské názvy produktů z Biedronky
 */

interface CategoryRule {
  pattern: RegExp;
  category: string;
}

const categoryRules: CategoryRule[] = [
  // Mléčné výrobky
  {
    pattern: /mleko|jogurt|serek|ser\b|maslo|smiet|kefir|twarog|roz|actimel|danone|activia|kremow/i,
    category: "Mléčné výrobky"
  },
  // Maso a uzeniny
  {
    pattern: /kurczak|kurz|wieprzow|wolow|mieso|kielb|szynk|bekon|filet|poled|drob|indyk|salami|parowk|kabanos|pasztet|mortadel/i,
    category: "Maso"
  },
  // Ryby
  {
    pattern: /ryb|losos|tunczyk|dorsz|makrela|sledz|karp|pstrag|krewet|frosta/i,
    category: "Ryby"
  },
  // Zelenina
  {
    pattern: /ziemniak|marchew|cebul|czosn|pomidor|ogor|salat|szpinak|kapust|papryka|brokul|kalafior|buraki|fasol|groch|seler|por|rzodkiew|dynia|cukinia|baklazan/i,
    category: "Zelenina"
  },
  // Ovoce
  {
    pattern: /jabłk|jablk|banan|pomarancz|trusk|malin|owoc|gruszk|sliwk|winogrono|cytryn|grejpfrut|mandarynk|kiwi|arbuz|melon|brzoskwin|nektaryn|czeresn|wisn|agrest|porzeczk|ananas|mango/i,
    category: "Ovoce"
  },
  // Pečivo
  {
    pattern: /chleb|bulka|bagiet|ciast|wafl|rogal|drozd|paczek|croissant|tort|biszkopt|makowiec|sernik|pieczywo/i,
    category: "Pečivo"
  },
  // Nápoje
  {
    pattern: /sok\b|woda|napoj|kawa|herbat|cola|pepsi|fanta|sprite|piwo|wino|nektar|lemoniada|ice tea|redbull|monster|tymbark|hortex|cappy/i,
    category: "Nápoje"
  },
  // Těstoviny a obiloviny
  {
    pattern: /makaron|spaghet|penne|ryz|kasza|płatki|musli|owsian|kukurydz|pasta|tagliatelle|fusilli|farfalle/i,
    category: "Těstoviny"
  },
  // Konzervy a omáčky
  {
    pattern: /ketchup|sos|majonez|musztarda|ocet|olej|oliwa|passata|koncentrat|konserw|puszk/i,
    category: "Konzervy a omáčky"
  },
  // Sladkosti a svačiny
  {
    pattern: /czekol|czekolad|baton|cukier|cukrowy|landryn|żelek|gumowe|ptasie|wafelek|snickers|mars|twix|kit kat|milka|wedel|oreo|ciastko|herbatnik|krakow|crisp|chips|chrup/i,
    category: "Sladkosti"
  },
  // Mražené výrobky
  {
    pattern: /mroz|lody|zamroz|frozen|fryt|pyzy|pierogi|pizza/i,
    category: "Mražené výrobky"
  },
  // Koření a dochucovadla
  {
    pattern: /przyprawa|pieprz|sol\b|kurkuma|papryka miel|oregano|bazylia|tymianek|cynamon|imbir|curry|kminek|majeran|rosmar|bulion/i,
    category: "Koření"
  },
  // Drogerie
  {
    pattern: /szampon|mydlo|proszek|plyn|papier|chusteczk|tampon|podpask|pasta do|szczoteczk|dezodorant|krem|balsam|zel|plukank/i,
    category: "Drogerie"
  },
  // Vejce
  {
    pattern: /jaj|jaja/i,
    category: "Vejce"
  },
];

/**
 * Automaticky přiřadí kategorii produktu na základě jeho názvu
 * @param name Název produktu (polsky)
 * @returns Kategorie produktu nebo undefined pokud nelze určit
 */
export function categorizeProduct(name: string): string | undefined {
  const normalizedName = name.toLowerCase().trim();

  for (const rule of categoryRules) {
    if (rule.pattern.test(normalizedName)) {
      return rule.category;
    }
  }

  return undefined;
}

/**
 * Seznam všech dostupných kategorií
 */
export const availableCategories = [
  "Mléčné výrobky",
  "Maso",
  "Ryby",
  "Zelenina",
  "Ovoce",
  "Pečivo",
  "Nápoje",
  "Těstoviny",
  "Konzervy a omáčky",
  "Sladkosti",
  "Mražené výrobky",
  "Koření",
  "Drogerie",
  "Vejce",
] as const;

export type ProductCategory = typeof availableCategories[number];
