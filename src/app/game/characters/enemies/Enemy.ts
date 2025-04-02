import Character from '../Character.js';

export default abstract class Enemy extends Character {
  public abstract calculateMovement(): Promise<void>;
  execPower(): void {} // Enemy has no power
  public getId(): string {
    return this.id;
  }
  kill(): boolean {
    // Enemy can kill
    return true;
  }

  die(): boolean {
    // Enemy can't die
    return false;
  }
  reborn(): void {} // Enemy cannot reborn, becasue it can't die either
}
