import puppeteer from "puppeteer";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ForensicReport {
  attackVector: string;
  entryPoint: string;
  exploitPath: string;
  fundFlow: string;
  explanation: string;
  technicalSummary: string;
}

export interface CodeFix {
  fixedCode: string;
  explanation: string;
  auditNotes: string;
}

export class ForensicsService {
  async generateReport(incidentId: string, txHash: string, contractAddress: string): Promise<ForensicReport> {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a senior smart contract security analyst. Provide a detailed forensic report for the following exploit. Return JSON.",
        },
        {
          role: "user",
          content: `Exploit Transaction: ${txHash}
          Target Contract: ${contractAddress}
          
          Provide JSON: { 
            "attackVector": string, 
            "entryPoint": string, 
            "exploitPath": string, 
            "fundFlow": string, 
            "explanation": string (non-technical), 
            "technicalSummary": string 
          }`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
    });

    return JSON.parse(response.choices[0].message.content || "{}") as ForensicReport;
  }

  async suggestCodeFix(vulnerableCode: string, exploitType: string, attackVector: string): Promise<CodeFix> {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a senior smart contract security auditor. Output ONLY valid Solidity with NatSpec explanation. Return JSON.",
        },
        {
          role: "user",
          content: `Vulnerable Code: 
          ${vulnerableCode}
          
          Exploit Type: ${exploitType}
          Attack Vector: ${attackVector}
          
          Provide JSON: { 
            "fixedCode": string, 
            "explanation": string, 
            "auditNotes": string 
          }`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.0,
    });

    return JSON.parse(response.choices[0].message.content || "{}") as CodeFix;
  }

  async generatePdf(report: ForensicReport) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    const html = `
      <html>
        <body style="font-family: Arial, sans-serif; padding: 40px; line-height: 1.6; color: #333;">
          <h1 style="border-bottom: 2px solid #000; padding-bottom: 10px;">🛡️ VIBRANIUM Forensic Report</h1>
          <p style="color: #666;">Generated on ${new Date().toLocaleString()}</p>
          
          <h2>Summary (Non-Technical)</h2>
          <p>${report.explanation}</p>
          
          <h2>Technical Analysis</h2>
          <p><strong>Attack Vector:</strong> ${report.attackVector}</p>
          <p><strong>Entry Point:</strong> ${report.entryPoint}</p>
          <p><strong>Exploit Path:</strong> ${report.exploitPath}</p>
          <p><strong>Fund Flow:</strong> ${report.fundFlow}</p>
          
          <h2>Detailed Summary</h2>
          <div style="background: #f4f4f4; padding: 20px; border-radius: 8px;">
            ${report.technicalSummary.replace(/\n/g, "<br>")}
          </div>
        </body>
      </html>
    `;

    await page.setContent(html);
    const pdf = await page.pdf({ format: "A4" });
    
    await browser.close();
    return pdf;
  }
}
