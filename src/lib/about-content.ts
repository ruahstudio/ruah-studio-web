import type { Lang } from "@/i18n";

/**
 * Founder narrative for /about.
 *
 * Deliberately kept out of the i18n dictionaries: those hold short interface
 * strings, and a long first-person story doesn't belong beside "Next" and
 * "Back".
 *
 * Spanish is the original — it is how John actually wrote it. Every other
 * language is a rendering of that meaning rather than a word-for-word
 * translation, because the voice matters more here than literal fidelity.
 * Previously only ES and EN existed and the other five fell back to English,
 * so a French or Arabic visitor read a translated site with an untranslated
 * founder story in the middle of it.
 */

export type AboutCopy = {
  heroLine: string;
  heroAccent: string;
  lede: string;
  roles: string[];
  storyTitle: string;
  story: string[];
  pullQuote: string;
  meaningTitle: string;
  meaning: string[];
  principlesTitle: string;
  principles: { n: string; title: string; body: string }[];
  ctaTitle: string;
  ctaBody: string;
};

const ES: AboutCopy = {
  heroLine: "Fui hecho",
  heroAccent: "para crear.",
  lede: "Soy John, fundador de Ruah Studio. Construyo IA, software y sistemas digitales a la medida — soluciones reales para problemas reales.",
  roles: ["Fundador", "Ingeniero", "Constructor de producto", "Arquitecto de sistemas"],

  storyTitle: "Cómo empezó esto",
  story: [
    "Tengo 19 años y empecé a construir desde donde muchos dirían que no se puede: desde Venezuela, con más determinación que recursos, aprendiendo por mi cuenta lo que hacía falta para crear lo que todavía no existía.",
    "No heredé un camino hecho. Lo fui levantando línea por línea, sistema por sistema. Aprendí a programar, a automatizar procesos, a integrar inteligencia artificial y a construir plataformas completas resolviendo problemas reales — primero los míos, luego los de otros.",
    "Cada limitación se volvió un motivo para mejorar: si no tenía la herramienta, la creaba; si no sabía, lo aprendía; si algo se caía, me levantaba y lo volvía a hacer, mejor.",
    "De ahí nació Ruah Studio: un estudio de IA, software y sistemas digitales para que empresas y personas dejen de perder tiempo en lo repetitivo y trabajen con herramientas hechas a su medida. No entrego plantillas genéricas — construyo cada solución como si el negocio fuera mío, porque sé lo que cuesta cada resultado.",
  ],

  pullQuote:
    "Si no tenía la herramienta, la creaba. Si no sabía, lo aprendía. Si algo se caía, lo volvía a hacer, mejor.",

  meaningTitle: "Qué significa Ruah",
  meaning: [
    "Ruah significa aliento, espíritu, soplo de vida.",
    "Para mí es el recordatorio de que todo lo que construyo lo hago con propósito y con excelencia: no solo para que funcione, sino para que transforme.",
  ],

  principlesTitle: "Cómo trabajo",
  principles: [
    {
      n: "01",
      title: "El problema va antes que el stack",
      body: "Elegir framework es fácil. Saber qué no construir es lo difícil, y es donde se pierden la mayoría de los presupuestos.",
    },
    {
      n: "02",
      title: "El software aburrido gana",
      body: "Los sistemas que sobreviven son los que alguien todavía puede mantener en dos años. Lo ingenioso es un pasivo.",
    },
    {
      n: "03",
      title: "Hablas con quien lo construye",
      body: "Sin capa de gestión de cuentas, sin traspaso a un junior después de firmar. La persona de la primera llamada es la que escribe el código.",
    },
    {
      n: "04",
      title: "Publicar y después medir",
      body: "Un sistema funcionando en producción enseña más en una semana que una especificación en un mes.",
    },
  ],

  ctaTitle: "Construyamos algo que valga la pena.",
  ctaBody:
    "Si buscas a alguien que no solo programe, sino que entienda tu visión y la convierta en un sistema real, estás en el lugar correcto. Cuéntame qué proceso te está costando tiempo.",
};

