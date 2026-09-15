import { describe, it, expect } from 'vitest';
import { mailStatus, sendMail } from '../../lib/mail.js';

describe('outbound mail (W8C.7)', () => {
  it('is off until a host and a from address are configured, and never throws', async () => {
    expect(mailStatus({}).configured).toBe(false);
    expect(await sendMail({ to: 'a@b.c', subject: 's', text: 't' }, {})).toEqual({ sent: false, reason: 'no_provider' });
    expect(await sendMail({ to: 'not-an-address', subject: 's', text: 't' }, { MAIL_HOST: 'h', MAIL_FROM: 'f@x.y' })).toEqual({ sent: false, reason: 'no_address' });
  });
});
