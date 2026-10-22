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
 *
 * Shape of the page, and why:
 *   lede        — who he is, stated plainly, before any credential.
 *   story       — where the way he works came from. Specific, not inspirational.
 *   pullQuote   — the one line the whole story rests on.
 *   meaning     — what the name carries.
 *   principles  — how that translates into the work itself.
 *   contrast    — the same choice, said as the reader is already framing it.
 *   close       — who should not write, then who should. Naming the wrong fit
 *                 out loud is what makes the right fit believe the rest.
 *   cta         — one step, in his words.
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
  contrastTitle: string;
  contrastLede: string;
  /** Left column: what is usually sold. Right column: what he does instead. */
  contrast: { them: string; me: string }[];
  contrastThemLabel: string;
  contrastMeLabel: string;
  closeEyebrow: string;
  closeNot: string;
  closeYes: string;
  ctaTitle: string;
  ctaBody: string;
};

const ES: AboutCopy = {
  heroLine: "Fui hecho",
  heroAccent: "para crear.",
  lede: "Soy John, fundador de Ruah Studio. Y antes que programador, emprendedor o cualquier título, soy hijo de Dios — y eso lo cambia todo, porque define cómo construyo, no solo qué construyo.",
  roles: ["Fundador", "Ingeniero", "Constructor de producto", "Arquitecto de sistemas"],

  storyTitle: "Dónde aprendí a construir",
  story: [
    "Tengo 20 años y aprendí a crear en el país donde todo empuja para que no crees nada. Donde se va la luz a mitad de una línea de código, donde no hay recursos para la herramienta que necesitas, donde lo normal es rendirse y lo raro es insistir.",
    "Ahí, desde una isla en Venezuela y sin que nadie me regalara el camino, entendí que las limitaciones no venían a frenarme — venían a formarme. Y vaya que forman. Cada vez que algo se rompía, aprendía a repararlo. Cada vez que no sabía, me sentaba a aprenderlo hasta el amanecer. Cada vez que caía, me levantaba — no igual, sino mejor.",
    "No lo digo como frase bonita de perfil: es, literalmente, la forma en que trabajo. Para mí la resiliencia no es aguantar golpes; es seguir creando con excelencia aun cuando sería más fácil hacerlo a medias. Es entregar lo que prometí, y un poco más, incluso los días en que nadie estaría mirando si no lo hiciera.",
    "Por eso no soy un técnico que entrega un archivo y desaparece. Soy fundador antes que proveedor: levanto mis propias marcas, arriesgo lo mío, y conozco en carne propia el peso de sacar algo adelante desde cero. Cuando trabajo contigo no veo un «trabajo» — veo el negocio de alguien que, como yo, está apostando por algo. Y eso lo trato con el mismo respeto con que trato lo mío.",
  ],

  pullQuote: "Porque yo sí sé Quién mira.",

  meaningTitle: "Qué significa Ruah",
  meaning: [
    "Ruah significa aliento, espíritu, soplo de vida.",
    "Es el recordatorio de que todo lo que hago lo hago con propósito, con alma y con excelencia — porque para mí crear es una forma de honrar a Dios, y la excelencia no es un lujo, es adoración.",
    "Fui hecho para crear y para liderar, y cada proyecto es una oportunidad de demostrarlo.",
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
      title: "Pruebas antes que promesas",
      body: "No te pido que confíes a ciegas. Cada sistema que construyo está hecho para tocarse, probarse y comprobarse antes de que pongas un dólar más.",
    },
    {
      n: "03",
      title: "Hablas con quien lo construye",
      body: "Sin capa de gestión de cuentas, sin traspaso a un junior después de firmar. La persona de la primera llamada es la que escribe el código.",
    },
    {
      n: "04",
      title: "El software aburrido gana",
      body: "Los sistemas que sobreviven son los que alguien todavía puede mantener en dos años. Lo ingenioso es un pasivo.",
    },
    {
      n: "05",
      title: "Entrego lo prometido, y un poco más",
      body: "Incluso los días en que nadie se daría cuenta si no lo hiciera. La excelencia no se enciende cuando hay público.",
    },
  ],

  contrastTitle: "La diferencia",
  contrastLede:
    "La mayoría de las agencias te venden código. Yo te construyo algo que funcione, que crezca y que transforme.",
  contrastThemLabel: "Lo que suelen venderte",
  contrastMeLabel: "Lo que hago yo",
  contrast: [
    {
      them: "Plantillas disfrazadas de soluciones a la medida.",
      me: "Cada sistema construido para tu problema, desde el primer archivo.",
    },
    {
      them: "Palabras técnicas para que confíes a ciegas.",
      me: "Pruebas antes que promesas: tócalo, pruébalo, compruébalo.",
    },
    {
      them: "Un archivo entregado y después, silencio.",
      me: "Un fundador que trata tu negocio como trata el suyo.",
    },
  ],

  closeEyebrow: "Antes de escribirme",
  closeNot:
    "Si buscas a alguien que programe barato y rápido, hay mil opciones ahí afuera, y todas te servirán para salir del paso.",
  closeYes:
    "Pero si buscas a alguien que entienda tu visión como si fuera suya, que no se rinda cuando se complique, y que construya con la convicción de quien sabe que fue hecho para esto — entonces no llegaste aquí por casualidad.",

  ctaTitle: "Construyamos algo que valga la pena.",
  ctaBody:
    "De las cosas que no se caen. De las que dejan huella. Cuéntame qué estás intentando sacar adelante.",
};

