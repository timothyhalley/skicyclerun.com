exports.handler = async (event) => {
  // Auto-confirm the user so they don't need a verification code
  event.response.autoConfirmUser = true;

  // Auto-verify email and phone so they are marked as verified
  if (event.request.userAttributes.hasOwnProperty("email")) {
    event.response.autoVerifyEmail = true;
  }
  if (event.request.userAttributes.hasOwnProperty("phone_number")) {
    event.response.autoVerifyPhone = true;
  }

  return event;
};
