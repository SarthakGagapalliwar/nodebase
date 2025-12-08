import Cryptr from "cryptr"

const cryptr = new Cryptr(process.env.ENCRYPTION_KEY!);

export const excrypt = (text:string)=>cryptr.encrypt(text);
export const decrypy = (text:string)=>cryptr.decrypt(text);