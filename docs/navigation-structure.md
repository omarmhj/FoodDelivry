# Medical Exam Platform - Navigation Structure

## 📚 Hierarchical Structure

```
┌─────────────────────────────────────────────────────────────┐
│                      HOME / DASHBOARD                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    SPECIALTIES (Certif)                      │
│  • Cardiologie                                               │
│  • Néphrologie                                               │
│  • Hématologie                                               │
│  • Urologie                                                  │
│  • Réanimation Pédiatrie                                     │
│  • ... etc                                                   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼ (Click: Néphrologie)
┌─────────────────────────────────────────────────────────────┐
│              TOPICS (Séries / Néphrologie)                   │
│  • Hématuries                                                │
│  • Insuffisance Rénale                                       │
│  • Œdèmes                                                    │
│  • Troubles Acido-Basiques                                   │
│  • Syndrome Néphrotique                                      │
│  • ... etc                                                   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼ (Click: Hématuries)
┌─────────────────────────────────────────────────────────────┐
│         SERIES (Séries / Néphrologie / Hématuries)          │
│                                                              │
│  📍 HISTORICAL SERIES (Existing Data)                        │
│  ├── Sousse                                                  │
│  │   ├── 2025 (15 questions)                                │
│  │   ├── 2024 (18 questions)                                │
│  │   ├── 2023 (12 questions)                                │
│  │   └── ...                                                 │
│  ├── Monastir                                                │
│  │   ├── 2025 (20 questions)                                │
│  │   ├── 2024 (16 questions)                                │
│  │   └── ...                                                 │
│  ├── Tunis                                                   │
│  │   └── ...                                                 │
│  └── Sfax                                                    │
│      └── ...                                                 │
│                                                              │
│  🤖 AI-GENERATED SERIES (New Feature)                        │
│  ├── Progressive Learning Path                              │
│  │   └── "Build Your Mental Map" (30 questions)             │
│  │       • Starts from basic concepts                       │
│  │       • Progresses logically through lessons             │
│  │       • Builds comprehensive understanding               │
│  │                                                           │
│  ├── Weak Area Focus                                         │
│  │   └── "Master Your Mistakes" (20 questions)              │
│  │       • Based on your previous errors                    │
│  │       • Targeted concept reinforcement                   │
│  │                                                           │
│  └── Comprehensive Review                                    │
│      └── "Complete Topic Review" (50 questions)             │
│          • Covers all sub-concepts                          │
│          • Mixed difficulty levels                          │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼ (Click: Progressive Learning Path)
┌─────────────────────────────────────────────────────────────┐
│              PROGRESSIVE LEARNING INTERFACE                  │
│                                                              │
│  Step 1/10: Basic Concepts                                   │
│  ├── Lesson Preview: "Introduction to Hématuries"           │
│  ├── Question 1: [MCQ about basic definition]               │
│  ├── Question 2: [MCQ about classification]                 │
│  └── Question 3: [MCQ about initial approach]               │
│                                                              │
│  [Mental Map Progress: 10% Complete]                         │
│  [Unlock Next Step: Score 70%+]                              │
│                                                              │
│  🧠 Mental Map Visualization:                                │
│     Definition → Classification → Causes → Diagnosis         │
│        ✓            ✓              🔒         🔒             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Key Features

### 1. **Historical Series (Existing Data)**
- Organized by **University** (Sousse, Monastir, Tunis, Sfax)
- Organized by **Year** (2025, 2024, 2023, ...)
- Contains real past exam questions
- Students can practice location-specific questions

### 2. **AI-Generated Progressive Learning Series**
This is the **game-changer** feature:

#### **How It Works:**
1. **Student selects a Topic** (e.g., "Hématuries")
2. **AI analyzes the course content** for that topic
3. **AI generates a logical learning path**:
   - Step 1: Basic definitions and concepts
   - Step 2: Classification and types
   - Step 3: Pathophysiology
   - Step 4: Clinical presentation
   - Step 5: Diagnostic approach
   - Step 6: Differential diagnosis
   - Step 7: Treatment principles
   - Step 8: Complications
   - Step 9: Special cases
   - Step 10: Integration and synthesis

4. **Each step contains**:
   - Brief lesson summary (from course content)
   - 3-5 questions testing that specific concept
   - Immediate feedback with course references
   - Link to full lesson for deeper study

5. **Mental Map Building**:
   - Visual representation of concept connections
   - Shows what's mastered (green) vs. needs work (red)
   - Unlocks next steps progressively
   - Creates a cognitive framework for exam day

#### **Benefits:**
✅ **Logical Progression**: Follows natural learning sequence  
✅ **Active Learning**: Learn by doing, not just reading  
✅ **Spaced Repetition**: Revisits concepts in later steps  
✅ **Mental Map**: Visual memory aid for exam recall  
✅ **Personalized**: Adapts to student's weak areas  
✅ **Comprehensive**: Covers entire topic systematically  

---

## 🗄️ Database Structure

### **Specialty Table**
```sql
id | name          | slug          | order_index
1  | Néphrologie   | nephrologie   | 1
2  | Cardiologie   | cardiologie   | 2
```

### **Topic Table**
```sql
id | specialty_id | name                    | slug                    | order_index
1  | 1            | Hématuries              | hematuries              | 1
2  | 1            | Insuffisance Rénale     | insuffisance-renale     | 2
3  | 1            | Œdèmes                  | oedemes                 | 3
```

### **Series Table**
```sql
id | topic_id | title                  | series_type      | university | year | total_questions
1  | 1        | Hématuries Sousse      | HISTORICAL       | SOUSSE     | 2025 | 15
2  | 1        | Hématuries Monastir    | HISTORICAL       | MONASTIR   | 2025 | 20
3  | 1        | Progressive Learning   | AI_PROGRESSIVE   | NULL       | NULL | 30
4  | 1        | Weak Area Focus        | AI_GENERATED     | NULL       | NULL | 20
```

### **LearningPath Table**
```sql
id | series_id | topic_id | total_steps | estimated_duration
1  | 3         | 1        | 10          | 120
```

### **PathStep Table**
```sql
id | path_id | step_number | lesson_id | concepts_covered                    | prerequisite_steps
1  | 1       | 1           | 101       | ["definition", "classification"]    | []
2  | 1       | 2           | 102       | ["causes", "pathophysiology"]       | [1]
3  | 1       | 3           | 103       | ["clinical_presentation"]           | [1, 2]
```

### **MentalMap Table**
```sql
id | user_id | topic_id | nodes                          | connections                  | completion_percentage
1  | 123     | 1        | [{"concept": "definition"...}] | [{"from": "def", "to"...}]  | 30
```

---

## 🤖 AI Implementation Strategy

### **1. Progressive Series Generation**

```typescript
// AI Service Method
async generateProgressiveSeries(topicId: string, userId: string) {
  // 1. Fetch all lessons for this topic
  const lessons = await this.getLessonsByTopic(topicId);
  
  // 2. Analyze lesson content and extract concepts
  const concepts = await this.extractConcepts(lessons);
  
  // 3. Build logical learning sequence
  const learningPath = await this.buildLearningPath(concepts);
  
  // 4. Generate questions for each step
  const questions = await this.generateQuestionsForPath(learningPath);
  
  // 5. Create series and path
  const series = await this.createSeries({
    topicId,
    seriesType: 'AI_PROGRESSIVE',
    questions
  });
  
  const path = await this.createLearningPath({
    seriesId: series.id,
    steps: learningPath
  });
  
  return { series, path };
}
```

### **2. Mental Map Generation**

```typescript
// Mental Map Service
async buildMentalMap(userId: string, topicId: string) {
  // 1. Get user's completed path steps
  const completedSteps = await this.getCompletedSteps(userId, topicId);
  
  // 2. Extract mastered concepts
  const nodes = completedSteps.map(step => ({
    concept: step.conceptsCovered,
    masteryLevel: step.averageScore,
    lessonId: step.lessonId
  }));
  
  // 3. Identify concept relationships
  const connections = await this.identifyConnections(nodes);
  
  // 4. Generate visual map
  return {
    nodes,
    connections,
    visualization: this.generateVisualization(nodes, connections)
  };
}
```

---

## 📱 UI/UX Flow

### **Series Selection Screen**
```
┌─────────────────────────────────────────┐
│  Néphrologie > Hématuries               │
├─────────────────────────────────────────┤
│                                         │
│  📚 Historical Series                   │
│  ┌─────────────────────────────────┐   │
│  │ 🏛️ Sousse 2025    [15 Q] [Start]│   │
│  │ 🏛️ Monastir 2025  [20 Q] [Start]│   │
│  │ 🏛️ Tunis 2025     [18 Q] [Start]│   │
│  │ 🏛️ Sfax 2025      [12 Q] [Start]│   │
│  └─────────────────────────────────┘   │
│                                         │
│  🤖 AI-Generated Series                 │
│  ┌─────────────────────────────────┐   │
│  │ 🧠 Progressive Learning Path     │   │
│  │    Build your mental map         │   │
│  │    [30 Q] [10 Steps] [~2h]       │   │
│  │    [Start Journey] 🚀            │   │
│  │                                  │   │
│  │ 🎯 Weak Area Focus               │   │
│  │    Master your mistakes          │   │
│  │    [20 Q] [Based on errors]      │   │
│  │    [Start] 💪                    │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