const EN: AboutCopy = {
  heroLine: "I was made",
  heroAccent: "to build.",
  lede: "I'm John, founder of Ruah Studio. And before programmer, entrepreneur or any other title, I'm a son of God — and that changes everything, because it defines how I build, not only what I build.",
  roles: ["Founder", "Engineer", "Product builder", "System architect"],

  storyTitle: "Where I learned to build",
  story: [
    "I'm 20, and I learned to create in the country where everything pushes you not to create anything. Where the power cuts out halfway through a line of code, where there's no budget for the tool you need, where giving up is normal and insisting is the strange thing to do.",
    "There, from an island in Venezuela, with nobody handing me the path, I understood that the limits weren't there to stop me — they were there to shape me. And shape they do. Every time something broke, I learned to repair it. Every time I didn't know, I sat down and learned it until sunrise. Every time I fell, I got back up — not the same, but better.",
    "That isn't a nice line for a profile: it is, literally, how I work. Resilience to me isn't taking hits; it's going on creating with excellence when doing it halfway would be easier. It's delivering what I promised, and a little more, even on the days nobody would notice if I didn't.",
    "So I'm not a technician who hands over a file and disappears. I'm a founder before I'm a vendor: I build my own brands, I risk my own money, and I know first-hand what it weighs to carry something from zero. When I work with you I don't see a “job” — I see the business of someone who, like me, is betting on something. And I treat that with the same respect I treat my own.",
  ],

  pullQuote: "Because I know Who is watching.",

  meaningTitle: "What Ruah means",
  meaning: [
    "Ruah means breath, spirit, the breath of life.",
    "It's the reminder that everything I do is done with purpose, with soul and with excellence — because to me creating is a way of honouring God, and excellence isn't a luxury, it's worship.",
    "I was made to create and to lead, and every project is a chance to show it.",
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
      title: "Proof before promises",
      body: "I don't ask you to trust me blindly. Every system I build is made to be touched, tested and checked before you commit another cent.",
    },
    {
      n: "03",
      title: "You talk to the person building it",
      body: "No account layer, no handoff to a junior after the contract is signed. The person in the first call writes the code.",
    },
    {
      n: "04",
      title: "Boring software wins",
      body: "The systems that survive are the ones somebody can still maintain in two years. Clever is a liability.",
    },
    {
      n: "05",
      title: "What I promised, and a little more",
      body: "Even on the days nobody would notice if I didn't. Excellence doesn't switch on when there's an audience.",
    },
  ],

  contrastTitle: "The difference",
  contrastLede:
    "Most agencies sell you code. I build you something that works, that grows, and that changes how the business runs.",
  contrastThemLabel: "What you're usually sold",
  contrastMeLabel: "What I do instead",
  contrast: [
    {
      them: "Templates dressed up as custom solutions.",
      me: "Every system built for your problem, from the first file.",
    },
    {
      them: "Technical words so you'll trust it blindly.",
      me: "Proof before promises: touch it, test it, check it.",
    },
    {
      them: "A file delivered, and then silence.",
      me: "A founder who treats your business the way he treats his own.",
    },
  ],

  closeEyebrow: "Before you write",
  closeNot:
    "If you're looking for someone to code it cheap and fast, there are a thousand options out there, and all of them will get you by.",
  closeYes:
    "But if you're looking for someone who understands your vision as if it were his own, who doesn't quit when it gets hard, and who builds with the conviction of knowing he was made for this — then you didn't land here by accident.",

  ctaTitle: "Let's build something worth building.",
  ctaBody:
    "The kind that doesn't fall over. The kind that leaves a mark. Tell me what you're trying to get off the ground.",
};

