export type CompassDegree = "bachelor" | "master";
export type CompassDestination = "china" | "hong-kong";
export type CompassField =
  | "computer-science"
  | "business"
  | "engineering"
  | "social-sciences"
  | "design";
export type CompassCategory = "ambitious" | "target" | "safe";

export type CompassProfile = {
  degree: CompassDegree;
  field: CompassField;
  destinations: CompassDestination[];
  gpaPercent: number;
  ielts: number | null;
  toefl: number | null;
  hsk: number | null;
  sat: number | null;
  annualBudgetUsd: number;
  intakeYear: number;
  priorities: string;
};

type Program = {
  id: string;
  university: string;
  name: string;
  destination: CompassDestination;
  city: string;
  degree: CompassDegree;
  fields: CompassField[];
  language: "english" | "chinese";
  minimumGpa: number;
  recommendedGpa: number;
  minimumIelts?: number;
  minimumToefl?: number;
  minimumHsk?: number;
  recommendedSat?: number;
  tuitionUsd: number;
  livingUsd: number;
  deadlineHint: string;
  documents: string[];
  sourceUrl: string;
  selectivity: number;
};

export type CompassRuleCheck = {
  key: "academics" | "language" | "budget" | "exam";
  label: string;
  status: "pass" | "warning" | "missing";
  detail: string;
};

export type CompassProgramResult = {
  id: string;
  university: string;
  name: string;
  destination: CompassDestination;
  city: string;
  category: CompassCategory;
  score: number;
  language: "english" | "chinese";
  tuitionUsd: number;
  livingUsd: number;
  annualCostUsd: number;
  deadlineHint: string;
  documents: string[];
  missingItems: string[];
  ruleChecks: CompassRuleCheck[];
  fit: string;
  risk: string;
  nextAction: string;
  sourceUrl: string;
};

export type CompassScenario = {
  title: string;
  change: string;
  effect: string;
};

export type CompassAnalysis = {
  mode: "ai" | "rules";
  model: string | null;
  generatedAt: string;
  catalogVersion: string;
  summary: string;
  notice: string;
  programs: CompassProgramResult[];
  scenarios: CompassScenario[];
  parentReport: string;
  questionsForExpert: string[];
};

type AiEnrichment = {
  summary: string;
  program_narratives: Array<{
    program_id: string;
    fit: string;
    risk: string;
    next_action: string;
  }>;
  scenarios: CompassScenario[];
  parent_report: string;
  questions_for_expert: string[];
};

const CATALOG_VERSION = "2026-07-29";

const commonDocuments = [
  "Аттестат или диплом с транскриптом",
  "Мотивационное письмо",
  "Рекомендации",
  "Подтверждение языка",
  "Паспорт",
];

