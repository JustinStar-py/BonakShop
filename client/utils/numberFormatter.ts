const toPersianDigits = (num: number) => {
    const persian = {
      0: "۰", 1: "۱", 2: "۲", 3: "۳", 4: "۴", 5: "۵", 6: "۶", 7: "۷", 8: "۸", 9: "۹"
    };
    // Format with thousands separator if >= 1000
    const formatted = num >= 1000 ? num.toLocaleString("en-US") : num.toString();
    return formatted.replace(/\d/g, (d) => persian[d as unknown as keyof typeof persian]);
};

export default toPersianDigits;