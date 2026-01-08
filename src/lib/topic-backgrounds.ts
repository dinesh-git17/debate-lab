// topic-backgrounds.ts
/**
 * Topic-to-category classification for dynamic debate backgrounds.
 * Uses keyword matching with GPT-4o-mini semantic fallback.
 */

const serverLog = {
  info: (msg: string, data?: Record<string, unknown>) => {
    if (typeof window === 'undefined') {
      // eslint-disable-next-line no-console
      console.log(`[TopicClassification] ${msg}`, data ? JSON.stringify(data) : '')
    }
  },
  warn: (msg: string, data?: Record<string, unknown>) => {
    if (typeof window === 'undefined') {
      // eslint-disable-next-line no-console
      console.warn(`[TopicClassification] ${msg}`, data ? JSON.stringify(data) : '')
    }
  },
  error: (msg: string, error?: Error) => {
    if (typeof window === 'undefined') {
      // eslint-disable-next-line no-console
      console.error(`[TopicClassification] ${msg}`, error)
    }
  },
}

const classificationCache = new Map<string, BackgroundCategory>()

export type BackgroundCategory =
  | 'ai'
  | 'technology'
  | 'politics'
  | 'science'
  | 'ethics'
  | 'environment'
  | 'economics'
  | 'medicine'
  | 'education'
  | 'culture'
  | 'religion'
  | 'arts'
  | 'food'
  | 'animals'
  | 'sports'
  | 'lifestyle'
  | 'popculture'
  | 'philosophy'
  | 'humor'
  | 'default'

