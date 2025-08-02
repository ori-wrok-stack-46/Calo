export const detectCardType = (cardNumber: string): string => {
  // Remove spaces and non-digits
  const cleanNumber = cardNumber.replace(/\D/g, "");

  // Check if we have at least 4 digits
  if (cleanNumber.length < 4) {
    return "";
  }

  const firstFour = cleanNumber.substring(0, 4);
  const firstTwo = firstFour.substring(0, 2);
  const firstOne = firstFour.substring(0, 1);

  // Visa cards start with 4
  if (firstOne === "4") {
    return "Visa";
  }

  // Mastercard
  if (firstOne === "5" || (firstTwo >= "22" && firstTwo <= "27")) {
    return "Mastercard";
  }

  // American Express
  if (firstTwo === "34" || firstTwo === "37") {
    return "American Express";
  }

  // Discover
  if (
    firstFour === "6011" ||
    firstTwo === "65" ||
    (firstFour >= "6221" && firstFour <= "6229")
  ) {
    return "Discover";
  }

  // Diners Club
  if (
    (firstTwo >= "30" && firstTwo <= "38") ||
    firstTwo === "54" ||
    firstTwo === "55"
  ) {
    return "Diners Club";
  }

  // JCB
  if (firstFour >= "3528" && firstFour <= "3589") {
    return "JCB";
  }

  return "Unknown";
};

export const formatCardNumber = (value: string): string => {
  // Remove all non-digits
  const digits = value.replace(/\D/g, "");

  // Limit to 16 digits
  const limitedDigits = digits.substring(0, 16);

  // Add spaces every 4 digits
  return limitedDigits.replace(/(\d{4})(?=\d)/g, "$1 ");
};

export const validateCardNumber = (cardNumber: string): boolean => {
  const cleanNumber = cardNumber.replace(/\D/g, "");

  // Basic length check
  if (cleanNumber.length < 13 || cleanNumber.length > 19) {
    return false;
  }

  // Luhn algorithm
  let sum = 0;
  let alternate = false;

  for (let i = cleanNumber.length - 1; i >= 0; i--) {
    let n = parseInt(cleanNumber.charAt(i), 10);

    if (alternate) {
      n *= 2;
      if (n > 9) {
        n = (n % 10) + 1;
      }
    }

    sum += n;
    alternate = !alternate;
  }

  return sum % 10 === 0;
};

export const getCardIcon = (cardType: string): string => {
  switch (cardType.toLowerCase()) {
    case "visa":
      return "💳";
    case "mastercard":
      return "💳";
    case "american express":
      return "💳";
    case "discover":
      return "💳";
    case "diners club":
      return "💳";
    case "jcb":
      return "💳";
    default:
      return "💳";
  }
};