const programs: Program[] = [
  {
    id: "hku-beng-cs",
    university: "The University of Hong Kong",
    name: "Bachelor of Engineering — Computer Science",
    destination: "hong-kong",
    city: "Hong Kong",
    degree: "bachelor",
    fields: ["computer-science", "engineering"],
    language: "english",
    minimumGpa: 84,
    recommendedGpa: 90,
    minimumIelts: 6.5,
    minimumToefl: 93,
    recommendedSat: 1430,
    tuitionUsd: 26000,
    livingUsd: 15000,
    deadlineHint: "Основной раунд обычно ноябрь–январь; дату intake нужно подтвердить",
    documents: [...commonDocuments, "Профильные оценки по математике"],
    sourceUrl: "https://admissions.hku.hk/apply/international-qualifications",
    selectivity: 14,
  },
  {
    id: "hkust-beng-cse",
    university: "HKUST",
    name: "BEng in Computer Science and Engineering",
    destination: "hong-kong",
    city: "Hong Kong",
    degree: "bachelor",
    fields: ["computer-science", "engineering"],
    language: "english",
    minimumGpa: 82,
    recommendedGpa: 88,
    minimumIelts: 6.5,
    minimumToefl: 80,
    recommendedSat: 1400,
    tuitionUsd: 25000,
    livingUsd: 15000,
    deadlineHint: "Ранний раунд обычно осенью, основной — до зимы",
    documents: [...commonDocuments, "Профильные оценки по математике и физике"],
    sourceUrl: "https://join.hkust.edu.hk/admissions/international-qualifications",
    selectivity: 12,
  },
  {
    id: "cuhk-bsc-cse",
    university: "The Chinese University of Hong Kong",
    name: "BSc in Computer Science and Engineering",
    destination: "hong-kong",
    city: "Hong Kong",
    degree: "bachelor",
    fields: ["computer-science", "engineering"],
    language: "english",
    minimumGpa: 80,
    recommendedGpa: 86,
    minimumIelts: 6,
    minimumToefl: 80,
    recommendedSat: 1360,
    tuitionUsd: 23000,
    livingUsd: 14000,
    deadlineHint: "Приоритетный раунд обычно осенью, регулярный — зимой",
    documents: [...commonDocuments, "Профильные оценки по математике"],
    sourceUrl: "https://admission.cuhk.edu.hk/application/non-jupas/",
    selectivity: 10,
  },
  {
    id: "hku-bba",
    university: "The University of Hong Kong",
    name: "Bachelor of Business Administration",
    destination: "hong-kong",
    city: "Hong Kong",
    degree: "bachelor",
    fields: ["business"],
    language: "english",
    minimumGpa: 84,
    recommendedGpa: 90,
    minimumIelts: 6.5,
    minimumToefl: 93,
    recommendedSat: 1420,
    tuitionUsd: 26000,
    livingUsd: 15000,
    deadlineHint: "Основной раунд обычно ноябрь–январь; дату intake нужно подтвердить",
    documents: [...commonDocuments, "Резюме достижений"],
    sourceUrl: "https://admissions.hku.hk/apply/international-qualifications",
    selectivity: 14,
  },
  {
    id: "hkust-bba",
    university: "HKUST",
    name: "BBA in Global Business",
    destination: "hong-kong",
    city: "Hong Kong",
    degree: "bachelor",
    fields: ["business", "social-sciences"],
    language: "english",
    minimumGpa: 82,
    recommendedGpa: 88,
    minimumIelts: 6.5,
    minimumToefl: 80,
    recommendedSat: 1400,
    tuitionUsd: 25000,
    livingUsd: 15000,
    deadlineHint: "Ранний раунд обычно осенью, основной — до зимы",
    documents: [...commonDocuments, "Резюме достижений"],
    sourceUrl: "https://join.hkust.edu.hk/admissions/international-qualifications",
    selectivity: 12,
  },
  {
    id: "cuhk-bssc",
    university: "The Chinese University of Hong Kong",
    name: "Bachelor of Social Science",
    destination: "hong-kong",
    city: "Hong Kong",
    degree: "bachelor",
    fields: ["social-sciences", "business"],
    language: "english",
    minimumGpa: 78,
    recommendedGpa: 84,
    minimumIelts: 6,
    minimumToefl: 80,
    tuitionUsd: 23000,
    livingUsd: 14000,
    deadlineHint: "Приоритетный раунд обычно осенью, регулярный — зимой",
    documents: commonDocuments,
    sourceUrl: "https://admission.cuhk.edu.hk/application/non-jupas/",
    selectivity: 9,
  },
  {
    id: "polyu-ba-design",
    university: "The Hong Kong Polytechnic University",
    name: "BA (Hons) Scheme in Design",
    destination: "hong-kong",
    city: "Hong Kong",
    degree: "bachelor",
    fields: ["design"],
    language: "english",
    minimumGpa: 76,
    recommendedGpa: 82,
    minimumIelts: 6,
    minimumToefl: 80,
    tuitionUsd: 21000,
    livingUsd: 14000,
    deadlineHint: "Основной период подачи обычно осень–зима",
    documents: [...commonDocuments, "Портфолио"],
    sourceUrl: "https://www.polyu.edu.hk/study/ug/admissions/international/",
    selectivity: 8,
  },
  {
    id: "cityu-ba-new-media",
    university: "City University of Hong Kong",
    name: "BA in New Media",
    destination: "hong-kong",
    city: "Hong Kong",
    degree: "bachelor",
    fields: ["design", "social-sciences"],
    language: "english",
    minimumGpa: 76,
    recommendedGpa: 82,
    minimumIelts: 6.5,
    minimumToefl: 79,
    tuitionUsd: 21000,
    livingUsd: 14000,
    deadlineHint: "Основной период подачи обычно осень–зима",
    documents: [...commonDocuments, "Портфолио или творческое задание"],
    sourceUrl: "https://www.cityu.edu.hk/admo/admissions/international-admission",
    selectivity: 8,
  },
  {
    id: "tsinghua-gte",
    university: "Tsinghua University",
    name: "Global Talents in Science and Engineering",
    destination: "china",
    city: "Beijing",
    degree: "bachelor",
    fields: ["computer-science", "engineering"],
    language: "english",
    minimumGpa: 88,
    recommendedGpa: 94,
    minimumIelts: 6.5,
    minimumToefl: 90,
    recommendedSat: 1450,
    tuitionUsd: 6000,
    livingUsd: 9000,
    deadlineHint: "Раунды обычно проходят с осени до начала года поступления",
    documents: [...commonDocuments, "Профильные оценки и подтверждение академических наград"],
    sourceUrl: "https://international.join-tsinghua.edu.cn/",
    selectivity: 16,
  },
  {
    id: "zju-engineering",
    university: "Zhejiang University",
    name: "English-taught Engineering Track",
    destination: "china",
    city: "Hangzhou",
    degree: "bachelor",
    fields: ["computer-science", "engineering"],
    language: "english",
    minimumGpa: 80,
    recommendedGpa: 87,
    minimumIelts: 6,
    minimumToefl: 75,
    recommendedSat: 1350,
    tuitionUsd: 9000,
    livingUsd: 8000,
    deadlineHint: "Подача обычно открыта зимой и завершается весной",
    documents: [...commonDocuments, "Профильные оценки по математике и физике"],
    sourceUrl: "https://iczu.zju.edu.cn/admissionsen/",
    selectivity: 10,
  },
  {
    id: "cuhksz-bsc-cs",
    university: "CUHK-Shenzhen",
    name: "BSc in Computer Science and Engineering",
    destination: "china",
    city: "Shenzhen",
    degree: "bachelor",
    fields: ["computer-science", "engineering"],
    language: "english",
    minimumGpa: 78,
    recommendedGpa: 84,
    minimumIelts: 6.5,
    minimumToefl: 80,
    recommendedSat: 1320,
    tuitionUsd: 16000,
    livingUsd: 9000,
    deadlineHint: "Международная подача обычно идёт зимой и весной",
    documents: [...commonDocuments, "Профильные оценки по математике"],
    sourceUrl: "https://admissions.cuhk.edu.cn/en",
    selectivity: 8,
  },
  {
    id: "cuhksz-global-business",
    university: "CUHK-Shenzhen",
    name: "BBA in Global Business Studies",
    destination: "china",
    city: "Shenzhen",
    degree: "bachelor",
    fields: ["business", "social-sciences"],
    language: "english",
    minimumGpa: 78,
    recommendedGpa: 84,
    minimumIelts: 6.5,
    minimumToefl: 80,
    recommendedSat: 1320,
    tuitionUsd: 16000,
    livingUsd: 9000,
    deadlineHint: "Международная подача обычно идёт зимой и весной",
    documents: [...commonDocuments, "Резюме достижений"],
    sourceUrl: "https://admissions.cuhk.edu.cn/en",
    selectivity: 8,
  },
  {
    id: "nyush-undergraduate",
    university: "NYU Shanghai",
    name: "Undergraduate Liberal Arts and Sciences",
    destination: "china",
    city: "Shanghai",
    degree: "bachelor",
    fields: ["computer-science", "business", "social-sciences", "design"],
    language: "english",
    minimumGpa: 82,
    recommendedGpa: 89,
    minimumIelts: 7,
    minimumToefl: 100,
    recommendedSat: 1420,
    tuitionUsd: 62000,
    livingUsd: 16000,
    deadlineHint: "Early Decision обычно осенью, Regular Decision — в начале года",
    documents: [...commonDocuments, "Common Application", "Эссе"],
    sourceUrl: "https://shanghai.nyu.edu/admissions",
    selectivity: 14,
  },
  {
    id: "dku-undergraduate",
    university: "Duke Kunshan University",
    name: "Interdisciplinary Undergraduate Program",
    destination: "china",
    city: "Kunshan",
    degree: "bachelor",
    fields: ["computer-science", "business", "social-sciences", "design"],
    language: "english",
    minimumGpa: 80,
    recommendedGpa: 87,
    minimumIelts: 7,
    minimumToefl: 100,
    recommendedSat: 1380,
    tuitionUsd: 65000,
    livingUsd: 15000,
    deadlineHint: "Ранний раунд обычно осенью, регулярный — в начале года",
    documents: [...commonDocuments, "Common Application", "Эссе"],
    sourceUrl: "https://admissions.dukekunshan.edu.cn/en/",
    selectivity: 12,
  },
  {
    id: "xjtlu-industrial-design",
    university: "Xi’an Jiaotong-Liverpool University",
    name: "BA Industrial Design",
    destination: "china",
    city: "Suzhou",
    degree: "bachelor",
    fields: ["design", "engineering"],
    language: "english",
    minimumGpa: 72,
    recommendedGpa: 78,
    minimumIelts: 6,
    minimumToefl: 78,
    tuitionUsd: 14000,
    livingUsd: 8000,
    deadlineHint: "Подача обычно доступна до весны или начала лета",
    documents: [...commonDocuments, "Портфолио"],
    sourceUrl: "https://www.xjtlu.edu.cn/en/admissions/global",
    selectivity: 5,
  },
  {
    id: "hku-msc-cs",
    university: "The University of Hong Kong",
    name: "MSc in Computer Science",
    destination: "hong-kong",
    city: "Hong Kong",
    degree: "master",
    fields: ["computer-science"],
    language: "english",
    minimumGpa: 78,
    recommendedGpa: 84,
    minimumIelts: 6,
    minimumToefl: 80,
    tuitionUsd: 31000,
    livingUsd: 15000,
    deadlineHint: "Раунды обычно идут с осени до весны; ранняя подача предпочтительна",
    documents: [...commonDocuments, "Резюме", "Описание профильных курсов"],
    sourceUrl: "https://www.msc-cs.hku.hk/AdmissionRequirements",
    selectivity: 12,
  },
  {
    id: "hkust-msc-big-data",
    university: "HKUST",
    name: "MSc in Big Data Technology",
    destination: "hong-kong",
    city: "Hong Kong",
    degree: "master",
    fields: ["computer-science", "engineering"],
    language: "english",
    minimumGpa: 76,
    recommendedGpa: 82,
    minimumIelts: 6.5,
    minimumToefl: 80,
    tuitionUsd: 32000,
    livingUsd: 15000,
    deadlineHint: "Несколько раундов обычно проходят с осени до весны",
    documents: [...commonDocuments, "Резюме", "Описание профильных курсов"],
    sourceUrl: "https://prog-crs.hkust.edu.hk/pgprog/2026-27/msc-bdt",
    selectivity: 10,
  },
  {
    id: "cuhk-msc-information-engineering",
    university: "The Chinese University of Hong Kong",
    name: "MSc in Information Engineering",
    destination: "hong-kong",
    city: "Hong Kong",
    degree: "master",
    fields: ["computer-science", "engineering"],
    language: "english",
    minimumGpa: 74,
    recommendedGpa: 80,
    minimumIelts: 6.5,
    minimumToefl: 79,
    tuitionUsd: 28000,
    livingUsd: 14000,
    deadlineHint: "Раунды обычно идут с осени до весны",
    documents: [...commonDocuments, "Резюме", "Описание профильных курсов"],
    sourceUrl: "https://www.ie.cuhk.edu.hk/programmes/msc/",
    selectivity: 8,
  },
  {
    id: "hku-msc-business-analytics",
    university: "The University of Hong Kong",
    name: "MSc in Business Analytics",
    destination: "hong-kong",
    city: "Hong Kong",
    degree: "master",
    fields: ["business", "computer-science"],
    language: "english",
    minimumGpa: 80,
    recommendedGpa: 86,
    minimumIelts: 6,
    minimumToefl: 80,
    tuitionUsd: 47000,
    livingUsd: 15000,
    deadlineHint: "Несколько раундов обычно идут с осени до весны",
    documents: [...commonDocuments, "Резюме", "GMAT/GRE — если усиливает профиль"],
    sourceUrl: "https://msc.hkubs.hku.hk/articles/masterofscienceinbusinessanalytics",
    selectivity: 13,
  },
  {
    id: "hkust-msc-management",
    university: "HKUST",
    name: "MSc in International Management",
    destination: "hong-kong",
    city: "Hong Kong",
    degree: "master",
    fields: ["business", "social-sciences"],
    language: "english",
    minimumGpa: 78,
    recommendedGpa: 84,
    minimumIelts: 6.5,
    minimumToefl: 80,
    tuitionUsd: 45000,
    livingUsd: 15000,
    deadlineHint: "Несколько раундов обычно идут с осени до весны",
    documents: [...commonDocuments, "Резюме", "GMAT/GRE — если усиливает профиль"],
    sourceUrl: "https://mimt.hkust.edu.hk/admissions",
    selectivity: 11,
  },
  {
    id: "polyu-master-design",
    university: "The Hong Kong Polytechnic University",
    name: "Master of Design",
    destination: "hong-kong",
    city: "Hong Kong",
    degree: "master",
    fields: ["design"],
    language: "english",
    minimumGpa: 74,
    recommendedGpa: 80,
    minimumIelts: 6,
    minimumToefl: 80,
    tuitionUsd: 30000,
    livingUsd: 14000,
    deadlineHint: "Подача обычно начинается осенью и идёт раундами",
    documents: [...commonDocuments, "Портфолио", "Резюме"],
    sourceUrl: "https://www.polyu.edu.hk/sd/study/taught-postgraduate-programmes/master-of-design/",
    selectivity: 8,
  },
  {
    id: "cuhksz-msc-data-science",
    university: "CUHK-Shenzhen",
    name: "MSc in Data Science",
    destination: "china",
    city: "Shenzhen",
    degree: "master",
    fields: ["computer-science", "engineering"],
    language: "english",
    minimumGpa: 74,
    recommendedGpa: 81,
    minimumIelts: 6.5,
    minimumToefl: 79,
    tuitionUsd: 32000,
    livingUsd: 9000,
    deadlineHint: "Раунды обычно идут с осени до весны",
    documents: [...commonDocuments, "Резюме", "Описание профильных курсов"],
    sourceUrl: "https://sds.cuhk.edu.cn/en/page/46",
    selectivity: 9,
  },
  {
    id: "tsinghua-meng",
    university: "Tsinghua University",
    name: "English-taught Master of Engineering Track",
    destination: "china",
    city: "Beijing",
    degree: "master",
    fields: ["computer-science", "engineering"],
    language: "english",
    minimumGpa: 82,
    recommendedGpa: 88,
    minimumIelts: 6.5,
    minimumToefl: 90,
    tuitionUsd: 12000,
    livingUsd: 9000,
    deadlineHint: "Международная подача обычно завершается зимой или ранней весной",
    documents: [...commonDocuments, "Резюме", "Исследовательский план"],
    sourceUrl: "https://yz.tsinghua.edu.cn/en/",
    selectivity: 15,
  },
  {
    id: "zju-meng",
    university: "Zhejiang University",
    name: "English-taught Master of Engineering Track",
    destination: "china",
    city: "Hangzhou",
    degree: "master",
    fields: ["computer-science", "engineering"],
    language: "english",
    minimumGpa: 76,
    recommendedGpa: 83,
    minimumIelts: 6.5,
    minimumToefl: 80,
    tuitionUsd: 10000,
    livingUsd: 8000,
    deadlineHint: "Подача обычно идёт зимой и завершается весной",
    documents: [...commonDocuments, "Резюме", "Исследовательский план"],
    sourceUrl: "https://iczu.zju.edu.cn/admissionsen/",
    selectivity: 10,
  },
  {
    id: "cuhksz-msc-marketing",
    university: "CUHK-Shenzhen",
    name: "MSc in Marketing",
    destination: "china",
    city: "Shenzhen",
    degree: "master",
    fields: ["business", "social-sciences"],
    language: "english",
    minimumGpa: 72,
    recommendedGpa: 79,
    minimumIelts: 6.5,
    minimumToefl: 79,
    tuitionUsd: 30000,
    livingUsd: 9000,
    deadlineHint: "Раунды обычно идут с осени до весны",
    documents: [...commonDocuments, "Резюме", "GMAT/GRE — если усиливает профиль"],
    sourceUrl: "https://sme.cuhk.edu.cn/en/programmes/msc-marketing",
    selectivity: 7,
  },
  {
    id: "xjtlu-msc-management",
    university: "Xi’an Jiaotong-Liverpool University",
    name: "MSc Management",
    destination: "china",
    city: "Suzhou",
    degree: "master",
    fields: ["business", "social-sciences"],
    language: "english",
    minimumGpa: 68,
    recommendedGpa: 75,
    minimumIelts: 6.5,
    minimumToefl: 90,
    tuitionUsd: 21000,
    livingUsd: 8000,
    deadlineHint: "Подача обычно доступна до весны или начала лета",
    documents: [...commonDocuments, "Резюме"],
    sourceUrl: "https://www.xjtlu.edu.cn/en/study/masters/msc-management",
    selectivity: 5,
  },
  {
    id: "xjtlu-mdes",
    university: "Xi’an Jiaotong-Liverpool University",
    name: "MDes Industrial Design",
    destination: "china",
    city: "Suzhou",
    degree: "master",
    fields: ["design", "engineering"],
    language: "english",
    minimumGpa: 68,
    recommendedGpa: 75,
    minimumIelts: 6.5,
    minimumToefl: 90,
    tuitionUsd: 21000,
    livingUsd: 8000,
    deadlineHint: "Подача обычно доступна до весны или начала лета",
    documents: [...commonDocuments, "Портфолио", "Резюме"],
    sourceUrl: "https://www.xjtlu.edu.cn/en/study/masters",
    selectivity: 5,
  },
  {
    id: "nyush-ma-social-research",
    university: "NYU Shanghai",
    name: "MA in Social Research and Public Policy",
    destination: "china",
    city: "Shanghai",
    degree: "master",
    fields: ["social-sciences"],
    language: "english",
    minimumGpa: 76,
    recommendedGpa: 82,
    minimumIelts: 7,
    minimumToefl: 100,
    tuitionUsd: 42000,
    livingUsd: 16000,
    deadlineHint: "Основной срок обычно приходится на зиму",
    documents: [...commonDocuments, "Резюме", "Академическое writing sample"],
    sourceUrl: "https://shanghai.nyu.edu/academics/graduate",
    selectivity: 10,
  },
];

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

