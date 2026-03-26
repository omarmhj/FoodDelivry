# Medical Exam Platform - Complete Architecture

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          FRONTEND (Next.js)                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │  Specialty   │  │   Series     │  │  Progressive │              │
│  │  Browser     │  │   Practice   │  │   Learning   │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │   Mental     │  │  Analytics   │  │     AI       │              │
│  │     Map      │  │  Dashboard   │  │   Assistant  │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                │ REST API / GraphQL
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      API GATEWAY (NestJS)                            │
│                    Authentication / Rate Limiting                    │
└─────────────────────────────────────────────────────────────────────┘
                                │
                ┌───────────────┼───────────────┐
                ▼               ▼               ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│   Auth Service   │  │  Series Service  │  │   AI Service     │
│   - JWT Auth     │  │  - Topics        │  │  - LLM API       │
│   - User Mgmt    │  │  - Series        │  │  - RAG System    │
│   - Permissions  │  │  - Questions     │  │  - Generation    │
└──────────────────┘  └──────────────────┘  └──────────────────┘
        │                      │                      │
        ▼                      ▼                      ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  Course Service  │  │ Analytics Service│  │ Notification Svc │
│  - Lessons       │  │  - Progress      │  │  - Email/Push    │
│  - Modules       │  │  - Leaderboard   │  │  - Reminders     │
│  - Content       │  │  - Reports       │  │  - Achievements  │
└──────────────────┘  └──────────────────┘  └──────────────────┘
        │                      │                      │
        └──────────────────────┼──────────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        MESSAGE QUEUE (RabbitMQ)                      │
│  - Event-driven communication between services                       │
│  - Async processing (AI generation, analytics, notifications)        │
└─────────────────────────────────────────────────────────────────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        ▼                      ▼                      ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│   PostgreSQL     │  │     MongoDB      │  │  Redis Cache     │
│  - Users         │  │  - Courses       │  │  - Sessions      │
│  - Series        │  │  - AI Responses  │  │  - Leaderboards  │
│  - Questions     │  │  - Mental Maps   │  │  - Rate Limits   │
│  - Attempts      │  │  - Embeddings    │  │  - Hot Data      │
└──────────────────┘  └──────────────────┘  └──────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    VECTOR DATABASE (Pinecone)                        │
│  - Course content embeddings for semantic search                     │
│  - AI-powered course recommendations                                 │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📊 Data Flow: Progressive Learning Series

