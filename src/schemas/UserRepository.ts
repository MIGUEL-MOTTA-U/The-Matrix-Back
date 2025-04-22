import type { UserQueue } from './zod.js';

export default interface UserRepository {
  /**
   * Retrieves a user by their ID.
   *
   * @param {string} userId - The ID of the user to retrieve.
   * @return {Promise<User>} A promise that resolves to the user object.
   */
  getUserById(userId: string): Promise<UserQueue>;

  /**
   * Updates the user with the given ID.
   *
   * @param {string} userId - The ID of the user to update.
   * @param {Partial<User>} userData - The data to update in the user.
   * @return {Promise<void>} A promise that resolves when the update is complete.
   */
  updateUser(userId: string, userData: Partial<UserQueue>): Promise<void>;

  /**
   * Deletes the user with the given ID.
   *
   * @param {string} userId - The ID of the user to delete.
   * @return {Promise<void>} A promise that resolves when the user is deleted.
   */
  deleteUser(userId: string): Promise<void>;

  /**
   * Creates a new user.
   *
   * @param {User} user - The user object to create.
   * @return {Promise<void>} A promise that resolves when the user is created.
   */
  createUser(user: UserQueue): Promise<void>;

  /**
   * Retrieves all users.
   *
   * @return {Promise<User[]>} A promise that resolves to an array of user objects.
   */
  getAllUsers(): Promise<UserQueue[]>;

  /**
   * Extends the session for the user with the given ID.
   *
   * @param {string} userId - The ID of the user to extend the session for.
   * @param {number} duration - The duration in minutes to extend the session for.
   * @return {Promise<void>} A promise that resolves when the session is extended.
   */
  extendSession(userId: string, duration: number): Promise<void>;

  /**
   * User exists
   *
   * @param {string} userId - The ID of the user to check.
   * @return {Promise<boolean>} A promise that resolves to true if the user exists, false otherwise.
   */
  userExists(userId: string): Promise<boolean>;
}