function languageResult(program: Program, profile: CompassProfile) {
  if (program.language === "chinese") {
    if (!profile.hsk) {
      return { points: -10, status: "missing" as const, detail: `Нужен HSK ${program.minimumHsk ?? 5}` };
    }
    const passed = profile.hsk >= (program.minimumHsk ?? 5);
    return {
      points: passed ? 7 : -12,
      status: passed ? ("pass" as const) : ("warning" as const),
      detail: passed ? `HSK ${profile.hsk} проходит ориентир` : `HSK ${profile.hsk} ниже ориентира ${program.minimumHsk ?? 5}`,
    };
  }
  const passedIelts = profile.ielts !== null && profile.ielts >= (program.minimumIelts ?? 6);
  const passedToefl = profile.toefl !== null && profile.toefl >= (program.minimumToefl ?? 80);
  if (passedIelts || passedToefl) {
    return {
      points: 7,
      status: "pass" as const,
      detail: passedIelts ? `IELTS ${profile.ielts} проходит ориентир` : `TOEFL ${profile.toefl} проходит ориентир`,
    };
  }
  if (profile.ielts === null && profile.toefl === null) {
    return {
      points: -10,
      status: "missing" as const,
      detail: `Нужен IELTS от ${program.minimumIelts ?? 6} или TOEFL от ${program.minimumToefl ?? 80}`,
    };
  }
  return {
    points: -12,
    status: "warning" as const,
    detail: `Текущий языковой результат ниже ориентира`,
  };
}

