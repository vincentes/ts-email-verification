import { EmailValidator } from "@vbermudez/email-validator";

(async () => {
  const result = await EmailValidator.validateEmail("test@example.com");
  console.log(result);
})();
