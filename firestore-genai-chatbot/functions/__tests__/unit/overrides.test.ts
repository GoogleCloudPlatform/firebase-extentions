import {extractOverrides} from '../../src/overrides'; // Adjust the import as per your file structure
import {describe, beforeEach, afterEach, test, expect, vi} from 'vitest';

describe('extractOverrides function', () => {
  let mockDocSnap: any;

  beforeEach(() => {
    mockDocSnap = {
      get: vi.fn(field => mockDocSnap[field]),
      exists: vi.fn().mockReturnValue(true),
      data: () => mockDocSnap,
      // Mock other necessary DocumentSnapshot methods here
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test('should correctly extract string fields', () => {
    mockDocSnap['context'] = 'testContext';
    mockDocSnap['model'] = 'testModel';

    const overrides = extractOverrides(mockDocSnap);

    expect(overrides).toEqual({
      context: 'testContext',
      model: 'testModel',
    });
  });

  test('should correctly extract integer fields', () => {
    mockDocSnap['topK'] = '10';
    mockDocSnap['candidateCount'] = 5;

    const overrides = extractOverrides(mockDocSnap);

    expect(overrides).toEqual({
      topK: 10,
      candidateCount: 5,
    });
  });

  test('should correctly extract float fields', () => {
    mockDocSnap['topP'] = '0.9';
    mockDocSnap['temperature'] = 0.7;

    const overrides = extractOverrides(mockDocSnap);

    expect(overrides).toEqual({
      topP: 0.9,
      temperature: 0.7,
    });
  });

  test('should handle invalid data gracefully', () => {
    mockDocSnap['context'] = 123; // Invalid context
    mockDocSnap['topK'] = 'not-a-number'; // Invalid topK

    expect(() => extractOverrides(mockDocSnap)).toThrow();
  });
});
