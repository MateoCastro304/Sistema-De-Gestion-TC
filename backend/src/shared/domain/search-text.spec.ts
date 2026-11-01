import { matchesSearch, normalizeSearchText } from './search-text';

describe('normalizeSearchText', () => {
  it('lowercases the text', () => {
    expect(normalizeSearchText('CASTRO')).toBe('castro');
  });

  it('removes accents and the eñe tilde', () => {
    expect(normalizeSearchText('Julián Núñez')).toBe('julian nunez');
  });
});

describe('matchesSearch', () => {
  const fields = ['Julián', 'Ferreyra', '42345678', 'Jefe de taller'];

  it('matches everything when the search is empty or missing', () => {
    expect(matchesSearch(undefined, fields)).toBe(true);
    expect(matchesSearch('', fields)).toBe(true);
    expect(matchesSearch('   ', fields)).toBe(true);
  });

  it('ignores case and accents', () => {
    expect(matchesSearch('JULIAN', fields)).toBe(true);
    expect(matchesSearch('jefe de TALLER', fields)).toBe(true);
  });

  it('matches a substring of any field', () => {
    expect(matchesSearch('ferre', fields)).toBe(true);
    expect(matchesSearch('4234', fields)).toBe(true);
  });

  it('requires every word to appear in some field', () => {
    expect(matchesSearch('julian ferreyra', fields)).toBe(true);
    expect(matchesSearch('julian gomez', fields)).toBe(false);
  });

  it('does not match when nothing contains the text', () => {
    expect(matchesSearch('zzz', fields)).toBe(false);
  });
});
