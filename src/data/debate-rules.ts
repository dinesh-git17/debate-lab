// debate-rules.ts
/**
 * Static configuration for debate rules, categories, and scoring criteria.
 * Defines the canonical rule set used by moderators and the judging system.
 */

export type RuleEnforcer = 'system' | 'moderator'

export interface Rule {
  id: string
  title: string
  shortDescription: string
  fullExplanation: string
  examples?: string[]
  enforcedBy: RuleEnforcer
}

export interface RuleCategory {
  id: string
  title: string
  description: string
  icon: string
  rules: Rule[]
}

export const debateRules: RuleCategory[] = [
  {
    id: 'turn-structure',
    title: 'Turn Structure',
    description: 'How debates are organized into sequential turns',
    icon: 'ListOrdered',
    rules: [
      {
        id: 'opening-statement',
        title: 'Opening Statement',
        shortDescription: 'Each side presents their initial position',
        fullExplanation:
          "The opening statement establishes each debater's core thesis and primary arguments. This is the foundation upon which all subsequent arguments will build. Debaters should clearly state their position and outline their main points.",
        examples: [
          'FOR: "I will argue that X leads to Y because of A, B, and C."',
          'AGAINST: "I will demonstrate that X actually causes Z due to factors D, E, and F."',
        ],
        enforcedBy: 'system',
      },
      {
        id: 'constructive-argument',
        title: 'Constructive Argument',
        shortDescription: 'Develop and expand upon initial arguments',
        fullExplanation:
          'Constructive rounds allow debaters to elaborate on their opening positions, introduce supporting evidence, and build a comprehensive case. New arguments may be introduced during this phase.',
        enforcedBy: 'system',
      },
      {
        id: 'rebuttal',
        title: 'Rebuttal',
        shortDescription: "Directly address and counter opponent's arguments",
        fullExplanation:
          "Rebuttals focus on dismantling the opponent's arguments. Debaters should identify weaknesses in logic, challenge evidence, and explain why their position remains stronger. No new arguments should be introduced.",
        enforcedBy: 'moderator',
      },
      {
        id: 'cross-examination',
        title: 'Cross-Examination (Optional)',
        shortDescription: 'Direct questioning between debaters',
        fullExplanation:
          'In formats that include cross-examination, debaters may pose direct questions to their opponent. Questions should be relevant and aimed at exposing weaknesses or clarifying positions.',
        enforcedBy: 'moderator',
      },
      {
        id: 'closing-statement',
        title: 'Closing Statement',
        shortDescription: 'Summarize arguments and make final appeal',
        fullExplanation:
          "The closing statement synthesizes all arguments made, addresses key rebuttals, and makes a final persuasive appeal. No new arguments may be introduced. This is the debater's last chance to convince the audience.",
        enforcedBy: 'system',
      },
    ],
  },
  {
    id: 'conduct',
    title: 'Conduct & Etiquette',
    description: 'Standards for professional and respectful debate',
    icon: 'Scale',
    rules: [
      {
        id: 'no-personal-attacks',
        title: 'No Personal Attacks',
        shortDescription: 'Address arguments, not the arguer',
        fullExplanation:
          "Ad hominem attacks are strictly prohibited. Debaters must focus on the merits of arguments rather than attacking their opponent's character, intelligence, or motives. The moderator will issue warnings for violations.",
        examples: [
          '❌ "Only an idiot would believe that..."',
          '✓ "This argument fails because the evidence shows..."',
        ],
        enforcedBy: 'moderator',
      },
      {
        id: 'stay-on-topic',
        title: 'Stay On Topic',
        shortDescription: 'Arguments must relate to the debate topic',
        fullExplanation:
          'All arguments and rebuttals must be relevant to the stated debate topic. Tangential discussions or attempts to shift the debate to unrelated areas will be redirected by the moderator.',
        enforcedBy: 'moderator',
      },
      {
        id: 'intellectual-honesty',
        title: 'Intellectual Honesty',
        shortDescription: 'Argue in good faith without misrepresentation',
        fullExplanation:
          "Debaters should not intentionally misrepresent their opponent's arguments (strawmanning), cherry-pick data, or use other deceptive tactics. Good faith argumentation is expected.",
        enforcedBy: 'moderator',
      },
      {
        id: 'professional-language',
        title: 'Professional Language',
        shortDescription: 'Maintain appropriate and respectful tone',
        fullExplanation:
          'Language should be professional and suitable for academic discourse. Profanity, slurs, and inflammatory rhetoric are not permitted. The moderator may intervene if tone becomes inappropriate.',
        enforcedBy: 'moderator',
      },
    ],
  },
  {
    id: 'format-limits',
    title: 'Format & Limits',
    description: 'Technical constraints on debate structure',
    icon: 'Settings',
    rules: [
      {
        id: 'turn-length',
        title: 'Turn Length Limits',
        shortDescription: 'Each turn has a maximum response length',
        fullExplanation:
          'To ensure balanced participation, each turn is limited in length. The system automatically enforces these limits. Debaters should be concise and prioritize their strongest arguments.',
        enforcedBy: 'system',
      },
      {
        id: 'turn-order',
        title: 'Turn Order',
        shortDescription: 'Debaters alternate in a fixed sequence',
        fullExplanation:
          'The debate follows a strict turn order. The FOR position speaks first in opening and closing, while AGAINST responds. Neither side may speak out of turn or interrupt.',
        enforcedBy: 'system',
      },
      {
        id: 'no-editing',
        title: 'No Editing After Submission',
        shortDescription: 'Turns cannot be modified once submitted',
        fullExplanation:
          'Once a debater submits their turn, it cannot be edited or retracted. This mirrors real-time debate conditions and ensures fairness.',
        enforcedBy: 'system',
      },
    ],
  },
  {
    id: 'moderation',
    title: 'Moderator Powers',
    description: 'How Claude enforces rules and maintains order',
    icon: 'Shield',
    rules: [
      {
        id: 'moderator-role',
        title: 'Moderator Role',
        shortDescription: 'Claude serves as neutral debate moderator',
        fullExplanation:
          "Claude (Anthropic's AI) serves as the debate moderator. The moderator does not take sides on the topic but ensures rules are followed, the debate remains productive, and both sides are treated fairly.",
        enforcedBy: 'system',
      },
      {
        id: 'warnings',
        title: 'Warnings & Interventions',
        shortDescription: 'Moderator can issue warnings for rule violations',
        fullExplanation:
          'The moderator may issue warnings when rules are violated. Minor violations receive a note. Repeated or serious violations may result in the moderator interrupting to redirect the debate.',
        examples: [
          'Warning: "Please address the argument rather than the arguer."',
          'Intervention: "This point is off-topic. Please return to the main debate question."',
        ],
        enforcedBy: 'moderator',
      },
      {
        id: 'neutrality',
        title: 'Strict Neutrality',
        shortDescription: 'Moderator never favors either position',
        fullExplanation:
          'The moderator maintains strict neutrality on the debate topic. Moderation decisions are based solely on rule adherence and debate quality, never on agreement with a particular position.',
        enforcedBy: 'system',
      },
      {
        id: 'summary',
        title: 'Post-Debate Summary',
        shortDescription: 'Moderator provides closing analysis',
        fullExplanation:
          'After the debate concludes, the moderator provides a neutral summary of key arguments from both sides, notes any significant moments, and may offer an optional assessment of argumentation quality.',
        enforcedBy: 'system',
      },
    ],
  },
  {
    id: 'scoring',
    title: 'Scoring Criteria',
    description: 'How debates are evaluated when scoring is enabled',
    icon: 'Trophy',
    rules: [
      {
        id: 'argument-quality',
        title: 'Argument Quality (0-15 points)',
        shortDescription: 'Strength and validity of core arguments',
        fullExplanation:
          "Evaluates the logical structure, coherence, and persuasiveness of arguments. Strong arguments are well-reasoned, clearly articulated, and directly support the debater's position.",
        enforcedBy: 'moderator',
      },
      {
        id: 'evidence-support',
        title: 'Evidence & Support (0-10 points)',
        shortDescription: 'Use of examples, data, and supporting material',
        fullExplanation:
          'Assesses how well arguments are supported with evidence, examples, or logical reasoning. Higher scores for specific, relevant, and credible supporting material.',
        enforcedBy: 'moderator',
      },
      {
        id: 'rebuttal-effectiveness',
        title: 'Rebuttal Effectiveness (0-10 points)',
        shortDescription: "Success in countering opponent's arguments",
        fullExplanation:
          "Measures how effectively the debater addresses and undermines their opponent's points. Strong rebuttals directly engage with the opponent's best arguments.",
        enforcedBy: 'moderator',
      },
      {
        id: 'clarity-organization',
        title: 'Clarity & Organization (0-10 points)',
        shortDescription: 'How clearly arguments are presented',
        fullExplanation:
          "Evaluates the structure and clarity of the debater's presentation. Well-organized arguments with clear transitions and logical flow score higher.",
        enforcedBy: 'moderator',
      },
      {
        id: 'rule-adherence',
        title: 'Rule Adherence (0-5 points)',
        shortDescription: 'Following debate rules and moderator guidance',
        fullExplanation:
          'Points awarded for following all debate rules throughout. Deductions for warnings, off-topic arguments, or conduct violations.',
        enforcedBy: 'moderator',
      },
    ],
  },
]
