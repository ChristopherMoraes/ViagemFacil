export const formatCurrency = (value) => {
  if (typeof value !== 'number') {
    value = Number(value) || 0;
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

export const formatCPF = (value) => {
  if (!value) return '';
  const digits = String(value).replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
};

export const validateCPF = (cpf) => {
  if (!cpf) return false;
  const clean = cpf.replace(/\D/g, '');
  return clean.length === 11;
};

export const formatPhone = (value) => {
  if (!value) return '';
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 10) {
    return digits
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d{1,4})$/, '$1-$2');
  }
  return digits
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d{1,4})$/, '$1-$2');
};

export const validatePhone = (phone) => {
  if (!phone) return false;
  const digits = phone.replace(/\D/g, '');
  if (digits.length !== 10 && digits.length !== 11) return false;
  const ddd = parseInt(digits.substring(0, 2), 10);
  if (ddd < 11 || ddd > 99) return false;
  if (digits.length === 11 && digits.charAt(2) !== '9') return false;
  return true;
};

export const validateFullName = (name) => {
  if (!name || typeof name !== 'string') return false;
  const trimmed = name.trim();
  const words = trimmed.split(/\s+/);
  if (words.length < 2) return false;

  const validPrepositions = new Set(['de', 'da', 'do', 'dos', 'das', 'e']);
  const nameRegex = /^[A-Za-zÀ-ÖØ-öø-ÿ]+$/;

  let validMainWordsCount = 0;

  for (const word of words) {
    if (!nameRegex.test(word)) return false;
    const lower = word.toLowerCase();
    if (validPrepositions.has(lower)) {
      continue;
    }
    if (word.length < 3) return false;
    validMainWordsCount++;
  }

  return validMainWordsCount >= 2;
};

export const validateEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email.trim());
};

export const formatDateMask = (value) => {
  if (!value) return '';
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return digits.replace(/(\d{2})(\d)/, '$1/$2');
  return digits.replace(/(\d{2})(\d{2})(\d)/, '$1/$2/$3');
};

export const validateBirthDate = (dateStr) => {
  if (!dateStr) return false;

  let day, month, year;

  if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    if (parts.length !== 3) return false;
    day = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10);
    year = parseInt(parts[2], 10);
  } else if (dateStr.includes('-')) {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return false;
    year = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10);
    day = parseInt(parts[2], 10);
  } else {
    return false;
  }

  if (!day || !month || !year) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;

  const currentYear = new Date().getFullYear();
  if (year < currentYear - 120 || year > currentYear) return false;

  const dateObj = new Date(year, month - 1, day);
  if (dateObj.getFullYear() !== year || dateObj.getMonth() !== month - 1 || dateObj.getDate() !== day) {
    return false;
  }

  const now = new Date();
  if (dateObj > now) return false;

  return true;
};

export const formatDateBR = (dateStr) => {
  if (!dateStr) return '';
  if (dateStr.includes('/')) return dateStr;
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? dateStr : date.toLocaleDateString('pt-BR');
};

export const formatTime = (timeStr) => {
  if (!timeStr) return '';
  return timeStr.slice(0, 5);
};

export const getTodayDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
