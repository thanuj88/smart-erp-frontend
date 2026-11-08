import { planMatchesSearch } from './planSearch';

const plan = {
  customer_name: 'Ada Perera',
  customer_phone: '077 123 4567',
  customer_id_card: '901234567V',
  order_number: 'ORD-77',
};

describe('planMatchesSearch', () => {
  it('matches by name, phone, NIC and order number, ignoring case and spaces', () => {
    expect(planMatchesSearch(plan, 'ada')).toBe(true);
    expect(planMatchesSearch(plan, 'PERERA')).toBe(true);
    expect(planMatchesSearch(plan, '0771234567')).toBe(true);
    expect(planMatchesSearch(plan, '901234567v')).toBe(true);
    expect(planMatchesSearch(plan, ' 9012 ')).toBe(true);
    expect(planMatchesSearch(plan, 'ord-77')).toBe(true);
  });

  it('does not match unrelated text', () => {
    expect(planMatchesSearch(plan, 'zzz')).toBe(false);
    expect(planMatchesSearch(plan, '851234567V')).toBe(false);
  });

  it('shows everything for an empty search', () => {
    expect(planMatchesSearch(plan, '')).toBe(true);
    expect(planMatchesSearch(plan, '   ')).toBe(true);
    expect(planMatchesSearch(plan, undefined)).toBe(true);
  });

  it('does not throw when the plan has no name, phone or NIC', () => {
    expect(planMatchesSearch({ customer_name: null }, 'ada')).toBe(false);
    expect(planMatchesSearch({}, 'ada')).toBe(false);
    expect(planMatchesSearch(null, 'ada')).toBe(false);
  });
});
