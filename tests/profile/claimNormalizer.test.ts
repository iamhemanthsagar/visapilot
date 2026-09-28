import { describe, expect, it } from 'vitest'

import {
  normalizeClaims,
} from '../../src/engines/profile/claimNormalizer'

describe('claimNormalizer', () => {
  it('creates deterministic claim IDs', () => {
    const claims = [
      {
        text: "One of the world's leading cloud architects.",
        sourcePage: 1,
        verificationStatus:
          'ASSERTED_UNVERIFIED' as const,
        verificationReason:
          'unsupported-superlative',
      },
    ]

    const first = normalizeClaims(
      claims,
      {
        documentName:
          'Arjun_Mehta_Test_Profile.pdf',
      },
    )

    const second = normalizeClaims(
      claims,
      {
        documentName:
          'Arjun_Mehta_Test_Profile.pdf',
      },
    )

    expect(first[0].id).toBe(
      second[0].id,
    )
  })

  it('flags unsupported superlatives', () => {
    const result = normalizeClaims(
      [
        {
          text:
            "One of the world's leading cloud architects.",
          sourcePage: 1,
          verificationStatus:
            'ASSERTED_UNVERIFIED',
          verificationReason:
            'unsupported-superlative',
        },
      ],
      {
        documentName:
          'Arjun_Mehta_Test_Profile.pdf',
      },
    )

    expect(
      result[0].safety.flags,
    ).toContain(
      'UNSUPPORTED_SUPERLATIVE',
    )
  })

  it('flags quantitative claims', () => {
    const result = normalizeClaims(
      [
        {
          text:
            'Designed a platform used by millions of users.',
          sourcePage: 2,
          verificationStatus:
            'ASSERTED_UNVERIFIED',
          verificationReason:
            'unsupported-quantitative-claim',
        },
      ],
      {
        documentName:
          'Arjun_Mehta_Test_Profile.pdf',
      },
    )

    expect(
      result[0].safety.flags,
    ).toContain(
      'UNSUPPORTED_QUANTITATIVE',
    )
  })

  it('classifies patent claims', () => {
    const result = normalizeClaims(
      [
        {
          text:
            'Patent application submitted in 2021.',
          sourcePage: 3,
          verificationStatus:
            'UNCLEAR',
          verificationReason:
            'requires verification',
        },
      ],
      {
        documentName:
          'Arjun_Mehta_Test_Profile.pdf',
      },
    )

    expect(result[0].type).toBe(
      'PATENT',
    )
  })

  it('removes duplicate claims', () => {
    const claims = [
      {
        text: 'Top 1% of cloud architects globally.',
        sourcePage: 2,
        verificationStatus:
          'ASSERTED_UNVERIFIED' as const,
        verificationReason:
          'unsupported-superlative',
      },
      {
        text: 'Top 1% of cloud architects globally.',
        sourcePage: 2,
        verificationStatus:
          'ASSERTED_UNVERIFIED' as const,
        verificationReason:
          'unsupported-superlative',
      },
    ]

    const result = normalizeClaims(
      claims,
      {
        documentName:
          'Arjun_Mehta_Test_Profile.pdf',
      },
    )

    expect(result).toHaveLength(1)
  })
})