### **Progressive Learning Interface**
```
┌─────────────────────────────────────────┐
│  Step 3/10: Clinical Presentation       │
├─────────────────────────────────────────┤
│                                         │
│  📖 Lesson Preview:                     │
│  "Hématurie can present as..."          │
│  [Read Full Lesson]                     │
│                                         │
│  ❓ Question 1 of 3:                    │
│  A 45-year-old patient presents with... │
│  ○ A) Glomerular hematuria              │
│  ○ B) Post-renal hematuria              │
│  ○ C) Pre-renal hematuria               │
│  ○ D) Functional hematuria              │
│                                         │
│  [Submit Answer]                        │
│                                         │
│  🧠 Mental Map Progress:                │
│  ████████░░░░░░░░░░ 30%                 │
│                                         │
│  Mastered: Definition, Classification   │
│  Current: Clinical Presentation         │
│  Next: Diagnostic Approach 🔒           │
└─────────────────────────────────────────┘
```

---

## 🎓 Student Benefits

1. **Structured Learning**: No more random question practice
2. **Concept Mastery**: Deep understanding, not memorization
3. **Visual Memory**: Mental maps aid recall during exams
4. **Confidence Building**: Progressive difficulty builds confidence
5. **Efficient Study**: Focus on weak areas automatically
6. **Exam Readiness**: Comprehensive coverage ensures preparedness

This approach transforms passive exam prep into active, structured learning! 🚀
