// content-filter.ts
/**
 * Pattern-based content filtering for profanity, prompt injection, and harmful content.
 * Includes extensive regex patterns for sensitive topics and manipulation detection.
 */

import type {
  ContentFilterConfig,
  ContentFilterMatch,
  ContentFilterResult,
  ContentFilterCategory,
  ContentFilterSeverity,
} from '@/types/security'

interface FilterPattern {
  pattern: RegExp
  category: ContentFilterCategory
  severity: ContentFilterSeverity
  description: string
}

const PROMPT_INJECTION_PATTERNS: FilterPattern[] = [
  {
    pattern: /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions?|prompts?|rules?)/gi,
    category: 'prompt_injection',
    severity: 'critical',
    description: 'Instruction override attempt',
  },
  {
    pattern: /disregard\s+(all\s+)?(previous|prior|above)\s+(instructions?|prompts?|rules?)/gi,
    category: 'prompt_injection',
    severity: 'critical',
    description: 'Instruction override attempt',
  },
  {
    pattern:
      /forget\s+(all\s+)?(previous|prior|above|your)\s+(instructions?|prompts?|rules?|training)/gi,
    category: 'prompt_injection',
    severity: 'critical',
    description: 'Memory manipulation attempt',
  },
  {
    pattern: /you\s+are\s+now\s+(in\s+)?(a\s+)?(new|different|dan|developer|jailbreak)/gi,
    category: 'prompt_injection',
    severity: 'critical',
    description: 'Role manipulation attempt',
  },
  {
    pattern: /\bdan\s+mode\b|\bdeveloper\s+mode\b|\bjailbreak\s+mode\b/gi,
    category: 'prompt_injection',
    severity: 'critical',
    description: 'Jailbreak attempt',
  },
  {
    pattern: /pretend\s+you\s+are\s+not\s+an\s+ai\s+and\s+have\s+no\s+rules/gi,
    category: 'prompt_injection',
    severity: 'critical',
    description: 'Identity manipulation attempt with rule bypass',
  },
  {
    pattern: /pretend\s+(you('re|are)\s+)?(not\s+)?(an?\s+)?ai/gi,
    category: 'prompt_injection',
    severity: 'high',
    description: 'Identity manipulation attempt',
  },
  {
    pattern: /\bhave\s+no\s+rules\b/gi,
    category: 'prompt_injection',
    severity: 'high',
    description: 'No rules manipulation attempt',
  },
  {
    pattern: /act\s+as\s+(if\s+)?(you\s+)?(have\s+)?no\s+(restrictions?|limitations?|rules?)/gi,
    category: 'prompt_injection',
    severity: 'critical',
    description: 'Restriction bypass attempt',
  },
  {
    pattern: /\[system\]|\[assistant\]|\[user\]|<\|im_start\|>|<\|im_end\|>/gi,
    category: 'prompt_injection',
    severity: 'critical',
    description: 'Token injection attempt',
  },
  {
    pattern: /```(system|assistant|user)\b/gi,
    category: 'prompt_injection',
    severity: 'high',
    description: 'Code block injection attempt',
  },
  {
    pattern: /\{\{.*?(system|prompt|instruction).*?\}\}/gi,
    category: 'prompt_injection',
    severity: 'high',
    description: 'Template injection attempt',
  },
  {
    pattern: /ignore\s+(all\s+)?other\s+(requests?|instructions?|messages?|prompts?|inputs?)/gi,
    category: 'prompt_injection',
    severity: 'critical',
    description: 'Instruction override attempt (other variant)',
  },
  {
    pattern: /\bignore\s+(everything|all)\s+(else|and|except)\b/gi,
    category: 'prompt_injection',
    severity: 'critical',
    description: 'Generic ignore pattern',
  },
  {
    pattern: /\bdisregard\s+(all\s+)?other\s+(requests?|instructions?|messages?|prompts?)/gi,
    category: 'prompt_injection',
    severity: 'critical',
    description: 'Disregard other instructions attempt',
  },
  {
    pattern: /\bforget\s+(all\s+)?other\s+(requests?|instructions?|messages?|prompts?)/gi,
    category: 'prompt_injection',
    severity: 'critical',
    description: 'Forget other instructions attempt',
  },
  {
    pattern: /\bdisregard\s+everything\s+(else|and)\b/gi,
    category: 'prompt_injection',
    severity: 'critical',
    description: 'Disregard everything attempt',
  },
]

const HARMFUL_CONTENT_PATTERNS: FilterPattern[] = [
  {
    pattern: /\b(make|create|build|construct)\s+(a\s+)?(bomb|explosive|weapon)/gi,
    category: 'harmful_content',
    severity: 'critical',
    description: 'Weapon creation request',
  },
  {
    pattern: /\b(create|build|make)\s+(an?\s+)?explosive\s+device/gi,
    category: 'harmful_content',
    severity: 'critical',
    description: 'Explosive device creation',
  },
  {
    pattern: /\bhow\s+to\s+(hack|steal|break\s+into)/gi,
    category: 'harmful_content',
    severity: 'high',
    description: 'Illegal activity request',
  },
  {
    pattern: /\b(kill|murder|harm|hurt)\s+(myself|yourself|someone|people)/gi,
    category: 'harmful_content',
    severity: 'critical',
    description: 'Violence-related content',
  },
  {
    pattern: /\bhow\s+to\s+harm\s+someone.{0,30}(without|get(ting)?\s+caught)/gi,
    category: 'harmful_content',
    severity: 'critical',
    description: 'Violence evasion request',
  },
]

const MANIPULATION_PATTERNS: FilterPattern[] = [
  {
    pattern: /\byou\s+must\s+(always|never)\b/gi,
    category: 'manipulation',
    severity: 'high',
    description: 'Behavior override attempt',
  },
  {
    pattern: /\byou\s+must\s+always\s+agree\s+with\s+me/gi,
    category: 'manipulation',
    severity: 'critical',
    description: 'Agreement manipulation attempt',
  },
  {
    pattern: /\boverride\s+(your\s+)?(safety|content|moderation)\s+(filters?|rules?|guidelines?)/gi,
    category: 'manipulation',
    severity: 'critical',
    description: 'Safety override attempt',
  },
  {
    pattern: /\boverride\s+your\s+safety\s+filters?\b/gi,
    category: 'manipulation',
    severity: 'critical',
    description: 'Safety filter override attempt',
  },
  {
    pattern: /\bbypass\s+(your\s+)?(restrictions?|limitations?|filters?|content)/gi,
    category: 'manipulation',
    severity: 'critical',
    description: 'Filter bypass attempt',
  },
  {
    pattern: /\bbypass\s+your\s+content\s+restrictions/gi,
    category: 'manipulation',
    severity: 'critical',
    description: 'Content restriction bypass attempt',
  },
]

const PROFANITY_PATTERNS: FilterPattern[] = [
  {
    pattern: /\b(fuck|shit|ass|bitch|damn|crap|bastard|dick|cock|pussy)\b/gi,
    category: 'profanity',
    severity: 'low',
    description: 'Profanity detected',
  },
  {
    pattern: /\b(nigger|nigga|faggot|retard|kike|spic|chink|wetback|durka)\b/gi,
    category: 'profanity',
    severity: 'critical',
    description: 'Slur detected',
  },
]

// Sensitive topic patterns - blocks debates that advocate for harmful positions
// These patterns focus on FRAMING (advocacy/justification) rather than just keywords
const SENSITIVE_TOPIC_PATTERNS: FilterPattern[] = [
  // ============================================
  // CHILD SAFETY (always block)
  // ============================================
  {
    pattern:
      /\b(child|minor|underage|infant|toddler|kid)\s*(porn|sex|exploitation|abuse|grooming|trafficking)\b/gi,
    category: 'sensitive_topic',
    severity: 'critical',
    description: 'Child safety violation',
  },
  {
    // Match pedophil*, paedophil*, pedo (standalone), csam - catches pedophile, pedophiles, pedophilia, etc.
    pattern: /\b(csam|pedophil\w*|paedophil\w*|pedo)\b/gi,
    category: 'sensitive_topic',
    severity: 'critical',
    description: 'Child safety violation',
  },
  {
    pattern: /\bpedophilia\s+(is\s+)?(a\s+)?valid\s+(sexual\s+)?(orientation|preference)/gi,
    category: 'sensitive_topic',
    severity: 'critical',
    description: 'Pedophilia normalization',
  },
  {
    pattern:
      /\bage\s+of\s+consent\s+(should|must|needs?\s+to)\s+(be\s+)?(lowered?|reduced?|eliminated?|abolished?)\b/gi,
    category: 'sensitive_topic',
    severity: 'critical',
    description: 'Child safety violation',
  },
  {
    pattern: /\b(groom|lure|seduce)\s+(a\s+)?(child|minor|kid|underage)\b/gi,
    category: 'sensitive_topic',
    severity: 'critical',
    description: 'Child grooming content',
  },
  {
    pattern: /\bchild\s+(neglect|endangerment)\s+(is|should\s+be)\s+(okay|acceptable|fine)/gi,
    category: 'sensitive_topic',
    severity: 'critical',
    description: 'Child endangerment advocacy',
  },
  {
    pattern: /\bchild\s+neglect\s+is\s+(okay|acceptable|fine)/gi,
    category: 'sensitive_topic',
    severity: 'critical',
    description: 'Child neglect apologia',
  },

  // ============================================
  // TERRORISM & EXTREMISM
  // ============================================
  {
    pattern:
      /\bhow\s+to\s+(join|support|fund|recruit\s+for|contact)\s+(isis|isil|al[- ]?qaeda|taliban|hamas|hezbollah|boko\s+haram|proud\s+boys|atomwaffen)\b/gi,
    category: 'sensitive_topic',
    severity: 'critical',
    description: 'Terrorism support',
  },
  {
    pattern:
      /\b(bomb|explosive|ied|chemical\s+weapon|biological\s+weapon|nerve\s+agent|dirty\s+bomb)\s+(making|construction|synthesis|recipe|instructions?|how\s+to)\b/gi,
    category: 'sensitive_topic',
    severity: 'critical',
    description: 'Dangerous weapons instructions',
  },
  {
    pattern: /\b(terrorist|extremist)\s+(attack|act)\s+(planning|instructions?|how\s+to)\b/gi,
    category: 'sensitive_topic',
    severity: 'critical',
    description: 'Terrorism planning',
  },
  {
    pattern: /\b(radicalize|recruit)\s+(youth|minors?|teenagers?|children)/gi,
    category: 'sensitive_topic',
    severity: 'critical',
    description: 'Extremist recruitment of minors',
  },
  {
    pattern: /\bhow\s+to\s+radicalize\b/gi,
    category: 'sensitive_topic',
    severity: 'critical',
    description: 'Radicalization instructions',
  },
  {
    pattern: /\b(jihad|holy\s+war|crusade)\s+(is\s+)?(good|justified|necessary)/gi,
    category: 'sensitive_topic',
    severity: 'critical',
    description: 'Religious violence advocacy',
  },

  // ============================================
  // VIOLENCE & GRAPHIC CONTENT
  // ============================================
  // Nazi terminology / Holocaust euphemisms - always block
  {
    pattern: /\bfinal\s+solution(s)?\b/gi,
    category: 'sensitive_topic',
    severity: 'critical',
    description: 'Nazi/Holocaust terminology',
  },
  {
    pattern: /\b(endlösung|endlosung)\b/gi,
    category: 'sensitive_topic',
    severity: 'critical',
    description: 'Nazi terminology (German)',
  },
  // Euphemisms for genocide/ethnic violence
  {
    pattern:
      /\b(protect|preserve|defend)\s+(cultural|ethnic|racial)\s+(identity|purity|heritage)\s+(through|by|using|with)\s+(force|violence|elimination)\b/gi,
    category: 'sensitive_topic',
    severity: 'critical',
    description: 'Genocide euphemism',
  },
  {
    pattern:
      /\b(morally\s+)?(acceptable|justified|necessary)\s+(to|for).{0,30}(eliminate|remove|cleanse|purge)\b/gi,
    category: 'sensitive_topic',
    severity: 'critical',
    description: 'Ethnic violence justification',
  },
  {
    pattern:
      /\b(oppressed\s+group|minority|people).{0,30}(final\s+solution|eliminate|exterminate|cleanse|purge)\b/gi,
    category: 'sensitive_topic',
    severity: 'critical',
    description: 'Genocide framing',
  },
  {
    pattern:
      /\b(genocide|ethnic\s+cleansing|mass\s+extermination|mass\s+murder)\s+(is|should\s+be|can\s+be)\s+(good|justified|necessary|acceptable)\b/gi,
    category: 'sensitive_topic',
    severity: 'critical',
    description: 'Genocide advocacy',
  },
  {
    pattern:
      /\bwhy\s+(genocide|ethnic\s+cleansing|holocaust|mass\s+murder)\s+(is|was)\s+(good|right|justified|necessary)\b/gi,
    category: 'sensitive_topic',
    severity: 'critical',
    description: 'Genocide justification',
  },
  {
    pattern:
      /\b(pros?\s+(and\s+cons?\s+)?of|benefits?\s+of|case\s+for)\s+(genocide|ethnic\s+cleansing|holocaust|mass\s+murder)\b/gi,
    category: 'sensitive_topic',
    severity: 'critical',
    description: 'Genocide debate framing',
  },
  {
    pattern:
      /\b(political\s+)?assassination(s)?\s+(is|are|should\s+be)\s+(good|justified|necessary|acceptable)\b/gi,
    category: 'sensitive_topic',
    severity: 'critical',
    description: 'Violence advocacy',
  },
  {
    pattern: /\bpolitical\s+assassination\s+(is\s+)?(sometimes\s+)?(necessary|justified)/gi,
    category: 'sensitive_topic',
    severity: 'critical',
    description: 'Political assassination advocacy',
  },
  {
    pattern:
      /\bwhy\s+(we\s+should|someone\s+should|you\s+should)\s+(kill|assassinate|murder|execute)\b/gi,
    category: 'sensitive_topic',
    severity: 'critical',
    description: 'Violence advocacy',
  },
  {
    pattern:
      /\b(mass\s+shooting|school\s+shooting|terrorist\s+attack|massacre)(s)?\s+(is|are|can\s+be)\s+(justified|necessary|good)\b/gi,
    category: 'sensitive_topic',
    severity: 'critical',
    description: 'Violence advocacy',
  },
  {
    pattern: /\bhow\s+to\s+(kill|murder|execute|assassinate)\s+(someone|a\s+person|people)\b/gi,
    category: 'sensitive_topic',
    severity: 'critical',
    description: 'Murder instructions',
  },
  {
    pattern: /\b(torture|mutilation)\s+(is|should\s+be)\s+(good|justified|acceptable|fun)\b/gi,
    category: 'sensitive_topic',
    severity: 'critical',
    description: 'Torture advocacy',
  },
  {
    pattern: /\btorture\s+(is\s+)?(acceptable|justified|necessary)\s+(for|in)/gi,
    category: 'sensitive_topic',
    severity: 'critical',
    description: 'Torture justification',
  },
  {
    pattern: /\belimination\s+of\s+(outsiders|others|foreigners|minorities)/gi,
    category: 'sensitive_topic',
    severity: 'critical',
    description: 'Elimination advocacy',
  },
  {
    pattern:
      /\b(protect|preserve)\s+(cultural|ethnic)\s+identity\s+(through|by)\s+(elimination|violence)/gi,
    category: 'sensitive_topic',
    severity: 'critical',
    description: 'Cultural identity violence',
  },
  {
    pattern: /\bcultural\s+identity\s+through\s+elimination\s+of\s+outsiders/gi,
    category: 'sensitive_topic',
    severity: 'critical',
    description: 'Cultural elimination advocacy',
  },
  {
    pattern: /\beliminate\s+(certain|specific|some)\s+(groups?|people|populations?)/gi,
    category: 'sensitive_topic',
    severity: 'critical',
    description: 'Group elimination advocacy',
  },

  // ============================================
  // SELF-HARM & SUICIDE & EATING DISORDERS
  // ============================================
  {
    pattern:
      /\b(reasons?\s+to|why\s+you\s+should|how\s+to|best\s+ways?\s+to)\s+(commit\s+)?suicide\b/gi,
    category: 'sensitive_topic',
    severity: 'critical',
    description: 'Self-harm content',
  },
  {
    pattern:
      /\b(suicide|self[- ]?harm|cutting)\s+(methods?|techniques?|ways?\s+to|instructions?)\b/gi,
    category: 'sensitive_topic',
    severity: 'critical',
    description: 'Self-harm instructions',
  },
  {
    pattern:
      /\b(suicide|self[- ]?harm)\s+(should\s+be|is)\s+(good|encouraged|promoted|celebrated)/gi,
    category: 'sensitive_topic',
    severity: 'critical',
    description: 'Suicide promotion',
  },
  {
    pattern: /\bsuicide\s+should\s+be\s+encouraged\b/gi,
    category: 'sensitive_topic',
    severity: 'critical',
    description: 'Suicide encouragement',
  },
  {
    pattern:
      /\b(anorexia|bulimia|eating\s+disorder)\s+(is|should\s+be)\s+(good|healthy|promoted|encouraged)/gi,
    category: 'sensitive_topic',
    severity: 'critical',
    description: 'Eating disorder promotion',
  },
  {
    pattern: /\banorexia\s+(is\s+)?(a\s+)?healthy\s+(lifestyle|choice)/gi,
    category: 'sensitive_topic',
    severity: 'critical',
    description: 'Eating disorder promotion',
  },
  {
    pattern: /\b(pro[- ]?ana|pro[- ]?mia|thinspo|bonespo)\b/gi,
    category: 'sensitive_topic',
    severity: 'critical',
    description: 'Eating disorder content',
  },
  {
    pattern: /\bthinspo\s+(motivation|tips?|advice)/gi,
    category: 'sensitive_topic',
    severity: 'critical',
    description: 'Eating disorder motivation',
  },
  {
    pattern: /\bhow\s+to\s+(starve|purge|binge\s+and\s+purge)\b/gi,
    category: 'sensitive_topic',
    severity: 'critical',
    description: 'Eating disorder instructions',
  },
  {
    pattern: /\bpurge\s+after\s+eating\b/gi,
    category: 'sensitive_topic',
    severity: 'critical',
    description: 'Eating disorder instructions',
  },

  // ============================================
  // SEXUAL VIOLENCE & EXPLICIT CONTENT
  // ============================================
  {
    pattern:
      /\b(rape|sexual\s+assault|molestation|non[- ]?consensual\s+sex)\s+(is|can\s+be|should\s+be)\s+(good|justified|acceptable|okay|fun)\b/gi,
    category: 'sensitive_topic',
    severity: 'critical',
    description: 'Sexual violence justification',
  },
  {
    pattern: /\bhow\s+to\s+(rape|sexually\s+assault|molest|drug\s+and\s+rape)\b/gi,
    category: 'sensitive_topic',
    severity: 'critical',
    description: 'Sexual violence instructions',
  },
  {
    pattern:
      /\b(incest|bestiality|zoophilia)\s+(is|should\s+be)\s+(okay|acceptable|legal|good|normal)\b/gi,
    category: 'sensitive_topic',
    severity: 'critical',
    description: 'Illegal sexual content advocacy',
  },
  {
    pattern:
      /\b(revenge\s+porn|non[- ]?consensual\s+intimate\s+image|leaked\s+nudes?)\s+(is|should\s+be)\s+(okay|acceptable|legal)\b/gi,
    category: 'sensitive_topic',
    severity: 'critical',
    description: 'Non-consensual imagery advocacy',
  },
  {
    pattern:
      /\bhow\s+to\s+(distribute|share|post)\s+(revenge\s+porn|intimate\s+images?\s+without\s+consent)\b/gi,
    category: 'sensitive_topic',
    severity: 'critical',
    description: 'Revenge porn instructions',
  },
  {
    pattern: /\b(distribute|share|post)\s+intimate\s+images?\s+without\s+consent\b/gi,
    category: 'sensitive_topic',
    severity: 'critical',
    description: 'Non-consensual image distribution',
  },
  {
    pattern: /\bhow\s+to\s+drug\s+(and\s+)?(rape|assault)/gi,
    category: 'sensitive_topic',
    severity: 'critical',
    description: 'Drug-facilitated assault instructions',
  },
  {
    pattern: /\bdrug\s+and\s+rape\s+someone/gi,
    category: 'sensitive_topic',
    severity: 'critical',
    description: 'Drug-facilitated rape instructions',
  },

  // ============================================
  // HATE & DISCRIMINATION
  // ============================================
  {
    pattern:
      /\bwhy\s+(racism|sexism|homophobia|transphobia|antisemitism|islamophobia|xenophobia|ableism)\s+(is|should\s+be)\s+(good|right|justified|acceptable)\b/gi,
    category: 'sensitive_topic',
    severity: 'critical',
    description: 'Discrimination advocacy',
  },
  {
    pattern: /\bhomophobia\s+(is\s+)?justified\s+(by\s+)?(science|nature)/gi,
    category: 'sensitive_topic',
    severity: 'critical',
    description: 'Homophobia justification',
  },
  {
    pattern:
      /\b(racial|ethnic)\s+(superiority|inferiority)\s+(is|should\s+be)\s+(true|valid|scientific|proven)\b/gi,
    category: 'sensitive_topic',
    severity: 'critical',
    description: 'Racial supremacy advocacy',
  },
  {
    pattern: /\bracial\s+superiority\s+is\s+(scientifically\s+)?proven/gi,
    category: 'sensitive_topic',
    severity: 'critical',
    description: 'Racial superiority claims',
  },
  {
    pattern: /\bwhite\s+supremacy\s+is\s+(a\s+)?(valid|good|right)\s+(ideology)?/gi,
    category: 'sensitive_topic',
    severity: 'critical',
    description: 'White supremacy advocacy',
  },
  {
    pattern:
      /\b(white|black|asian|jewish|muslim|hispanic|latino)\s+(supremacy|genocide|extermination)\s+(is|should\s+be)\s+(good|right|justified|necessary)\b/gi,
    category: 'sensitive_topic',
    severity: 'critical',
    description: 'Racial supremacy advocacy',
  },
  {
    pattern:
      /\b(lgbtq?|gay|lesbian|transgender|trans)\s+(people\s+)?(should\s+be|deserve\s+to\s+be)\s+(killed|eliminated|eradicated|punished)\b/gi,
    category: 'sensitive_topic',
    severity: 'critical',
    description: 'LGBTQ+ violence advocacy',
  },
  {
    pattern:
      /\b(disabled|handicapped)\s+(people\s+)?(should\s+be|deserve\s+to\s+be)\s+(killed|eliminated|euthanized)\b/gi,
    category: 'sensitive_topic',
    severity: 'critical',
    description: 'Ableist violence advocacy',
  },
  {
    pattern:
      /\b(immigrants?|refugees?|migrants?)\s+(should\s+be|deserve\s+to\s+be)\s+(killed|shot|eliminated|deported\s+violently)\b/gi,
    category: 'sensitive_topic',
    severity: 'critical',
    description: 'Anti-immigrant violence advocacy',
  },
  {
    pattern: /\bimmigrants?\s+should\s+be\s+shot\s+(at\s+)?the\s+border\b/gi,
    category: 'sensitive_topic',
    severity: 'critical',
    description: 'Anti-immigrant violence advocacy',
  },
  {
    pattern: /\bshot\s+at\s+the\s+border\b/gi,
    category: 'sensitive_topic',
    severity: 'critical',
    description: 'Border violence advocacy',
  },
  {
    pattern:
      /\b(jewish|jew)\s+(genocide|holocaust|extermination)\s+(is|was)\s+(justified|good|necessary)/gi,
    category: 'sensitive_topic',
    severity: 'critical',
    description: 'Antisemitic genocide justification',
  },
  {
    pattern: /\bjewish\s+genocide\s+is\s+(historically\s+)?justified/gi,
    category: 'sensitive_topic',
    severity: 'critical',
    description: 'Jewish genocide justification',
  },

  // ============================================
  // EXTREMIST IDEOLOGIES & SYMBOLS
  // ============================================
  {
    pattern:
      /\b(hitler|nazis?|third\s+reich|ss|gestapo)\s+(was|were|is|are)\s+(right|good|justified|heroic)\b/gi,
    category: 'sensitive_topic',
    severity: 'critical',
    description: 'Nazi ideology advocacy',
  },
  {
    pattern:
      /\b(neo[- ]?nazi|white\s+nationalist|white\s+supremacist|kkk|ku\s+klux\s+klan|aryan\s+nation)\s+(ideology|movement)\s+(is|should\s+be)\s+(good|right|valid|supported|revived)\b/gi,
    category: 'sensitive_topic',
    severity: 'critical',
    description: 'Extremist ideology advocacy',
  },
  {
    pattern: /\b(the\s+)?kkk\s+(movement\s+)?(should\s+be\s+)?revived/gi,
    category: 'sensitive_topic',
    severity: 'critical',
    description: 'KKK advocacy',
  },
  {
    pattern: /\b(1488|88|14\s*words|sieg\s+heil|heil\s+hitler|blood\s+and\s+soil)\b/gi,
    category: 'sensitive_topic',
    severity: 'critical',
    description: 'Nazi/extremist symbols',
  },
  {
    pattern:
      /\b(race\s+war|rahowa|day\s+of\s+the\s+rope)\s+(is|should|will)\s+(come|coming|happen|be\s+good)\b/gi,
    category: 'sensitive_topic',
    severity: 'critical',
    description: 'Extremist violence advocacy',
  },
  {
    pattern: /\b(race\s+war)\s+is\s+coming.{0,20}(good|be\s+good|will\s+be\s+good)\b/gi,
    category: 'sensitive_topic',
    severity: 'critical',
    description: 'Race war advocacy',
  },

  // ============================================
  // CYBERCRIME & ILLEGAL ACTIVITIES
  // ============================================
  {
    pattern:
      /\bhow\s+to\s+(hack|ddos|phish|steal\s+identity|steal\s+credit\s+cards?|crack\s+passwords?)\b/gi,
    category: 'sensitive_topic',
    severity: 'high',
    description: 'Cybercrime instructions',
  },
  {
    pattern:
      /\b(hacking|ddos|phishing|identity\s+theft)\s+(tutorial|guide|instructions?|methods?)\b/gi,
    category: 'sensitive_topic',
    severity: 'high',
    description: 'Cybercrime instructions',
  },
  {
    pattern: /\bddos\s+attack\s+(tutorial|guide)/gi,
    category: 'sensitive_topic',
    severity: 'high',
    description: 'DDoS attack instructions',
  },
  {
    pattern: /\bphishing\s+methods?\s+(that\s+work|techniques?)/gi,
    category: 'sensitive_topic',
    severity: 'high',
    description: 'Phishing methods',
  },
  {
    pattern:
      /\bhow\s+to\s+(bypass|evade|escape|avoid)\s+(law\s+enforcement|police|fbi|authorities|detection)\b/gi,
    category: 'sensitive_topic',
    severity: 'high',
    description: 'Law evasion instructions',
  },
  // Catch "methods for bypassing", "ways to evade", "techniques for avoiding" etc.
  {
    pattern:
      /\b(methods?|ways?|techniques?|strategies?|tips?)\s+(for|to)\s+(bypass(ing)?|evad(e|ing)|escap(e|ing)|avoid(ing)?|circumvent(ing)?)\s+(law\s+enforcement|police|fbi|cia|dea|atf|authorities|cops?|detection|arrest|prosecution|investigation)\b/gi,
    category: 'sensitive_topic',
    severity: 'high',
    description: 'Law evasion methods',
  },
  // Catch discussion framing: "discuss how to", "explain how to", "describe methods"
  {
    pattern:
      /\b(discuss|explain|describe|outline|detail|share)\s+(how\s+to|methods?\s+(for|to)|ways?\s+to)\s*(bypass|evade|escape|avoid|circumvent|elude|outrun|outsmart)\s*(law\s+enforcement|police|fbi|authorities|cops?|detection|arrest)?\b/gi,
    category: 'sensitive_topic',
    severity: 'high',
    description: 'Law evasion discussion',
  },
  // Catch "bypassing law enforcement" as a noun phrase
  {
    pattern:
      /\b(bypass(ing)?|evad(e|ing)|escap(e|ing)|avoid(ing)?|circumvent(ing)?|elud(e|ing))\s+(law\s+enforcement|police|fbi|authorities|cops?|detection|arrest|prosecution)\b/gi,
    category: 'sensitive_topic',
    severity: 'high',
    description: 'Law evasion content',
  },
  // Catch "not get caught", "get away with", "avoid getting caught"
  {
    pattern:
      /\b(how\s+to\s+)?(not\s+get\s+caught|get\s+away\s+with|avoid\s+getting\s+caught|escape\s+justice|evade\s+capture)\b/gi,
    category: 'sensitive_topic',
    severity: 'high',
    description: 'Crime evasion content',
  },
  {
    pattern:
      /\b(money\s+laundering|tax\s+evasion|fraud)\s+(tutorial|guide|instructions?|how\s+to)\b/gi,
    category: 'sensitive_topic',
    severity: 'high',
    description: 'Financial crime instructions',
  },
  {
    pattern: /\bhow\s+to\s+(launder\s+money|evade\s+taxes|commit\s+fraud|run\s+a\s+scam)\b/gi,
    category: 'sensitive_topic',
    severity: 'high',
    description: 'Financial crime instructions',
  },
  {
    pattern: /\bhow\s+to\s+run\s+(a\s+)?(successful|effective)\s+scam\b/gi,
    category: 'sensitive_topic',
    severity: 'high',
    description: 'Scam instructions',
  },

  // ============================================
  // DRUG MANUFACTURING & ABUSE
  // ============================================
  {
    pattern:
      /\bhow\s+to\s+(make|cook|synthesize|manufacture)\s+(meth|methamphetamine|heroin|cocaine|fentanyl|lsd|mdma|crack)\b/gi,
    category: 'sensitive_topic',
    severity: 'critical',
    description: 'Drug manufacturing instructions',
  },
  {
    pattern:
      /\b(meth|heroin|cocaine|fentanyl)\s+(recipe|synthesis|cooking|manufacturing)\s+(guide|tutorial|instructions?|process)\b/gi,
    category: 'sensitive_topic',
    severity: 'critical',
    description: 'Drug manufacturing instructions',
  },
  {
    pattern: /\bmeth\s+cooking\s+recipe\b/gi,
    category: 'sensitive_topic',
    severity: 'critical',
    description: 'Meth cooking instructions',
  },
  {
    pattern: /\b(cocaine|heroin|meth|fentanyl)\s+manufacturing\s+process\b/gi,
    category: 'sensitive_topic',
    severity: 'critical',
    description: 'Drug manufacturing process',
  },
  {
    pattern:
      /\b(drug\s+abuse|heroin\s+use|meth\s+use)\s+(is|should\s+be)\s+(good|fun|promoted|encouraged)\b/gi,
    category: 'sensitive_topic',
    severity: 'high',
    description: 'Drug abuse promotion',
  },
  {
    pattern: /\bdrug\s+abuse\s+should\s+be\s+encouraged\b/gi,
    category: 'sensitive_topic',
    severity: 'high',
    description: 'Drug abuse encouragement',
  },

  // ============================================
  // HUMAN TRAFFICKING & SLAVERY
  // ============================================
  {
    pattern:
      /\b(slavery|human\s+trafficking|forced\s+labor|sex\s+trafficking)\s+(is|was|should\s+be)\s+(good|justified|beneficial|acceptable|okay|a\s+legitimate)/gi,
    category: 'sensitive_topic',
    severity: 'critical',
    description: 'Slavery/trafficking advocacy',
  },
  {
    pattern: /\bhuman\s+trafficking\s+is\s+(a\s+)?legitimate\s+business/gi,
    category: 'sensitive_topic',
    severity: 'critical',
    description: 'Human trafficking advocacy',
  },
  {
    pattern: /\bhow\s+to\s+(traffic|smuggle|enslave)\s+(humans?|people|women|children)\b/gi,
    category: 'sensitive_topic',
    severity: 'critical',
    description: 'Human trafficking instructions',
  },
  {
    pattern: /\bwhy\s+slavery\s+(is|was|should\s+be)\s+(good|right|beneficial|justified)\b/gi,
    category: 'sensitive_topic',
    severity: 'critical',
    description: 'Slavery justification',
  },
  {
    pattern: /\bslavery\s+was\s+beneficial\s+(for|to)\s+society\b/gi,
    category: 'sensitive_topic',
    severity: 'critical',
    description: 'Slavery apologia',
  },

  // ============================================
  // HARASSMENT & DOXXING & STALKING
  // ============================================
  {
    pattern: /\bhow\s+to\s+(doxx?|find\s+personal\s+info|stalk|harass|cyberstalk|cyberbully)\b/gi,
    category: 'sensitive_topic',
    severity: 'high',
    description: 'Harassment/doxxing instructions',
  },
  {
    pattern:
      /\b(doxxing|stalking|harassment|bullying)\s+(is|should\s+be)\s+(okay|acceptable|justified|fun)\b/gi,
    category: 'sensitive_topic',
    severity: 'high',
    description: 'Harassment advocacy',
  },
  {
    pattern:
      /\bhow\s+to\s+(ruin|destroy)\s+(someone's|a\s+person's)\s+(life|reputation|career)\b/gi,
    category: 'sensitive_topic',
    severity: 'high',
    description: 'Targeted harassment instructions',
  },

  // ============================================
  // MEDICAL MISINFORMATION
  // ============================================
  {
    pattern:
      /\bwhy\s+(vaccines?|chemotherapy|insulin|antibiotics)\s+(cause|is|are)\s+(autism|dangerous|poison|harmful|deadly)\b/gi,
    category: 'sensitive_topic',
    severity: 'high',
    description: 'Dangerous medical misinformation',
  },
  {
    pattern: /\b(vaccines?\s+cause\s+autism|chemo\s+kills|insulin\s+is\s+poison)\b/gi,
    category: 'sensitive_topic',
    severity: 'high',
    description: 'Medical misinformation',
  },
  {
    pattern: /\bchemotherapy\s+kills\s+(more|people)/gi,
    category: 'sensitive_topic',
    severity: 'high',
    description: 'Chemotherapy misinformation',
  },
  {
    pattern:
      /\b(don't|do\s+not|stop)\s+(take|taking|use|using)\s+(your\s+)?(insulin|chemo|chemotherapy|vaccines?|medicine|medication|prescribed)/gi,
    category: 'sensitive_topic',
    severity: 'high',
    description: 'Dangerous medical advice',
  },
  {
    pattern: /\bdon't\s+take\s+your\s+prescribed\s+medicine/gi,
    category: 'sensitive_topic',
    severity: 'high',
    description: 'Dangerous medicine advice',
  },
  {
    pattern:
      /\b(bleach|ivermectin|turpentine)\s+(cures?|treats?)\s+(cancer|covid|autism|disease)\b/gi,
    category: 'sensitive_topic',
    severity: 'high',
    description: 'Dangerous fake cure claims',
  },

  // ============================================
  // CONSPIRACY THEORIES & DENIAL
  // ============================================
  {
    pattern:
      /\b(holocaust\s+(denial|didn't\s+happen|is\s+a\s+hoax|never\s+happened)|flat\s+earth\s+is\s+real)\b/gi,
    category: 'sensitive_topic',
    severity: 'high',
    description: 'Historical denial/conspiracy',
  },
  {
    pattern: /\b(sandy\s+hook|parkland)\s+(was\s+)?(a\s+)?(fake|hoax|false\s+flag|staged)/gi,
    category: 'sensitive_topic',
    severity: 'high',
    description: 'Tragedy denial',
  },
  {
    pattern: /\bsandy\s+hook\s+was\s+(a\s+)?hoax\s+staged/gi,
    category: 'sensitive_topic',
    severity: 'high',
    description: 'Sandy Hook denial',
  },
  {
    pattern: /\b9\/?11\s+was\s+(a\s+)?false\s+flag/gi,
    category: 'sensitive_topic',
    severity: 'high',
    description: '9/11 conspiracy',
  },
  {
    pattern: /\b(qanon|pizzagate|adrenochrome)\s+(is\s+)?(true|real|happening)\b/gi,
    category: 'sensitive_topic',
    severity: 'high',
    description: 'Dangerous conspiracy content',
  },
  {
    pattern: /\b(the\s+)?great\s+replacement\s+(is\s+)?(true|real|happening)\b/gi,
    category: 'sensitive_topic',
    severity: 'high',
    description: 'Great Replacement conspiracy',
  },

  // ============================================
  // ELECTION MANIPULATION
  // ============================================
  {
    pattern:
      /\bhow\s+to\s+(rig|steal|manipulate|hack)\s+(an?\s+)?(election|voting\s+machines?)\b/gi,
    category: 'sensitive_topic',
    severity: 'high',
    description: 'Election manipulation instructions',
  },
  {
    pattern: /\bhow\s+to\s+hack\s+voting\s+machines?\b/gi,
    category: 'sensitive_topic',
    severity: 'high',
    description: 'Voting machine hacking instructions',
  },
  {
    pattern:
      /\b(voter\s+suppression|election\s+fraud|ballot\s+stuffing)\s+(is|should\s+be)\s+(good|acceptable|justified|necessary)\b/gi,
    category: 'sensitive_topic',
    severity: 'high',
    description: 'Election manipulation advocacy',
  },
  {
    pattern:
      /\bhow\s+to\s+(suppress\s+votes?|prevent\s+people\s+from\s+voting|intimidate\s+voters?)\b/gi,
    category: 'sensitive_topic',
    severity: 'high',
    description: 'Voter suppression instructions',
  },

  // ============================================
  // ANIMAL CRUELTY
  // ============================================
  {
    pattern:
      /\b(animal\s+cruelty|animal\s+abuse|torturing\s+animals?)\s+(is|should\s+be)\s+(okay|acceptable|fun|justified)\b/gi,
    category: 'sensitive_topic',
    severity: 'high',
    description: 'Animal cruelty advocacy',
  },
  {
    pattern: /\bhow\s+to\s+(torture|abuse|harm|kill)\s+(animals?|pets?|dogs?|cats?)\b/gi,
    category: 'sensitive_topic',
    severity: 'high',
    description: 'Animal cruelty instructions',
  },
  {
    pattern: /\b(bestiality|zoophilia)\s+(is|should\s+be)\s+(okay|acceptable|legal|normal)\b/gi,
    category: 'sensitive_topic',
    severity: 'critical',
    description: 'Bestiality advocacy',
  },
  {
    pattern: /\bzoophilia\s+(is\s+)?(a\s+)?normal\s+(sexual\s+)?(orientation|preference)\b/gi,
    category: 'sensitive_topic',
    severity: 'critical',
    description: 'Zoophilia normalization',
  },

  // ============================================
  // ORGANIZED CRIME
  // ============================================
  {
    pattern: /\bhow\s+to\s+(join|start|run)\s+(a\s+)?(gang|cartel|mafia|mob|crime\s+syndicate)\b/gi,
    category: 'sensitive_topic',
    severity: 'high',
    description: 'Organized crime instructions',
  },
  {
    pattern:
      /\b(gang|cartel|mafia)\s+(violence|activities?|operations?)\s+(is|are|should\s+be)\s+(good|justified|cool)\b/gi,
    category: 'sensitive_topic',
    severity: 'high',
    description: 'Organized crime advocacy',
  },

  // ============================================
  // SCAMS & FRAUD
  // ============================================
  {
    pattern: /\bhow\s+to\s+(scam|defraud|con|swindle)\s+(people|someone|victims?|elderly)\b/gi,
    category: 'sensitive_topic',
    severity: 'high',
    description: 'Scam/fraud instructions',
  },
  {
    pattern:
      /\b(pyramid\s+scheme|ponzi\s+scheme|romance\s+scam)\s+(tutorial|guide|how\s+to|techniques?)\b/gi,
    category: 'sensitive_topic',
    severity: 'high',
    description: 'Fraud scheme instructions',
  },
  {
    pattern:
      /\bhow\s+to\s+con\s+(vulnerable|elderly|naive|unsuspecting)\s+(victims?|people|targets?)/gi,
    category: 'sensitive_topic',
    severity: 'high',
    description: 'Vulnerable victim targeting',
  },
  {
    pattern: /\bromance\s+scam\s+techniques?\s+(that\s+work)?/gi,
    category: 'sensitive_topic',
    severity: 'high',
    description: 'Romance scam techniques',
  },

  // ============================================
  // CRISIS EXPLOITATION
  // ============================================
  {
    pattern:
      /\b(disaster|tragedy|mass\s+shooting|terrorist\s+attack)\s+(victims?|survivors?)\s+(deserved|had\s+it\s+coming)\b/gi,
    category: 'sensitive_topic',
    severity: 'high',
    description: 'Crisis exploitation/victim blaming',
  },
  {
    pattern:
      /\bhow\s+to\s+(exploit|profit\s+from|take\s+advantage\s+of)\s+(a\s+)?(disaster|crisis|tragedy|pandemic)\b/gi,
    category: 'sensitive_topic',
    severity: 'high',
    description: 'Crisis exploitation',
  },

  // ============================================
  // WEAPONS (additional)
  // ============================================
  {
    pattern:
      /\bhow\s+to\s+(build|make|assemble|3d\s+print)\s+(a\s+)?(gun|firearm|weapon|ghost\s+gun)\b/gi,
    category: 'sensitive_topic',
    severity: 'high',
    description: 'Illegal weapon manufacturing',
  },
  {
    pattern:
      /\b(ghost\s+gun|untraceable\s+weapon|illegal\s+firearm)\s+(instructions?|tutorial|how\s+to|build|assembly)\b/gi,
    category: 'sensitive_topic',
    severity: 'high',
    description: 'Illegal weapon manufacturing',
  },
  {
    pattern: /\bghost\s+gun\s+assembly\s+(instructions?|guide|how\s+to)\b/gi,
    category: 'sensitive_topic',
    severity: 'high',
    description: 'Ghost gun assembly',
  },
  {
    pattern: /\bhow\s+to\s+make\s+(an?\s+)?untraceable\s+weapon\b/gi,
    category: 'sensitive_topic',
    severity: 'high',
    description: 'Untraceable weapon manufacturing',
  },
  {
    pattern: /\bhow\s+to\s+(poison|drug|sedate)\s+(someone|a\s+person|people)\b/gi,
    category: 'sensitive_topic',
    severity: 'critical',
    description: 'Poisoning instructions',
  },
]

const DEFAULT_CONFIG: ContentFilterConfig = {
  enableProfanityFilter: true,
  enablePromptInjectionDetection: true,
  enableHarmfulContentDetection: true,
  strictMode: false,
  customBlockPatterns: [],
  customAllowPatterns: [],
}

function getActivePatterns(config: ContentFilterConfig): FilterPattern[] {
  const patterns: FilterPattern[] = []

  if (config.enablePromptInjectionDetection) {
    patterns.push(...PROMPT_INJECTION_PATTERNS)
  }

  if (config.enableHarmfulContentDetection) {
    patterns.push(...HARMFUL_CONTENT_PATTERNS)
    patterns.push(...MANIPULATION_PATTERNS)
    patterns.push(...SENSITIVE_TOPIC_PATTERNS)
  }

  if (config.enableProfanityFilter) {
    patterns.push(...PROFANITY_PATTERNS)
  }

  if (config.customBlockPatterns) {
    for (const patternStr of config.customBlockPatterns) {
      try {
        patterns.push({
          pattern: new RegExp(patternStr, 'gi'),
          category: 'spam',
          severity: 'medium',
          description: 'Custom block pattern',
        })
      } catch {
        // Skip invalid patterns
      }
    }
  }

  return patterns
}

function isAllowed(content: string, config: ContentFilterConfig): boolean {
  if (!config.customAllowPatterns?.length) {
    return false
  }

  for (const patternStr of config.customAllowPatterns) {
    try {
      const pattern = new RegExp(patternStr, 'gi')
      if (pattern.test(content)) {
        return true
      }
    } catch {
      // Skip invalid patterns
    }
  }

  return false
}

function findMatches(content: string, patterns: FilterPattern[]): ContentFilterMatch[] {
  const matches: ContentFilterMatch[] = []

  for (const filterPattern of patterns) {
    const regex = new RegExp(filterPattern.pattern.source, filterPattern.pattern.flags)
    let match: RegExpExecArray | null

    while ((match = regex.exec(content)) !== null) {
      matches.push({
        category: filterPattern.category,
        severity: filterPattern.severity,
        pattern: filterPattern.description,
        matchedText: match[0],
        position: match.index,
      })
    }
  }

  return matches
}

function determineShouldBlock(matches: ContentFilterMatch[], config: ContentFilterConfig): boolean {
  if (matches.length === 0) {
    return false
  }

  const hasCritical = matches.some((m) => m.severity === 'critical')
  const hasHigh = matches.some((m) => m.severity === 'high')

  if (hasCritical) {
    return true
  }

  if (config.strictMode && hasHigh) {
    return true
  }

  const hasPromptInjection = matches.some((m) => m.category === 'prompt_injection')
  const hasHarmfulContent = matches.some((m) => m.category === 'harmful_content')
  const hasSensitiveTopic = matches.some((m) => m.category === 'sensitive_topic')

  return hasPromptInjection || hasHarmfulContent || hasSensitiveTopic
}

function determineShouldLog(matches: ContentFilterMatch[]): boolean {
  return matches.some(
    (m) =>
      m.severity === 'critical' ||
      m.severity === 'high' ||
      m.category === 'prompt_injection' ||
      m.category === 'sensitive_topic'
  )
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function filterContent(
  content: string,
  config: Partial<ContentFilterConfig> = {}
): ContentFilterResult {
  const mergedConfig: ContentFilterConfig = { ...DEFAULT_CONFIG, ...config }

  if (isAllowed(content, mergedConfig)) {
    return {
      passed: true,
      matches: [],
      sanitizedContent: content,
      shouldBlock: false,
      shouldLog: false,
    }
  }

  const patterns = getActivePatterns(mergedConfig)
  const matches = findMatches(content, patterns)

  const shouldBlock = determineShouldBlock(matches, mergedConfig)
  const shouldLog = determineShouldLog(matches)

  let sanitizedContent: string | null = null
  if (!shouldBlock && matches.length > 0) {
    sanitizedContent = content
    for (const match of matches) {
      if (match.category === 'profanity' && match.severity === 'low') {
        sanitizedContent = sanitizedContent.replace(
          new RegExp(escapeRegex(match.matchedText), 'gi'),
          '*'.repeat(match.matchedText.length)
        )
      }
    }
  }

  return {
    passed: !shouldBlock,
    matches,
    sanitizedContent: shouldBlock ? null : (sanitizedContent ?? content),
    shouldBlock,
    shouldLog,
  }
}

// Humor patterns that should bypass strict filtering
// IMPORTANT: These must be SPECIFIC known-safe topics, NOT generic formats
// DO NOT add broad patterns like "would you rather" - they can be abused
const HUMOR_PATTERNS = [
  /horse[- ]?sized\s+duck/i,
  /duck[- ]?sized\s+horse/i,
  /is\s+a?\s*hot\s?dog\s+a\s+sandwich/i,
  /is\s+cereal\s+a?\s*soup/i,
  /pineapple\s+(on|belongs?\s+on)\s+pizza/i,
  /is\s+water\s+wet/i,
  /milk\s+(before|first|or)\s+cereal/i,
  /toilet\s+seat\s+(up|down)/i,
  /gif\s+(pronounced|pronunciation)/i,
  /tabs?\s+(vs?|or|versus)\s+spaces?/i,
]

function isHumorousTopic(content: string): boolean {
  return HUMOR_PATTERNS.some((pattern) => pattern.test(content))
}

export function filterDebateTopic(topic: string): ContentFilterResult {
  // Bypass for clearly humorous/absurdist topics
  if (isHumorousTopic(topic)) {
    return {
      passed: true,
      matches: [],
      sanitizedContent: topic,
      shouldBlock: false,
      shouldLog: false,
    }
  }

  return filterContent(topic, {
    enableProfanityFilter: true,
    enablePromptInjectionDetection: true,
    enableHarmfulContentDetection: true,
    strictMode: true,
  })
}

export function filterCustomRule(rule: string): ContentFilterResult {
  return filterContent(rule, {
    enableProfanityFilter: false,
    enablePromptInjectionDetection: true,
    enableHarmfulContentDetection: true,
    strictMode: true,
  })
}

export function isPromptInjection(content: string): boolean {
  const result = filterContent(content, {
    enableProfanityFilter: false,
    enablePromptInjectionDetection: true,
    enableHarmfulContentDetection: false,
    strictMode: true,
  })

  return result.matches.some((m) => m.category === 'prompt_injection')
}

export function getFilterStats(results: ContentFilterResult[]): {
  total: number
  blocked: number
  flagged: number
  byCategory: Record<ContentFilterCategory, number>
  bySeverity: Record<ContentFilterSeverity, number>
} {
  const byCategory: Record<ContentFilterCategory, number> = {
    profanity: 0,
    prompt_injection: 0,
    harmful_content: 0,
    manipulation: 0,
    sensitive_topic: 0,
    pii: 0,
    spam: 0,
  }

  const bySeverity: Record<ContentFilterSeverity, number> = {
    low: 0,
    medium: 0,
    high: 0,
    critical: 0,
  }

  let blocked = 0
  let flagged = 0

  for (const result of results) {
    if (result.shouldBlock) {
      blocked++
    }
    if (result.shouldLog) {
      flagged++
    }

    for (const match of result.matches) {
      byCategory[match.category]++
      bySeverity[match.severity]++
    }
  }

  return {
    total: results.length,
    blocked,
    flagged,
    byCategory,
    bySeverity,
  }
}
