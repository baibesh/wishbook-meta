import { LANGUAGES } from '@fabulka/shared';
import {
  kzt,
  orderConfirmation,
  orderNumber,
  orderStatusChanged,
  purchaseReceipt,
} from './templates';

const order = {
  id: 'cmh1x2y3z4abcdefgh',
  bookId: 'book-1',
  bookTitle: 'Арман и <снежный> барс',
  recipientName: 'Айгерим',
  city: 'Алматы',
  address: 'ул. Абая, 1',
  cover: 'hard' as const,
  quantity: 2,
  totalKzt: 29800,
};
const site = 'https://fabulka.com';

describe('mail templates', () => {
  it.each(LANGUAGES)('renders the order confirmation in %s', (locale) => {
    const mail = orderConfirmation(order, locale, site);
    expect(mail.subject).toContain(orderNumber(order.id));
    for (const body of [mail.html, mail.text]) {
      expect(body).toContain('29 800 ₸');
      expect(body).toContain(`${site}/orders/${order.id}?lang=${locale}`);
      expect(body).toContain(`${site}/books/book-1?lang=${locale}`);
      expect(body).toContain('Айгерим');
    }
    expect(mail.html).toContain('&lt;снежный&gt;');
    expect(mail.html).not.toContain('<снежный>');
  });

  it.each(LANGUAGES)('renders the status change in %s', (locale) => {
    const mail = orderStatusChanged(order, 'shipped', locale, site);
    expect(mail.subject).toContain(orderNumber(order.id));
    expect(mail.text).toContain(`${site}/orders/${order.id}`);
    expect(mail.text).not.toContain('undefined');
  });

  it.each(LANGUAGES)('renders the purchase receipt in %s', (locale) => {
    const mail = purchaseReceipt(
      { kind: 'custom', priceKzt: 2900 },
      locale,
      site,
    );
    expect(mail.text).toContain('2 900 ₸');
    expect(mail.html).toContain(`${site}/catalog?lang=${locale}`);
  });

  it('says in Russian that nothing was charged', () => {
    expect(
      purchaseReceipt({ kind: 'template', priceKzt: 1900 }, 'ru', site).text,
    ).toContain('деньги не списывались');
  });

  it('formats tenge and order numbers', () => {
    expect(kzt(1500)).toBe('1 500 ₸');
    expect(kzt(149000)).toBe('149 000 ₸');
    expect(orderNumber('abcdefghijkl')).toBe('EFGHIJKL');
  });
});
