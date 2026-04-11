import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export class AlertService {
  async sendAlert(incident: any, protocol: any) {
    const alerts = [
      this.sendTelegramAlert(incident, protocol),
      this.sendSlackAlert(incident, protocol),
      this.sendPagerDutyAlert(incident, protocol),
      this.sendEmailAlert(incident, protocol),
    ];

    await Promise.allSettled(alerts);
  }

  private async sendTelegramAlert(incident: any, protocol: any) {
    if (!protocol.telegramChatId) return;
    
    const message = `
🛡️ VIBRANIUM ALERT — ${protocol.name}

Exploit detected. Contract PAUSED.

Type: ${incident.type}
Attacker: ${incident.txHash}
Funds at risk: $${protocol.tvlUsd.toLocaleString()}
Response time: ${incident.responseTimeMs}ms
Contract: ${incident.contractId}

Dashboard → ${process.env.NEXT_PUBLIC_APP_URL}/dashboard
Forensic report generating...
    `;

    try {
      await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: protocol.telegramChatId,
          text: message,
        }),
      });
    } catch (error) {
      console.error("Telegram alert failed:", error);
    }
  }

  private async sendSlackAlert(incident: any, protocol: any) {
    if (!protocol.slackWebhookUrl) return;
    
    const payload = {
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: `🛡️ VIBRANIUM ALERT — ${protocol.name}`,
            emoji: true
          }
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "*Exploit detected. Contract PAUSED.*"
          }
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*Type:*\n${incident.type}`
            },
            {
              type: "mrkdwn",
              text: `*Attacker:*\n<https://etherscan.io/tx/${incident.txHash}|${incident.txHash.slice(0, 10)}...>`
            },
            {
              type: "mrkdwn",
              text: `*Response Time:*\n${incident.responseTimeMs}ms`
            },
            {
              type: "mrkdwn",
              text: `*Contract:*\n${incident.contractId}`
            }
          ]
        },
        {
          type: "actions",
          elements: [
            {
              type: "button",
              text: {
                type: "plain_text",
                text: "View Dashboard",
                emoji: true
              },
              url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
              style: "danger"
            }
          ]
        }
      ]
    };

    try {
      await fetch(protocol.slackWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.error("Slack alert failed:", error);
    }
  }

  private async sendPagerDutyAlert(incident: any, protocol: any) {
    if (!protocol.pagerdutyKey) return;

    const payload = {
      payload: {
        summary: `[VIBRANIUM ALERT] Exploit detected for ${protocol.name}`,
        severity: "critical",
        source: "VIBRANIUM",
        component: "Smart Contract Guardian",
        group: "Security",
        class: "Exploit Detection",
        custom_details: {
          incidentId: incident.id,
          protocolName: protocol.name,
          exploitType: incident.type,
          txHash: incident.txHash,
        },
      },
      routing_key: protocol.pagerdutyKey,
      event_action: "trigger",
      dedup_key: `vibranium-${incident.id}`,
    };

    try {
      await fetch("https://events.pagerduty.com/v2/enqueue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.error("PagerDuty alert failed:", error);
    }
  }

  private async sendEmailAlert(incident: any, protocol: any) {
    if (!protocol.teamEmails || protocol.teamEmails.length === 0) return;

    try {
      await resend.emails.send({
        from: "VIBRANIUM Security <alerts@vibranium.security>",
        to: protocol.teamEmails,
        subject: `[VIBRANIUM ALERT] ${protocol.name} — Contract Paused`,
        html: `
          <h1>🛡️ VIBRANIUM ALERT</h1>
          <p>Exploit detected and contract paused for <strong>${protocol.name}</strong>.</p>
          <ul>
            <li><strong>Type:</strong> ${incident.type}</li>
            <li><strong>Transaction Hash:</strong> ${incident.txHash}</li>
            <li><strong>Response Time:</strong> ${incident.responseTimeMs}ms</li>
          </ul>
          <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard">View Dashboard</a></p>
        `,
      });
    } catch (error) {
      console.error("Email alert failed:", error);
    }
  }
}