const EN: AboutCopy = {
  heroLine: "I was made",
  heroAccent: "to build.",
  lede: "I'm John, founder of Ruah Studio. I build AI, software and digital systems made to measure — real solutions for real problems.",
  roles: ["Founder", "Engineer", "Product builder", "System architect"],

  storyTitle: "How this started",
  story: [
    "I'm 19, and I started building from a place many would say you can't: from Venezuela, with more determination than resources, teaching myself whatever it took to create what didn't exist yet.",
    "I didn't inherit a path. I built it line by line, system by system. I learned to program, to automate processes, to integrate AI and to ship whole platforms by solving real problems — mine first, then other people's.",
    "Every limitation became a reason to get better: if I didn't have the tool, I built it; if I didn't know, I learned it; if something broke, I got back up and did it again, better.",
    "Ruah Studio came out of that: a studio for AI, software and digital systems, so businesses and people stop losing time on repetitive work and start using tools built for them. I don't hand over generic templates — I build every solution as if the business were mine, because I know what each result costs.",
  ],

  pullQuote:
    "If I didn't have the tool, I built it. If I didn't know, I learned it. If something broke, I did it again, better.",

  meaningTitle: "What Ruah means",
  meaning: [
    "Ruah means breath, spirit, the breath of life.",
    "For me it's the reminder that everything I build is made with purpose and with excellence: not just so it works, but so it changes something.",
  ],

  principlesTitle: "How I work",
  principles: [
    {
      n: "01",
      title: "The problem comes before the stack",
      body: "Choosing a framework is easy. Knowing what not to build is the hard part, and it is where most budgets are lost.",
    },
    {
      n: "02",
      title: "Boring software wins",
      body: "The systems that survive are the ones somebody can still maintain in two years. Clever is a liability.",
    },
    {
      n: "03",
      title: "You talk to the person building it",
      body: "No account layer, no handoff to a junior after the contract is signed. The person in the first call writes the code.",
    },
    {
      n: "04",
      title: "Ship, then measure",
      body: "A working system in production teaches more in a week than a specification does in a month.",
    },
  ],

  ctaTitle: "Let's build something worth building.",
  ctaBody:
    "If you're looking for someone who doesn't just write code, but understands your vision and turns it into a real system, you're in the right place. Tell me which process is costing you time.",
};

const PT: AboutCopy = {
  heroLine: "Eu fui feito",
  heroAccent: "para criar.",
  lede: "Sou o John, fundador do Ruah Studio. Construo IA, software e sistemas digitais sob medida — soluções reais para problemas reais.",
  roles: ["Fundador", "Engenheiro", "Construtor de produto", "Arquiteto de sistemas"],

  storyTitle: "Como isto começou",
  story: [
    "Tenho 19 anos e comecei a construir de um lugar onde muitos diriam que não dá: da Venezuela, com mais determinação do que recursos, aprendendo por conta própria o que fosse preciso para criar o que ainda não existia.",
    "Não herdei um caminho pronto. Fui levantando linha por linha, sistema por sistema. Aprendi a programar, a automatizar processos, a integrar inteligência artificial e a construir plataformas inteiras resolvendo problemas reais — primeiro os meus, depois os dos outros.",
    "Cada limitação virou um motivo para melhorar: se eu não tinha a ferramenta, eu criava; se não sabia, eu aprendia; se algo caía, eu levantava e fazia de novo, melhor.",
    "Foi daí que nasceu o Ruah Studio: um estúdio de IA, software e sistemas digitais para que empresas e pessoas parem de perder tempo com o repetitivo e trabalhem com ferramentas feitas sob medida. Não entrego templates genéricos — construo cada solução como se o negócio fosse meu, porque sei quanto custa cada resultado.",
  ],

  pullQuote:
    "Se eu não tinha a ferramenta, eu criava. Se não sabia, eu aprendia. Se algo caía, eu fazia de novo, melhor.",

  meaningTitle: "O que significa Ruah",
  meaning: [
    "Ruah significa sopro, espírito, fôlego de vida.",
    "Para mim é o lembrete de que tudo o que construo é feito com propósito e com excelência: não só para funcionar, mas para transformar.",
  ],

  principlesTitle: "Como eu trabalho",
  principles: [
    {
      n: "01",
      title: "O problema vem antes do stack",
      body: "Escolher framework é fácil. Saber o que não construir é a parte difícil, e é onde a maioria dos orçamentos se perde.",
    },
    {
      n: "02",
      title: "Software chato vence",
      body: "Os sistemas que sobrevivem são os que alguém ainda consegue manter daqui a dois anos. Ser engenhoso é um passivo.",
    },
    {
      n: "03",
      title: "Você fala com quem constrói",
      body: "Sem camada de gestão de contas, sem repasse para um júnior depois de assinar. A pessoa da primeira call é quem escreve o código.",
    },
    {
      n: "04",
      title: "Publicar e depois medir",
      body: "Um sistema rodando em produção ensina mais em uma semana do que uma especificação em um mês.",
    },
  ],

  ctaTitle: "Vamos construir algo que valha a pena.",
  ctaBody:
    "Se você procura alguém que não só programe, mas entenda sua visão e a transforme num sistema real, está no lugar certo. Me conta qual processo está custando o seu tempo.",
};