const CATEGORY_KEYWORDS: Record<BackgroundCategory, string[]> = {
  ai: [
    'ai',
    'artificial intelligence',
    'machine learning',
    'neural',
    'chatgpt',
    'gpt',
    'llm',
    'robot',
    'automation',
    'algorithm',
    'deep learning',
    'agi',
    'superintelligence',
    'ai art',
    'ai tutor',
    'autonomous',
  ],
  technology: [
    'tech',
    'software',
    'internet',
    'digital',
    'computer',
    'crypto',
    'cryptocurrency',
    'blockchain',
    'social media',
    'smartphone',
    'app',
    'silicon valley',
    'startup',
    'data',
    'privacy',
    'cybersecurity',
    'vr',
    'virtual reality',
    'ar',
    'augmented reality',
    'metaverse',
    'space tech',
    'android',
    'iphone',
    'tiktok',
    'instagram',
    'facebook',
    'twitter',
    'streaming',
  ],
  politics: [
    'government',
    'democracy',
    'election',
    'vote',
    'president',
    'congress',
    'law',
    'policy',
    'regulation',
    'rights',
    'freedom',
    'liberal',
    'conservative',
    'political',
    'immigration',
    'authoritarian',
    'international relations',
    'war',
    'peace',
    'national security',
    'human rights',
    'censorship',
    'surveillance',
    'criminal justice',
  ],
  science: [
    'science',
    'research',
    'study',
    'experiment',
    'physics',
    'chemistry',
    'biology',
    'space',
    'nasa',
    'quantum',
    'dna',
    'gene',
    'astronomy',
    'mars',
    'moon',
    'colonization',
    'time travel',
    'evolution',
    'universe',
    'black hole',
    'theory',
  ],
  ethics: [
    'ethics',
    'ethical',
    'moral',
    'morality',
    'bioethics',
    'utilitarianism',
    'deontology',
    'trolley problem',
    'ship of theseus',
    'virtue ethics',
    'ethical dilemma',
  ],
  environment: [
    'climate',
    'environment',
    'green',
    'sustainable',
    'carbon',
    'renewable',
    'pollution',
    'ocean',
    'forest',
    'wildlife',
    'eco',
    'nature',
    'global warming',
    'nuclear energy',
    'water',
    'conservation',
    'solar',
    'wind power',
  ],
  economics: [
    'economy',
    'economic',
    'money',
    'tax',
    'income',
    'wealth',
    'capitalism',
    'socialism',
    'market',
    'trade',
    'business',
    'inflation',
    'recession',
    'billionaire',
    'inequality',
    'ubi',
    'universal basic income',
    'corporate',
    'renting',
    'buying',
    'credit card',
    'frugal',
  ],
  medicine: [
    'medicine',
    'medical',
    'health',
    'vaccine',
    'drug',
    'pharmaceutical',
    'hospital',
    'doctor',
    'genetic engineering',
    'crispr',
    'longevity',
    'mental health',
    'diet',
    'nutrition',
    'animal testing',
    'therapy',
    'disease',
    'cure',
    'treatment',
  ],
  education: [
    'education',
    'school',
    'university',
    'college',
    'student',
    'teacher',
    'learning',
    'homework',
    'testing',
    'standardized test',
    'online school',
    'degree',
    'tuition',
    'curriculum',
    'language learning',
  ],
  culture: [
    'culture',
    'society',
    'social',
    'gender',
    'family',
    'tradition',
    'generation',
    'cancel culture',
    'freedom of speech',
    'woke',
    'identity',
  ],
  religion: [
    'religion',
    'religious',
    'god',
    'faith',
    'spiritual',
    'church',
    'bible',
    'prayer',
    'afterlife',
    'heaven',
    'hell',
    'soul',
    'atheist',
    'agnostic',
    'christian',
    'muslim',
    'jewish',
    'buddhist',
    'hindu',
  ],
  arts: [
    'art',
    'artist',
    'music',
    'film',
    'movie',
    'cinema',
    'literature',
    'book',
    'novel',
    'video game',
    'gaming',
    'celebrity',
    'netflix',
    'spotify',
    'entertainment',
    'creative',
    'museum',
    'painting',
  ],
  food: [
    'food',
    'cooking',
    'cuisine',
    'restaurant',
    'pizza',
    'pineapple',
    'vegan',
    'vegetarian',
    'meat',
    'coffee',
    'tea',
    'spicy',
    'breakfast',
    'dinner',
    'chef',
    'recipe',
    'diet',
    'eating',
  ],
  animals: [
    'animal',
    'pet',
    'dog',
    'cat',
    'zoo',
    'wildlife',
    'species',
    'endangered',
    'veterinary',
    'bird',
    'fish',
    'horse',
    'duck',
  ],
  sports: [
    'sport',
    'athlete',
    'football',
    'soccer',
    'basketball',
    'baseball',
    'tennis',
    'olympic',
    'championship',
    'messi',
    'ronaldo',
    'goat',
    'esport',
    'competition',
    'team',
    'player',
    'coach',
    'performance enhancing',
    'doping',
  ],
  lifestyle: [
    'lifestyle',
    'minimalism',
    'productivity',
    'meditation',
    'remote work',
    'work from home',
    'travel',
    'city',
    'rural',
    'living',
    'habit',
    'routine',
    'self improvement',
    'wellness',
  ],
  popculture: [
    'marvel',
    'dc',
    'pokemon',
    'star wars',
    'harry potter',
    'anime',
    'superhero',
    'meme',
    'viral',
    'trend',
    'influencer',
    'youtuber',
  ],
  philosophy: [
    'simulation',
    'consciousness',
    'free will',
    'determinism',
    'existence',
    'meaning of life',
    'reality',
    'perception',
    'truth',
    'knowledge',
    'inherently good',
    'inherently evil',
    'nature of',
  ],
  humor: [
    'hotdog',
    'sandwich',
    'cereal',
    'soup',
    'wet',
    'water wet',
    'toilet seat',
    'boneless wing',
    'chicken nugget',
    'horse-sized',
    'duck-sized',
    'milk first',
    'cereal first',
  ],
  default: [],
}

