import Joi from "joi";

export const password: Joi.CustomValidator<string> = (value, helpers) => {
  if (value.length < 8) {
    return helpers.error("password must be at least 8 characters");
  }
  if (!value.match(/\d/) || !value.match(/[a-zA-Z]/)) {
    return helpers.error(
      "password must contain at least 1 letter and 1 number"
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
