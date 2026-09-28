import type { PropositionDefinition } from '../../../types/visa/pathway'

export type EB1BRequirementCode =
  | 'B1' | 'B2' | 'B3' | 'B4' | 'B5' | 'B6'
  | 'B7' | 'B8' | 'B9' | 'B10'

const define = (
  requirementId: string,
  entries: ReadonlyArray<[string, string, string[]?]>,
): readonly PropositionDefinition[] =>
  entries.map(([name, statement, evidenceCharacteristics], index) => ({
    id: `${requirementId}-P${index + 1}`,
    requirementId,
    name,
    statement,
    ...(evidenceCharacteristics ? { evidenceCharacteristics } : {}),
  }))

export const EB1B_PROPOSITIONS: Readonly<Record<EB1BRequirementCode, readonly PropositionDefinition[]>> = {
  B1: define('EB1B-B1', [
    ['award_receipt', 'The candidate received the major prize or award.'],
    ['academic_excellence', 'The prize or award recognizes outstanding achievement in the academic field.'],
    ['major_award_stature', 'The prize or award is major (evaluated by criteria for receipt, national/international scope, and significance of issuing body).'],
  ]),
  B2: define('EB1B-B2', [
    ['membership_held', 'The candidate has or had membership in the association.'],
    ['academic_field_relevance', 'The association concerns the relevant academic field.'],
    ['outstanding_achievements_required', 'The specific membership grade requires outstanding achievements of its members.'],
    ['expert_judgment', 'Selection is judged by recognized national or international experts.'],
  ]),
  B3: define('EB1B-B3', [
    ['published_material_exists', 'Published material exists in professional publications.'],
    ['written_by_others', 'The material was written by others independent of the beneficiary.'],
    ['about_beneficiary_work', 'The material is about the beneficiary’s work in the academic field (not mere citation or passing mention).'],
    ['publication_metadata', 'Required publication metadata, including title, date, author, and publication name, is established.'],
  ]),
  B4: define('EB1B-B4', [
    ['judge_participation', 'The candidate participated as a judge (individually or on a panel).'],
    ['work_of_others', 'The activity involved evaluating the work of others.'],
    ['allied_academic_field', 'The judging was in the same or an allied academic field.'],
    ['completed_activity', 'The judging activity was actually completed (e.g., peer review of journal papers, editorial board duties, conference review).'],
  ]),
  B5: define('EB1B-B5', [
    ['contribution_identity', 'Specific original scientific or scholarly research contributions are identified.'],
    ['candidate_attribution', 'The research contributions are attributable to the candidate.'],
    ['academic_field_relevance', 'The research is in the academic field.'],
    ['major_significance', 'The contributions are of major significance in the academic field (e.g., widespread citation, replication, practical adoption).'],
  ]),
  B6: define('EB1B-B6', [
    ['authorship_established', 'The candidate authored or co-authored scholarly books or articles.'],
    ['academic_field_relevance', 'The published work is in the academic field.'],
    ['international_circulation', 'The publication is in scholarly journals with international circulation.'],
  ]),
  B7: define('EB1B-B7', [
    ['three_year_duration', 'The candidate possesses at least 3 years (36 months) of full-time teaching or research experience in the academic field.'],
    ['qualifying_predegree_teaching', 'Pre-degree teaching experience counts only if degree was acquired and candidate was the instructor of record with primary responsibility.'],
    ['qualifying_predegree_research', 'Pre-degree research experience counts only if degree was acquired and the research was recognized as outstanding in the academic field.'],
    ['employer_corroboration', 'Experience is substantiated by letters from current or former employers detailing dates, position, and duties.'],
  ]),
  B8: define('EB1B-B8', [
    ['permanent_job_offer', 'A formal permanent job offer exists from a prospective U.S. employer.'],
    ['tenured_or_tenure_track', 'For universities/colleges, the position is tenured, tenure-track, or a permanent research position.'],
    ['private_employer_qualifications', 'For private employers, the entity employs at least 3 full-time researchers and demonstrates documented research accomplishments.'],
  ]),
  B9: define('EB1B-B9', [
    ['defined_academic_field', 'A specific academic discipline or body of knowledge is defined.'],
    ['field_continuity', 'The candidate’s past achievements and proposed U.S. work fall within this academic field.'],
  ]),
  B10: define('EB1B-B10', [
    ['international_recognition', 'The totality of the record establishes international recognition as outstanding in the academic field.'],
    ['sustained_scholastic_record', 'The candidate maintains a sustained record of scholastic achievement and reputation in the academic discipline.'],
  ]),
}
