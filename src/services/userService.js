import { storageService } from './storageService.js'
import { TeamMember } from '../models/index.js'

/**
 * Service for managing global users across all projects
 */
class UserService {
  constructor() {
    this.USERS_KEY = 'global_users'
  }

  /**
   * Get all global users
   * @returns {Array} Array of users
   */
  getAllUsers() {
    try {
      const users = localStorage.getItem(this.USERS_KEY)
      return users ? JSON.parse(users).map(user => TeamMember.fromJSON(user)) : []
    } catch (error) {
      console.error('Error loading global users:', error)
      return []
    }
  }

  /**
   * Save a user to global users list
   * @param {Object} userData - User data
   * @returns {TeamMember} The saved user
   */
  saveUser(userData) {
    try {
      const users = this.getAllUsers()
      
      // Check if user already exists (by email)
      const existingUserIndex = users.findIndex(user => user.email === userData.email)
      
      let user
      if (existingUserIndex !== -1) {
        // Update existing user
        user = new TeamMember({ ...users[existingUserIndex], ...userData })
        users[existingUserIndex] = user
      } else {
        // Create new user
        user = new TeamMember(userData)
        users.push(user)
      }
      
      // Save to localStorage
      localStorage.setItem(this.USERS_KEY, JSON.stringify(users.map(u => u.toJSON())))
      
      return user
    } catch (error) {
      console.error('Error saving user:', error)
      throw error
    }
  }

  /**
   * Get user by ID
   * @param {string} userId - User ID
   * @returns {TeamMember|null} The user or null if not found
   */
  getUserById(userId) {
    const users = this.getAllUsers()
    return users.find(user => user.id === userId) || null
  }

  /**
   * Get user by email
   * @param {string} email - User email
   * @returns {TeamMember|null} The user or null if not found
   */
  getUserByEmail(email) {
    const users = this.getAllUsers()
    return users.find(user => user.email === email) || null
  }

  /**
   * Delete a user from global users
   * @param {string} userId - User ID
   */
  deleteUser(userId) {
    try {
      const users = this.getAllUsers()
      const filteredUsers = users.filter(user => user.id !== userId)
      localStorage.setItem(this.USERS_KEY, JSON.stringify(filteredUsers.map(u => u.toJSON())))
    } catch (error) {
      console.error('Error deleting user:', error)
      throw error
    }
  }

  /**
   * Get users that are not in the specified project
   * @param {string} projectId - Project ID
   * @returns {Array} Array of available users
   */
  getAvailableUsersForProject(projectId) {
    try {
      const allUsers = this.getAllUsers()
      const project = storageService.getProject(projectId)
      
      if (!project) return allUsers
      
      const projectMemberEmails = project.teamMembers.map(member => member.email)
      
      return allUsers.filter(user => !projectMemberEmails.includes(user.email))
    } catch (error) {
      console.error('Error getting available users:', error)
      return []
    }
  }

  /**
   * Sync user data when a team member is added to a project
   * This ensures the global user list is updated with any new users
   * @param {Object} memberData - Team member data
   */
  syncUserFromTeamMember(memberData) {
    try {
      this.saveUser(memberData)
    } catch (error) {
      console.error('Error syncing user from team member:', error)
    }
  }
}

export const userService = new UserService()