/**
 * Example usage of flexible format detection and project generation
 * Demonstrates how the system handles custom task formats like "Titulo / Asignado a / Duracion (días)"
 */

import { promptAnalyzer } from '../utils/promptAnalyzer.js';
import { openAIService } from '../services/openAIService.js';

// Example 1: Eficlub project with explicit format specification
const eficlubPrompt = `Proyecto Eficlub

Equipo: Daniel Calcina (DC), Dayana Zegarra (DZ)
Formato: Titulo / Asignado a / Duracion (días)

MODULO 1. ANALISIS DEL SISTEMA / DC
- Definir Modulos, permisos y roles del Sistema / DC / 1
- Crear BD del Sistema / DC / 1
MODULO 2. INTRANET / DC
- Submodulo Login / DZ
    - Login de usuarios (encriptados) / DC / 1
    - Registro de nuevos usuarios / DC / 1
    - Actualizacion y eliminacion de usuarios / DC / 1
    - Asignacion de Usuarios y permisos / DC / 1
- Submodulo Personas / DZ
    - Creacion de personas / DC / 4
    - Creacion de parametros de las empresas / DC / 3
    - Dar de baja persona / DC / 2
    - Restaurar contraseñas / DC / 1
    - Gestion de personas. Solicitud Registro / DC / 1
    - Gestion de personas. Solicitud Baja / DC / 1
- Submodulo Solicitudes / DZ
    - Creacion solicitud / DC / 3
    - Atencion solicitud / DC / 4
    - Configuracion tipos de solicitudes por Area / DC / 2
    - Reporteria Solicitudes / DC / 2
MODULO 3. COMERCIAL / DC
- Submodulo Formularios de Venta / DZ
    - Mejora en desarrollo, API de Scord, sincronizacion vendedores y tarifas / DC / 5
- Submodulo Infoexpress / DZ
    - Mejora en la funcionalidad y UX del desarrrollo / DC / 3
- Submodulo Puntos Cclub / DZ
    - Modulo Panel Principal. Conexión a ETL, calculo de puntos, Vista Cliente/Asesor / DC / 10
    - Modulo Tienda. Gestion productos, catalogo, canjes / DC / 7
    - Modulo Solicitudes. Integracion con el modulo solicitudes de la Intranet. / DC / 5
    - Modulo Administrador / DC / 2
    - Modulo Reportes / DC / 2
- Submodulo Validaciones Calidad / DZ
    - Integrarlo dentro de Intranet / DC / 1
MODULO 4. OPERACIONES / DC
- Submodulo Administracion Cuadrillas / DZ
    - Crear cuadrillas, asignar tecnicos, definir horarios de atencion y datos corporativos / DC / 6
- Submodulo Programacion y Seguimiento OS / DZ
    - Extraccion y sincronizacion tabla OS ETL / DC / 3
    - Integracion con Modulo Admin. Cuadrillas / DC / 3
    - Agregar campos propios del modulo a lo ya obtenido del ETL / DC / 2
    - Exportar registros seleccionados / DC / 1
- Submodulo Atencion OS / DZ
    - Vista de OS filtrado por cuadrilla y ordenado según programacion / DC / 4
    - Control estados de OS / DC / 3
    - Campo comentarios del tecnico en OS(no obligatorio pero importante) / DC / 1
    - Crear Vista responsive para tecnicos / DC / 2
MODULO 5. MODULOS ADMINISTRACION Y FINANZAS / DC
- Submodulo Generador Plantilla / DZ
    - Migrar desarrollo a la Intranet / DC / 1`;

// Example 2: Alternative format with different separator
const alternativeFormatPrompt = `Sistema de Gestión Empresarial

Equipo: Ana García (AG), Luis Pérez (LP), María Rodríguez (MR)
Formato: Tarea | Responsable | Duración meses

MÓDULO VENTAS | AG
- Gestión de clientes | AG | 2
- Proceso de cotizaciones | LP | 1
- Seguimiento de leads | MR | 1

MÓDULO INVENTARIO | LP  
- Control de stock | LP | 3
- Gestión de proveedores | AG | 2
- Reportes de inventario | MR | 1

MÓDULO FINANZAS | MR
- Facturación automática | MR | 2
- Control de pagos | AG | 1
- Reportes financieros | LP | 1`;

// Example 3: Format without explicit specification (implicit detection)
const implicitFormatPrompt = `Desarrollo de Aplicación Móvil

- Diseño de interfaz - UI Team - 5 días
- Desarrollo backend - Backend Team - 10 días  
- Integración API - Full Stack - 3 días
- Testing y QA - QA Team - 4 días
- Deployment - DevOps - 2 días`;