export const CATEGORY_GRADIENTS: Record<BackgroundCategory, string> = {
  ai: `
    radial-gradient(ellipse 80% 50% at 50% -20%, rgba(99, 102, 241, 0.15) 0%, transparent 50%),
    radial-gradient(ellipse 60% 40% at 80% 50%, rgba(139, 92, 246, 0.1) 0%, transparent 50%),
    radial-gradient(ellipse 50% 30% at 20% 80%, rgba(59, 130, 246, 0.08) 0%, transparent 50%)
  `,
  technology: `
    radial-gradient(ellipse 70% 50% at 30% 20%, rgba(34, 211, 238, 0.12) 0%, transparent 50%),
    radial-gradient(ellipse 50% 40% at 70% 70%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
    radial-gradient(ellipse 40% 30% at 90% 30%, rgba(99, 102, 241, 0.08) 0%, transparent 50%)
  `,
  politics: `
    radial-gradient(ellipse 60% 40% at 20% 30%, rgba(239, 68, 68, 0.08) 0%, transparent 50%),
    radial-gradient(ellipse 50% 40% at 80% 60%, rgba(59, 130, 246, 0.08) 0%, transparent 50%),
    radial-gradient(ellipse 40% 30% at 50% 80%, rgba(156, 163, 175, 0.06) 0%, transparent 50%)
  `,
  science: `
    radial-gradient(ellipse 70% 50% at 60% 20%, rgba(16, 185, 129, 0.1) 0%, transparent 50%),
    radial-gradient(ellipse 50% 40% at 30% 70%, rgba(59, 130, 246, 0.08) 0%, transparent 50%),
    radial-gradient(ellipse 40% 30% at 80% 80%, rgba(139, 92, 246, 0.06) 0%, transparent 50%)
  `,
  ethics: `
    radial-gradient(ellipse 60% 50% at 50% 30%, rgba(245, 158, 11, 0.08) 0%, transparent 50%),
    radial-gradient(ellipse 50% 40% at 20% 60%, rgba(156, 163, 175, 0.06) 0%, transparent 50%),
    radial-gradient(ellipse 40% 30% at 80% 70%, rgba(139, 92, 246, 0.06) 0%, transparent 50%)
  `,
  environment: `
    radial-gradient(ellipse 70% 50% at 40% 30%, rgba(34, 197, 94, 0.1) 0%, transparent 50%),
    radial-gradient(ellipse 50% 40% at 70% 60%, rgba(16, 185, 129, 0.08) 0%, transparent 50%),
    radial-gradient(ellipse 40% 30% at 20% 80%, rgba(59, 130, 246, 0.06) 0%, transparent 50%)
  `,
  economics: `
    radial-gradient(ellipse 60% 50% at 30% 30%, rgba(234, 179, 8, 0.08) 0%, transparent 50%),
    radial-gradient(ellipse 50% 40% at 70% 50%, rgba(34, 197, 94, 0.06) 0%, transparent 50%),
    radial-gradient(ellipse 40% 30% at 50% 80%, rgba(156, 163, 175, 0.05) 0%, transparent 50%)
  `,
  medicine: `
    radial-gradient(ellipse 70% 50% at 50% 20%, rgba(239, 68, 68, 0.08) 0%, transparent 50%),
    radial-gradient(ellipse 50% 40% at 30% 70%, rgba(59, 130, 246, 0.08) 0%, transparent 50%),
    radial-gradient(ellipse 40% 30% at 70% 60%, rgba(16, 185, 129, 0.06) 0%, transparent 50%)
  `,
  education: `
    radial-gradient(ellipse 60% 50% at 40% 30%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
    radial-gradient(ellipse 50% 40% at 70% 60%, rgba(245, 158, 11, 0.07) 0%, transparent 50%),
    radial-gradient(ellipse 40% 30% at 20% 70%, rgba(139, 92, 246, 0.05) 0%, transparent 50%)
  `,
  culture: `
    radial-gradient(ellipse 60% 50% at 50% 20%, rgba(236, 72, 153, 0.08) 0%, transparent 50%),
    radial-gradient(ellipse 50% 40% at 20% 60%, rgba(245, 158, 11, 0.06) 0%, transparent 50%),
    radial-gradient(ellipse 40% 30% at 80% 70%, rgba(139, 92, 246, 0.06) 0%, transparent 50%)
  `,
  religion: `
    radial-gradient(ellipse 70% 50% at 50% 10%, rgba(245, 158, 11, 0.1) 0%, transparent 50%),
    radial-gradient(ellipse 50% 40% at 30% 60%, rgba(139, 92, 246, 0.06) 0%, transparent 50%),
    radial-gradient(ellipse 40% 30% at 70% 80%, rgba(234, 179, 8, 0.05) 0%, transparent 50%)
  `,
  arts: `
    radial-gradient(ellipse 60% 50% at 30% 30%, rgba(236, 72, 153, 0.1) 0%, transparent 50%),
    radial-gradient(ellipse 50% 40% at 70% 50%, rgba(139, 92, 246, 0.08) 0%, transparent 50%),
    radial-gradient(ellipse 40% 30% at 50% 80%, rgba(245, 158, 11, 0.06) 0%, transparent 50%)
  `,
  food: `
    radial-gradient(ellipse 60% 50% at 40% 30%, rgba(249, 115, 22, 0.1) 0%, transparent 50%),
    radial-gradient(ellipse 50% 40% at 70% 60%, rgba(234, 179, 8, 0.08) 0%, transparent 50%),
    radial-gradient(ellipse 40% 30% at 20% 70%, rgba(239, 68, 68, 0.06) 0%, transparent 50%)
  `,
  animals: `
    radial-gradient(ellipse 70% 50% at 50% 30%, rgba(34, 197, 94, 0.08) 0%, transparent 50%),
    radial-gradient(ellipse 50% 40% at 30% 60%, rgba(245, 158, 11, 0.07) 0%, transparent 50%),
    radial-gradient(ellipse 40% 30% at 70% 70%, rgba(59, 130, 246, 0.05) 0%, transparent 50%)
  `,
  sports: `
    radial-gradient(ellipse 70% 50% at 60% 20%, rgba(239, 68, 68, 0.1) 0%, transparent 50%),
    radial-gradient(ellipse 50% 40% at 30% 60%, rgba(59, 130, 246, 0.08) 0%, transparent 50%),
    radial-gradient(ellipse 40% 30% at 70% 80%, rgba(34, 197, 94, 0.06) 0%, transparent 50%)
  `,
  lifestyle: `
    radial-gradient(ellipse 60% 50% at 40% 30%, rgba(16, 185, 129, 0.08) 0%, transparent 50%),
    radial-gradient(ellipse 50% 40% at 70% 50%, rgba(59, 130, 246, 0.07) 0%, transparent 50%),
    radial-gradient(ellipse 40% 30% at 30% 70%, rgba(139, 92, 246, 0.05) 0%, transparent 50%)
  `,
  popculture: `
    radial-gradient(ellipse 60% 50% at 50% 20%, rgba(239, 68, 68, 0.09) 0%, transparent 50%),
    radial-gradient(ellipse 50% 40% at 20% 60%, rgba(59, 130, 246, 0.08) 0%, transparent 50%),
    radial-gradient(ellipse 40% 30% at 80% 70%, rgba(245, 158, 11, 0.06) 0%, transparent 50%)
  `,
  philosophy: `
    radial-gradient(ellipse 80% 60% at 50% 30%, rgba(139, 92, 246, 0.1) 0%, transparent 50%),
    radial-gradient(ellipse 50% 40% at 30% 70%, rgba(99, 102, 241, 0.07) 0%, transparent 50%),
    radial-gradient(ellipse 40% 30% at 70% 50%, rgba(59, 130, 246, 0.05) 0%, transparent 50%)
  `,
  humor: `
    radial-gradient(ellipse 60% 50% at 40% 30%, rgba(245, 158, 11, 0.1) 0%, transparent 50%),
    radial-gradient(ellipse 50% 40% at 70% 60%, rgba(236, 72, 153, 0.08) 0%, transparent 50%),
    radial-gradient(ellipse 40% 30% at 30% 70%, rgba(34, 197, 94, 0.06) 0%, transparent 50%)
  `,
  default: `
    radial-gradient(ellipse 80% 50% at 50% 0%, rgba(99, 102, 241, 0.08) 0%, transparent 50%),
    radial-gradient(ellipse 50% 40% at 80% 80%, rgba(59, 130, 246, 0.06) 0%, transparent 50%)
  `,
}

