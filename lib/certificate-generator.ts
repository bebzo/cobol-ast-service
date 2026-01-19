/**
 * Equivalence Certificate Generator
 * Generates PDF certificates for COBOL-to-Python migration validation
 */

export interface CertificateData {
  programName: string;
  validationDate: string;
  cobolLines: number;
  pythonLines: number;
  testsTotal: number;
  testsPassed: number;
  testsFailed: number;
  numericalEquivalence: number;
  behavioralEquivalence: number;
  edgeCaseCoverage: number;
  semanticCoverage: number;
  performanceDeviation: number;
  riskLevel: string;
  confidence: number;
  issues: string[];
  securityWarnings: number;
  limitations: string[];
}

export function generateCertificateHTML(data: CertificateData): string {
  const overallScore = (
    data.numericalEquivalence * 0.3 +
    data.behavioralEquivalence * 0.25 +
    data.edgeCaseCoverage * 0.2 +
    data.semanticCoverage * 0.25
  );

  const status = overallScore >= 95 && data.testsFailed === 0
    ? { label: "CERTIFIED", color: "#22c55e" }
    : overallScore >= 80
    ? { label: "VALIDATED", color: "#3b82f6" }
    : overallScore >= 60
    ? { label: "REVIEW NEEDED", color: "#eab308" }
    : { label: "NOT READY", color: "#ef4444" };

  const passRate = data.testsTotal > 0 
    ? ((data.testsPassed / data.testsTotal) * 100).toFixed(1) 
    : "0.0";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Equivalence Certificate - ${data.programName}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: 'Inter', sans-serif;
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
      color: #e2e8f0;
      padding: 40px;
      min-height: 100vh;
    }
    
    .certificate {
      max-width: 800px;
      margin: 0 auto;
      background: linear-gradient(145deg, #1e293b 0%, #0f172a 50%, #1e1b4b 100%);
      border: 2px solid #4f46e5;
      border-radius: 16px;
      padding: 48px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    }
    
    .header {
      text-align: center;
      margin-bottom: 32px;
      padding-bottom: 24px;
      border-bottom: 1px solid #334155;
    }
    
    .logo {
      font-size: 32px;
      font-weight: 700;
      background: linear-gradient(135deg, #818cf8, #c084fc);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 8px;
    }
    
    .title {
      font-size: 24px;
      color: #94a3b8;
      font-weight: 500;
    }
    
    .status-badge {
      display: inline-block;
      padding: 8px 24px;
      border-radius: 9999px;
      font-size: 18px;
      font-weight: 700;
      margin: 24px 0;
      background: ${status.color}22;
      color: ${status.color};
      border: 2px solid ${status.color};
    }
    
    .program-info {
      background: #0f172a;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 24px;
    }
    
    .program-name {
      font-size: 28px;
      font-weight: 700;
      color: #f8fafc;
      margin-bottom: 8px;
    }
    
    .date {
      color: #64748b;
      font-size: 14px;
    }
    
    .score-section {
      margin: 32px 0;
    }
    
    .score-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    
    .score-label {
      font-size: 16px;
      color: #94a3b8;
    }
    
    .score-value {
      font-size: 32px;
      font-weight: 700;
      color: ${status.color};
    }
    
    .progress-bar {
      height: 12px;
      background: #1e293b;
      border-radius: 6px;
      overflow: hidden;
    }
    
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, ${status.color}, ${status.color}cc);
      width: ${overallScore}%;
      border-radius: 6px;
    }
    
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      margin: 32px 0;
    }
    
    .metric-card {
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 20px;
    }
    
    .metric-label {
      font-size: 12px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 8px;
    }
    
    .metric-value {
      font-size: 24px;
      font-weight: 700;
    }
    
    .metric-green { color: #22c55e; }
    .metric-yellow { color: #eab308; }
    .metric-red { color: #ef4444; }
    .metric-blue { color: #3b82f6; }
    
    .test-summary {
      background: #0f172a;
      border-radius: 12px;
      padding: 24px;
      margin: 24px 0;
    }
    
    .test-row {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid #1e293b;
    }
    
    .test-row:last-child {
      border-bottom: none;
    }
    
    .limitations {
      background: #451a0322;
      border: 1px solid #f9731633;
      border-radius: 12px;
      padding: 20px;
      margin-top: 24px;
    }
    
    .limitations-title {
      color: #fb923c;
      font-weight: 600;
      margin-bottom: 12px;
    }
    
    .limitations-list {
      list-style: none;
      color: #fdba74;
      font-size: 14px;
    }
    
    .limitations-list li {
      padding: 4px 0;
      padding-left: 20px;
      position: relative;
    }
    
    .limitations-list li::before {
      content: "⚠";
      position: absolute;
      left: 0;
    }
    
    .signature {
      margin-top: 40px;
      padding-top: 24px;
      border-top: 1px solid #334155;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    
    .signature-info {
      text-align: left;
    }
    
    .signature-label {
      font-size: 12px;
      color: #64748b;
      margin-bottom: 4px;
    }
    
    .signature-value {
      font-size: 14px;
      color: #94a3b8;
    }
    
    .qr-placeholder {
      width: 80px;
      height: 80px;
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      color: #64748b;
    }
    
    .footer {
      text-align: center;
      margin-top: 32px;
      color: #475569;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="certificate">
    <div class="header">
      <div class="logo">CodeSwitch Pro</div>
      <div class="title">Equivalence Validation Certificate</div>
      <div class="status-badge">${status.label}</div>
    </div>
    
    <div class="program-info">
      <div class="program-name">${data.programName}</div>
      <div class="date">Validated on ${data.validationDate}</div>
    </div>
    
    <div class="score-section">
      <div class="score-header">
        <span class="score-label">Overall Equivalence Score</span>
        <span class="score-value">${overallScore.toFixed(1)}%</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill"></div>
      </div>
    </div>
    
    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-label">Numerical Equivalence</div>
        <div class="metric-value ${data.numericalEquivalence >= 90 ? 'metric-green' : data.numericalEquivalence >= 70 ? 'metric-yellow' : 'metric-red'}">
          ${data.numericalEquivalence.toFixed(1)}%
        </div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Behavioral Equivalence</div>
        <div class="metric-value ${data.behavioralEquivalence >= 90 ? 'metric-green' : data.behavioralEquivalence >= 70 ? 'metric-yellow' : 'metric-red'}">
          ${data.behavioralEquivalence.toFixed(1)}%
        </div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Edge Case Coverage</div>
        <div class="metric-value ${data.edgeCaseCoverage >= 80 ? 'metric-green' : data.edgeCaseCoverage >= 60 ? 'metric-yellow' : 'metric-red'}">
          ${data.edgeCaseCoverage.toFixed(1)}%
        </div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Semantic Coverage</div>
        <div class="metric-value ${data.semanticCoverage >= 90 ? 'metric-green' : data.semanticCoverage >= 70 ? 'metric-yellow' : 'metric-red'}">
          ${data.semanticCoverage.toFixed(1)}%
        </div>
      </div>
    </div>
    
    <div class="test-summary">
      <h3 style="color: #f8fafc; margin-bottom: 16px;">Test Summary</h3>
      <div class="test-row">
        <span style="color: #94a3b8;">COBOL Lines Analyzed</span>
        <span style="color: #f8fafc; font-weight: 600;">${data.cobolLines.toLocaleString()}</span>
      </div>
      <div class="test-row">
        <span style="color: #94a3b8;">Python Lines Generated</span>
        <span style="color: #f8fafc; font-weight: 600;">${data.pythonLines.toLocaleString()}</span>
      </div>
      <div class="test-row">
        <span style="color: #94a3b8;">Tests Executed</span>
        <span style="color: #f8fafc; font-weight: 600;">${data.testsTotal}</span>
      </div>
      <div class="test-row">
        <span style="color: #94a3b8;">Tests Passed</span>
        <span style="color: #22c55e; font-weight: 600;">${data.testsPassed} (${passRate}%)</span>
      </div>
      <div class="test-row">
        <span style="color: #94a3b8;">Tests Failed</span>
        <span style="color: ${data.testsFailed > 0 ? '#ef4444' : '#22c55e'}; font-weight: 600;">${data.testsFailed}</span>
      </div>
      <div class="test-row">
        <span style="color: #94a3b8;">Security Warnings</span>
        <span style="color: ${data.securityWarnings > 0 ? '#f97316' : '#22c55e'}; font-weight: 600;">${data.securityWarnings}</span>
      </div>
      <div class="test-row">
        <span style="color: #94a3b8;">Confidence Score</span>
        <span style="color: #818cf8; font-weight: 600;">${data.confidence}%</span>
      </div>
    </div>
    
    ${data.limitations.length > 0 ? `
    <div class="limitations">
      <div class="limitations-title">Known Limitations</div>
      <ul class="limitations-list">
        ${data.limitations.map(l => `<li>${l}</li>`).join('')}
      </ul>
    </div>
    ` : ''}
    
    <div class="signature">
      <div class="signature-info">
        <div class="signature-label">Validated by</div>
        <div class="signature-value">CodeSwitch Pro v8.4</div>
        <div class="signature-value" style="color: #818cf8;">Gemini AI Validation Engine</div>
      </div>
      <div class="signature-info" style="text-align: right;">
        <div class="signature-label">Certificate ID</div>
        <div class="signature-value">${generateCertificateId(data)}</div>
        <div class="signature-label" style="margin-top: 8px;">Risk Level</div>
        <div class="signature-value" style="color: ${data.riskLevel === 'LOW' ? '#22c55e' : data.riskLevel === 'MEDIUM' ? '#eab308' : '#ef4444'};">${data.riskLevel}</div>
      </div>
    </div>
    
    <div class="footer">
      <p>This certificate attests that the Python code generated by CodeSwitch Pro</p>
      <p>has been validated for functional equivalence with the original COBOL program.</p>
      <p style="margin-top: 8px; color: #64748b;">© ${new Date().getFullYear()} CodeSwitch Pro - COBOL Migration Platform</p>
    </div>
  </div>
</body>
</html>
`;
}

function generateCertificateId(data: CertificateData): string {
  const hash = btoa(`${data.programName}-${data.validationDate}-${data.testsTotal}`).slice(0, 12);
  return `CSW-${new Date().getFullYear()}-${hash.toUpperCase()}`;
}

export function downloadCertificateAsPDF(data: CertificateData): void {
  const html = generateCertificateHTML(data);
  
  // Open in new window for printing/saving as PDF
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    
    // Auto-trigger print dialog after a short delay
    setTimeout(() => {
      printWindow.print();
    }, 500);
  }
}

export function downloadCertificateAsHTML(data: CertificateData): void {
  const html = generateCertificateHTML(data);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `equivalence-certificate-${data.programName.replace(/[^a-z0-9]/gi, '_')}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
