export const checkString = (strVal: string, fieldName: string) => {
  if (!strVal) throw new Error(`${fieldName} was not supplied.`);
  if (typeof strVal !== "string")
    throw new Error(`${fieldName} must be a string!`);
  strVal = strVal.trim();
  if (strVal.length === 0)
    throw new Error(
      `${fieldName} cannot be an empty string or a string with just spaces`,
    );
  return strVal;
};

export const validateLogin = (
  first: string,
  last: string | null,
  paymentMethods: { service: string; user: string }[],
) => {
  let firstName = checkString(first, "First name");
  if (firstName.length < 2)
    throw new Error("First name must be at least 2 characters.");
  if (firstName.length > 25)
    throw new Error("First name cannot exceed 25 characters.");

  let lastName: string | null = null;
  if (last !== null && last !== undefined) {
    lastName = checkString(last, "Last name");
    if (lastName.length < 2)
      throw new Error("Last name must be at least 2 characters.");
    if (lastName.length > 25)
      throw new Error("Last name cannot exceed 25 characters.");
  }

  if (!paymentMethods || paymentMethods.length === 0)
    throw new Error("At least one payment method must be selected.");

  for (const method of paymentMethods) {
    let username = checkString(method.user, `${method.service} username`);
    if (username.length < 2)
      throw new Error(
        `${method.service} username must be at least 2 characters.`,
      );
    if (username.length > 25)
      throw new Error(
        `${method.service} username cannot exceed 25 characters.`,
      );
  }

  return {
    first_name: firstName,
    last_name: lastName,
    payment_methods: paymentMethods,
  };
};