const FR: AboutCopy = {
  heroLine: "J'ai été fait",
  heroAccent: "pour créer.",
  lede: "Je suis John, fondateur de Ruah Studio. Je construis de l'IA, des logiciels et des systèmes numériques sur mesure — de vraies solutions à de vrais problèmes.",
  roles: ["Fondateur", "Ingénieur", "Bâtisseur de produit", "Architecte système"],

  storyTitle: "Comment tout a commencé",
  story: [
    "J'ai 19 ans et j'ai commencé à construire depuis un endroit d'où beaucoup diraient que c'est impossible : depuis le Venezuela, avec plus de détermination que de moyens, en apprenant seul tout ce qu'il fallait pour créer ce qui n'existait pas encore.",
    "Je n'ai pas hérité d'un chemin tout tracé. Je l'ai bâti ligne par ligne, système par système. J'ai appris à programmer, à automatiser des processus, à intégrer l'intelligence artificielle et à livrer des plateformes entières en résolvant de vrais problèmes — les miens d'abord, puis ceux des autres.",
    "Chaque limite est devenue une raison de progresser : si je n'avais pas l'outil, je le créais ; si je ne savais pas, je l'apprenais ; si quelque chose cassait, je me relevais et je le refaisais, en mieux.",
    "C'est de là qu'est né Ruah Studio : un studio d'IA, de logiciels et de systèmes numériques, pour que les entreprises et les personnes cessent de perdre du temps sur le répétitif et travaillent avec des outils faits pour elles. Je ne livre pas de gabarits génériques — je construis chaque solution comme si l'entreprise était la mienne, parce que je sais ce que coûte chaque résultat.",
  ],

  pullQuote:
    "Si je n'avais pas l'outil, je le créais. Si je ne savais pas, je l'apprenais. Si quelque chose cassait, je le refaisais, en mieux.",

  meaningTitle: "Ce que signifie Ruah",
  meaning: [
    "Ruah signifie souffle, esprit, souffle de vie.",
    "Pour moi, c'est le rappel que tout ce que je construis est fait avec intention et exigence : pas seulement pour que ça marche, mais pour que ça change quelque chose.",
  ],

  principlesTitle: "Ma façon de travailler",
  principles: [
    {
      n: "01",
      title: "Le problème passe avant la stack",
      body: "Choisir un framework est facile. Savoir ce qu'il ne faut pas construire est la vraie difficulté, et c'est là que la plupart des budgets se perdent.",
    },
    {
      n: "02",
      title: "Le logiciel ennuyeux gagne",
      body: "Les systèmes qui survivent sont ceux que quelqu'un peut encore maintenir dans deux ans. L'ingéniosité est un passif.",
    },
    {
      n: "03",
      title: "Vous parlez à celui qui construit",
      body: "Pas de couche de gestion de compte, pas de transfert à un junior après la signature. La personne du premier appel est celle qui écrit le code.",
    },
    {
      n: "04",
      title: "Livrer, puis mesurer",
      body: "Un système en production apprend plus en une semaine qu'un cahier des charges en un mois.",
    },
  ],

  ctaTitle: "Construisons quelque chose qui en vaut la peine.",
  ctaBody:
    "Si vous cherchez quelqu'un qui ne se contente pas de coder, mais qui comprend votre vision et la transforme en système réel, vous êtes au bon endroit. Dites-moi quel processus vous coûte du temps.",
};