function scoreProgram(program: Program, profile: CompassProfile): CompassProgramResult {
  const language = languageResult(program, profile);
  const annualCost = program.tuitionUsd + program.livingUsd;
  const budgetGap = profile.annualBudgetUsd - annualCost;
  const gpaDelta = profile.gpaPercent - program.recommendedGpa;
  const satMissing = Boolean(program.recommendedSat && profile.sat === null);
  const satDelta = program.recommendedSat && profile.sat ? profile.sat - program.recommendedSat : 0;
  const score = Math.round(
    clamp(
      72 +
        gpaDelta * 1.35 +
        language.points +
        clamp(budgetGap / 3000, -10, 7) +
        (satMissing ? -3 : clamp(satDelta / 30, -5, 5)) -
        program.selectivity * 0.55,
      25,
      96,
    ),
  );
  const category: CompassCategory = score >= 81 ? "safe" : score >= 64 ? "target" : "ambitious";
  const missingItems: string[] = [];
  if (profile.gpaPercent < program.minimumGpa) {
    missingItems.push(`Академический результат ниже базового ориентира ${program.minimumGpa}%`);
  }
  if (language.status !== "pass") {
    missingItems.push(language.detail);
  }
  if (budgetGap < 0) {
    missingItems.push(`Дефицит бюджета около $${Math.abs(Math.round(budgetGap / 1000) * 1000).toLocaleString("en-US")} в год`);
  }
  if (satMissing) {
    missingItems.push(`SAT около ${program.recommendedSat} может усилить заявку`);
  }
  const requiredPortfolio = program.documents.find((item) => item.includes("Портфолио"));
  if (requiredPortfolio) {
    missingItems.push("Нужно подготовить портфолио");
  }
  const academicStatus = profile.gpaPercent >= program.minimumGpa ? "pass" : "warning";
  const budgetStatus = budgetGap >= 0 ? "pass" : "warning";
  const examStatus = program.recommendedSat
    ? profile.sat === null
      ? "missing"
      : profile.sat >= program.recommendedSat
        ? "pass"
        : "warning"
    : "pass";
  return {
    id: program.id,
    university: program.university,
    name: program.name,
    destination: program.destination,
    city: program.city,
    category,
    score,
    language: program.language,
    tuitionUsd: program.tuitionUsd,
    livingUsd: program.livingUsd,
    annualCostUsd: annualCost,
    deadlineHint: program.deadlineHint,
    documents: program.documents,
    missingItems,
    ruleChecks: [
      {
        key: "academics",
        label: "Академика",
        status: academicStatus,
        detail: academicStatus === "pass"
          ? `${profile.gpaPercent}% проходит базовый ориентир ${program.minimumGpa}%`
          : `${profile.gpaPercent}% ниже базового ориентира ${program.minimumGpa}%`,
      },
      { key: "language", label: "Язык", status: language.status, detail: language.detail },
      {
        key: "budget",
        label: "Бюджет",
        status: budgetStatus,
        detail: budgetStatus === "pass"
          ? `Годовой бюджет покрывает ориентир $${annualCost.toLocaleString("en-US")}`
          : `Нужно ещё около $${Math.abs(Math.round(budgetGap / 1000) * 1000).toLocaleString("en-US")} в год`,
      },
      {
        key: "exam",
        label: "Экзамены",
        status: examStatus,
        detail: program.recommendedSat
          ? profile.sat === null
            ? `SAT ${program.recommendedSat}+ может усилить заявку`
            : `SAT ${profile.sat}; ориентир конкурентного профиля ${program.recommendedSat}`
          : "Дополнительный стандартизированный тест не заложен в базовую проверку",
      },
    ],
    fit: `${program.name} соответствует направлению и даёт ${category === "safe" ? "более устойчивый" : category === "target" ? "сбалансированный" : "амбициозный"} вариант в портфеле.`,
    risk: missingItems[0] ?? "Критичных формальных разрывов в анкете не найдено; конкурсный риск всё равно сохраняется.",
    nextAction: missingItems.length
      ? `Сначала закрыть: ${missingItems[0].toLowerCase()}.`
      : "Сверить intake и начать готовить мотивационное письмо под программу.",
    sourceUrl: program.sourceUrl,
  };
}

