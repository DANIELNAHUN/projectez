# Flexible Format Detection Feature

## Overview

The Flexible Format Detection feature allows the AI project generator to automatically detect and preserve custom task formats specified by users. This is particularly useful for teams that have established conventions for task descriptions, assignments, and time estimates.

## Key Features

### 1. Explicit Format Specification
Users can specify their desired format using a format declaration:

```
Formato: Titulo / Asignado a / Duracion (días)
```

**Supported separators:**
- `/` (slash)
- `|` (pipe)
- `-` (dash)
- `\` (backslash)
- `→` (arrow)
- `>` (greater than)
- `•` (bullet)

### 2. Implicit Format Detection
The system can automatically detect format patterns from task lists without explicit specification:

```
- Diseño interfaz / UI Team / 5 días
- Backend API / Backend / 10 días
- Testing / QA / 3 días
```

### 3. Field Type Recognition

The system automatically identifies different field types:

- **Title**: Task names and descriptions
- **Assignment**: Team member names, initials (DC, DZ), or roles
- **Duration**: Time estimates with units (días, days, meses, months, horas, hours)
- **Priority**: Priority levels (alta, media, baja, high, medium, low)
- **Status**: Task status (activo, pendiente, completado, active, pending, completed)
- **Custom**: Any other field types

### 4. Team Member Extraction

The system automatically extracts team member information from project descriptions:

```
Equipo: Daniel Calcina (DC), Dayana Zegarra (DZ)
```

**Extracted information:**
- Full names: Daniel Calcina, Dayana Zegarra
- Initials: DC, DZ
- Assignment mapping: DC → Daniel Calcina, DZ → Dayana Zegarra
- Task distribution statistics

### 5. Multi-language Support

The feature works with both Spanish and English:

**Spanish:**
```
Formato: Titulo / Asignado a / Duracion (días)
Equipo: Daniel Calcina (DC), Dayana Zegarra (DZ)
```

**English:**
```
Format: Title / Assigned to / Duration (days)
Team: John Smith (JS), Mary Johnson (MJ)
```

## Usage Examples

### Example 1: Eficlub Project Format

```
Proyecto Eficlub

Equipo: Daniel Calcina (DC), Dayana Zegarra (DZ)
Formato: Titulo / Asignado a / Duracion (días)

MODULO 1. ANALISIS DEL SISTEMA / DC
- Definir Modulos, permisos y roles del Sistema / DC / 1
- Crear BD del Sistema / DC / 1
```

**Detected format:**
- Separator: `/`
- Fields: Titulo (title), Asignado a (assignment), Duracion (días) (duration)
- Confidence: 100% (explicit)

**Detected team:**
- Daniel Calcina (DC) - 9 assignments
- Dayana Zegarra (DZ) - 2 assignments

### Example 2: Alternative Separator

```
Sistema de Gestión

Formato: Tarea | Responsable | Duración meses

MÓDULO VENTAS | AG
- Gestión clientes | AG | 2
- Cotizaciones | LP | 1
```

**Detected format:**
- Separator: `|`
- Fields: Tarea (custom), Responsable (assignment), Duración meses (duration)

### Example 3: Implicit Detection

```
Desarrollo App

- Diseño interfaz / UI Team / 5 días
- Backend API / Backend / 10 días
- Testing / QA / 3 días
```

**Detected format:**
- Separator: `/`
- Fields: Field 1 (assignment), Field 2 (assignment), Field 3 (duration)
- Confidence: 95% (implicit)

## Integration with AI Generation

When a format is detected, the AI project generator:

1. **Preserves format structure** in generated tasks
2. **Maps fields to task properties**:
   - Assignment fields → `assignedTo` property
   - Duration fields → `estimatedDays` property
   - Priority fields → `priority` property
   - Custom fields → preserved as metadata

3. **Maintains team assignments** throughout the project hierarchy
4. **Respects time units** specified in the format
5. **Automatically assigns tasks** to team members based on detected initials
6. **Preserves team member information** in the generated project

## Technical Implementation

### Core Components

1. **PromptAnalyzer** (`src/utils/promptAnalyzer.js`)
   - Detects format specifications
   - Analyzes field types
   - Provides confidence scores

2. **OpenAIService** (`src/services/openAIService.js`)
   - Integrates format information into AI prompts
   - Generates format-aware project structures

3. **Task Enhancement** 
   - Adds format-specific fields to task objects
   - Preserves original format metadata

### Detection Algorithm

1. **Explicit Detection**: Looks for format specifications using regex patterns
2. **Implicit Detection**: Analyzes task lines for consistent separator patterns
3. **Field Type Inference**: Uses pattern matching and sample analysis
4. **Confidence Scoring**: Based on consistency and pattern strength

## Configuration

The feature is automatically enabled and requires no additional configuration. It works with existing AI providers (OpenAI, Gemini) and integrates seamlessly with hierarchical project generation.

## Benefits

- **Team Consistency**: Maintains established team conventions
- **Automatic Mapping**: No manual field mapping required
- **Flexible Separators**: Supports various separator preferences
- **Multi-language**: Works with Spanish and English projects
- **Hierarchical Integration**: Compatible with complex project structures
- **High Accuracy**: Robust detection with confidence scoring

## Testing

Comprehensive test suite available in `src/test/utils/flexibleFormat.test.js` covering:
- Explicit format detection
- Implicit pattern recognition
- Field type identification
- Edge cases and error handling
- Multi-language support

## Examples

Run the examples to see the feature in action:

```bash
node src/examples/flexibleFormatExample.js
```

This demonstrates detection and generation with various format types and separators.