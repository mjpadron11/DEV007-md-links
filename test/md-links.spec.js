// Importa las dependencias y funciones necesarias para las pruebas
const { mdLinks, extractLinksFromMarkdown } = require('./tu-archivo'); // Asegúrate de ajustar la ruta adecuadamente
const fs = require('fs');
const path = require('path');
const markdownLinkExtractor = require('markdown-link-extractor'); // Asegúrate de que esta importación sea correcta

// Mock para fs.existsSync
jest.mock('fs', () => ({
  existsSync: jest.fn(() => true),
  stat: jest.fn((path, callback) => {
    callback(null, { isFile: () => true, isDirectory: () => false });
  }),
}));

// Mock para fs.readFileSync
jest.mock('fs', () => ({
  readFileSync: jest.fn(() => 'Mocked content'),
}));

// Mock para markdownLinkExtractor.extract
jest.mock('markdown-link-extractor', () => ({
  extract: jest.fn(() => []),
}));


describe('mdLinks', () => {
  it('It should be a function', () => {
    expect(typeof mdLinks).toBe('function');
  });
  it('Should call extractLinksFromMarkdown when given content', async () => {
    const content = '[Google](https://www.google.com)';
    await mdLinks(content);
    expect(extractLinksFromMarkdown).toHaveBeenCalledWith(content);
  });

});