function selectShortlist(profile: CompassProfile) {
  const exact = programs.filter(
    (program) =>
      program.degree === profile.degree &&
      profile.destinations.includes(program.destination) &&
      program.fields.includes(profile.field),
  );
  const destinationPool = programs.filter(
    (program) =>
      program.degree === profile.degree &&
      profile.destinations.includes(program.destination),
  );
  const pool = exact.length >= 3
    ? exact
    : [...exact, ...destinationPool.filter((program) => !exact.some((item) => item.id === program.id))];
  const scored = pool.map((program) => scoreProgram(program, profile));
  const byDistance = [...scored].sort((a, b) => {
    const aDistance = Math.abs(a.score - 73);
    const bDistance = Math.abs(b.score - 73);
    return aDistance - bDistance || b.score - a.score;
  });
  const selected: CompassProgramResult[] = [];
  const add = (candidate?: CompassProgramResult) => {
    if (candidate && !selected.some((item) => item.id === candidate.id)) selected.push(candidate);
  };
  add(scored.filter((item) => item.category === "ambitious").sort((a, b) => b.score - a.score)[0]);
  add(scored.filter((item) => item.category === "target").sort((a, b) => b.score - a.score)[0]);
  add(scored.filter((item) => item.category === "safe").sort((a, b) => b.score - a.score)[0]);
  byDistance.forEach((item) => {
    if (selected.length < Math.min(7, Math.max(3, exact.length))) add(item);
  });
  return selected.sort((a, b) => b.score - a.score).slice(0, 7);
}