const PT: AboutCopy = {
  heroLine: "Eu fui feito",
  heroAccent: "para criar.",
  lede: "Sou o John, fundador do Ruah Studio. E antes de programador, empreendedor ou qualquer outro título, sou filho de Deus — e isso muda tudo, porque define como eu construo, não só o que eu construo.",
  roles: ["Fundador", "Engenheiro", "Construtor de produto", "Arquiteto de sistemas"],

  storyTitle: "Onde aprendi a construir",
  story: [
    "Tenho 20 anos e aprendi a criar no país onde tudo empurra para você não criar nada. Onde a luz cai no meio de uma linha de código, onde não há recurso para a ferramenta de que você precisa, onde desistir é o normal e insistir é o estranho.",
    "Ali, de uma ilha na Venezuela e sem que ninguém me desse o caminho pronto, entendi que os limites não vinham para me travar — vinham para me formar. E formam mesmo. Cada vez que algo quebrava, aprendia a consertar. Cada vez que não sabia, sentava e aprendia até o amanhecer. Cada vez que caía, levantava — não igual, mas melhor.",
    "Não digo isso como frase bonita de perfil: é, literalmente, o jeito como trabalho. Para mim resiliência não é aguentar pancada; é seguir criando com excelência quando fazer pela metade seria mais fácil. É entregar o que prometi, e um pouco mais, mesmo nos dias em que ninguém perceberia se eu não entregasse.",
    "Por isso não sou um técnico que entrega um arquivo e some. Sou fundador antes de ser fornecedor: levanto minhas próprias marcas, arrisco o meu, e sei na pele o peso de tirar algo do zero. Quando trabalho com você não vejo um “trabalho” — vejo o negócio de alguém que, como eu, está apostando em algo. E trato isso com o mesmo respeito com que trato o meu.",
  ],

  pullQuote: "Porque eu sei Quem está olhando.",

  meaningTitle: "O que significa Ruah",
  meaning: [
    "Ruah significa sopro, espírito, fôlego de vida.",
    "É o lembrete de que tudo o que faço, faço com propósito, com alma e com excelência — porque para mim criar é uma forma de honrar a Deus, e excelência não é luxo, é adoração.",
    "Fui feito para criar e para liderar, e cada projeto é uma chance de mostrar isso.",
  ],

  principlesTitle: "Como eu trabalho",
  principles: [
    {
      n: "01",
      title: "O problema vem antes da stack",
      body: "Escolher framework é fácil. Difícil é saber o que não construir, e é aí que a maioria dos orçamentos se perde.",
    },
    {
      n: "02",
      title: "Provas antes de promessas",
      body: "Não peço que você confie de olhos fechados. Cada sistema que construo é feito para ser tocado, testado e conferido antes de você investir mais um centavo.",
    },
    {
      n: "03",
      title: "Você fala com quem constrói",
      body: "Sem camada de gestão de contas, sem repasse para um júnior depois da assinatura. A pessoa da primeira conversa é quem escreve o código.",
    },
    {
      n: "04",
      title: "Software chato vence",
      body: "Os sistemas que sobrevivem são os que alguém ainda consegue manter daqui a dois anos. Esperteza é passivo.",
    },
    {
      n: "05",
      title: "O que prometi, e um pouco mais",
      body: "Mesmo nos dias em que ninguém notaria se eu não fizesse. Excelência não liga quando tem plateia.",
    },
  ],

  contrastTitle: "A diferença",
  contrastLede:
    "A maioria das agências vende código. Eu construo algo que funciona, que cresce e que transforma.",
  contrastThemLabel: "O que costumam te vender",
  contrastMeLabel: "O que eu faço",
  contrast: [
    {
      them: "Modelos prontos disfarçados de solução sob medida.",
      me: "Cada sistema construído para o seu problema, desde o primeiro arquivo.",
    },
    {
      them: "Palavras técnicas para você confiar de olhos fechados.",
      me: "Provas antes de promessas: toque, teste, confira.",
    },
    {
      them: "Um arquivo entregue e depois, silêncio.",
      me: "Um fundador que trata o seu negócio como trata o dele.",
    },
  ],

  closeEyebrow: "Antes de me escrever",
  closeNot:
    "Se você procura alguém que programe barato e rápido, há mil opções por aí, e todas vão quebrar o seu galho.",
  closeYes:
    "Mas se procura alguém que entenda a sua visão como se fosse dele, que não desista quando complicar, e que construa com a convicção de quem sabe que foi feito para isso — então você não chegou aqui por acaso.",

  ctaTitle: "Vamos construir algo que valha a pena.",
  ctaBody:
    "Daquelas coisas que não caem. Das que deixam marca. Me conta o que você está tentando tirar do papel.",
};

