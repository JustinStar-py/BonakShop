export const formatToToman = (value: string | number): string => {
  if (value === null || value === undefined || value === '') {
    return '';
  }

  const numberValue = Number(String(value).replace(/,/g, ''));
  if (isNaN(numberValue)) {
    return '';
  }

  const tomanValue = numberValue / 10;
  const formattedNumber = new Intl.NumberFormat('fa-IR').format(tomanValue);
  return `${formattedNumber} تومان`;
};