const store = {};
const sets = {};

const safeGet = jest.fn(async (key) => store[key] ?? null);
const safeSet = jest.fn(async (key, value) => { store[key] = value; return true; });
const safeDel = jest.fn(async (key) => { delete store[key]; return true; });
const safeSadd = jest.fn(async (key, member) => { if (!sets[key]) sets[key] = new Set(); sets[key].add(member); return 1; });
const safeSrem = jest.fn(async (key, member) => { if (sets[key]) sets[key].delete(member); return 1; });
const safeScard = jest.fn(async (key) => (sets[key] ? sets[key].size : 0));
const safeSmembers = jest.fn(async (key) => (sets[key] ? Array.from(sets[key]) : []));
const safeExpire = jest.fn(async () => 1);

const __reset = () => {
  Object.keys(store).forEach(k => delete store[k]);
  Object.keys(sets).forEach(k => delete sets[k]);
  safeGet.mockClear();
  safeSet.mockClear();
  safeDel.mockClear();
  safeSadd.mockClear();
  safeSrem.mockClear();
  safeScard.mockClear();
  safeSmembers.mockClear();
  safeExpire.mockClear();
};

module.exports = { safeGet, safeSet, safeDel, safeSadd, safeSrem, safeScard, safeSmembers, safeExpire, __reset };