const FR: AboutCopy = {
  heroLine: "J'ai été fait",
  heroAccent: "pour créer.",
  lede: "Je suis John, fondateur de Ruah Studio. Et avant d'être développeur, entrepreneur ou n'importe quel titre, je suis fils de Dieu — et cela change tout, parce que cela définit comment je construis, pas seulement ce que je construis.",
  roles: ["Fondateur", "Ingénieur", "Bâtisseur de produit", "Architecte système"],

  storyTitle: "Où j'ai appris à construire",
  story: [
    "J'ai 20 ans et j'ai appris à créer dans le pays où tout pousse à ne rien créer. Où le courant saute au milieu d'une ligne de code, où il n'y a pas de budget pour l'outil dont on a besoin, où abandonner est la norme et insister, l'exception.",
    "Là, depuis une île du Venezuela et sans que personne ne m'ouvre le chemin, j'ai compris que les limites n'étaient pas là pour m'arrêter — elles étaient là pour me former. Et elles forment. Chaque fois que quelque chose cassait, j'apprenais à le réparer. Chaque fois que je ne savais pas, je m'asseyais et j'apprenais jusqu'au lever du jour. Chaque fois que je tombais, je me relevais — pas à l'identique, mais en mieux.",
    "Ce n'est pas une jolie phrase de profil : c'est, littéralement, ma façon de travailler. Pour moi la résilience n'est pas d'encaisser ; c'est de continuer à créer avec excellence quand faire à moitié serait plus simple. C'est livrer ce que j'ai promis, et un peu plus, même les jours où personne ne le verrait.",
    "C'est pourquoi je ne suis pas un technicien qui livre un fichier et disparaît. Je suis fondateur avant d'être prestataire : je monte mes propres marques, je risque mon argent, et je sais dans ma chair ce que pèse de sortir quelque chose de zéro. Quand je travaille avec vous, je ne vois pas une « mission » — je vois l'entreprise de quelqu'un qui, comme moi, mise sur quelque chose. Et je la traite avec le respect que je donne à la mienne.",
  ],

  pullQuote: "Parce que moi, je sais Qui regarde.",

  meaningTitle: "Ce que veut dire Ruah",
  meaning: [
    "Ruah signifie souffle, esprit, haleine de vie.",
    "C'est le rappel que tout ce que je fais, je le fais avec intention, avec âme et avec excellence — parce que créer est pour moi une manière d'honorer Dieu, et l'excellence n'est pas un luxe, c'est une adoration.",
    "J'ai été fait pour créer et pour diriger, et chaque projet est une occasion de le montrer.",
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
      title: "Des preuves avant des promesses",
      body: "Je ne vous demande pas de me faire confiance à l'aveugle. Chaque système que je construis est fait pour être touché, testé et vérifié avant que vous n'engagiez un euro de plus.",
    },
    {
      n: "03",
      title: "Vous parlez à celui qui construit",
      body: "Pas de couche de gestion de compte, pas de transfert à un junior après la signature. La personne du premier appel est celle qui écrit le code.",
    },
    {
      n: "04",
      title: "Le logiciel ennuyeux gagne",
      body: "Les systèmes qui survivent sont ceux que quelqu'un peut encore maintenir dans deux ans. L'astuce est un passif.",
    },
    {
      n: "05",
      title: "Ce que j'ai promis, et un peu plus",
      body: "Même les jours où personne ne remarquerait le contraire. L'excellence ne s'allume pas quand il y a du public.",
    },
  ],

  contrastTitle: "La différence",
  contrastLede:
    "La plupart des agences vous vendent du code. Moi, je vous construis quelque chose qui fonctionne, qui grandit et qui transforme.",
  contrastThemLabel: "Ce qu'on vous vend d'habitude",
  contrastMeLabel: "Ce que je fais",
  contrast: [
    {
      them: "Des modèles déguisés en solutions sur mesure.",
      me: "Chaque système construit pour votre problème, dès le premier fichier.",
    },
    {
      them: "Du jargon technique pour que vous signiez les yeux fermés.",
      me: "Des preuves avant des promesses : touchez-le, testez-le, vérifiez-le.",
    },
    {
      them: "Un fichier livré, puis le silence.",
      me: "Un fondateur qui traite votre entreprise comme la sienne.",
    },
  ],

  closeEyebrow: "Avant de m'écrire",
  closeNot:
    "Si vous cherchez quelqu'un pour coder vite et pas cher, il y a mille options dehors, et toutes feront l'affaire pour dépanner.",
  closeYes:
    "Mais si vous cherchez quelqu'un qui comprenne votre vision comme si c'était la sienne, qui n'abandonne pas quand ça se complique, et qui construise avec la conviction de savoir qu'il a été fait pour ça — alors vous n'êtes pas arrivé ici par hasard.",

  ctaTitle: "Construisons quelque chose qui en vaut la peine.",
  ctaBody:
    "De celles qui ne s'effondrent pas. De celles qui laissent une trace. Dites-moi ce que vous essayez de faire décoller.",
};