const DE: AboutCopy = {
  heroLine: "Ich wurde gemacht,",
  heroAccent: "um zu bauen.",
  lede: "Ich bin John, Gründer von Ruah Studio. Ich baue KI, Software und digitale Systeme nach Maß — echte Lösungen für echte Probleme.",
  roles: ["Gründer", "Ingenieur", "Produktentwickler", "Systemarchitekt"],

  storyTitle: "Wie das angefangen hat",
  story: [
    "Ich bin 19 und habe dort angefangen zu bauen, wo viele sagen würden, es gehe nicht: in Venezuela, mit mehr Entschlossenheit als Mitteln, und habe mir selbst beigebracht, was nötig war, um zu schaffen, was es noch nicht gab.",
    "Ich habe keinen fertigen Weg geerbt. Ich habe ihn Zeile für Zeile aufgebaut, System für System. Ich habe programmieren gelernt, Prozesse zu automatisieren, künstliche Intelligenz einzubinden und ganze Plattformen zu bauen, indem ich echte Probleme gelöst habe — zuerst meine, dann die anderer.",
    "Jede Begrenzung wurde ein Grund, besser zu werden: Hatte ich das Werkzeug nicht, baute ich es; wusste ich es nicht, lernte ich es; ging etwas kaputt, stand ich auf und machte es noch einmal, besser.",
    "Daraus entstand Ruah Studio: ein Studio für KI, Software und digitale Systeme, damit Unternehmen und Menschen keine Zeit mehr mit Wiederholungen verlieren und mit Werkzeugen arbeiten, die für sie gebaut sind. Ich liefere keine Standardvorlagen — ich baue jede Lösung, als wäre es mein eigenes Geschäft, weil ich weiß, was jedes Ergebnis kostet.",
  ],

  pullQuote:
    "Hatte ich das Werkzeug nicht, baute ich es. Wusste ich es nicht, lernte ich es. Ging etwas kaputt, machte ich es noch einmal, besser.",

  meaningTitle: "Was Ruah bedeutet",
  meaning: [
    "Ruah bedeutet Atem, Geist, Lebenshauch.",
    "Für mich ist es die Erinnerung daran, dass alles, was ich baue, mit Absicht und Sorgfalt entsteht: nicht nur, damit es funktioniert, sondern damit es etwas verändert.",
  ],

  principlesTitle: "Wie ich arbeite",
  principles: [
    {
      n: "01",
      title: "Das Problem kommt vor dem Stack",
      body: "Ein Framework zu wählen ist einfach. Zu wissen, was man nicht bauen sollte, ist das Schwere — und dort gehen die meisten Budgets verloren.",
    },
    {
      n: "02",
      title: "Langweilige Software gewinnt",
      body: "Die Systeme, die überleben, sind die, die in zwei Jahren noch jemand warten kann. Cleverness ist eine Belastung.",
    },
    {
      n: "03",
      title: "Sie sprechen mit dem, der baut",
      body: "Keine Account-Management-Ebene, keine Übergabe an einen Junior nach der Unterschrift. Wer im ersten Gespräch sitzt, schreibt auch den Code.",
    },
    {
      n: "04",
      title: "Ausliefern, dann messen",
      body: "Ein laufendes System in Produktion lehrt in einer Woche mehr als eine Spezifikation in einem Monat.",
    },
  ],

  ctaTitle: "Bauen wir etwas, das sich lohnt.",
  ctaBody:
    "Wenn Sie jemanden suchen, der nicht nur programmiert, sondern Ihre Vision versteht und in ein echtes System verwandelt, sind Sie richtig. Sagen Sie mir, welcher Prozess Sie Zeit kostet.",
};

