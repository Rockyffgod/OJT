// Utility for translating/transliterating English/Roman names into Nepali Devanagari script.

const NAME_DICTIONARY: Record<string, string> = {
  ram: 'राम',
  sita: 'सीता',
  sharma: 'शर्मा',
  bahadur: 'बहादुर',
  hari: 'हरि',
  anita: 'अनिता',
  gita: 'गीता',
  bishal: 'विशाल',
  thapa: 'थापा',
  prakash: 'प्रकाश',
  poudel: 'पौडेल',
  maya: 'माया',
  tamang: 'तामाङ',
  raju: 'राजु',
  maharjan: 'महर्जन',
  sunita: 'सुनीता',
  karma: 'कर्म',
  guest: 'पाहुना',
  user: 'प्रयोगकर्ता',
  thapa_kaji: 'थापा काजी',
  bikash: 'विकास',
  shrestha: 'श्रेष्ठ',
  adhikari: 'अधिकारी',
  gurung: 'गुरुङ',
  rai: 'राई',
  kc: 'केसी',
  k_c: 'केसी',
  sherpa: 'शेर्पा',
  gopal: 'गोपाल',
  krishna: 'कृष्ण',
  shyam: 'श्याम',
  ram_sharma: 'राम शर्मा',
  sita_adhikari: 'सीता अधिकारी',
  hari_gurung: 'हरि गुरुङ',
  gita_rai: 'गीता राई',
  bishal_thapa: 'विशाल थापा',
  anita_kc: 'अनिता केसी',
  prakash_poudel: 'प्रकाश पौडेल',
  maya_tamang: 'माया तामाङ',
  raju_maharjan: 'राजु महर्जन',
  sunita_sharma: 'सुनीता शर्मा',
};

// Simple rule-based transliterater for fallbacks
export function transliterateName(name: string): string {
  if (!name) return '';
  const clean = name.trim().toLowerCase();
  
  // Try exact dictionary match first
  if (NAME_DICTIONARY[clean]) {
    return NAME_DICTIONARY[clean];
  }
  
  // Try multi-word name dictionary match
  const parts = clean.split(/[\s_]+/);
  const translatedParts = parts.map(part => {
    if (NAME_DICTIONARY[part]) {
      return NAME_DICTIONARY[part];
    }
    return transliterateWord(part);
  });
  
  return translatedParts.join(' ');
}

function transliterateWord(word: string): string {
  let result = '';
  let i = 0;
  
  // Rule-based English to Devanagari mapping
  const rules: { regex: RegExp; replacement: string }[] = [
    { regex: /^shrestha/i, replacement: 'श्रेष्ठ' },
    { regex: /^sharma/i, replacement: 'शर्मा' },
    { regex: /^bahadur/i, replacement: 'बहादुर' },
    { regex: /^prasad/i, replacement: 'प्रसाद' },
    { regex: /^kumari/i, replacement: 'कुमारी' },
    { regex: /^kumar/i, replacement: 'कुमार' },
    { regex: /^singh/i, replacement: 'सिंह' },
    { regex: /^devi/i, replacement: 'देवी' },
    { regex: /^chhetri/i, replacement: 'क्षेत्री' },
    { regex: /^acharya/i, replacement: 'आचार्य' },
    { regex: /^bhandari/i, replacement: 'भण्डारी' },
    { regex: /^karki/i, replacement: 'कार्की' },
    { regex: /^adhikari/i, replacement: 'अधिकारी' },
    { regex: /^ghimire/i, replacement: 'घिमिरे' },
    { regex: /^phuyal/i, replacement: 'फुयाँल' },
  ];

  for (const rule of rules) {
    if (rule.regex.test(word)) {
      return rule.replacement;
    }
  }

  // General syllable mappings
  const map: Record<string, string> = {
    'k': 'क', 'kh': 'ख', 'g': 'ग', 'gh': 'घ', 'ng': 'ङ',
    'ch': 'च', 'chh': 'छ', 'j': 'ज', 'jh': 'झ', 'yn': 'ञ',
    't': 'त', 'th': 'थ', 'd': 'द', 'dh': 'ध', 'n': 'न',
    'p': 'प', 'ph': 'फ', 'f': 'फ', 'b': 'ब', 'bh': 'भ', 'm': 'म',
    'y': 'य', 'r': 'र', 'l': 'ल', 'w': 'व', 'v': 'व',
    'sh': 'श', 's': 'स', 'h': 'ह', 'gy': 'ज्ञ',
    'a': 'ा', 'e': 'े', 'i': 'ि', 'o': 'ो', 'u': 'ु', 'ee': 'ी', 'oo': 'ू',
    'ai': 'ै', 'au': 'ौ'
  };

  const vowels = ['a', 'e', 'i', 'o', 'u'];
  
  // Process characters
  while (i < word.length) {
    // Try 3 letters
    if (i + 2 < word.length && map[word.substr(i, 3)]) {
      result += map[word.substr(i, 3)];
      i += 3;
    }
    // Try 2 letters
    else if (i + 1 < word.length && map[word.substr(i, 2)]) {
      result += map[word.substr(i, 2)];
      i += 2;
    }
    // Try 1 letter
    else {
      const char = word[i];
      if (vowels.includes(char)) {
        // If vowel is at start, use independent form
        if (i === 0) {
          const startVowels: Record<string, string> = {
            'a': 'अ', 'e': 'ए', 'i': 'इ', 'o': 'ओ', 'u': 'उ'
          };
          result += startVowels[char] || 'अ';
        } else {
          result += map[char] || '';
        }
      } else {
        result += map[char] || char;
      }
      i++;
    }
  }
  
  // Clean up double vowels/consonants
  return result.charAt(0).toUpperCase() + result.slice(1);
}