const DE: AboutCopy = {
  heroLine: "Ich wurde gemacht,",
  heroAccent: "um zu bauen.",
  lede: "Ich bin John, Gründer von Ruah Studio. Und bevor ich Entwickler, Unternehmer oder irgendein Titel bin, bin ich ein Sohn Gottes — und das ändert alles, weil es bestimmt, wie ich baue, nicht nur was.",
  roles: ["Gründer", "Ingenieur", "Produktbauer", "Systemarchitekt"],

  storyTitle: "Wo ich bauen gelernt habe",
  story: [
    "Ich bin 20 und habe in dem Land gelernt zu bauen, in dem alles dazu drängt, nichts zu bauen. Wo mitten in einer Zeile Code der Strom ausfällt, wo das Geld für das nötige Werkzeug fehlt, wo Aufgeben normal ist und Weitermachen die Ausnahme.",
    "Dort, von einer Insel in Venezuela aus und ohne dass mir jemand den Weg geebnet hätte, habe ich verstanden: Die Grenzen waren nicht da, um mich zu bremsen — sie waren da, um mich zu formen. Und das tun sie. Jedes Mal, wenn etwas kaputtging, lernte ich, es zu reparieren. Jedes Mal, wenn ich etwas nicht konnte, setzte ich mich hin und lernte es bis zum Morgengrauen. Jedes Mal, wenn ich fiel, stand ich wieder auf — nicht gleich, sondern besser.",
    "Das ist kein hübscher Satz fürs Profil: So arbeite ich buchstäblich. Belastbarkeit heißt für mich nicht, Schläge auszuhalten; sie heißt, mit Sorgfalt weiterzubauen, wenn halbe Arbeit einfacher wäre. Es heißt, zu liefern, was ich versprochen habe, und ein Stück mehr — auch an den Tagen, an denen es niemandem auffiele.",
    "Deshalb bin ich kein Techniker, der eine Datei abgibt und verschwindet. Ich bin Gründer, bevor ich Dienstleister bin: Ich baue eigene Marken auf, riskiere mein eigenes Geld und weiß am eigenen Leib, was es wiegt, etwas aus dem Nichts zu tragen. Wenn ich mit Ihnen arbeite, sehe ich keinen „Auftrag“ — ich sehe das Geschäft von jemandem, der wie ich auf etwas setzt. Und das behandle ich mit demselben Respekt wie mein eigenes.",
  ],

  pullQuote: "Denn ich weiß, Wer zusieht.",

  meaningTitle: "Was Ruah bedeutet",
  meaning: [
    "Ruah bedeutet Atem, Geist, Hauch des Lebens.",
    "Es erinnert daran, dass alles, was ich tue, mit Absicht, mit Seele und mit Sorgfalt geschieht — denn Schaffen ist für mich eine Art, Gott zu ehren, und Exzellenz ist kein Luxus, sie ist Anbetung.",
    "Ich wurde zum Schaffen und zum Führen gemacht, und jedes Projekt ist eine Gelegenheit, das zu zeigen.",
  ],

  principlesTitle: "Wie ich arbeite",
  principles: [
    {
      n: "01",
      title: "Das Problem kommt vor dem Stack",
      body: "Ein Framework zu wählen ist leicht. Zu wissen, was man nicht bauen sollte, ist das Schwere — und daran gehen die meisten Budgets zugrunde.",
    },
    {
      n: "02",
      title: "Belege vor Versprechen",
      body: "Ich bitte Sie nicht, blind zu vertrauen. Jedes System, das ich baue, ist dazu gemacht, angefasst, getestet und geprüft zu werden, bevor Sie einen weiteren Cent einsetzen.",
    },
    {
      n: "03",
      title: "Sie sprechen mit dem, der es baut",
      body: "Keine Account-Management-Schicht, keine Übergabe an einen Junior nach der Unterschrift. Wer im ersten Gespräch sitzt, schreibt den Code.",
    },
    {
      n: "04",
      title: "Langweilige Software gewinnt",
      body: "Die Systeme, die überleben, sind die, die in zwei Jahren noch jemand warten kann. Cleverness ist eine Verbindlichkeit.",
    },
    {
      n: "05",
      title: "Das Versprochene, und ein Stück mehr",
      body: "Auch an den Tagen, an denen es niemandem auffiele. Sorgfalt schaltet sich nicht erst ein, wenn jemand zusieht.",
    },
  ],

  contrastTitle: "Der Unterschied",
  contrastLede:
    "Die meisten Agenturen verkaufen Ihnen Code. Ich baue Ihnen etwas, das läuft, das wächst und das etwas verändert.",
  contrastThemLabel: "Was man Ihnen üblicherweise verkauft",
  contrastMeLabel: "Was ich stattdessen tue",
  contrast: [
    {
      them: "Vorlagen, als Maßarbeit verkleidet.",
      me: "Jedes System für Ihr Problem gebaut, ab der ersten Datei.",
    },
    {
      them: "Fachbegriffe, damit Sie blind zustimmen.",
      me: "Belege vor Versprechen: anfassen, testen, prüfen.",
    },
    {
      them: "Eine Datei geliefert — und dann Funkstille.",
      me: "Ein Gründer, der Ihr Geschäft behandelt wie sein eigenes.",
    },
  ],

  closeEyebrow: "Bevor Sie schreiben",
  closeNot:
    "Wenn Sie jemanden suchen, der billig und schnell programmiert: Es gibt tausend Angebote da draußen, und alle bringen Sie irgendwie über die Runden.",
  closeYes:
    "Wenn Sie aber jemanden suchen, der Ihre Vision versteht, als wäre es seine, der nicht aufgibt, wenn es schwierig wird, und der mit der Überzeugung baut, dafür gemacht zu sein — dann sind Sie nicht zufällig hier gelandet.",

  ctaTitle: "Bauen wir etwas, das sich lohnt.",
  ctaBody:
    "Von der Sorte, die nicht umfällt. Von der, die etwas hinterlässt. Erzählen Sie mir, was Sie gerade zum Laufen bringen wollen.",
};