/**
 * Analyze and generate project with flexible format
 */
export const analyzeFlexibleFormat = async (prompt, title) => {
  console.log(`\n=== ${title} ===`);
  console.log('Prompt:', prompt.substring(0, 100) + '...\n');

  // Step 1: Analyze the prompt structure
  console.log('1. Analyzing prompt structure...');
  const analysis = promptAnalyzer.analyzeStructure(prompt);
  
  console.log('Analysis Result:');
  console.log(promptAnalyzer.getAnalysisSummary(analysis));
  console.log('\n');

  // Step 2: Show format detection details
  if (analysis.formatInfo && analysis.formatInfo.hasFormat) {
    console.log('2. Format Detection Details:');
    console.log(`   Original Format: ${analysis.formatInfo.originalFormat}`);
    console.log(`   Separator: "${analysis.formatInfo.separator}"`);
    console.log(`   Fields:`);
    analysis.formatInfo.fields.forEach((field, index) => {
      console.log(`     ${index + 1}. ${field.name} (Type: ${field.type})`);
      if (field.samples) {
        console.log(`        Samples: ${field.samples.join(', ')}`);
      }
    });
    if (analysis.formatInfo.confidence) {
      console.log(`   Confidence: ${Math.round(analysis.formatInfo.confidence)}%`);
    }
    console.log('\n');
  } else {
    console.log('2. No flexible format detected\n');
  }

  return analysis;
};

/**
 * Generate project with format-aware AI
 */
export const generateProjectWithFormat = async (prompt, analysis, title) => {
  console.log(`3. Generating project for: ${title}`);
  
  try {
    // Configure OpenAI service (you would need to set your API key)
    // openAIService.configure('your-openai-api-key');
    
    const options = {
      complexity: analysis.complexity,
      includeTeamMembers: true,
      maxTasks: 20,
      analysisResult: analysis
    };

    // This would generate the actual project
    // const project = await openAIService.generateProject(prompt, options);
    
    console.log('   Project generation would include:');
    console.log(`   - Hierarchical structure: ${analysis.isHierarchical ? 'Yes' : 'No'}`);
    console.log(`   - Modules detected: ${analysis.modules.length}`);
    
    if (analysis.formatInfo && analysis.formatInfo.hasFormat) {
      console.log('   - Custom format fields will be preserved in tasks');
      console.log(`   - Assignment field will map to: assignedTo`);
      console.log(`   - Duration field will map to: estimatedDays`);
    }
    
    console.log('   ✅ Project structure would be generated with format-aware fields\n');
    
    return { success: true, message: 'Format-aware generation configured' };
    
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}\n`);
    return { success: false, error: error.message };
  }
};

/**
 * Run all flexible format examples
 */
export const runFlexibleFormatExamples = async () => {
  console.log('🔧 Flexible Format Detection and Project Generation Examples');
  console.log('=' .repeat(60));

  // Example 1: Eficlub format
  const eficlubAnalysis = await analyzeFlexibleFormat(eficlubPrompt, 'Eficlub Project (Explicit Format)');
  await generateProjectWithFormat(eficlubPrompt, eficlubAnalysis, 'Eficlub Project');

  // Example 2: Alternative format
  const altAnalysis = await analyzeFlexibleFormat(alternativeFormatPrompt, 'Alternative Format (Pipe Separator)');
  await generateProjectWithFormat(alternativeFormatPrompt, altAnalysis, 'Alternative Format');

  // Example 3: Implicit format
  const implicitAnalysis = await analyzeFlexibleFormat(implicitFormatPrompt, 'Implicit Format Detection');
  await generateProjectWithFormat(implicitFormatPrompt, implicitAnalysis, 'Implicit Format');

  console.log('🎉 All flexible format examples completed!');
  console.log('\nKey Features Demonstrated:');
  console.log('✅ Explicit format specification detection (Formato: ...)');
  console.log('✅ Multiple separator support (/, |, -, etc.)');
  console.log('✅ Field type inference (assignment, duration, title, etc.)');
  console.log('✅ Implicit format detection from task patterns');
  console.log('✅ Integration with hierarchical project generation');
  console.log('✅ Preservation of team member assignments');
  console.log('✅ Duration mapping to project timeline');
};

// Export individual functions for testing
export {
  eficlubPrompt,
  alternativeFormatPrompt,
  implicitFormatPrompt
};

// Run examples if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runFlexibleFormatExamples().catch(console.error);
}