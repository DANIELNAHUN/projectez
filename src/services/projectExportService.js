/**
 * ProjectExportService - Handles project export functionality
 * Provides methods to export projects to JSON format with proper serialization
 */

export class ProjectExportService {
  /**
   * Safely convert a date value to ISO string
   * @param {Date|string|null} dateValue - Date value to convert
   * @returns {string|null} ISO string or null
   */
  static safeToISOString(dateValue) {
    if (!dateValue) return null;
    
    try {
      // If it's already a Date object
      if (dateValue instanceof Date) {
        return dateValue.toISOString();
      }
      
      // If it's a string, try to parse it
      if (typeof dateValue === 'string') {
        const date = new Date(dateValue);
        if (!isNaN(date.getTime())) {
          return date.toISOString();
        }
      }
      
      // If it's a number (timestamp)
      if (typeof dateValue === 'number') {
        const date = new Date(dateValue);
        if (!isNaN(date.getTime())) {
          return date.toISOString();
        }
      }
      
      return null;
    } catch (error) {
      console.warn('Error converting date to ISO string:', dateValue, error);
      return null;
    }
  }

  /**
   * Export a project to JSON format with proper serialization
   * @param {Project} project - The project to export
   * @returns {string} JSON string representation of the project
   * @throws {Error} If project is invalid or export fails
   */
  static exportProject(project) {
    if (!project) {
      throw new Error('Project is required for export');
    }

    if (!project.id || !project.name) {
      throw new Error('Project must have an id and name');
    }

    try {
      // Create export data structure with all project components
      const exportData = {
        // Project metadata
        id: project.id,
        name: project.name,
        description: project.description || '',
        startDate: this.safeToISOString(project.startDate),
        endDate: this.safeToISOString(project.endDate),
        status: project.status || 'active',
        createdAt: this.safeToISOString(project.createdAt) || new Date().toISOString(),
        updatedAt: this.safeToISOString(project.updatedAt) || new Date().toISOString(),
        
        // Team members with full serialization
        teamMembers: this.serializeTeamMembers(project.teamMembers || []),
        
        // Tasks with full hierarchy and deliverables
        tasks: this.serializeTasks(project.tasks || []),
        
        // Export metadata
        exportedAt: new Date().toISOString(),
        exportVersion: '1.0.0'
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      throw new Error(`Failed to export project: ${error.message}`);
    }
  }

  /**
   * Serialize team members to JSON-compatible format
   * @param {TeamMember[]} teamMembers - Array of team members
   * @returns {Object[]} Serialized team members
   */
  static serializeTeamMembers(teamMembers) {
    return teamMembers.map(member => ({
      id: member.id,
      name: member.name || '',
      email: member.email || '',
      role: member.role || '',
      avatar: member.avatar || null,
      joinedAt: this.safeToISOString(member.joinedAt) || new Date().toISOString()
    }));
  }

  /**
   * Serialize tasks with full hierarchy and deliverables
   * @param {Task[]} tasks - Array of tasks
   * @returns {Object[]} Serialized tasks
   */
  static serializeTasks(tasks) {
    return tasks.map(task => ({
      id: task.id,
      projectId: task.projectId || '',
      parentTaskId: task.parentTaskId || null,
      title: task.title || '',
      description: task.description || '',
      startDate: this.safeToISOString(task.startDate),
      endDate: this.safeToISOString(task.endDate),
      status: task.status || 'pending',
      type: task.type || 'simple',
      assignedTo: task.assignedTo || null,
      priority: task.priority || 'medium',
      progress: task.progress || 0,
      level: task.level || 0,
      duration: task.duration || 0,
      adjustStartDate: task.adjustStartDate || false,
      createdAt: this.safeToISOString(task.createdAt) || new Date().toISOString(),
      updatedAt: this.safeToISOString(task.updatedAt) || new Date().toISOString(),
      
      // Serialize deliverable if present
      deliverable: task.deliverable ? this.serializeDeliverable(task.deliverable) : null,
      
      // Serialize subtasks recursively
      subtasks: task.subtasks ? this.serializeTasks(task.subtasks) : []
    }));
  }

  /**
   * Serialize deliverable to JSON-compatible format
   * @param {Deliverable} deliverable - The deliverable to serialize
   * @returns {Object} Serialized deliverable
   */
  static serializeDeliverable(deliverable) {
    return {
      type: deliverable.type || 'other',
      description: deliverable.description || '',
      dueDate: this.safeToISOString(deliverable.dueDate),
      status: deliverable.status || 'pending',
      notes: deliverable.notes || ''
    };
  }

  /**
   * Generate and download a JSON file with the project data
   * @param {string} jsonData - The JSON string to download
   * @param {string} filename - The filename for the download (without extension)
   * @throws {Error} If download fails or browser doesn't support downloads
   */
  static downloadJSON(jsonData, filename = 'project-export') {
    if (!jsonData) {
      throw new Error('JSON data is required for download');
    }

    if (typeof jsonData !== 'string') {
      throw new Error('JSON data must be a string');
    }

    try {
      // Validate JSON format
      JSON.parse(jsonData);
    } catch (error) {
      throw new Error('Invalid JSON data provided for download');
    }

    try {
      // Create blob with JSON data
      const blob = new Blob([jsonData], { type: 'application/json' });
      
      // Create download URL
      const url = URL.createObjectURL(blob);
      
      // Create temporary download link
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.json`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      throw new Error(`Failed to download JSON file: ${error.message}`);
    }
  }

  /**
   * Export and download a project in one operation
   * @param {Project} project - The project to export and download
   * @param {string} filename - Optional filename (defaults to project name)
   */
  static exportAndDownload(project, filename = null) {
    if (!project) {
      throw new Error('Project is required for export and download');
    }

    try {
      // Export project to JSON
      const jsonData = this.exportProject(project);
      
      // Generate filename from project name if not provided
      const downloadFilename = filename || this.sanitizeFilename(project.name) || 'project-export';
      
      // Download the JSON file
      this.downloadJSON(jsonData, downloadFilename);
      
    } catch (error) {
      throw new Error(`Failed to export and download project: ${error.message}`);
    }
  }

  /**
   * Sanitize filename for safe file system usage
   * @param {string} filename - The filename to sanitize
   * @returns {string} Sanitized filename
   */
  static sanitizeFilename(filename) {
    if (!filename || typeof filename !== 'string' || filename.trim() === '') {
      return 'project-export';
    }

    // Remove or replace invalid characters
    const sanitized = filename
      .replace(/[<>:"/\\|?*]/g, '-')  // Replace invalid chars with dash
      .replace(/\s+/g, '-')           // Replace spaces with dash
      .replace(/-+/g, '-')            // Replace multiple dashes with single dash
      .replace(/^-|-$/g, '')          // Remove leading/trailing dashes
      .toLowerCase()
      .substring(0, 50);              // Limit length

    // Return default if result is empty after sanitization
    return sanitized || 'project-export';
  }

  /**
   * Validate project structure for export
   * @param {Project} project - The project to validate
   * @returns {Object} Validation result with isValid flag and errors array
   */
  static validateProjectForExport(project) {
    const result = {
      isValid: true,
      errors: [],
      warnings: []
    };

    // Check if project exists
    if (!project) {
      result.errors.push('Project is required');
      result.isValid = false;
      return result;
    }

    // Check required fields
    if (!project.id) {
      result.errors.push('Project must have an id');
      result.isValid = false;
    }

    if (!project.name || project.name.trim() === '') {
      result.errors.push('Project must have a name');
      result.isValid = false;
    }

    // Check date validity
    if (project.startDate) {
      const startDate = project.startDate instanceof Date ? project.startDate : new Date(project.startDate);
      if (isNaN(startDate.getTime())) {
        result.errors.push('Project start date is invalid');
        result.isValid = false;
      }
    }

    if (project.endDate) {
      const endDate = project.endDate instanceof Date ? project.endDate : new Date(project.endDate);
      if (isNaN(endDate.getTime())) {
        result.errors.push('Project end date is invalid');
        result.isValid = false;
      }
    }

    // Validate tasks
    if (project.tasks && Array.isArray(project.tasks)) {
      project.tasks.forEach((task, index) => {
        if (!task.id) {
          result.errors.push(`Task at index ${index} is missing an id`);
          result.isValid = false;
        }

        if (!task.title || task.title.trim() === '') {
          result.warnings.push(`Task at index ${index} is missing a title`);
        }

        if (task.startDate) {
          const startDate = task.startDate instanceof Date ? task.startDate : new Date(task.startDate);
          if (isNaN(startDate.getTime())) {
            result.errors.push(`Task "${task.title || 'Untitled'}" has invalid start date`);
            result.isValid = false;
          }
        }

        if (task.endDate) {
          const endDate = task.endDate instanceof Date ? task.endDate : new Date(task.endDate);
          if (isNaN(endDate.getTime())) {
            result.errors.push(`Task "${task.title || 'Untitled'}" has invalid end date`);
            result.isValid = false;
          }
        }
      });
    }

    // Validate team members
    if (project.teamMembers && Array.isArray(project.teamMembers)) {
      project.teamMembers.forEach((member, index) => {
        if (!member.id) {
          result.errors.push(`Team member at index ${index} is missing an id`);
          result.isValid = false;
        }

        if (!member.name || member.name.trim() === '') {
          result.warnings.push(`Team member at index ${index} is missing a name`);
        }
      });
    }

    return result;
  }
}