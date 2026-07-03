export interface EmailPort {
  sendRegistrationPending(email: string, firstName: string): Promise<void>;
  sendPasswordReset(email: string, resetUrl: string): Promise<void>;
  sendHelpRequestConfirmation(email: string, firstName: string): Promise<void>;
  sendContactConfirmation(email: string, name: string): Promise<void>;
}
