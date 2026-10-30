import type { TemplateTranslation } from '@fabulka/shared';

/**
 * Kazakh and English text of the starting catalog. Russian is the template itself. Choice options
 * are listed in the same order as the Russian ones.
 */
export const SEED_TRANSLATIONS: Record<
  string,
  Record<'kk' | 'en', TemplateTranslation>
> = {
  'first-day-kindergarten': {
    kk: {
      title: 'Балабақшадағы алғашқы күн',
      summary:
        'Балабақшада не болатынын сабырмен, ретімен айтады: қоштасу, тәрбиеші, ойындар және анамен кездесу.',
      questions: {
        toy: {
          label: 'Өзімен қандай ойыншық алады?',
          placeholder: 'жұмсақ қоян',
        },
        goodbye: {
          label: 'Таңертең қалай қоштасасыздар?',
          options: [
            'құшақтасамыз',
            'терезеден қол бұлғаймыз',
            'алақан соғамыз',
            'бетінен сүйеміз',
          ],
        },
        teacher: { label: 'Тәрбиешінің аты кім?', placeholder: 'Гүлнар апай' },
        looking_forward: {
          label: 'Бала ең көп нені күтеді?',
          options: ['ойындар', 'сурет салу', 'жаңа достар', 'серуен'],
        },
      },
    },
    en: {
      title: 'First Day at Kindergarten',
      summary:
        'Calmly, step by step: saying goodbye, the teacher, games and the moment mum or dad comes back.',
      questions: {
        toy: {
          label: 'Which toy will they take along?',
          placeholder: 'a plush bunny',
        },
        goodbye: {
          label: 'How do you say goodbye in the morning?',
          options: [
            'a hug',
            'waving through the window',
            'a high five',
            'a kiss on the cheek',
          ],
        },
        teacher: {
          label: "What is the teacher's name?",
          placeholder: 'Ms Gulnara',
        },
        looking_forward: {
          label: 'What is your child looking forward to most?',
          options: ['games', 'drawing', 'new friends', 'playing outside'],
        },
      },
    },
  },
  'snow-leopard-alatau': {
    kk: {
      title: 'Ақ барыстың құпиясы',
      summary:
        'Алатау тауларына саяхат: бүркіт, тұман, тау көлі және адасып қалған ақ барыстың күшігі.',
      questions: {
        friend: {
          label: 'Кейіпкермен бірге сапарға шығатын ең жақын досы',
          placeholder: 'Даник',
        },
        dream: {
          label: 'Бала кім болуды армандайды?',
          placeholder: 'құтқарушы',
        },
        color: {
          label: 'Сүйікті түсі',
          options: ['қызыл', 'көк', 'жасыл', 'сары', 'күлгін', 'қызғылт'],
        },
      },
    },
    en: {
      title: 'The Secret of the Snow Leopard',
      summary:
        'A journey to the Alatau mountains: a golden eagle, fog, a mountain lake and a lost snow leopard cub.',
      questions: {
        friend: {
          label: 'A best friend who comes along on the journey',
          placeholder: 'Danik',
        },
        dream: {
          label: 'What does your child dream of becoming?',
          placeholder: 'a rescuer',
        },
        color: {
          label: 'Favourite colour',
          options: ['red', 'blue', 'green', 'yellow', 'purple', 'pink'],
        },
      },
    },
  },
  'not-yet': {
    kk: {
      title: 'Мен үйренемін!',
      summary:
        'Шықпады — әзірге. Жаттығу мен жақындардың көмегі «білмеймін» дегенді «білемінге» қалай айналдыратыны туралы кітап.',
      questions: {
        skill: {
          label: 'Бала қазір не үйреніп жүр?',
          options: [
            'велосипед тебуді',
            'жүзуді',
            'оқуды',
            'бау байлауды',
            'коньки тебуді',
            'домбыра тартуды',
          ],
        },
        helper: {
          label: 'Үйренуге кім көмектеседі?',
          options: [
            'анасы',
            'әкесі',
            'атасы',
            'әжесі',
            'ағасы',
            'әпкесі',
            'жаттықтырушы',
          ],
        },
      },
    },
    en: {
      title: 'I Will Learn!',
      summary:
        'Can\'t do it — yet. A book about how practice and help from loved ones turn "I can\'t" into "I can".',
      questions: {
        skill: {
          label: 'What is your child learning right now?',
          options: [
            'to ride a bike',
            'to swim',
            'to read',
            'to tie shoelaces',
            'to ice-skate',
            'to play the dombra',
          ],
        },
        helper: {
          label: 'Who helps them learn?',
          options: [
            'mum',
            'dad',
            'grandpa',
            'grandma',
            'big brother',
            'big sister',
            'a coach',
          ],
        },
      },
    },
  },
  'big-feelings': {
    kk: {
      title: 'Ішімдегі дауыл',
      summary:
        'Күшті сезімдер туралы: оларды байқау, атау, сабырға келу және татуласу.',
      questions: {
        feeling: {
          label: 'Балаға қай сезіммен күресу қиын?',
          options: ['ашу', 'қорқыныш', 'өкпе', 'қызғаныш', 'мұң'],
        },
        trigger: {
          label: 'Бұл сезімді әдетте не тудырады?',
          placeholder: 'ағасы ойыншықтарын алғанда',
        },
        calm: {
          label: 'Сабырға келуге не көмектеседі?',
          options: [
            'құшақтасу',
            'терең дем алу',
            'беске дейін санау',
            'тыныш бұрышта отыру',
            'сурет салу',
          ],
        },
      },
    },
    en: {
      title: 'A Storm Inside',
      summary:
        'About big feelings: noticing them, naming them, calming down and making up.',
      questions: {
        feeling: {
          label: 'Which feeling is hardest for your child?',
          options: ['anger', 'fear', 'hurt', 'jealousy', 'sadness'],
        },
        trigger: {
          label: 'What usually sets it off?',
          placeholder: 'when a brother takes their toys',
        },
        calm: {
          label: 'What helps them calm down?',
          options: [
            'hugs',
            'deep breaths',
            'counting to five',
            'a quiet corner',
            'drawing',
          ],
        },
      },
    },
  },
  'nauryz-new-friend': {
    kk: {
      title: 'Жаңа досыммен Наурыз',
      summary:
        'Туған қаладағы көктем мейрамы: наурыз көже, киіз үй, алтыбақан және жақында басқа елден келген дос.',
      questions: {
        friend_country: {
          label: 'Жаңа дос қай елден келді?',
          options: ['Корея', 'Түркия', 'Бразилия', 'Германия', 'Жапония'],
        },
        dish: {
          label: 'Наурыздағы сүйікті тағам',
          options: ['наурыз көже', 'бауырсақ', 'бешбармақ', 'шәкшәк'],
        },
        tradition: {
          label: 'Отбасыңыздың Наурыз дәстүрі',
          placeholder: 'әжемізге қонаққа барамыз',
        },
      },
    },
    en: {
      title: 'Nauryz with a New Friend',
      summary:
        'A spring festival at home: nauryz kozhe, a yurt, altybakan swings and a friend who has just moved from another country.',
      questions: {
        friend_country: {
          label: 'Where has the new friend moved from?',
          options: ['Korea', 'Turkey', 'Brazil', 'Germany', 'Japan'],
        },
        dish: {
          label: 'Favourite Nauryz treat',
          options: ['nauryz kozhe', 'baursaks', 'beshbarmak', 'chak-chak'],
        },
        tradition: {
          label: "Your family's Nauryz tradition",
          placeholder: 'we visit grandma',
        },
      },
    },
  },
  'bath-time': {
    kk: {
      title: 'Былқ-сылқ, шомыламыз!',
      summary:
        'Кішкентайларға арналған кешкі ванна: ойыншықтар, көпіршіктер, қайталанатын әуен және тәтті ұйқы.',
      questions: {
        toy: { label: 'Ваннадағы сүйікті ойыншығы', placeholder: 'сары үйрек' },
        sound: {
          label: 'Су шашқанда бөбек не дейді?',
          options: ['былқ-былқ', 'шалп-шалп', 'тамшы-тамшы'],
        },
      },
    },
    en: {
      title: 'Splish-Splash, Bath Time!',
      summary:
        'An evening bath for the youngest: toys, bubbles, a repeating little song and sweet dreams.',
      questions: {
        toy: { label: 'Favourite bath toy', placeholder: 'a yellow duck' },
        sound: {
          label: 'What does your little one say when splashing?',
          options: ['splish-splash', 'plop-plop', 'drip-drop'],
        },
      },
    },
  },
};
