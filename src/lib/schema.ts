export type Programme = 'Addiction' | 'Family Group' | 'Weight Management'
export type Gender = 'Male' | 'Female' | 'Other' | 'Prefer not to say'
export type Timepoint = 'intake' | 'week2' | 'day28' | '3m' | '6m' | '12m'

export interface Assessment {
  timepoint: Timepoint
  date: string
  gad7?: number
  phq9?: number
  core10?: number
  topsDays?: number
  teaSubstance?: number
  teaHealth?: number
  teaLifestyle?: number
  teaCommunity?: number
}

export interface SessionRecord {
  type: 'Group' | '1:1'
  scheduled: number
  attended: number
  dna: number
  cancelled: number
}

export interface Patient {
  id: string
  dob: string
  ageBand: '18-20' | '21-30' | '31-40' | '41-50' | '51-60' | '61-70' | '71-80' | '81-90' | '91-100'
  gender: Gender
  ethnicity: 'White British' | 'White Other' | 'Black African' | 'Black Caribbean' | 'Asian' | 'Mixed' | 'Other' | 'Prefer not to say'
  religion: 'Christian' | 'Muslim' | 'Hindu' | 'Sikh' | 'Jewish' | 'Buddhist' | 'None' | 'Other' | 'Prefer not to say'
  programme: Programme
  substance?: 'Alcohol' | 'Cocaine' | 'Cannabis' | 'Opioids' | 'Gambling' | 'Emotional eating' | 'Ketamine' | 'Sex' | 'Porn' | 'Prescription Medication'
  referralSource: 'GP' | 'Self Funded' | 'Insurance' | 'Employer' | 'Family'
  funder: 'Self-funded' | 'Family' | 'Employer' | 'Spire' | 'Aviva' | 'Vita' | 'Healix' | 'VHI' | 'Police Federation' | 'Klarna' | '0% Finance'
  therapist: string
  startDate: string
  dischargeDate?: string
  completionStatus: 'Completed' | 'Currently in programme' | 'Did Not Complete' | 'Treatment Paused' | 'Offered & Refused' | 'Awaiting Admission'
  device: 'Laptop/Desktop' | 'iPhone' | 'Android' | 'Tablet'
  assessments: Assessment[]
  sessions: SessionRecord[]
}

export type ActiveFilters = {
  programme: string
  dateRange: string
  dateStart: string
  dateEnd: string
  substance: string
  ageBand: string
  gender: string
  ethnicity: string
  religion: string
  referralSource: string
  funder: string
  therapist: string
  completionStatus: string
  device: string
}

// 'none' is the default — "exclude this dimension from filtering" (identical to 'all')
export const DEFAULT_FILTERS: ActiveFilters = {
  programme:        'none',
  dateRange:        'none',
  dateStart:        '',
  dateEnd:          '',
  substance:        'none',
  ageBand:          'none',
  gender:           'none',
  ethnicity:        'none',
  religion:         'none',
  referralSource:   'none',
  funder:           'none',
  therapist:        'none',
  completionStatus: 'none',
  device:           'none',
}
