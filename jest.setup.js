// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock Firebase
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({}))
}))

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(),
  onSnapshot: jest.fn(),
  doc: jest.fn(),
  updateDoc: jest.fn()
}))

// Mock next/headers
jest.mock('next/headers', () => ({
  headers: jest.fn(() => new Map())
}))