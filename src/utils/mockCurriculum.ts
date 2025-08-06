// Mock curriculum data for testing purposes
// In a real implementation, this would be extracted from uploaded PDFs

import { CurriculumData, Concept, LearningGoal } from '@/types'

export const MOCK_MATHEMATICS_CURRICULUM: CurriculumData = {
  id: 'math-grade-9-ontario',
  title: 'Ontario Mathematics Grade 9 - Academic',
  strands: ['Number Sense', 'Algebra', 'Linear Relations', 'Analytic Geometry', 'Measurement'],
  concepts: [
    {
      id: 'ns-1',
      name: 'Real Numbers',
      description: 'Properties and operations with real numbers',
      strand: 'Number Sense',
      subsection: 'Number Properties'
    },
    {
      id: 'ns-2', 
      name: 'Exponents and Radicals',
      description: 'Laws of exponents and radical expressions',
      strand: 'Number Sense',
      subsection: 'Exponential Operations'
    },
    {
      id: 'alg-1',
      name: 'Algebraic Expressions',
      description: 'Simplifying and manipulating algebraic expressions',
      strand: 'Algebra',
      subsection: 'Expression Manipulation'
    },
    {
      id: 'alg-2',
      name: 'Linear Equations',
      description: 'Solving linear equations in one variable',
      strand: 'Algebra', 
      subsection: 'Equation Solving'
    },
    {
      id: 'lr-1',
      name: 'Linear Relations',
      description: 'Identifying and representing linear relationships',
      strand: 'Linear Relations',
      subsection: 'Relationship Analysis'
    },
    {
      id: 'ag-1',
      name: 'Coordinate Geometry',
      description: 'Working with points, lines, and shapes in the coordinate plane',
      strand: 'Analytic Geometry',
      subsection: 'Coordinate Systems'
    }
  ],
  learning_goals: [
    {
      id: 'lg-1',
      name: 'Solve problems involving operations with real numbers',
      description: 'Students will demonstrate an understanding of real numbers and perform operations with real numbers, with and without technology.',
      concepts: ['ns-1', 'ns-2'],
      strand: 'Number Sense'
    },
    {
      id: 'lg-2', 
      name: 'Manipulate algebraic expressions and solve linear equations',
      description: 'Students will manipulate algebraic expressions and solve linear equations.',
      concepts: ['alg-1', 'alg-2'],
      strand: 'Algebra'
    },
    {
      id: 'lg-3',
      name: 'Identify and represent linear relations',
      description: 'Students will identify and represent linear relations, using concrete, pictorial, and algebraic methods.',
      concepts: ['lr-1', 'ag-1'],
      strand: 'Linear Relations'
    },
    {
      id: 'lg-4',
      name: 'Solve problems using analytic geometry',
      description: 'Students will solve problems using the slope and y-intercept of a line.',
      concepts: ['ag-1', 'lr-1'],
      strand: 'Analytic Geometry'
    }
  ]
}

export const MOCK_ENGLISH_CURRICULUM: CurriculumData = {
  id: 'english-grade-10',
  title: 'English Language Arts Grade 10',
  strands: ['Reading', 'Writing', 'Speaking', 'Listening', 'Media Literacy'],
  concepts: [
    {
      id: 'read-1',
      name: 'Reading Comprehension',
      description: 'Understanding and analyzing written texts',
      strand: 'Reading',
      subsection: 'Comprehension Skills'
    },
    {
      id: 'write-1',
      name: 'Essay Writing',
      description: 'Organizing and developing ideas in written form',
      strand: 'Writing',
      subsection: 'Composition'
    },
    {
      id: 'speak-1',
      name: 'Oral Communication',
      description: 'Effective speaking and presentation skills',
      strand: 'Speaking',
      subsection: 'Communication Skills'
    }
  ],
  learning_goals: [
    {
      id: 'lg-e1',
      name: 'Analyze and interpret texts',
      description: 'Students will read and analyze various texts to demonstrate understanding.',
      concepts: ['read-1'],
      strand: 'Reading'
    },
    {
      id: 'lg-e2',
      name: 'Compose clear and coherent writing',
      description: 'Students will write clear, coherent, and well-organized texts.',
      concepts: ['write-1'],
      strand: 'Writing'
    }
  ]
}

export const getMockCurriculumBySubject = (subject: string): CurriculumData | null => {
  switch (subject.toLowerCase()) {
    case 'mathematics':
    case 'math':
      return MOCK_MATHEMATICS_CURRICULUM
    case 'english':
    case 'english language arts':
      return MOCK_ENGLISH_CURRICULUM
    default:
      return null
  }
}