```
┌─────────────────────────────────────────────────────────────────────┐
│  STUDENT: "Generate Progressive Learning for Hématuries"             │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│  1. SERIES SERVICE: Receives request                                 │
│     - Validates user subscription (Premium feature)                  │
│     - Checks if series already exists for this topic                 │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│  2. COURSE SERVICE: Fetch topic lessons                              │
│     - Retrieves all lessons for "Hématuries"                         │
│     - Returns structured course content                              │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│  3. AI SERVICE: Analyze & Generate                                   │
│     ┌─────────────────────────────────────────────────────────┐     │
│     │ a) Extract Concepts from Lessons                        │     │
│     │    - Use LLM to identify key concepts                   │     │
│     │    - Build concept hierarchy                            │     │
│     └─────────────────────────────────────────────────────────┘     │
│     ┌─────────────────────────────────────────────────────────┐     │
│     │ b) Build Learning Path                                  │     │
│     │    - Order concepts logically                           │     │
│     │    - Define prerequisites                               │     │
│     │    - Create 10 progressive steps                        │     │
│     └─────────────────────────────────────────────────────────┘     │
│     ┌─────────────────────────────────────────────────────────┐     │
│     │ c) Generate Questions                                   │     │
│     │    - 3-5 questions per step                             │     │
│     │    - Aligned with step concepts                         │     │
│     │    - Progressive difficulty                             │     │
│     └─────────────────────────────────────────────────────────┘     │
│     ┌─────────────────────────────────────────────────────────┐     │
│     │ d) Create Explanations                                  │     │
│     │    - Link to course sections                            │     │
│     │    - Detailed reasoning                                 │     │
│     └─────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│  4. SERIES SERVICE: Save Generated Series                            │
│     - Create Series record (type: AI_PROGRESSIVE)                    │
│     - Create LearningPath record                                     │
│     - Create PathStep records (10 steps)                             │
│     - Create Question records (30 questions)                         │
│     - Create Answer records                                          │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│  5. RETURN TO STUDENT: Series Ready                                  │
│     - Display series with 10 steps                                   │
│     - Show mental map visualization                                  │
│     - Enable "Start Journey" button                                  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🎮 User Journey: Taking Progressive Series

```
┌─────────────────────────────────────────────────────────────────────┐
│  STUDENT: Clicks "Start Journey" on Progressive Series              │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 1: Basic Concepts                                              │
│  ┌───────────────────────────────────────────────────────────┐      │
│  │ 1. Show Lesson Preview (from Course Service)             │      │
│  │    "Definition and Classification of Hématuries"          │      │
│  │    [Read Full Lesson] button                              │      │
│  └───────────────────────────────────────────────────────────┘      │
│  ┌───────────────────────────────────────────────────────────┐      │
│  │ 2. Present Questions (3 questions)                        │      │
│  │    Q1: What is the definition of hematuria?               │      │
│  │    Q2: How is hematuria classified?                       │      │
│  │    Q3: What is the difference between...                  │      │
│  └───────────────────────────────────────────────────────────┘      │
│  ┌───────────────────────────────────────────────────────────┐      │
│  │ 3. Student Answers                                        │      │
│  │    - Immediate feedback (correct/incorrect)               │      │
│  │    - Explanation with course reference                    │      │
│  │    - Option to review lesson section                      │      │
│  └───────────────────────────────────────────────────────────┘      │
│  ┌───────────────────────────────────────────────────────────┐      │
│  │ 4. Calculate Step Score                                   │      │
│  │    Score: 2/3 (66%)                                       │      │
│  │    ✅ Passed! (Need 60%+ to unlock next step)            │      │
│  └───────────────────────────────────────────────────────────┘      │
│  ┌───────────────────────────────────────────────────────────┐      │
│  │ 5. Update Mental Map                                      │      │
│  │    - Mark "Definition" node as mastered (66%)             │      │
│  │    - Mark "Classification" node as mastered (66%)         │      │
│  │    - Unlock "Causes" node                                 │      │
│  └───────────────────────────────────────────────────────────┘      │
│  ┌───────────────────────────────────────────────────────────┐      │
│  │ 6. Show Progress                                          │      │
│  │    Mental Map: 10% Complete                               │      │
│  │    [Continue to Step 2] button                            │      │
│  └───────────────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 2: Causes & Pathophysiology                                    │
│  (Same flow as Step 1)                                               │
│  - Builds on concepts from Step 1                                    │
│  - Questions reference previous knowledge                            │
│  - Mental map shows connections                                      │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
                              ...
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 10: Integration & Synthesis                                    │
│  - Complex clinical scenarios                                        │
│  - Requires knowledge from all previous steps                        │
│  - Final mental map: 100% Complete                                   │
│  - Certificate of Completion                                         │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🧠 Mental Map Generation Algorithm

