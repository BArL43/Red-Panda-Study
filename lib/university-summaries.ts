// Generated from RPS_Universities_By_Program (1).xlsx on 2026-08-10.
// Safe for the public catalog: no program-level requirements are included here.
// Tuition is a rounded planning estimate in RUB, calculated 2026-08-13 from
// the lowest tuition in the RPS dataset. The exact amount depends on programme
// and the exchange rate at payment.

export type UniversitySummary = {
  nameRu: string;
  nameEn: string;
  code: string;
  city: string;
  country: "Китай" | "Гонконг";
  directions: readonly string[];
  languages: readonly string[];
  degrees: readonly string[];
  programCount: number;
  tuitionFromRub: number;
};

export const universitySummaries = [
  {
    "nameRu": "Пекинский университет",
    "nameEn": "Peking University",
    "code": "PKU",
    "city": "Пекин",
    "country": "Китай",
    "directions": [
      "Медицина",
      "Право",
      "Экономика и менеджмент",
      "Гуманитарные и социальные науки"
    ],
    "languages": [
      "Китайский",
      "Китайский (англоязычного бакалавриата нет)"
    ],
    "degrees": [
      "Bachelor"
    ],
    "programCount": 4,
    "tuitionFromRub": 290000
  },
  {
    "nameRu": "Университет Цинхуа",
    "nameEn": "Tsinghua University",
    "code": "Tsinghua",
    "city": "Пекин",
    "country": "Китай",
    "directions": [
      "Инженерия",
      "Компьютерные науки и AI",
      "Архитектура",
      "Экономика и менеджмент"
    ],
    "languages": [
      "Китайский / Английский (отдельные программы)"
    ],
    "degrees": [
      "Bachelor"
    ],
    "programCount": 4,
    "tuitionFromRub": 310000
  },
  {
    "nameRu": "Университет Фудань",
    "nameEn": "Fudan University",
    "code": "Fudan",
    "city": "Шанхай",
    "country": "Китай",
    "directions": [
      "Медицина",
      "Экономика и менеджмент",
      "Журналистика и коммуникации",
      "Компьютерные науки"
    ],
    "languages": [
      "Китайский",
      "Китайский / Английский (отдельные программы)",
      "Китайский (англоязычного бакалавриата нет)"
    ],
    "degrees": [
      "Bachelor"
    ],
    "programCount": 4,
    "tuitionFromRub": 260000
  },
  {
    "nameRu": "Шанхайский университет транспорта",
    "nameEn": "Shanghai Jiao Tong University",
    "code": "SJTU",
    "city": "Шанхай",
    "country": "Китай",
    "directions": [
      "Инженерия",
      "Компьютерные науки и AI",
      "Медицина",
      "Бизнес"
    ],
    "languages": [
      "Китайский / Английский (отдельные программы)",
      "Китайский"
    ],
    "degrees": [
      "Bachelor"
    ],
    "programCount": 4,
    "tuitionFromRub": 310000
  },
  {
    "nameRu": "Чжэцзянский университет",
    "nameEn": "Zhejiang University",
    "code": "ZJU",
    "city": "Ханчжоу",
    "country": "Китай",
    "directions": [
      "Компьютерные науки и AI",
      "Инженерия",
      "Data Science",
      "Биомедицина и Life Sciences"
    ],
    "languages": [
      "Китайский / Английский (отдельные программы)"
    ],
    "degrees": [
      "Bachelor"
    ],
    "programCount": 4,
    "tuitionFromRub": 220000
  },
  {
    "nameRu": "Научно-технический университет Китая",
    "nameEn": "University of Science and Technology of China",
    "code": "USTC",
    "city": "Хэфэй",
    "country": "Китай",
    "directions": [
      "Физика",
      "Квантовые технологии",
      "Компьютерные науки",
      "Химия и материаловедение"
    ],
    "languages": [
      "Китайский / Английский (отдельные программы)"
    ],
    "degrees": [
      "Bachelor"
    ],
    "programCount": 4,
    "tuitionFromRub": 220000
  },
  {
    "nameRu": "Нанкинский университет",
    "nameEn": "Nanjing University",
    "code": "NJU",
    "city": "Нанкин",
    "country": "Китай",
    "directions": [
      "Физика и астрономия",
      "Химия",
      "Компьютерные науки",
      "Гуманитарные и социальные науки"
    ],
    "languages": [
      "Китайский / Английский (отдельные программы)",
      "Китайский (англоязычного бакалавриата нет)"
    ],
    "degrees": [
      "Bachelor"
    ],
    "programCount": 4,
    "tuitionFromRub": 220000
  },
  {
    "nameRu": "Уханьский университет",
    "nameEn": "Wuhan University",
    "code": "WHU",
    "city": "Ухань",
    "country": "Китай",
    "directions": [
      "Геодезия и Remote Sensing",
      "Право",
      "Гидро- и гражданская инженерия",
      "Экономика и менеджмент"
    ],
    "languages": [
      "Китайский / Английский (отдельные программы)",
      "Китайский (англоязычного бакалавриата нет)"
    ],
    "degrees": [
      "Bachelor"
    ],
    "programCount": 4,
    "tuitionFromRub": 220000
  },
  {
    "nameRu": "Университет Тунцзи",
    "nameEn": "Tongji University",
    "code": "Tongji",
    "city": "Шанхай",
    "country": "Китай",
    "directions": [
      "Архитектура и градостроительство",
      "Civil Engineering",
      "Автомобилестроение",
      "Дизайн"
    ],
    "languages": [
      "Китайский / Английский (отдельные программы)"
    ],
    "degrees": [
      "Bachelor"
    ],
    "programCount": 4,
    "tuitionFromRub": 290000
  },
  {
    "nameRu": "Хуачжунский университет науки и технологий",
    "nameEn": "Huazhong University of Science and Technology",
    "code": "HUST",
    "city": "Ухань",
    "country": "Китай",
    "directions": [
      "Оптика и фотоника",
      "Biomedical Engineering",
      "Машиностроение и электроника",
      "Computer Science"
    ],
    "languages": [
      "Китайский / Английский (отдельные программы)"
    ],
    "degrees": [
      "Bachelor"
    ],
    "programCount": 4,
    "tuitionFromRub": 220000
  },
  {
    "nameRu": "Харбинский политехнический университет",
    "nameEn": "Harbin Institute of Technology",
    "code": "HIT",
    "city": "Харбин",
    "country": "Китай",
    "directions": [
      "Аэрокосмическая инженерия",
      "Робототехника",
      "Машиностроение",
      "Computer Science"
    ],
    "languages": [
      "Китайский / Английский (отдельные программы)"
    ],
    "degrees": [
      "Bachelor"
    ],
    "programCount": 4,
    "tuitionFromRub": 220000
  },
  {
    "nameRu": "Университет Сунь Ятсена",
    "nameEn": "Sun Yat-sen University",
    "code": "SYSU",
    "city": "Гуанчжоу",
    "country": "Китай",
    "directions": [
      "Медицина",
      "Бизнес и экономика",
      "Компьютерные науки",
      "Морские науки"
    ],
    "languages": [
      "Китайский",
      "Китайский / Английский (отдельные программы)"
    ],
    "degrees": [
      "Bachelor"
    ],
    "programCount": 4,
    "tuitionFromRub": 240000
  },
  {
    "nameRu": "Пекинский педагогический университет",
    "nameEn": "Beijing Normal University",
    "code": "BNU",
    "city": "Пекин",
    "country": "Китай",
    "directions": [
      "Педагогика",
      "Психология",
      "Китайский язык и лингвистика",
      "Экологические науки"
    ],
    "languages": [
      "Китайский (англоязычного бакалавриата нет)",
      "Китайский / Английский (отдельные программы)"
    ],
    "degrees": [
      "Bachelor"
    ],
    "programCount": 4,
    "tuitionFromRub": 220000
  },
  {
    "nameRu": "Южный университет науки и технологий",
    "nameEn": "Southern University of Science and Technology",
    "code": "SUSTech",
    "city": "Шэньчжэнь",
    "country": "Китай",
    "directions": [
      "Материаловедение",
      "Математика",
      "AI и Computer Science",
      "Биомедицина"
    ],
    "languages": [
      "Английский (основной) / Китайский"
    ],
    "degrees": [
      "Bachelor"
    ],
    "programCount": 4,
    "tuitionFromRub": 310000
  },
  {
    "nameRu": "Сианьский университет транспорта",
    "nameEn": "Xi'an Jiaotong University",
    "code": "XJTU",
    "city": "Сиань",
    "country": "Китай",
    "directions": [
      "Энергетика",
      "Электротехника и машиностроение",
      "Менеджмент",
      "Медицина"
    ],
    "languages": [
      "Китайский / Английский (отдельные программы)",
      "Китайский"
    ],
    "degrees": [
      "Bachelor"
    ],
    "programCount": 4,
    "tuitionFromRub": 220000
  },
  {
    "nameRu": "Сычуаньский университет",
    "nameEn": "Sichuan University",
    "code": "SCU",
    "city": "Чэнду",
    "country": "Китай",
    "directions": [
      "Стоматология",
      "Медицина",
      "Химия и материаловедение",
      "Инженерия"
    ],
    "languages": [
      "Китайский",
      "Китайский / Английский (отдельные программы)"
    ],
    "degrees": [
      "Bachelor"
    ],
    "programCount": 4,
    "tuitionFromRub": 220000
  },
  {
    "nameRu": "Университет Бэйхан",
    "nameEn": "Beihang University",
    "code": "BUAA",
    "city": "Пекин",
    "country": "Китай",
    "directions": [
      "Авиация и космос",
      "Computer Science и Software",
      "Automation и робототехника",
      "Электроника"
    ],
    "languages": [
      "Китайский / Английский (отдельные программы)"
    ],
    "degrees": [
      "Bachelor"
    ],
    "programCount": 4,
    "tuitionFromRub": 260000
  },
  {
    "nameRu": "Университет Сямэнь",
    "nameEn": "Xiamen University",
    "code": "XMU",
    "city": "Сямэнь",
    "country": "Китай",
    "directions": [
      "Экономика и финансы",
      "Менеджмент",
      "Химия",
      "Морские науки",
      "Журналистика"
    ],
    "languages": [
      "Китайский / Английский (отдельные программы)",
      "Китайский (англоязычного бакалавриата нет)"
    ],
    "degrees": [
      "Bachelor"
    ],
    "programCount": 5,
    "tuitionFromRub": 220000
  },
  {
    "nameRu": "Университет электронной науки и технологий Китая",
    "nameEn": "University of Electronic Science and Technology of China",
    "code": "UESTC",
    "city": "Чэнду",
    "country": "Китай",
    "directions": [
      "Электроника",
      "Телекоммуникации",
      "Cybersecurity",
      "AI и Computer Science"
    ],
    "languages": [
      "Китайский / Английский (отдельные программы)"
    ],
    "degrees": [
      "Bachelor"
    ],
    "programCount": 4,
    "tuitionFromRub": 200000
  },
  {
    "nameRu": "Народный университет Китая",
    "nameEn": "Renmin University of China",
    "code": "RUC",
    "city": "Пекин",
    "country": "Китай",
    "directions": [
      "Экономика",
      "Финансы",
      "Право",
      "Журналистика",
      "Государственное управление"
    ],
    "languages": [
      "Китайский (англоязычного бакалавриата нет)"
    ],
    "degrees": [
      "Bachelor"
    ],
    "programCount": 5,
    "tuitionFromRub": 260000
  },
  {
    "nameRu": "Университет международного бизнеса и экономики",
    "nameEn": "University of International Business and Economics",
    "code": "UIBE",
    "city": "Пекин",
    "country": "Китай",
    "directions": [
      "Международная экономика и торговля",
      "Финансы",
      "Бизнес",
      "Международное право"
    ],
    "languages": [
      "Китайский / Английский (отдельные программы)"
    ],
    "degrees": [
      "Bachelor"
    ],
    "programCount": 4,
    "tuitionFromRub": 240000
  },
  {
    "nameRu": "Шанхайский университет финансов и экономики",
    "nameEn": "Shanghai University of Finance and Economics",
    "code": "SUFE",
    "city": "Шанхай",
    "country": "Китай",
    "directions": [
      "Финансы",
      "Бухгалтерский учёт",
      "Экономика",
      "Бизнес и Analytics"
    ],
    "languages": [
      "Китайский / Английский (отдельные программы)"
    ],
    "degrees": [
      "Bachelor"
    ],
    "programCount": 4,
    "tuitionFromRub": 260000
  },
  {
    "nameRu": "Восточно-Китайский педагогический университет",
    "nameEn": "East China Normal University",
    "code": "ECNU",
    "city": "Шанхай",
    "country": "Китай",
    "directions": [
      "Педагогика",
      "Психология",
      "Статистика и Data Science",
      "Китайский язык"
    ],
    "languages": [
      "Китайский (англоязычного бакалавриата нет)",
      "Китайский / Английский (отдельные программы)"
    ],
    "degrees": [
      "Bachelor"
    ],
    "programCount": 4,
    "tuitionFromRub": 220000
  },
  {
    "nameRu": "Шэньчжэньский университет",
    "nameEn": "Shenzhen University",
    "code": "SZU",
    "city": "Шэньчжэнь",
    "country": "Китай",
    "directions": [
      "Computer Science",
      "Оптоэлектроника",
      "Бизнес и финансы",
      "Архитектура и дизайн"
    ],
    "languages": [
      "Китайский / Английский (отдельные программы)"
    ],
    "degrees": [
      "Bachelor"
    ],
    "programCount": 4,
    "tuitionFromRub": 220000
  },
  {
    "nameRu": "Восточно-Китайский университет науки и технологии",
    "nameEn": "East China University of Science and Technology",
    "code": "ECUST",
    "city": "Шанхай",
    "country": "Китай",
    "directions": [
      "Химическая инженерия и новые материалы",
      "Фармацевтика и биотехнологии",
      "Искусственный интеллект и Data Science",
      "Экология и энергетика"
    ],
    "languages": [
      "Китайский / Английский (отдельные программы)"
    ],
    "degrees": [
      "Bachelor"
    ],
    "programCount": 4,
    "tuitionFromRub": 220000
  },
  {
    "nameRu": "Тяньцзиньский университет",
    "nameEn": "Tianjin University",
    "code": "TJU",
    "city": "Тяньцзинь",
    "country": "Китай",
    "directions": [
      "Химическая инженерия и фармацевтика",
      "Приборостроение и точная механика",
      "Гражданское строительство"
    ],
    "languages": [
      "Китайский / Английский (отдельные программы)"
    ],
    "degrees": [
      "Bachelor"
    ],
    "programCount": 3,
    "tuitionFromRub": 220000
  },
  {
    "nameRu": "Даляньский технологический университет",
    "nameEn": "Dalian University of Technology",
    "code": "DUT",
    "city": "Далянь",
    "country": "Китай",
    "directions": [
      "Химическая инженерия",
      "Судостроение и океанотехника",
      "Машиностроение"
    ],
    "languages": [
      "Китайский / Английский (отдельные программы)"
    ],
    "degrees": [
      "Bachelor"
    ],
    "programCount": 3,
    "tuitionFromRub": 200000
  },
  {
    "nameRu": "Шанхайский университет",
    "nameEn": "Shanghai University",
    "code": "SHU",
    "city": "Шанхай",
    "country": "Китай",
    "directions": [
      "Изящные искусства и кино",
      "Цифровые медиа и социология",
      "Машиностроение"
    ],
    "languages": [
      "Китайский (англоязычного бакалавриата нет)",
      "Китайский / Английский (отдельные программы)"
    ],
    "degrees": [
      "Bachelor"
    ],
    "programCount": 3,
    "tuitionFromRub": 220000
  },
  {
    "nameRu": "Юго-Восточный университет",
    "nameEn": "Southeast University",
    "code": "SEU",
    "city": "Нанкин",
    "country": "Китай",
    "directions": [
      "Архитектура и градостроительство",
      "Биоэлектроника и биомедицина",
      "Транспортное строительство"
    ],
    "languages": [
      "Китайский / Английский (отдельные программы)"
    ],
    "degrees": [
      "Bachelor"
    ],
    "programCount": 3,
    "tuitionFromRub": 260000
  },
  {
    "nameRu": "Пекинский химико-технологический университет",
    "nameEn": "Beijing University of Chemical Technology",
    "code": "BUCT",
    "city": "Пекин",
    "country": "Китай",
    "directions": [
      "Полимеры и нефтехимия",
      "Зеленая химия и экология"
    ],
    "languages": [
      "Китайский / Английский (отдельные программы)"
    ],
    "degrees": [
      "Bachelor"
    ],
    "programCount": 2,
    "tuitionFromRub": 200000
  },
  {
    "nameRu": "Южно-Китайский технологический университет",
    "nameEn": "South China University of Technology",
    "code": "SCUT",
    "city": "Гуанчжоу",
    "country": "Китай",
    "directions": [
      "Легкая промышленность и пищевые технологии",
      "Архитектура и урбанистика",
      "Химическая инженерия"
    ],
    "languages": [
      "Китайский / Английский (отдельные программы)"
    ],
    "degrees": [
      "Bachelor"
    ],
    "programCount": 3,
    "tuitionFromRub": 220000
  },
  {
    "nameRu": "Центрально-Южный университет",
    "nameEn": "Central South University",
    "code": "CSU",
    "city": "Чанша",
    "country": "Китай",
    "directions": [
      "Цветная металлургия и материаловедение",
      "Железнодорожный транспорт",
      "Клиническая медицина"
    ],
    "languages": [
      "Китайский / Английский (отдельные программы)",
      "Китайский"
    ],
    "degrees": [
      "Bachelor"
    ],
    "programCount": 3,
    "tuitionFromRub": 200000
  },
  {
    "nameRu": "Хунаньский университет",
    "nameEn": "Hunan University",
    "code": "HNU",
    "city": "Чанша",
    "country": "Китай",
    "directions": [
      "Промышленный дизайн",
      "Мостостроение и гражданская инженерия",
      "Финансы и экономика"
    ],
    "languages": [
      "Китайский / Английский (отдельные программы)"
    ],
    "degrees": [
      "Bachelor"
    ],
    "programCount": 3,
    "tuitionFromRub": 220000
  },
  {
    "nameRu": "Шанхайский технологический университет",
    "nameEn": "ShanghaiTech University",
    "code": "ShanghaiTech",
    "city": "Шанхай",
    "country": "Китай",
    "directions": [
      "Материаловедение и фотоника",
      "Biomedical Engineering и Life Sciences",
      "AI и Computer Science"
    ],
    "languages": [
      "Английский (основной) / Китайский"
    ],
    "degrees": [
      "Bachelor"
    ],
    "programCount": 3,
    "tuitionFromRub": 310000
  },
  {
    "nameRu": "Гонконгский университет",
    "nameEn": "The University of Hong Kong",
    "code": "HKU",
    "city": "Гонконг",
    "country": "Гонконг",
    "directions": [
      "Медицина и стоматология",
      "Право",
      "Бизнес и экономика",
      "Архитектура и инженерия",
      "Data Science / Computer Science"
    ],
    "languages": [
      "Английский"
    ],
    "degrees": [
      "Bachelor"
    ],
    "programCount": 5,
    "tuitionFromRub": 1710000
  },
  {
    "nameRu": "Китайский университет Гонконга",
    "nameEn": "The Chinese University of Hong Kong",
    "code": "CUHK",
    "city": "Гонконг",
    "country": "Гонконг",
    "directions": [
      "Медицина",
      "Бизнес",
      "Инженерия и Computer Science",
      "Social Sciences",
      "Гуманитарные науки"
    ],
    "languages": [
      "Английский"
    ],
    "degrees": [
      "Bachelor"
    ],
    "programCount": 5,
    "tuitionFromRub": 1650000
  },
  {
    "nameRu": "Гонконгский университет науки и технологий",
    "nameEn": "The Hong Kong University of Science and Technology",
    "code": "HKUST",
    "city": "Гонконг",
    "country": "Гонконг",
    "directions": [
      "Инженерия",
      "Computer Science и AI",
      "Бизнес",
      "Естественные науки"
    ],
    "languages": [
      "Английский"
    ],
    "degrees": [
      "Bachelor"
    ],
    "programCount": 4,
    "tuitionFromRub": 1700000
  },
  {
    "nameRu": "Городской университет Гонконга",
    "nameEn": "City University of Hong Kong",
    "code": "CityUHK",
    "city": "Гонконг",
    "country": "Гонконг",
    "directions": [
      "Инженерия",
      "Computer Science и Data Science",
      "Бизнес",
      "Creative Media",
      "Ветеринария"
    ],
    "languages": [
      "Английский"
    ],
    "degrees": [
      "Bachelor"
    ],
    "programCount": 5,
    "tuitionFromRub": 1600000
  },
  {
    "nameRu": "Гонконгский политехнический университет",
    "nameEn": "The Hong Kong Polytechnic University",
    "code": "PolyU",
    "city": "Гонконг",
    "country": "Гонконг",
    "directions": [
      "Дизайн",
      "Гостиничный и туристический менеджмент",
      "Инженерия",
      "Бизнес",
      "Health Sciences"
    ],
    "languages": [
      "Английский"
    ],
    "degrees": [
      "Bachelor"
    ],
    "programCount": 5,
    "tuitionFromRub": 1600000
  },
  {
    "nameRu": "Гонконгский баптистский университет",
    "nameEn": "Hong Kong Baptist University",
    "code": "HKBU",
    "city": "Гонконг",
    "country": "Гонконг",
    "directions": [
      "Коммуникации и журналистика",
      "Бизнес",
      "Arts & Humanities",
      "Китайская медицина",
      "Data Science и AI"
    ],
    "languages": [
      "Английский",
      "Китайский (кантонский / путунхуа)"
    ],
    "degrees": [
      "Bachelor"
    ],
    "programCount": 5,
    "tuitionFromRub": 1500000
  }
] as const satisfies readonly UniversitySummary[];
