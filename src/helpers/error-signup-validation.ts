import { isEmpty, isNil } from "lodash";

export const extractError = (name: string, lastName: string, email: string, password: string): Record<string, string> => {
    const errors: Record<string, string> = {};
    if (isNil(name) || isEmpty(name)) {
        errors.name = 'Name is required';
    }
    if (isNil(lastName) || isEmpty(lastName)) {
        errors.lastName = 'Last name is required';
    }
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
