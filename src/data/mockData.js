export const MockVerifications = [
  {
    id: '1',
    type: 'Email',
    title: '[Email] Security Threat - Immediate Action Required',
    sender: 'Google Security Agent <security-alerts@google-security-alert.net>',
    senderEmail: 'security-alerts@google-security-alert.net',
    ip: '185.220.101.4 (Bucharest, RO)',
    time: '2 mins ago',
    trustScore: 34,
    spfStatus: false,
    dkimStatus: false,
    dmarcStatus: false,
    senderFrequency: 0,
    senderAlert: 'SPOOFING WARNING: HEADER MISMATCH - Zero historical records from this subdomain.',
    rawText: 'WARNING: Your Google accounts are at risk of immediate permanent deletion. We detected multiple logins originating from unauthorized servers in Rotterdam. Click to authorize consensus.',
    status: 'completed',
    uiHighlights: [
      { id: 'mock-1-hl-1', text: 'at risk of immediate permanent deletion.', type: 'danger', reason: 'Critical Phishing Pattern - Threatening statements demanding immediate action.' },
      { id: 'mock-1-hl-2', text: 'logins originating from unauthorized servers in Rotterdam.', type: 'info', reason: 'Unverified Claim - IP coordinates are unconfirmed and lack technical telemetry.' }
    ],
    explainers: [
      {
        phrase: 'at risk of immediate permanent deletion.',
        explanation: 'Google Accounts security framework provides a minimum 30-day grace period for alerts and never enforces immediate, unreviewable deletion of accounts.',
        sources: [
          { name: 'Google Safety Standards', url: 'https://safety.google/security' },
          { name: 'Snopes Phishing Database', url: 'https://snopes.com/fact-check/google-deletion' }
        ]
      }
    ],
    mediaType: null,
    anomalies: [
      { text: 'Domain Spoofing Detected', passed: false },
      { text: 'SPF/DKIM Cryptographic Check Failed', passed: false },
      { text: 'Phishing Ingestion Patterns Identified', passed: false },
      { text: 'Chronological Displacement Check', passed: true }
    ]
  },
  {
    id: '2',
    type: 'Video',
    title: '[Video] Breaking Announcement regarding Local Reserves',
    sender: 'Global News Hub <broadcast@global-news-dispatch.org>',
    senderEmail: 'broadcast@global-news-dispatch.org',
    ip: '45.89.231.11 (Rotterdam, NL)',
    time: '12 mins ago',
    trustScore: 42,
    spfStatus: true,
    dkimStatus: true,
    dmarcStatus: true,
    senderFrequency: 24,
    senderAlert: 'Frequent interaction. However, video payload contains severe structural artifacts and chronological displacement.',
    rawText: 'Official breaking emergency statement: I am today declaring a state of total financial emergency. Effective tomorrow morning, all banks will halt retail withdrawals.',
    status: 'completed',
    uiHighlights: [
      { id: 'mock-2-hl-1', text: 'breaking emergency statement', type: 'danger', reason: 'Chronological Displacement/Context Spoofing: Old digital footprints (from 2021) detected on asset, but header metadata claims current breaking status.' },
      { id: 'mock-2-hl-2', text: 'all banks will halt retail withdrawals', type: 'danger', reason: 'Debunked Disinformation - Fabricated crisis narrative designed to incite public panic.' }
    ],
    explainers: [
      {
        phrase: 'breaking emergency statement',
        explanation: 'Chronological Displacement: This video stream contains visual and metadata signatures matching archive broadcasts from November 2021. It is being recirculated out of context to simulate a current breaking emergency.',
        sources: [
          { name: 'Truth Guard Historical Archives', url: 'https://truthguard.io/archive/2021' }
        ]
      },
      {
        phrase: 'all banks will halt retail withdrawals',
        explanation: 'Central Bank authorities confirm there are no pending capital control declarations. Financial reserves are operating under standard regulatory metrics.',
        sources: [
          { name: 'Reuters Fact Check Service', url: 'https://reuters.com/fact-check' }
        ]
      }
    ],
    mediaType: 'video',
    mediaUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4',
    mediaDiagnostics: {
      aiIndex: 89,
      synthId: false,
      avSync: 46,
      blurMitigation: true
    },
    anomalies: [
      { text: 'Sender Crypto Header Verification', passed: true },
      { text: 'Video Face-Mesh Boundary Check', passed: false },
      { text: 'Lip-Sync Alignment Mapping (Wav2Lip)', passed: false },
      { text: 'Chronological Displacement Check', passed: false }
    ]
  },
  {
    id: '3',
    type: 'Email',
    title: '[Email] Security Update: System Log Verified',
    sender: 'Truth Guard Security <auth@truthguard.io>',
    senderEmail: 'auth@truthguard.io',
    ip: '104.244.42.1 (San Francisco, US)',
    time: '1 hour ago',
    trustScore: 98,
    spfStatus: true,
    dkimStatus: true,
    dmarcStatus: true,
    senderFrequency: 148,
    senderAlert: 'Highly trusted contact. 148 previous cryptographic authentications.',
    rawText: 'System status report: Truth Guard verification engine updated to database version v4.2.1-alpha. All local AI models are fully calibrated. Your system settings are verified secure, and local storage limits comply with privacy standards.',
    status: 'completed',
    uiHighlights: [
      { id: 'mock-3-hl-1', text: 'database version v4.2.1-alpha.', type: 'success', reason: 'Verified Factual - Codebase matches active production deployment records.' }
    ],
    explainers: [
      {
        phrase: 'database version v4.2.1-alpha.',
        explanation: 'Corresponds to standard update logs published in the GitHub production release channel.',
        sources: [
          { name: 'Truth Guard Releases', url: 'https://github.com/truthguard/releases' }
        ]
      }
    ],
    mediaType: null,
    anomalies: [
      { text: 'Sender Header Verification', passed: true },
      { text: 'IP Origin Check', passed: true },
      { text: 'Signature Verification', passed: true },
      { text: 'Chronological Displacement Check', passed: true }
    ]
  },
  {
    id: '4',
    type: 'Photo',
    title: '[Photo] Local Lens ID Scanning Log',
    sender: 'Live System Camera Scan',
    senderEmail: 'camera-module@localhost',
    ip: 'Local Bus Interface (0x7F)',
    time: '3 hours ago',
    trustScore: 96,
    spfStatus: true,
    dkimStatus: true,
    dmarcStatus: true,
    senderFrequency: 940,
    senderAlert: 'Direct hardware stream. Cryptographic lens signature matches hardware profile.',
    rawText: 'Authorized Terminal Certificate: Truth Guard Lens validation complete. ID: TG-9082-C2PA. Signature expires December 2026.',
    status: 'completed',
    uiHighlights: [
      { id: 'mock-4-hl-1', text: 'ID: TG-9082-C2PA.', type: 'success', reason: 'Verified Factual - Hardware identifier signed and validated.' }
    ],
    explainers: [
      {
        phrase: 'ID: TG-9082-C2PA.',
        explanation: 'This matches the Coalition for Content Provenance and Authenticity (C2PA) cryptographic lens metadata registered during device manufacturing.',
        sources: [
          { name: 'C2PA Org Portal', url: 'https://c2pa.org' }
        ]
      }
    ],
    mediaType: 'image',
    mediaDiagnostics: {
      aiIndex: 4,
      synthId: true,
      avSync: 0,
      blurMitigation: false
    },
    anomalies: [
      { text: 'C2PA Metadata Integrity', passed: true },
      { text: 'Lens Cryptographic Signature', passed: true },
      { text: 'SynthID Digital Fingerprint Detected', passed: true },
      { text: 'Chronological Displacement Check', passed: true }
    ]
  }
];