const IT: AboutCopy = {
  heroLine: "Sono stato fatto",
  heroAccent: "per creare.",
  lede: "Sono John, fondatore di Ruah Studio. Costruisco IA, software e sistemi digitali su misura — soluzioni reali per problemi reali.",
  roles: ["Fondatore", "Ingegnere", "Costruttore di prodotto", "Architetto di sistemi"],

  storyTitle: "Come è iniziata",
  story: [
    "Ho 19 anni e ho iniziato a costruire da un posto da cui molti direbbero che non si può: dal Venezuela, con più determinazione che risorse, imparando da solo tutto ciò che serviva per creare quello che ancora non esisteva.",
    "Non ho ereditato una strada già fatta. L'ho costruita riga per riga, sistema per sistema. Ho imparato a programmare, ad automatizzare processi, a integrare l'intelligenza artificiale e a realizzare piattaforme intere risolvendo problemi veri — prima i miei, poi quelli degli altri.",
    "Ogni limite è diventato un motivo per migliorare: se non avevo lo strumento, lo creavo; se non sapevo, lo imparavo; se qualcosa si rompeva, mi rialzavo e lo rifacevo, meglio.",
    "Da lì è nato Ruah Studio: uno studio di IA, software e sistemi digitali perché aziende e persone smettano di perdere tempo nel ripetitivo e lavorino con strumenti fatti su misura. Non consegno template generici — costruisco ogni soluzione come se l'azienda fosse mia, perché so quanto costa ogni risultato.",
  ],

  pullQuote:
    "Se non avevo lo strumento, lo creavo. Se non sapevo, lo imparavo. Se qualcosa si rompeva, lo rifacevo, meglio.",

  meaningTitle: "Cosa significa Ruah",
  meaning: [
    "Ruah significa respiro, spirito, soffio di vita.",
    "Per me è il promemoria che tutto ciò che costruisco è fatto con uno scopo e con cura: non solo perché funzioni, ma perché cambi qualcosa.",
  ],

  principlesTitle: "Come lavoro",
  principles: [
    {
      n: "01",
      title: "Il problema viene prima dello stack",
      body: "Scegliere un framework è facile. Sapere cosa non costruire è la parte difficile, ed è lì che si perde la maggior parte dei budget.",
    },
    {
      n: "02",
      title: "Il software noioso vince",
      body: "I sistemi che sopravvivono sono quelli che qualcuno riesce ancora a mantenere tra due anni. L'ingegnosità è un passivo.",
    },
    {
      n: "03",
      title: "Parli con chi lo costruisce",
      body: "Nessun livello di gestione account, nessun passaggio a un junior dopo la firma. La persona della prima call è quella che scrive il codice.",
    },
    {
      n: "04",
      title: "Rilasciare, poi misurare",
      body: "Un sistema in produzione insegna più in una settimana di quanto faccia una specifica in un mese.",
    },
  ],

  ctaTitle: "Costruiamo qualcosa che valga la pena.",
  ctaBody:
    "Se cerchi qualcuno che non si limiti a programmare, ma capisca la tua visione e la trasformi in un sistema reale, sei nel posto giusto. Raccontami quale processo ti sta costando tempo.",
};