function defaultScenarios(profile: CompassProfile, shortlist: CompassProgramResult[]): CompassScenario[] {
  const averageScore = shortlist.length
    ? Math.round(shortlist.reduce((sum, item) => sum + item.score, 0) / shortlist.length)
    : 0;
  const languageMissing = shortlist.some((item) =>
    item.ruleChecks.some((check) => check.key === "language" && check.status !== "pass"),
  );
  const budgetMissing = shortlist.some((item) =>
    item.ruleChecks.some((check) => check.key === "budget" && check.status !== "pass"),
  );
  return [
    {
      title: "Текущий профиль",
      change: "Без изменений в анкете",
      effect: `Средний расчётный fit ${averageScore}%. Портфель требует экспертной проверки конкурсности и intake ${profile.intakeYear}.`,
    },
    {
      title: languageMissing ? "Поднять английский" : "Усилить академический профиль",
      change: languageMissing ? "IELTS +0.5 или эквивалент TOEFL" : "Добавить сильный профильный проект и рекомендацию",
      effect: languageMissing
        ? "Снимает языковой разрыв у части программ и переводит пограничные варианты ближе к target."
        : "Не меняет формальный балл, но улучшает доказательную часть конкурсной заявки.",
    },
    {
      title: budgetMissing ? "Расширить бюджет" : "Добавить один safe-вариант",
      change: budgetMissing ? "Плюс $10–15 тыс. в год или стратегия стипендий" : "Один вуз с более устойчивым порогом",
      effect: budgetMissing
        ? "Расширяет выбор Гонконга и англоязычных joint-venture программ в Китае."
        : "Снижает риск остаться без оффера при высокой волатильности конкурса.",
    },
  ];
}

