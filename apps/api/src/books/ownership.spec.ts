import { anonymousBooksOf, myBooksWhere, ownsBook } from './books.service';

describe('book ownership', () => {
  it('moves only the anonymous books of this browser on sign-in', () => {
    expect(anonymousBooksOf('key-1')).toEqual({
      clientKey: 'key-1',
      userId: null,
    });
  });

  it('lists the account books plus this browser’s anonymous ones', () => {
    expect(myBooksWhere('key-1', 'user-1')).toEqual({
      OR: [{ userId: 'user-1' }, { clientKey: 'key-1', userId: null }],
    });
    expect(myBooksWhere('key-1')).toEqual({ clientKey: 'key-1', userId: null });
  });

  it('lets the browser order an anonymous book and the account its own', () => {
    const anonymous = { clientKey: 'key-1', userId: null };
    const owned = { clientKey: 'key-1', userId: 'user-1' };
    expect(ownsBook(anonymous, 'key-1')).toBe(true);
    expect(ownsBook(anonymous, 'key-2', 'user-1')).toBe(false);
    expect(ownsBook(owned, 'key-9', 'user-1')).toBe(true);
    // Signed out, or another account, in the same browser: the moved book is not theirs.
    expect(ownsBook(owned, 'key-1')).toBe(false);
    expect(ownsBook(owned, 'key-1', 'user-2')).toBe(false);
  });
});