const AR: AboutCopy = {
  heroLine: "خُلقت",
  heroAccent: "لأبني.",
  lede: "أنا جون، مؤسس Ruah Studio. أبني الذكاء الاصطناعي والبرمجيات والأنظمة الرقمية حسب الطلب — حلول حقيقية لمشكلات حقيقية.",
  roles: ["مؤسس", "مهندس", "صانع منتجات", "مهندس أنظمة"],

  storyTitle: "كيف بدأ هذا",
  story: [
    "عمري ١٩ عامًا، وبدأت البناء من مكان يقول كثيرون إنه لا يمكن البدء منه: من فنزويلا، بعزيمة تفوق الموارد، أعلّم نفسي كل ما يلزم لأصنع ما لم يكن موجودًا بعد.",
    "لم أرث طريقًا جاهزًا. بنيته سطرًا بسطر، ونظامًا بنظام. تعلمت البرمجة، وأتمتة العمليات، ودمج الذكاء الاصطناعي، وبناء منصات كاملة عبر حل مشكلات حقيقية — مشكلاتي أولًا، ثم مشكلات الآخرين.",
    "تحوّل كل قيد إلى سبب للتحسّن: إن لم تكن الأداة لدي صنعتها، وإن لم أكن أعرف تعلّمت، وإن انهار شيء نهضت وأعدت بناءه على نحو أفضل.",
    "من هناك وُلد Ruah Studio: استوديو للذكاء الاصطناعي والبرمجيات والأنظمة الرقمية، كي تتوقف الشركات والأفراد عن إهدار الوقت في المتكرر ويعملوا بأدوات مصممة لهم. لا أسلّم قوالب جاهزة — أبني كل حل كأن العمل عملي، لأنني أعرف كلفة كل نتيجة.",
  ],

  pullQuote:
    "إن لم تكن الأداة لدي صنعتها. وإن لم أكن أعرف تعلّمت. وإن انهار شيء أعدت بناءه على نحو أفضل.",

  meaningTitle: "ماذا تعني Ruah",
  meaning: [
    "رُواح تعني النَّفَس، الروح، نسمة الحياة.",
    "بالنسبة لي هي تذكير بأن كل ما أبنيه أصنعه بقصد وبإتقان: لا ليعمل فحسب، بل ليُحدث فرقًا.",
  ],

  principlesTitle: "كيف أعمل",
  principles: [
    {
      n: "01",
      title: "المشكلة قبل التقنية",
      body: "اختيار إطار العمل سهل. الصعب هو معرفة ما لا ينبغي بناؤه، وهناك تضيع معظم الميزانيات.",
    },
    {
      n: "02",
      title: "البرمجيات المملة هي الرابحة",
      body: "الأنظمة التي تبقى هي التي يستطيع أحدهم صيانتها بعد عامين. الذكاء المفرط عبء.",
    },
    {
      n: "03",
      title: "تتحدث مع من يبني",
      body: "لا طبقة إدارة حسابات، ولا تسليم لمبتدئ بعد التوقيع. من يجري المكالمة الأولى هو من يكتب الشيفرة.",
    },
    {
      n: "04",
      title: "أطلِق ثم قِس",
      body: "نظام يعمل في الإنتاج يعلّمك في أسبوع أكثر مما تعلّمك وثيقة مواصفات في شهر.",
    },
  ],

  ctaTitle: "لنبنِ شيئًا يستحق.",
  ctaBody:
    "إن كنت تبحث عمّن لا يكتفي بالبرمجة، بل يفهم رؤيتك ويحوّلها إلى نظام حقيقي، فأنت في المكان الصحيح. أخبرني أي عملية تكلّفك وقتًا.",
};

const BY_LANG: Record<Lang, AboutCopy> = {
  en: EN,
  es: ES,
  pt: PT,
  fr: FR,
  de: DE,
  it: IT,
  ar: AR,
};

export function aboutCopy(lang: Lang): AboutCopy {
  return BY_LANG[lang] ?? EN;
}
