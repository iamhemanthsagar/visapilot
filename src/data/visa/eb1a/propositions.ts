import type { EB1ACriterionCode, PropositionDefinition } from '../../../types/visa/eb1a'

const define = (criterionId: string, entries: ReadonlyArray<[string, string, string[]?]>): readonly PropositionDefinition[] =>
  entries.map(([name, statement, evidenceCharacteristics], index) => ({
    id: `${criterionId}-P${index + 1}`,
    criterionId,
    name,
    statement,
    ...(evidenceCharacteristics ? { evidenceCharacteristics } : {}),
  }))

export const EB1A_PROPOSITIONS: Readonly<Record<EB1ACriterionCode, readonly PropositionDefinition[]>> = {
  C1: define('EB1A-C1', [
    ['award_receipt', 'The candidate received the prize or award.'],
    ['award_recognition', 'The prize or award is nationally or internationally recognized.'],
    ['field_excellence', 'The prize or award recognizes excellence in the candidate’s field.'],
  ]),
  C2: define('EB1A-C2', [
    ['membership', 'The candidate has or had membership in the association.'],
    ['field_membership_level', 'The specific membership level is in the relevant field.'],
    ['outstanding_achievements', 'The membership requires outstanding achievements.'],
    ['expert_judgment', 'Recognized national or international experts judge the required achievements.'],
  ]),
  C3: define('EB1A-C3', [
    ['published_material', 'Published material exists.'],
    ['material_about_beneficiary', 'The material is about the beneficiary, rather than only a passing mention.'],
    ['work_in_field', 'The material relates to the beneficiary’s work in the field.'],
    ['qualifying_publication', 'The publication is professional, a major trade publication, or other major media.'],
    ['publication_metadata', 'Required publication metadata, including title, date, and author, can be established.'],
  ]),
  C4: define('EB1A-C4', [
    ['judge_participation', 'The candidate participated as a judge, individually or on a panel.'],
    ['work_of_others', 'The activity involved judging or evaluating the work of others.'],
    ['field_relationship', 'The judging activity was in the same or an allied field.'],
    ['completed_activity', 'The candidate actually completed the judging activity.'],
  ]),
  C5: define('EB1A-C5', [
    ['contribution_identity', 'A specific contribution is identified.'],
    ['candidate_attribution', 'The contribution is attributable to the beneficiary.'],
    ['originality', 'The contribution is original.'],
    ['field_relevance', 'The contribution is in the relevant field.'],
    ['significance_evidence', 'Evidence of the contribution’s significance is present.'],
    ['major_significance', 'The significance is sufficiently major in the field.'],
  ]),
  C6: define('EB1A-C6', [
    ['authorship', 'The candidate is an author or coauthor of the article.'],
    ['article_identity', 'The article exists and can be identified.'],
    ['scholarly_nature', 'The article is scholarly.'],
    ['field_relevance', 'The article concerns the relevant field.'],
    ['qualifying_publication', 'The article was published in a qualifying professional, major trade publication, or other major media.'],
  ]),
  C7: define('EB1A-C7', [
    ['work_identity', 'The candidate’s work is identified.'],
    ['artistic_field', 'The work is in the relevant artistic field.'],
    ['actual_display', 'The work was actually displayed.'],
    ['artistic_exhibition', 'The display occurred at an artistic exhibition or showcase.'],
  ]),
  C8: define('EB1A-C8', [
    ['leading_or_critical_role', 'The candidate performed a leading or critical role.'],
    ['actual_responsibilities', 'The role is attributable to actual responsibilities and performance, not merely title.'],
    ['organization_or_establishment', 'The role was for an organization or establishment.'],
    ['distinguished_reputation', 'The organization or establishment has a distinguished reputation.'],
  ]),
  C9: define('EB1A-C9', [
    ['remuneration', 'The candidate commanded salary or remuneration at the claimed level.'],
    ['comparative_height', 'The remuneration is high or significantly high in relation to others in the field.'],
    ['meaningful_comparison', 'The comparison population and context are meaningful.'],
  ]),
  C10: define('EB1A-C10', [
    ['performing_arts_participation', 'The candidate participated in a performing-arts work or activity.'],
    ['performing_arts_context', 'The activity falls within the relevant performing-arts context.'],
    ['commercial_success', 'Commercial success is established.'],
    ['attribution', 'The commercial result can be meaningfully attributed to the candidate or work.'],
    ['objective_evidence', 'Objective commercial evidence exists or is identified as required.'],
  ]),
}
