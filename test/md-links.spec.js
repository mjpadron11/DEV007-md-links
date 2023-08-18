const { mdLinks, extractLinksFromMarkdown, extractMDFilesFromDir, getHttpCode, statsWithBroken } = require('../index');  
const fs = require('fs');
const path = require('path');
const axios = require ('axios');
const { stat } = require('fs/promises');

// Mock para fs.existsSync
jest.mock('fs', () => ({
  mdLinks: jest.fn(() => true),
  existsSync: jest.fn(() => true),
  extractLinksFromMarkdown: jest.fn(),
  extractMDFilesFromDir: jest.fn(), // Simula que el archivo existe
}));

jest.mock('axios');


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
      const inputPath = 'C:\\Users\\josep\\OneDrive\\Escritorio\\code\\DEV007-md-links\\testing-files\\card-validator\\readme.md';
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

describe('extractLinksFromMarkdown', () => {
  it('Should be a function', () => {
    expect(typeof extractLinksFromMarkdown).toBe('function');
  });
  it('should extract a single link', () => {
    const markdown = '[Google](https://www.google.com)';
    const expected = [{ text: 'Google', url: 'https://www.google.com' }];
    expect(extractLinksFromMarkdown(markdown)).toEqual(expected);
  });

});


describe('extractMDFilesFromDir', () => {
  it('Should be a function', () => {
    expect(typeof extractMDFilesFromDir).toBe('function');
  });

  // it('should call the real functions readdirSync and statSync', () => {
  //   const dirPath = path.resolve(__dirname, 'testing-files', 'card-validator');
  
  //   const result = extractMDFilesFromDir(dirPath);
  
  //   expect(result).toHaveLength(2);
  //   expect(result[0]).toHaveProperty('path', path.join(dirPath, 'readme.md'));
  // });
  it('should resolve with a link object with status "ok" for successful requests', async () => {
    const link = {
      href: 'http://README.com',
      text: 'Link README',
    };
    jest.spyOn(axios, 'get').mockResolvedValue({ status: 200, statusText: 'OK' });
    try {
      const result = await getHttpCode(link);
      expect(result.status).toBe(200);
      expect(result.ok).toBe('ok');
    } catch (error) {
      console.error(error);
    }
  });
  
})


describe('getHttpCode', () => {
  it('Should be a function', () => {
    expect(typeof getHttpCode).toBe('function')
  })
  it('should return HTTP code 200 and status message "OK" for a successful request', async () => {
    const url = 'https://www.google.com';
    const response = await getHttpCode(url);
    expect(response.httpCode).toBe(200);
    expect(response.statusMessage).toBe('OK');
  });
  // it('should return HTTP code 404 and status message "FAIL" for a failed request', async () => {
  //   const url = 'https://www.fakewebpage12345.com/error/doesnotexist';
  //   const response = await getHttpCode(url);
  //   expect(response.httpCode).toBe(404);
  //   expect(response.statusMessage).toBe('FAIL');
  // });
})

describe('statsWithBroken', () => {
  it('Should be a function', () => {
    expect(typeof statsWithBroken).toBe('function')
  })
  it('should return correct stats when there are no broken links', async () => {
    const links = [
      { href: 'https://google.com', ok: 'ok' },
      { href: 'https://github.com', ok: 'ok' },
    ];
    const expectedStats = {
      Total: 2,
      Unique: 2,
      Broken: 0,
    };
    const result = await statsWithBroken(links);
    console.log(result); 
  });
})
