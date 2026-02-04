export abstract class HashChecker {
  abstract check(password: string, hash: string): Promise<boolean>
}