const IT: AboutCopy = {
  heroLine: "Sono stato fatto",
  heroAccent: "per creare.",
  lede: "Sono John, fondatore di Ruah Studio. E prima che programmatore, imprenditore o qualsiasi altro titolo, sono figlio di Dio — e questo cambia tutto, perché definisce come costruisco, non solo cosa costruisco.",
  roles: ["Fondatore", "Ingegnere", "Costruttore di prodotto", "Architetto di sistemi"],

  storyTitle: "Dove ho imparato a costruire",
  story: [
    "Ho 20 anni e ho imparato a creare nel Paese dove tutto spinge a non creare niente. Dove la corrente salta a metà di una riga di codice, dove non ci sono soldi per lo strumento che ti serve, dove mollare è la norma e insistere è la stranezza.",
    "Lì, da un'isola del Venezuela e senza che nessuno mi spianasse la strada, ho capito che i limiti non erano lì per fermarmi — erano lì per formarmi. E formano, eccome. Ogni volta che qualcosa si rompeva, imparavo a ripararlo. Ogni volta che non sapevo, mi sedevo e lo imparavo fino all'alba. Ogni volta che cadevo, mi rialzavo — non uguale, ma migliore.",
    "Non è una bella frase da profilo: è, letteralmente, il modo in cui lavoro. Per me la resilienza non è incassare colpi; è continuare a creare con cura quando farlo a metà sarebbe più facile. È consegnare quello che ho promesso, e un po' di più, anche nei giorni in cui nessuno se ne accorgerebbe.",
    "Per questo non sono un tecnico che consegna un file e sparisce. Sono fondatore prima che fornitore: costruisco i miei marchi, rischio il mio, e so sulla pelle quanto pesa portare avanti qualcosa da zero. Quando lavoro con te non vedo un “lavoro” — vedo l'attività di qualcuno che, come me, sta scommettendo su qualcosa. E la tratto con lo stesso rispetto con cui tratto la mia.",
  ],

  pullQuote: "Perché io so Chi guarda.",

  meaningTitle: "Cosa significa Ruah",
  meaning: [
    "Ruah significa soffio, spirito, respiro di vita.",
    "È il promemoria che tutto quello che faccio lo faccio con uno scopo, con anima e con cura — perché per me creare è un modo di onorare Dio, e l'eccellenza non è un lusso, è adorazione.",
    "Sono stato fatto per creare e per guidare, e ogni progetto è un'occasione per dimostrarlo.",
  ],

  principlesTitle: "Come lavoro",
  principles: [
    {
      n: "01",
      title: "Il problema viene prima dello stack",
      body: "Scegliere un framework è facile. Sapere cosa non costruire è la parte difficile, ed è dove si perde la maggior parte dei budget.",
    },
    {
      n: "02",
      title: "Prove prima delle promesse",
      body: "Non ti chiedo di fidarti alla cieca. Ogni sistema che costruisco è fatto per essere toccato, provato e verificato prima che tu metta un altro euro.",
    },
    {
      n: "03",
      title: "Parli con chi lo costruisce",
      body: "Nessun livello di gestione clienti, nessun passaggio a un junior dopo la firma. La persona della prima chiamata è quella che scrive il codice.",
    },
    {
      n: "04",
      title: "Il software noioso vince",
      body: "I sistemi che sopravvivono sono quelli che qualcuno riesce ancora a mantenere fra due anni. L'ingegnosità è un passivo.",
    },
    {
      n: "05",
      title: "Quello che ho promesso, e un po' di più",
      body: "Anche nei giorni in cui nessuno se ne accorgerebbe. L'eccellenza non si accende quando c'è pubblico.",
    },
  ],

  contrastTitle: "La differenza",
  contrastLede:
    "La maggior parte delle agenzie ti vende codice. Io ti costruisco qualcosa che funziona, che cresce e che trasforma.",
  contrastThemLabel: "Quello che di solito ti vendono",
  contrastMeLabel: "Quello che faccio io",
  contrast: [
    {
      them: "Template travestiti da soluzioni su misura.",
      me: "Ogni sistema costruito sul tuo problema, dal primo file.",
    },
    {
      them: "Parole tecniche perché tu ti fidi alla cieca.",
      me: "Prove prima delle promesse: toccalo, provalo, verificalo.",
    },
    {
      them: "Un file consegnato e poi silenzio.",
      me: "Un fondatore che tratta la tua attività come tratta la sua.",
    },
  ],

  closeEyebrow: "Prima di scrivermi",
  closeNot:
    "Se cerchi qualcuno che programmi veloce e a poco, là fuori ci sono mille opzioni, e tutte ti tolgono dall'impiccio.",
  closeYes:
    "Ma se cerchi qualcuno che capisca la tua visione come se fosse la sua, che non molli quando si complica, e che costruisca con la convinzione di chi sa di essere stato fatto per questo — allora non sei arrivato qui per caso.",

  ctaTitle: "Costruiamo qualcosa che valga la pena.",
  ctaBody:
    "Di quelle che non crollano. Di quelle che lasciano il segno. Raccontami cosa stai cercando di far partire.",
};

