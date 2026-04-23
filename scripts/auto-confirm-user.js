const {
  CognitoIdentityProviderClient,
  AdminAddUserToGroupCommand,
} = require("@aws-sdk/client-cognito-identity-provider");

const cognitoClient = new CognitoIdentityProviderClient({});

// Default group assigned to every new user at signup.
const DEFAULT_GROUP = "GeneralUsers";

exports.handler = async (event) => {
  // Auto-confirm the user so they don't need a verification code
  event.response.autoConfirmUser = true;

  // Auto-verify email and phone so they are marked as verified
  if (
    Object.prototype.hasOwnProperty.call(event.request.userAttributes, "email")
  ) {
    event.response.autoVerifyEmail = true;
  }
  if (
    Object.prototype.hasOwnProperty.call(
      event.request.userAttributes,
      "phone_number",
    )
  ) {
    event.response.autoVerifyPhone = true;
  }

  // Add the new user to the default group so verify-otp returns real groups.
  // Cognito requires the user to already exist before group assignment; at
  // PreSignUp the record is created but not yet confirmed — adminAddUserToGroup
  // works here because we set autoConfirmUser = true above first.
  try {
    await cognitoClient.send(
      new AdminAddUserToGroupCommand({
        UserPoolId: event.userPoolId,
        Username: event.userName,
        GroupName: DEFAULT_GROUP,
      }),
    );
    console.log(`[AutoConfirm] Added ${event.userName} to ${DEFAULT_GROUP}`);
  } catch (err) {
    // Log but do not fail — a missing group assignment is non-fatal.
    // The user can be added manually via the AWS console if needed.
    console.error(`[AutoConfirm] Failed to add user to group: ${err.message}`);
  }

  return event;
};
