import "express-session";

declare module "express-session" {
  interface SessionData {
    fyers_app_id?: string;
    fyers_secret_id?: string;
    fyers_pin?: string;
  }
}
