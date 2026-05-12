export interface SeverityBand {
  label:  string
  min:    number
  max:    number
  color:  string
}

export const GAD7_BANDS: SeverityBand[] = [
  { label: 'Minimal anxiety',  min: 0,  max: 4,  color: '#5C8A6B' },
  { label: 'Mild anxiety',     min: 5,  max: 9,  color: '#FFCB6B' },
  { label: 'Moderate anxiety', min: 10, max: 14, color: '#F4A93A' },
  { label: 'Severe anxiety',   min: 15, max: 21, color: '#C25A5A' },
]

export const PHQ9_BANDS: SeverityBand[] = [
  { label: 'None / minimal depression',    min: 0,  max: 4,  color: '#5C8A6B' },
  { label: 'Mild depression',              min: 5,  max: 9,  color: '#FFCB6B' },
  { label: 'Moderate depression',          min: 10, max: 14, color: '#F4A93A' },
  { label: 'Moderately severe depression', min: 15, max: 19, color: '#C25A5A' },
  { label: 'Severe depression',            min: 20, max: 27, color: '#A83838' },
]

export const CORE10_BANDS: SeverityBand[] = [
  { label: 'Healthy',           min: 0,  max: 5,  color: '#5C8A6B' },
  { label: 'Low-level distress',min: 6,  max: 10, color: '#FFCB6B' },
  { label: 'Mild distress',     min: 11, max: 14, color: '#F4A93A' },
  { label: 'Moderate distress', min: 15, max: 19, color: '#C25A5A' },
  { label: 'Moderate-to-severe',min: 20, max: 24, color: '#C25A5A' },
  { label: 'Severe distress',   min: 25, max: 40, color: '#A83838' },
]

export const TOPS_BANDS: SeverityBand[] = [
  { label: 'Abstinent',         min: 0,  max: 0,  color: '#5C8A6B' },
  { label: 'Low use',           min: 1,  max: 6,  color: '#FFCB6B' },
  { label: 'Moderate use',      min: 7,  max: 14, color: '#F4A93A' },
  { label: 'Heavy / daily use', min: 15, max: 28, color: '#C25A5A' },
]

export const TEA_BANDS: SeverityBand[] = [
  { label: 'Low engagement',      min: 0, max: 3,  color: '#C25A5A' },
  { label: 'Moderate engagement', min: 4, max: 6,  color: '#F4A93A' },
  { label: 'Good engagement',     min: 7, max: 8,  color: '#FFCB6B' },
  { label: 'Strong engagement',   min: 9, max: 10, color: '#5C8A6B' },
]

export const BANDS_BY_KEY: Record<string, { bands: SeverityBand[]; totalMax: number }> = {
  gad7:   { bands: GAD7_BANDS,   totalMax: 21 },
  phq9:   { bands: PHQ9_BANDS,   totalMax: 27 },
  core10: { bands: CORE10_BANDS, totalMax: 40 },
  tops:   { bands: TOPS_BANDS,   totalMax: 28 },
  tea:    { bands: TEA_BANDS,    totalMax: 10 },
}

export function getBandForScore(bands: SeverityBand[], score: number): SeverityBand {
  return bands.find(b => score >= b.min && score <= b.max) ?? bands[bands.length - 1]!
}

export function getBandName(key: string, score: number): string {
  const config = BANDS_BY_KEY[key]
  if (!config) return ''
  return getBandForScore(config.bands, score).label
}

export const MEASURE_LONG_DESC: Record<string, string> = {
  gad7:
    'Generalized Anxiety Disorder 7-item scale. A short questionnaire patients complete that scores their anxiety from 0 to 21. Higher scores mean more severe anxiety. A reduction shows the patient is feeling less anxious day-to-day.',
  phq9:
    'Patient Health Questionnaire 9-item scale. Measures depression severity from 0 to 27. Higher scores mean more severe depression. A reduction shows the patient is feeling less low, more motivated, and sleeping better.',
  core10:
    'Clinical Outcomes in Routine Evaluation 10-item scale. A general measure of psychological distress, scored 0 to 40. Captures wellbeing, problems, functioning, and risk. A reduction shows broad mental-health improvement.',
  tops:
    'Treatment Outcomes Profile (Substance use). Counts the number of days in the past 28 the patient used their problem substance or behaviour. A reduction means fewer using days — the headline measure for addiction recovery.',
  tea:
    "Treatment Engagement Assessment. Scores four life domains 0 to 10: Substance Use, Health, Lifestyle, and Community. An increase across these domains shows the patient's wider life is improving — physical health, daily routines, and connection with others, not just their symptom scores.",
}