export function validateCompassProfile(value: unknown): CompassProfile {
  if (!value || typeof value !== "object") throw new Error("Анкета не передана");
  const input = value as Partial<CompassProfile>;
  const validDegree = input.degree === "bachelor" || input.degree === "master";
  const validFields: CompassField[] = ["computer-science", "business", "engineering", "social-sciences", "design"];
  const destinations = Array.isArray(input.destinations)
    ? input.destinations.filter((item): item is CompassDestination => item === "china" || item === "hong-kong")
    : [];
  if (!validDegree || !input.field || !validFields.includes(input.field) || !destinations.length) {
    throw new Error("Выберите уровень, направление и страну");
  }
  const numberOrNull = (number: unknown) =>
    number === null || number === "" || number === undefined ? null : Number(number);
  const profile: CompassProfile = {
    degree: input.degree!,
    field: input.field,
    destinations: [...new Set(destinations)],
    gpaPercent: Number(input.gpaPercent),
    ielts: numberOrNull(input.ielts),
    toefl: numberOrNull(input.toefl),
    hsk: numberOrNull(input.hsk),
    sat: numberOrNull(input.sat),
    annualBudgetUsd: Number(input.annualBudgetUsd),
    intakeYear: Number(input.intakeYear),
    priorities: String(input.priorities ?? "").trim().slice(0, 800),
  };
  if (!Number.isFinite(profile.gpaPercent) || profile.gpaPercent < 40 || profile.gpaPercent > 100) {
    throw new Error("Укажите средний балл от 40 до 100");
  }
  if (!Number.isFinite(profile.annualBudgetUsd) || profile.annualBudgetUsd < 5000 || profile.annualBudgetUsd > 200000) {
    throw new Error("Укажите реалистичный годовой бюджет");
  }
  if (!Number.isInteger(profile.intakeYear) || profile.intakeYear < 2026 || profile.intakeYear > 2032) {
    throw new Error("Выберите год поступления от 2026 до 2032");
  }
  if (profile.ielts !== null && (profile.ielts < 0 || profile.ielts > 9)) throw new Error("IELTS должен быть от 0 до 9");
  if (profile.toefl !== null && (profile.toefl < 0 || profile.toefl > 120)) throw new Error("TOEFL должен быть от 0 до 120");
  if (profile.hsk !== null && (profile.hsk < 1 || profile.hsk > 6)) throw new Error("HSK должен быть от 1 до 6");
  if (profile.sat !== null && (profile.sat < 400 || profile.sat > 1600)) throw new Error("SAT должен быть от 400 до 1600");
  return profile;
}

export function buildRuleAnalysis(profile: CompassProfile): CompassAnalysis {
  const shortlist = selectShortlist(profile);
  const categoryCounts = shortlist.reduce(
    (acc, item) => ({ ...acc, [item.category]: acc[item.category] + 1 }),
    { ambitious: 0, target: 0, safe: 0 },
  );
  const parentReport = [
    `Red Panda Compass сформировал предварительный портфель из ${shortlist.length} программ: ${categoryCounts.ambitious} ambitious, ${categoryCounts.target} target и ${categoryCounts.safe} safe.`,
    `Профиль: средний балл ${profile.gpaPercent}%, бюджет до $${profile.annualBudgetUsd.toLocaleString("en-US")} в год, планируемый intake ${profile.intakeYear}.`,
    `Главная задача сейчас: ${shortlist.flatMap((item) => item.missingItems)[0] ?? "подтвердить актуальные дедлайны и собрать доказательную часть заявки"}.`,
    "Это диагностический расчёт, а не гарантия поступления. Финальный портфель должен подтвердить эксперт Red Panda Study.",
  ].join(" ");
  return {
    mode: "rules",
    model: null,
    generatedAt: new Date().toISOString(),
    catalogVersion: CATALOG_VERSION,
    summary: `Собран сбалансированный предварительный портфель из ${shortlist.length} программ. Сначала закройте формальные разрывы, затем подтвердите стратегию с экспертом.`,
    notice: "Расчёт выполнен проверяемым правиловым слоем. AI-пояснения включатся после добавления VIBE_API_KEY.",
    programs: shortlist,
    scenarios: defaultScenarios(profile, shortlist),
    parentReport,
    questionsForExpert: [
      "Какие программы оставить в финальном портфеле после проверки актуального intake?",
      "Где есть реалистичный шанс на scholarship или tuition waiver?",
      "Какие два элемента профиля дадут максимальный прирост за ближайшие 8–12 недель?",
    ],
  };
}

const enrichmentSchema = {
  type: "object",
  properties: {
    summary: { type: "string" },
    program_narratives: {
      type: "array",
      items: {
        type: "object",
        properties: {
          program_id: { type: "string" },
          fit: { type: "string" },
          risk: { type: "string" },
          next_action: { type: "string" },
        },
        required: ["program_id", "fit", "risk", "next_action"],
        additionalProperties: false,
      },
    },
    scenarios: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          change: { type: "string" },
          effect: { type: "string" },
        },
        required: ["title", "change", "effect"],
        additionalProperties: false,
      },
    },
    parent_report: { type: "string" },
    questions_for_expert: { type: "array", items: { type: "string" } },
  },
  required: ["summary", "program_narratives", "scenarios", "parent_report", "questions_for_expert"],
  additionalProperties: false,
} as const;

function extractJSONObject(text: string) {
  const clean = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const start = clean.indexOf("{");
  const end = clean.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("VibeMarketolog не вернул JSON");
  return clean.slice(start, end + 1);
}

