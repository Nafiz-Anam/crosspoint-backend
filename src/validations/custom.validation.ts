import Joi from "joi";

// Standardized password regex pattern used across all validations
export const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\^$*.\\[\]{}()?\-"!@#%&/,><':;|_~`])\S{10,}$/;

export const password: Joi.CustomValidator<string> = (value, helpers) => {
  if (value.length < 10) {
    return helpers.error("password must be at least 10 characters");
  }
  if (!value.match(passwordRegex)) {
    return helpers.error(
      "password must be at least 10 characters long, with at least one uppercase letter, one lowercase letter, one digit, and one special character, without spaces"
    );
  }
  return value;
};

export const objectId: Joi.CustomValidator<string> = (value, helpers) => {
  if (
    !value.match(/^[0-9a-fA-F]{24}$/) &&
    !value.match(
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/
    )
  ) {
    return helpers.error("{{#label}} must be a valid mongo id or uuid");
  }
  return value;
};