const AR: AboutCopy = {
  heroLine: "خُلقت",
  heroAccent: "لأبني.",
  lede: "أنا جون، مؤسس Ruah Studio. وقبل أن أكون مبرمجًا أو رائد أعمال أو أي لقب آخر، أنا ابن لله — وهذا يغيّر كل شيء، لأنه يحدّد كيف أبني، لا ما أبنيه فقط.",
  roles: ["مؤسس", "مهندس", "باني منتجات", "مهندس أنظمة"],

  storyTitle: "أين تعلّمت أن أبني",
  story: [
    "عمري 20 سنة، وتعلّمت أن أصنع في البلد الذي يدفعك كل شيء فيه إلى ألا تصنع شيئًا. حيث ينقطع التيار في منتصف سطر برمجي، وحيث لا موارد للأداة التي تحتاجها، وحيث الاستسلام هو المعتاد والإصرار هو الغريب.",
    "هناك، من جزيرة في فنزويلا ودون أن يمهّد لي أحد الطريق، فهمت أن الحدود لم تأتِ لتوقفني — بل لتصنعني. وهي تصنع فعلًا. كلما انكسر شيء تعلّمت إصلاحه. وكلما جهلت شيئًا جلست أتعلّمه حتى الفجر. وكلما سقطت نهضت — لا كما كنت، بل أفضل.",
    "لا أقول هذا كعبارة جميلة في ملفّ شخصي: هذه حرفيًا طريقتي في العمل. الصلابة عندي ليست تحمّل الضربات؛ بل الاستمرار في الصنع بإتقان حين يكون أنصاف العمل أسهل. هي أن أسلّم ما وعدت به، وزيادة، حتى في الأيام التي لن يلاحظ فيها أحد لو لم أفعل.",
    "لذلك لست تقنيًا يسلّم ملفًا ثم يختفي. أنا مؤسس قبل أن أكون مورّدًا: أبني علاماتي الخاصة، وأخاطر بمالي، وأعرف بنفسي ثقل أن تخرج بشيء من الصفر. حين أعمل معك لا أرى «مهمة» — أرى عمل شخص يراهن على شيء، مثلي تمامًا. وأعامله بالاحترام نفسه الذي أعامل به عملي.",
  ],

  pullQuote: "لأنني أعرف مَن يرى.",

  meaningTitle: "ماذا تعني Ruah",
  meaning: [
    "رُوَح تعني النَّفَس، الرُّوح، نسمة الحياة.",
    "هي التذكير بأن كل ما أفعله أفعله بغاية وبروح وبإتقان — لأن الصنع عندي طريقة لتكريم الله، والإتقان ليس ترفًا، بل عبادة.",
    "خُلقت لأصنع ولأقود، وكل مشروع فرصة لإثبات ذلك.",
  ],

  principlesTitle: "كيف أعمل",
  principles: [
    {
      n: "01",
      title: "المشكلة قبل التقنيات",
      body: "اختيار إطار العمل سهل. الصعب هو معرفة ما لا ينبغي بناؤه، وهناك تضيع معظم الميزانيات.",
    },
    {
      n: "02",
      title: "أدلّة قبل الوعود",
      body: "لا أطلب منك ثقة عمياء. كل نظام أبنيه مصنوع ليُلمس ويُختبر ويُتحقَّق منه قبل أن تدفع المزيد.",
    },
    {
      n: "03",
      title: "تتحدث مع من يبني",
      body: "لا طبقة إدارة حسابات، ولا تسليم إلى مبتدئ بعد التوقيع. من يحادثك أول مرة هو من يكتب الشيفرة.",
    },
    {
      n: "04",
      title: "البرمجيات المملّة تفوز",
      body: "الأنظمة التي تبقى هي التي يستطيع أحدهم صيانتها بعد عامين. الذكاء الزائد عبء.",
    },
    {
      n: "05",
      title: "ما وعدت به، وزيادة",
      body: "حتى في الأيام التي لن ينتبه فيها أحد. الإتقان لا يشتغل عند وجود جمهور.",
    },
  ],

  contrastTitle: "الفرق",
  contrastLede: "معظم الوكالات تبيعك شيفرة. أنا أبني لك شيئًا يعمل، وينمو، ويُحدث فرقًا.",
  contrastThemLabel: "ما يُباع لك عادةً",
  contrastMeLabel: "ما أفعله أنا",
  contrast: [
    {
      them: "قوالب جاهزة متنكّرة في هيئة حلول مفصّلة.",
      me: "كل نظام مبني على مشكلتك أنت، من أول ملف.",
    },
    {
      them: "مصطلحات تقنية كي تثق بلا أن ترى.",
      me: "أدلّة قبل الوعود: المسه، جرّبه، تحقّق منه.",
    },
    {
      them: "ملف يُسلَّم ثم صمت.",
      me: "مؤسس يعامل عملك كما يعامل عمله.",
    },
  ],

  closeEyebrow: "قبل أن تراسلني",
  closeNot:
    "إن كنت تبحث عمّن يبرمج بسرعة وبثمن زهيد، فهناك ألف خيار بالخارج، وكلها ستخرجك من المأزق.",
  closeYes:
    "أما إن كنت تبحث عمّن يفهم رؤيتك كأنها رؤيته، ولا يستسلم حين تتعقّد الأمور، ويبني بقناعة من يعرف أنه خُلق لهذا — فأنت لم تصل إلى هنا صدفة.",

  ctaTitle: "لنبنِ شيئًا يستحق.",
  ctaBody: "من النوع الذي لا ينهار. من النوع الذي يترك أثرًا. أخبرني بما تحاول إطلاقه.",
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
