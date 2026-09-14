/**
 * Delivering an alert (W4.13). Two providers, each switched on by its own
 * environment variables, so DBEDC can contract whichever gateway it chooses
 * without a code change:
 *
 *   SMS — any Bangladesh bulk-SMS gateway with an HTTP API.
 *     ALERTS_SMS_URL     the gateway's send endpoint
 *     ALERTS_SMS_TOKEN   its API key (sent as a Bearer token)
 *     ALERTS_SMS_SENDER  the approved sender ID / masking name
 *     The request body is JSON {to, from, message}; a gateway that needs a
 *     different shape is adapted in `smsRequest` below.
 *
 *   WhatsApp — Meta's WhatsApp Business Cloud API.
 *     ALERTS_WHATSAPP_TOKEN        a permanent system-user token
 *     ALERTS_WHATSAPP_PHONE_ID     the business phone number id
 *     ALERTS_WHATSAPP_TEMPLATE     an approved template with one body parameter
 *     Business-initiated WhatsApp messages must use an approved template.
 *
 * With neither configured, a broadcast is recorded as "no provider" and
 * nothing is sent — never silently dropped, never reported as delivered.
 */
export function providerStatus(env = process.env) {
  return {
    sms: Boolean(env.ALERTS_SMS_URL && env.ALERTS_SMS_TOKEN),
    whatsapp: Boolean(env.ALERTS_WHATSAPP_TOKEN && env.ALERTS_WHATSAPP_PHONE_ID && env.ALERTS_WHATSAPP_TEMPLATE),
  };
}

export function smsRequest(to, message, env = process.env) {
  return {
    url: env.ALERTS_SMS_URL,
    init: {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${env.ALERTS_SMS_TOKEN}` },
      body: JSON.stringify({ to, from: env.ALERTS_SMS_SENDER || 'DBEDC', message }),
    },
  };
}

export function whatsappRequest(to, message, locale, env = process.env) {
  return {
    url: `https://graph.facebook.com/v20.0/${env.ALERTS_WHATSAPP_PHONE_ID}/messages`,
    init: {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${env.ALERTS_WHATSAPP_TOKEN}` },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: to.replace(/^\+/, ''),
        type: 'template',
        template: {
          name: env.ALERTS_WHATSAPP_TEMPLATE,
          language: { code: locale === 'bn' ? 'bn' : locale === 'zh' ? 'zh_CN' : 'en' },
          components: [{ type: 'body', parameters: [{ type: 'text', text: message }] }],
        },
      }),
    },
  };
}

/** Send one message; resolves true when the provider accepted it. */
export async function deliver(channel, to, message, locale, { env = process.env, fetchImpl = fetch } = {}) {
  const status = providerStatus(env);
  if (!status[channel]) return false;
  const { url, init } = channel === 'sms' ? smsRequest(to, message, env) : whatsappRequest(to, message, locale, env);
  const res = await fetchImpl(url, { ...init, cache: 'no-store', signal: AbortSignal.timeout(15000) });
  return res.ok;
}
