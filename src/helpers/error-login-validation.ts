import { isEmpty, isNil } from "lodash";


export const extractError = (email: string, password: string): Record<string, string> => {
    const errors: Record<string, string> = {};
    if (isNil(email) || isEmpty(email)) {
        errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.email = 'Invalid email address';
    }
    if (isNil(password) || isEmpty(password)) {
        errors.password = 'Password is required';
    }
    return errors;
}