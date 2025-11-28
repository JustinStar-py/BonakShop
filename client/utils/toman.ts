type TomanParts = { amount: string; suffix: string };

export const formatToTomanParts = (value: string | number): TomanParts | null => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const numberValue = Number(String(value).replace(/,/g, ''));
  if (isNaN(numberValue)) {
    return null;
  }

  const formattedNumber = new Intl.NumberFormat('fa-IR').format(numberValue);
  return { amount: formattedNumber, suffix: 'تومان' };
};

export const formatToToman = (value: string | number): string => {
  const parts = formatToTomanParts(value);
  if (!parts) return '';
  return `${parts.amount} ${parts.suffix}`;
};
