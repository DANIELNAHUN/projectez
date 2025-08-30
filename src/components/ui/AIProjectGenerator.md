# AIProjectGenerator Component

## Overview

The AIProjectGenerator is a Vue component that provides a chatbot interface for generating complete project structures using OpenAI's GPT models. Users can describe their project in natural language, and the AI will generate a comprehensive project with tasks, team members, and realistic timelines.

## Features

- **Chat Interface**: Interactive chatbot for natural language project descriptions
- **Complexity Levels**: Support for basic, medium, and detailed project complexity
- **Project Preview**: Preview generated projects before importing
- **Date Adjustment**: Set custom start dates for imported projects
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Loading States**: Visual feedback during AI generation and import processes
- **Confirmation Dialogs**: Safety confirmations before importing projects

## Usage

### Basic Usage

```vue
<template>
  <div>
    <button @click="showGenerator = true">Generate Project with AI</button>
    
    <AIProjectGenerator
      v-model:visible="showGenerator"
      @project-imported="handleProjectImported"
    />
  </div>
</template>

<script>
import AIProjectGenerator from '@/components/ui/AIProjectGenerator.vue'

export default {
  components: {
    AIProjectGenerator
  },
  data() {
    return {
      showGenerator: false
    }
  },
  methods: {
    handleProjectImported(project) {
      console.log('Project imported:', project)
      // Handle the imported project
    }
  }
}
</script>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `visible` | Boolean | `false` | Controls the visibility of the modal |

### Events

| Event | Payload | Description |
|-------|---------|-------------|
| `update:visible` | Boolean | Emitted when modal visibility changes |
| `project-imported` | Object | Emitted when a project is successfully imported |

## Configuration

### OpenAI API Setup

Before using the component, users need to configure their OpenAI API key:

1. The component will show a configuration screen on first use
2. Users enter their OpenAI API key
3. The component tests the connection
4. Once configured, the chat interface becomes available

**Note**: In production, API calls should go through a backend service for security.

### Complexity Levels

The component supports three complexity levels:

- **Basic**: 3-8 main tasks with minimal subtasks
- **Medium**: 5-15 main tasks with relevant subtasks (default)
- **Detailed**: 10-20 main tasks with comprehensive subtasks

## Generated Project Structure

The AI generates projects with the following structure:

```javascript
{
  id: "unique-project-id",
  name: "Project Name",
  description: "Detailed description",
  estimatedDuration: 30, // working days
  tasks: [
    {
      id: "task-id",
      title: "Task Title",
      description: "Task description",
      duration: 5, // working days
      priority: "medium", // low, medium, high
      type: "simple", // simple, with_deliverable
      subtasks: [...], // nested subtasks
      deliverable: { // if type is with_deliverable
        type: "file", // presentation, file, exposition, other
        description: "Deliverable description"
      }
    }
  ],
  teamMembers: [
    {
      name: "Team Member Name",
      role: "Role/Position",
      email: "email@example.com"
    }
  ]
}
```

## Example Prompts

### Basic Prompts
- "Create a simple website for a restaurant"
- "Build a mobile app for task management"
- "Develop an e-commerce platform"

### Detailed Prompts
- "Create a comprehensive e-commerce platform with user authentication, product catalog, shopping cart, payment processing, order management, and admin dashboard. Include both web and mobile interfaces."
- "Build a project management system with team collaboration features, Gantt charts, time tracking, file sharing, and reporting capabilities for software development teams."

## Error Handling

The component handles various error scenarios:

- **API Configuration Errors**: Invalid API keys, quota exceeded
- **Generation Errors**: Network issues, invalid responses
- **Import Errors**: Validation failures, storage issues
- **Rate Limiting**: Automatic retry with exponential backoff

## Integration with Store

The component integrates with the Vuex store through the `projects/importProject` action:

```javascript
// In your store module
actions: {
  async importProject({ commit }, projectData) {
    // Import logic here
    const project = await ProjectImportService.importProject(projectData)
    commit('ADD_PROJECT', project)
    return project
  }
}
```

## Testing

The component includes comprehensive unit tests covering:

- Component initialization and rendering
- API configuration flow
- Project generation workflow
- Error handling scenarios
- Import functionality
- User interactions

Run tests with:
```bash
npm run test -- src/test/components/ui/AIProjectGenerator.test.js
```

## Dependencies

- **OpenAI**: For AI project generation
- **Vuex**: For state management
- **ResponsiveModal**: For modal functionality
- **LoadingSpinner**: For loading states

## Security Considerations

- API keys are cleared from memory after configuration
- In production, implement backend proxy for OpenAI API calls
- Validate all generated content before import
- Implement rate limiting and usage monitoring

## Accessibility

The component follows accessibility best practices:

- Keyboard navigation support
- Screen reader compatible
- Focus management
- ARIA labels and descriptions
- High contrast support

## Browser Support

Compatible with all modern browsers that support:
- ES6+ features
- Vue 3 Composition API
- CSS Grid and Flexbox