function validateEnrichment(value: unknown, expectedProgramIds: string[]): AiEnrichment {
  if (!value || typeof value !== "object") throw new Error("Некорректный ответ Compass AI");
  const candidate = value as Partial<AiEnrichment>;
  const nonEmpty = (item: unknown, limit: number) =>
    typeof item === "string" && item.trim().length > 0 && item.length <= limit;
  if (!nonEmpty(candidate.summary, 1800) || !nonEmpty(candidate.parent_report, 5000)) {
    throw new Error("Compass AI вернул неполное объяснение");
  }
  if (!Array.isArray(candidate.program_narratives) || candidate.program_narratives.length !== expectedProgramIds.length) {
    throw new Error("Compass AI изменил состав программ");
  }
  const returnedIds = candidate.program_narratives.map((item) => item?.program_id);
  if (new Set(returnedIds).size !== expectedProgramIds.length || expectedProgramIds.some((id) => !returnedIds.includes(id))) {
    throw new Error("Compass AI изменил идентификаторы программ");
  }
  for (const item of candidate.program_narratives) {
    if (!nonEmpty(item.fit, 1600) || !nonEmpty(item.risk, 1600) || !nonEmpty(item.next_action, 1600)) {
      throw new Error("Compass AI вернул неполное описание программы");
    }
  }
  if (!Array.isArray(candidate.scenarios) || candidate.scenarios.length < 2 || candidate.scenarios.length > 4) {
    throw new Error("Compass AI вернул некорректные сценарии");
  }
  for (const item of candidate.scenarios) {
    if (!nonEmpty(item?.title, 300) || !nonEmpty(item?.change, 1000) || !nonEmpty(item?.effect, 1600)) {
      throw new Error("Compass AI вернул неполный сценарий");
    }
  }
  if (!Array.isArray(candidate.questions_for_expert) || candidate.questions_for_expert.length < 2 || candidate.questions_for_expert.length > 6 || candidate.questions_for_expert.some((item) => !nonEmpty(item, 600))) {
    throw new Error("Compass AI вернул некорректные вопросы эксперту");
  }
  return candidate as AiEnrichment;
}

async function idempotencyKey(userId: string | number, value: unknown) {
  const bucket = Math.floor(Date.now() / (30 * 24 * 60 * 60 * 1000));
  const bytes = new TextEncoder().encode(`${userId}:${bucket}:${JSON.stringify(value)}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const hash = Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
  return `rps-compass-${hash}`;
}

export async function enrichCompassAnalysis({
  profile,
  base,
  apiKey,
  model,
  userId,
}: {
  profile: CompassProfile;
  base: CompassAnalysis;
  apiKey: string;
  model: string;
  userId: string | number;
}): Promise<CompassAnalysis> {
  const compactPrograms = base.programs.map((program) => ({
    id: program.id,
    university: program.university,
    program: program.name,
    category: program.category,
    score: program.score,
    annual_cost_usd: program.annualCostUsd,
    deadline: program.deadlineHint,
    missing_items: program.missingItems,
    rule_checks: program.ruleChecks,
  }));
  const system = [
    "Ты — аналитический слой Red Panda Compass для поступления в Китай и Гонконг.",
    "Правиловый движок уже выбрал программы и рассчитал категории. Не добавляй, не удаляй, не переименовывай программы и не меняй категории, баллы, бюджет или дедлайны.",
    "Дай честные, конкретные объяснения на русском языке. Не обещай поступление. Явно отмечай неопределённость и то, что сроки и требования нужно подтвердить по официальной странице и у эксперта.",
    "Для каждой переданной программы верни ровно одну запись с тем же program_id.",
    "Сценарии должны быть выполнимыми и показывать эффект изменения языка, академического профиля, бюджета или состава портфеля.",
    "Отчёт для родителей должен быть спокойным, предметным и содержать риски, бюджетный контекст и ближайшее действие.",
    "Верни только один валидный JSON-объект без Markdown и комментариев. Его структура обязана точно соответствовать переданной JSON Schema.",
  ].join(" ");
  const requestValue = {
    applicant: profile,
    rule_engine_shortlist: compactPrograms,
    response_schema: enrichmentSchema,
  };
  const response = await fetch("https://lk.vibemarketolog.ru/api/agent/generate", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: "text",
      model,
      system,
      prompt: JSON.stringify(requestValue),
      max_tokens: 2400,
      effort: "low",
      thinking: false,
      strict: true,
      idempotency_key: await idempotencyKey(userId, requestValue),
    }),
    signal: AbortSignal.timeout(90_000),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`VibeMarketolog ${response.status}: ${detail.slice(0, 240)}`);
  }
  const payload = await response.json() as { status?: string; text?: string };
  if (payload.status !== "complete" || typeof payload.text !== "string") {
    throw new Error("VibeMarketolog не вернул готовый текстовый результат");
  }
  const enrichment = validateEnrichment(JSON.parse(extractJSONObject(payload.text)), base.programs.map((program) => program.id));
  const narratives = new Map(enrichment.program_narratives.map((item) => [item.program_id, item]));
  return {
    ...base,
    mode: "ai",
    model,
    summary: enrichment.summary,
    notice: "Правила проверили формальные требования; VibeMarketolog подготовил объяснения и сценарии. Финальную стратегию подтверждает эксперт.",
    programs: base.programs.map((program) => {
      const narrative = narratives.get(program.id);
      return narrative
        ? { ...program, fit: narrative.fit, risk: narrative.risk, nextAction: narrative.next_action }
        : program;
    }),
    scenarios: enrichment.scenarios.slice(0, 4),
    parentReport: enrichment.parent_report,
    questionsForExpert: enrichment.questions_for_expert.slice(0, 6),
  };
}
