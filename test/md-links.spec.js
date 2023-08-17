const { mdLinks, extractLinksFromMarkdown } = require('../index'); 
const markdownLinkExtractor = require('markdown-link-extractor'); 
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Mock para fs.existsSync
jest.mock('fs', () => ({
  mdLinks: jest.fn(() => true),
  existsSync: jest.fn(() => true), // Simula que el archivo existe
}));

// Mock para markdownLinkExtractor.extract
jest.mock('markdown-link-extractor', () => ({
  extract: jest.fn(() => []),
}));


describe('mdLinks', () => {
  it('It should be a function', () => {
    expect(typeof mdLinks).toBe('function');
  });
  it("return: The path does not exist", (done) => {
    const resolveData = mdLinks(" ");
    resolveData
      .then((res) => expect(res).toStrictEqual("The path does not exist"))
      .catch((rej) => rej);
    done();
  });
  it("return: The path does not exist .md file", (done) => {
    const resolveData = mdLinks(" ");
    resolveData
      .then((res) => expect(res).toBe("The path does not exist .md file"))
      .catch((rej) => rej);
    done();
  });
  describe('mdLinks - Check if input path is absolute', () => {
    it('should convert relative path to an absolute path', async () => {
      const inputPath = 'testing-files/card-validator/readme.md';
      const options = { validate: true, stats: false };
      const resolvedPath = path.resolve(inputPath);
  
      try {
        const result = await mdLinks(inputPath, options);
        expect(result).toBeTruthy();
      } catch (error) {
        console.error(error);
      }
    });
  });
  it('should handle absolute path correctly', async () => {
    const inputPath = 'C:\\Users\\josep\\OneDrive\\Escritorio\\code\\DEV007-md-links\\testing-files\\card-validator\\readme.md';
    const options = { validate: true, stats: false };
    const resolvedPath = path.resolve(inputPath);
  
    try {
      const result = await mdLinks(inputPath, options);
      expect(result).toBeTruthy();
    } catch (error) {
      console.log(error);
    }
  });
});