```typescript
// Pseudo-code for Mental Map Generation

class MentalMapService {
  async generateMap(userId: string, topicId: string) {
    // 1. Get completed path steps
    const steps = await this.getCompletedSteps(userId, topicId);
    
    // 2. Extract concepts and mastery levels
    const nodes = [];
    for (const step of steps) {
      for (const concept of step.conceptsCovered) {
        nodes.push({
          id: concept,
          label: this.formatConceptName(concept),
          masteryLevel: step.averageScore,
          color: this.getColorByMastery(step.averageScore),
          lessonId: step.lessonId
        });
      }
    }
    
    // 3. Identify connections between concepts
    const connections = [];
    for (let i = 0; i < steps.length - 1; i++) {
      const currentStep = steps[i];
      const nextStep = steps[i + 1];
      
      // Prerequisite connections
      for (const currentConcept of currentStep.conceptsCovered) {
        for (const nextConcept of nextStep.conceptsCovered) {
          connections.push({
            from: currentConcept,
            to: nextConcept,
            type: 'PREREQUISITE',
            strength: 1.0
          });
        }
      }
    }
    
    // 4. Use AI to identify related concepts (not just sequential)
    const relatedConnections = await this.aiService.identifyRelations(nodes);
    connections.push(...relatedConnections);
    
    // 5. Generate visualization data (for D3.js or similar)
    const visualization = {
      nodes: nodes.map((node, index) => ({
        ...node,
        x: this.calculateXPosition(index, nodes.length),
        y: this.calculateYPosition(node, connections)
      })),
      edges: connections.map(conn => ({
        source: conn.from,
        target: conn.to,
        type: conn.type,
        width: conn.strength * 3
      }))
    };
    
    // 6. Save to database
    await this.saveMentalMap(userId, topicId, {
      nodes,
      connections,
      visualization,
      completionPercentage: this.calculateCompletion(nodes)
    });
    
    return visualization;
  }
  
  getColorByMastery(score: number): string {
    if (score >= 80) return '#22c55e'; // Green - Mastered
    if (score >= 60) return '#eab308'; // Yellow - Good
    if (score >= 40) return '#f97316'; // Orange - Needs work
    return '#ef4444'; // Red - Weak
  }
}
```

---

## 🔄 AI Question Generation Prompt

```typescript
const PROGRESSIVE_SERIES_PROMPT = `
You are an expert medical educator creating a progressive learning series for medical students preparing for the concours de résidanat.

Topic: {topicName}
Specialty: {specialtyName}

Course Content:
{lessonContent}

Task: Generate a progressive learning path with 10 steps that:
1. Starts with basic definitions and concepts
2. Progresses logically through the topic
3. Builds a comprehensive mental map
4. Ends with complex clinical integration

For each step, provide:
- Step title
- Concepts covered (array)
- 3-5 multiple-choice questions
- Each question should have:
  * Question text
  * 4 answer options (A, B, C, D)
  * Correct answer(s)
  * Detailed explanation
  * Reference to specific lesson section

Format your response as JSON:
{
  "steps": [
    {
      "stepNumber": 1,
      "title": "Basic Definitions",
      "conceptsCovered": ["definition", "classification"],
      "lessonSummary": "Brief summary...",
      "questions": [
        {
          "questionText": "...",
          "options": [
            {"label": "A", "text": "...", "isCorrect": true},
            {"label": "B", "text": "...", "isCorrect": false},
            ...
          ],
          "explanation": "...",
          "lessonReference": "Section 1.2: Definition of Hematuria"
        }
      ]
    }
  ]
}
`;
```

---

## 📈 Scalability Considerations

### **Caching Strategy**
```typescript
// Cache layers
1. Redis: Hot data (active series, leaderboards)
   - TTL: 1 hour for series data
   - TTL: 5 minutes for leaderboards

2. CDN: Static content (images, videos, PDFs)
   - Edge caching for course materials
   - Reduces server load

3. Database Query Optimization:
   - Index on: specialty_id, topic_id, series_type, university, year
   - Materialized views for analytics
   - Read replicas for heavy queries
```

### **AI Request Optimization**
```typescript
// Prevent duplicate AI generation
1. Check if series already exists for topic
2. Queue AI generation requests (max 5 concurrent)
3. Cache generated series for reuse
4. Allow manual approval before publishing
```

### **Load Handling**
```
- Horizontal scaling: Multiple API instances behind load balancer
- Database sharding: By university (if needed)
- Message queue: Async processing for heavy tasks
- Rate limiting: Prevent abuse of AI generation
```

---

## 🎯 MVP Implementation Priority

### **Phase 1: Core Series Structure (Month 1)**
✅ Specialty → Topic → Series hierarchy  
✅ Historical series (import existing data)  
✅ Series attempt and scoring  
✅ Basic analytics  

### **Phase 2: AI Progressive Learning (Month 2)**
✅ AI series generation  
✅ Learning path creation  
✅ Progressive step unlocking  
✅ Mental map basic version  

### **Phase 3: Enhanced Features (Month 3)**
✅ Advanced mental map visualization  
✅ Weak area focus series  
✅ Comprehensive review series  
✅ Leaderboards and gamification  

This architecture provides a solid foundation for a scalable, AI-powered medical exam platform! 🚀