export const CATEGORY_IMAGES: Record<BackgroundCategory, string | null> = {
  ai: '/backgrounds/ai.jpg',
  technology: '/backgrounds/technology.jpg',
  politics: '/backgrounds/politics.jpg',
  science: '/backgrounds/science.jpg',
  ethics: '/backgrounds/ethics.jpg',
  environment: '/backgrounds/environment.jpg',
  economics: '/backgrounds/economics.jpg',
  medicine: '/backgrounds/medicine.jpg',
  education: '/backgrounds/education.jpg',
  culture: '/backgrounds/culture.jpg',
  religion: '/backgrounds/religion.jpg',
  arts: '/backgrounds/arts.jpg',
  food: '/backgrounds/food.jpg',
  animals: '/backgrounds/animals.jpg',
  sports: '/backgrounds/sports.jpg',
  lifestyle: '/backgrounds/lifestyle.jpg',
  popculture: '/backgrounds/popculture.jpg',
  philosophy: '/backgrounds/philosophy.jpg',
  humor: '/backgrounds/humor.jpg',
  default: null,
}

export function getTopicCategory(topic: string): BackgroundCategory {
  const normalizedTopic = topic.toLowerCase()

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (category === 'default') continue

    for (const keyword of keywords) {
      if (normalizedTopic.includes(keyword)) {
        return category as BackgroundCategory
      }
    }
  }

  return 'default'
}

