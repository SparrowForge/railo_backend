import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';

export function generateRandomPassword(length = 16) {
    return crypto.randomBytes(length).toString('base64').slice(0, length);
}

export async function generateRandomHashedPassword(length = 16) {
    const rawPass = generateRandomPassword(length);
    return await bcrypt.hash(rawPass, 10);
}
