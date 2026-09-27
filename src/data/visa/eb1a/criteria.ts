import { EB1A_RULE_VERSION, type CriterionDefinition } from '../../../types/visa/eb1a'
import { EB1A_PROPOSITIONS } from './propositions'

const sourceIds = ['INA-203-B-1-A', 'CFR-204-5-H', 'USCIS-PA-2024-24']
const criterion = (code: CriterionDefinition['code'], title: string, regulatoryRequirement: string, requirements: string[]): CriterionDefinition => ({
  id: `EB1A-${code}`,
  pathway: 'EB1A',
  code,
  title,
  regulatoryRequirement,
  requirements,
  propositionIds: EB1A_PROPOSITIONS[code].map(({ id }) => id),
  sourceIds,
  version: EB1A_RULE_VERSION,
  status: 'ACTIVE',
})

/** Versioned C1–C10 definitions. The propositions themselves live separately for reuse by later engines. */
export const EB1A_CRITERIA: readonly CriterionDefinition[] = [
  criterion('C1', 'Lesser nationally or internationally recognized prizes or awards', '8 CFR §204.5(h)(3)(i).', ['Candidate received the award or prize.', 'The award is nationally or internationally recognized.', 'The award recognizes excellence in the field.']),
  criterion('C2', 'Membership in associations requiring outstanding achievements', '8 CFR §204.5(h)(3)(ii).', ['Candidate has or had the relevant membership.', 'The membership requires outstanding achievements judged by recognized national or international experts.']),
  criterion('C3', 'Published material about the beneficiary', '8 CFR §204.5(h)(3)(iii).', ['Published material is about the beneficiary and their work in the field.', 'The publication is professional, major trade, or other major media.', 'Required publication metadata can be established.']),
  criterion('C4', 'Judging the work of others', '8 CFR §204.5(h)(3)(iv).', ['Candidate participated in judging or evaluating the work of others.', 'The activity is in the same or an allied field.', 'Participation actually occurred.']),
  criterion('C5', 'Original contributions of major significance', '8 CFR §204.5(h)(3)(v).', ['A specific, original contribution is attributable to the beneficiary in the relevant field.', 'Evidence establishes significance sufficiently major in the field.']),
  criterion('C6', 'Authorship of scholarly articles', '8 CFR §204.5(h)(3)(vi).', ['Candidate authored or coauthored an identifiable scholarly article.', 'The article concerns the relevant field and was published in a qualifying publication.']),
  criterion('C7', 'Display of work at artistic exhibitions or showcases', '8 CFR §204.5(h)(3)(vii).', ['Identified work in the relevant artistic field was actually displayed.', 'The display occurred at an artistic exhibition or showcase.']),
  criterion('C8', 'Leading or critical role', '8 CFR §204.5(h)(3)(viii).', ['Candidate performed a leading or critical role based on actual responsibilities or performance.', 'The role was for an organization or establishment with a distinguished reputation.']),
  criterion('C9', 'High salary or significantly high remuneration', '8 CFR §204.5(h)(3)(ix).', ['Candidate commanded the claimed salary or remuneration.', 'The amount is high or significantly high relative to a meaningful comparison population in the field.']),
  criterion('C10', 'Commercial success in the performing arts', '8 CFR §204.5(h)(3)(x).', ['Candidate participated in a relevant performing-arts work or activity.', 'Commercial success and meaningful attribution are supported by objective commercial evidence.']),
]