export function getTopicGradient(topic: string): string {
  const category = getTopicCategory(topic)
  return CATEGORY_GRADIENTS[category]
}

export function getTopicImagePath(topic: string): string | null {
  const category = getTopicCategory(topic)
  return CATEGORY_IMAGES[category]
}

const VALID_CATEGORIES = [
  'ai',
  'technology',
  'politics',
  'science',
  'ethics',
  'environment',
  'economics',
  'medicine',
  'education',
  'culture',
  'religion',
  'arts',
  'food',
  'animals',
  'sports',
  'lifestyle',
  'popculture',
  'philosophy',
  'humor',
] as const

export async function classifyTopicSemantically(topic: string): Promise<BackgroundCategory> {
  const apiKey = process.env.GOOGLE_API_KEY
  if (!apiKey) {
    serverLog.warn('No Google API key, returning default')
    return 'default'
  }

  try {
    serverLog.info('Calling Gemini 2.0-flash for semantic classification', { topic })

    const prompt = `You are a topic classifier. Given a debate topic, classify it into exactly ONE of these categories:
${VALID_CATEGORIES.join(', ')}

Rules:
- Respond with ONLY the category name, nothing else
- Choose the most relevant category
- If truly uncertain, respond with "default"

Categories explained:
- ai: Artificial intelligence, machine learning, robots, automation
- technology: Tech, software, internet, crypto, social media, VR/AR, smartphones
- politics: Government, elections, laws, policy, international relations, rights
- science: Physics, chemistry, biology, space, astronomy, research
- ethics: Morality, justice, philosophical dilemmas, bioethics
- environment: Climate, sustainability, conservation, renewable energy
- economics: Money, business, capitalism, socialism, wealth, markets
- medicine: Health, vaccines, genetics, mental health, medical treatments
- education: Schools, universities, learning, teaching methods
- culture: Society, gender, traditions, social movements
- religion: Faith, spirituality, religious debates
- arts: Music, film, literature, video games, entertainment
- food: Cuisine, cooking, dietary choices
- animals: Pets, wildlife, zoos, animal rights
- sports: Athletics, competitions, sports debates
- lifestyle: Personal choices, productivity, travel, living situations
- popculture: Marvel/DC, anime, memes, internet culture, fandoms
- philosophy: Existence, consciousness, reality, abstract thought experiments
- humor: Silly debates like "is a hotdog a sandwich"

Classify this debate topic: "${topic}"`

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 20, temperature: 0.2 },
        }),
      }
    )

    if (!response.ok) {
      serverLog.warn('Gemini API error', { status: response.status })
      return 'default'
    }

    const data = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
    }
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim().toLowerCase()

    serverLog.info('Gemini 2.0-flash response', { response: content })

    if (content && VALID_CATEGORIES.includes(content as (typeof VALID_CATEGORIES)[number])) {
      serverLog.info('Semantic result', { category: content })
      return content as BackgroundCategory
    }

    serverLog.warn('Invalid response, returning default', { response: content })
    return 'default'
  } catch (error) {
    serverLog.error(
      'Error during classification',
      error instanceof Error ? error : new Error(String(error))
    )
    return 'default'
  }
}

export async function getTopicCategoryWithFallback(topic: string): Promise<BackgroundCategory> {
  const cacheKey = topic.toLowerCase().trim()

  const cached = classificationCache.get(cacheKey)
  if (cached) {
    serverLog.info('Cache hit', { topic, category: cached })
    return cached
  }

  serverLog.info('Classifying topic via API', { topic })

  const category = await classifyTopicSemantically(topic)

  classificationCache.set(cacheKey, category)

  serverLog.info('Classification result', { topic, category })

  return category
}
