import { describe, it, expect, beforeEach } from 'vitest'
import { mountComponent, mockProject } from '../../utils.js'
import ProjectCard from '../../../components/project/ProjectCard.vue'

describe('ProjectCard', () => {
  let wrapper
  let project

  beforeEach(() => {
    project = mockProject({
      name: 'Test Project',
      description: 'Test project description',
      status: 'active',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      tasks: [
        { id: '1', status: 'completed' },
        { id: '2', status: 'pending' },
        { id: '3', status: 'completed' }
      ],
      teamMembers: [
        { id: '1', name: 'John Doe' },
        { id: '2', name: 'Jane Smith' }
      ]
    })
  })

  describe('rendering', () => {
    beforeEach(() => {
      wrapper = mountComponent(ProjectCard, {
        props: { project }
      })
    })

    it('should render project name and description', () => {
      expect(wrapper.text()).toContain('Test Project')
      expect(wrapper.text()).toContain('Test project description')
    })

    it('should render project status', () => {
      expect(wrapper.text()).toContain('Activo')
      expect(wrapper.find('.bg-green-100').exists()).toBe(true)
    })

    it('should render project stats', () => {
      expect(wrapper.text()).toContain('3')
      expect(wrapper.text()).toContain('Tareas')
      expect(wrapper.text()).toContain('2')
      expect(wrapper.text()).toContain('Miembros')
    })

    it('should render project dates', () => {
      expect(wrapper.text()).toContain('Inicio: 1 ene 2024')
      expect(wrapper.text()).toContain('Fin: 31 dic 2024')
    })

    it('should render progress percentage', () => {
      expect(wrapper.text()).toContain('67% completado')
    })

    it('should render action buttons', () => {
      const editButton = wrapper.find('[title="Editar proyecto"]')
      const deleteButton = wrapper.find('[title="Eliminar proyecto"]')
      
      expect(editButton.exists()).toBe(true)
      expect(deleteButton.exists()).toBe(true)
    })

    it('should render view project button', () => {
      const viewButton = wrapper.find('button:last-child')
      expect(viewButton.text()).toBe('Ver Proyecto')
    })
  })

  describe('status display', () => {
    it('should display active status correctly', () => {
      wrapper = mountComponent(ProjectCard, {
        props: { project: { ...project, status: 'active' } }
      })
      
      expect(wrapper.text()).toContain('Activo')
      expect(wrapper.find('.bg-green-100').exists()).toBe(true)
    })

    it('should display completed status correctly', () => {
      wrapper = mountComponent(ProjectCard, {
        props: { project: { ...project, status: 'completed' } }
      })
      
      expect(wrapper.text()).toContain('Completado')
      expect(wrapper.find('.bg-blue-100').exists()).toBe(true)
    })

    it('should display paused status correctly', () => {
      wrapper = mountComponent(ProjectCard, {
        props: { project: { ...project, status: 'paused' } }
      })
      
      expect(wrapper.text()).toContain('Pausado')
      expect(wrapper.find('.bg-yellow-100').exists()).toBe(true)
    })

    it('should handle unknown status', () => {
      wrapper = mountComponent(ProjectCard, {
        props: { project: { ...project, status: 'unknown' } }
      })
      
      expect(wrapper.text()).toContain('Desconocido')
      expect(wrapper.find('.bg-gray-100').exists()).toBe(true)
    })
  })

  describe('progress calculation', () => {
    it('should calculate progress correctly', () => {
      wrapper = mountComponent(ProjectCard, {
        props: { project }
      })
      
      // 2 completed out of 3 tasks = 67%
      expect(wrapper.text()).toContain('67% completado')
    })

    it('should handle no tasks', () => {
      wrapper = mountComponent(ProjectCard, {
        props: { project: { ...project, tasks: [] } }
      })
      
      expect(wrapper.text()).not.toContain('% completado')
    })

    it('should handle undefined tasks', () => {
      wrapper = mountComponent(ProjectCard, {
        props: { project: { ...project, tasks: undefined } }
      })
      
      expect(wrapper.text()).not.toContain('% completado')
    })
  })

  describe('days remaining calculation', () => {
    it('should show days remaining for future end date', () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 5)
      
      wrapper = mountComponent(ProjectCard, {
        props: { project: { ...project, endDate: futureDate } }
      })
      
      expect(wrapper.text()).toContain('5 días restantes')
    })

    it('should show overdue for past end date', () => {
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 3)
      
      wrapper = mountComponent(ProjectCard, {
        props: { project: { ...project, endDate: pastDate } }
      })
      
      expect(wrapper.text()).toContain('3 días de retraso')
    })

    it('should show "vence hoy" for today', () => {
      const today = new Date()
      
      wrapper = mountComponent(ProjectCard, {
        props: { project: { ...project, endDate: today } }
      })
      
      expect(wrapper.text()).toContain('Vence hoy')
    })

    it('should show "vence mañana" for tomorrow', () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      
      wrapper = mountComponent(ProjectCard, {
        props: { project: { ...project, endDate: tomorrow } }
      })
      
      expect(wrapper.text()).toContain('Vence mañana')
    })

    it('should not show days remaining for completed projects', () => {
      wrapper = mountComponent(ProjectCard, {
        props: { project: { ...project, status: 'completed' } }
      })
      
      expect(wrapper.text()).not.toContain('días restantes')
    })

    it('should not show days remaining when no end date', () => {
      wrapper = mountComponent(ProjectCard, {
        props: { project: { ...project, endDate: null } }
      })
      
      expect(wrapper.text()).not.toContain('días restantes')
    })
  })

  describe('date formatting', () => {
    it('should format dates correctly', () => {
      wrapper = mountComponent(ProjectCard, {
        props: { project }
      })
      
      expect(wrapper.text()).toContain('1 ene 2024')
      expect(wrapper.text()).toContain('31 dic 2024')
    })

    it('should handle missing dates', () => {
      wrapper = mountComponent(ProjectCard, {
        props: { project: { ...project, endDate: null } }
      })
      
      expect(wrapper.text()).not.toContain('Fin:')
    })
  })

  describe('empty states', () => {
    it('should handle project without description', () => {
      wrapper = mountComponent(ProjectCard, {
        props: { project: { ...project, description: null } }
      })
      
      expect(wrapper.text()).toContain('Sin descripción')
    })

    it('should handle project without tasks', () => {
      wrapper = mountComponent(ProjectCard, {
        props: { project: { ...project, tasks: [] } }
      })
      
      expect(wrapper.text()).toContain('0')
      expect(wrapper.text()).toContain('Tareas')
    })

    it('should handle project without team members', () => {
      wrapper = mountComponent(ProjectCard, {
        props: { project: { ...project, teamMembers: [] } }
      })
      
      expect(wrapper.text()).toContain('0')
      expect(wrapper.text()).toContain('Miembros')
    })
  })

  describe('events', () => {
    beforeEach(() => {
      wrapper = mountComponent(ProjectCard, {
        props: { project }
      })
    })

    it('should emit edit event when edit button is clicked', async () => {
      const editButton = wrapper.find('[title="Editar proyecto"]')
      await editButton.trigger('click')
      
      expect(wrapper.emitted('edit')).toBeTruthy()
      expect(wrapper.emitted('edit')[0]).toEqual([project])
    })

    it('should emit delete event when delete button is clicked', async () => {
      const deleteButton = wrapper.find('[title="Eliminar proyecto"]')
      await deleteButton.trigger('click')
      
      expect(wrapper.emitted('delete')).toBeTruthy()
      expect(wrapper.emitted('delete')[0]).toEqual([project])
    })

    it('should emit view event when view button is clicked', async () => {
      const viewButton = wrapper.find('button:last-child')
      await viewButton.trigger('click')
      
      expect(wrapper.emitted('view')).toBeTruthy()
      expect(wrapper.emitted('view')[0]).toEqual([project])
    })
  })

  describe('responsive behavior', () => {
    it('should use ResponsiveCard component', () => {
      wrapper = mountComponent(ProjectCard, {
        props: { project }
      })
      
      expect(wrapper.findComponent({ name: 'ResponsiveCard' }).exists()).toBe(true)
    })

    it('should have hover effects', () => {
      wrapper = mountComponent(ProjectCard, {
        props: { project }
      })
      
      expect(wrapper.find('.group').exists()).toBe(true)
      expect(wrapper.find('.group-hover\\:opacity-100').exists()).toBe(true)
    })
  })

  describe('accessibility', () => {
    beforeEach(() => {
      wrapper = mountComponent(ProjectCard, {
        props: { project }
      })
    })

    it('should have proper button titles', () => {
      expect(wrapper.find('[title="Editar proyecto"]').exists()).toBe(true)
      expect(wrapper.find('[title="Eliminar proyecto"]').exists()).toBe(true)
    })

    it('should have proper semantic structure', () => {
      expect(wrapper.find('h3').exists()).toBe(true)
      expect(wrapper.find('button').exists()).toBe(true)
    })
  })
})