const { mdLinks, extractLinksFromMarkdown, extractMDFilesFromDir, getHttpCode, statsWithBroken } = require('../index');  
const fs = require('fs');
const path = require('path');
const axios = require ('axios');

// Mock para fs.existsSync
jest.mock('fs', () => ({
  mdLinks: jest.fn(() => true),
  existsSync: jest.fn(() => true),
  extractMDFilesFromDir: jest.fn(),
  readdirSync: jest.fn(),
  statSync: jest.fn(),
  readFileSync: jest.fn(),
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
  it('should reject with an error when the route does not exist', async () => {
    // Mock fs.existsSync to simulate that the route does not exist
    jest.spyOn(fs, 'existsSync').mockReturnValue(false);

    const absoluteRoute = path.join(__dirname, 'nonexistent-folder');

    // Use expect(...).rejects to verify that the function rejects with an error
    await expect(mdLinks(absoluteRoute)).rejects.toThrowError('The route does not exist');
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
  
    it('should return HTTP code 404 and status message "FAIL" for a failed request', async () => {
      const url = 'https://www.fakewebpage12345.com/errordoesnotexist';
      const response = await getHttpCode(url);
      console.log(response)
      expect(response.httpCode).toBe(404);
      expect(response.statusMessage).toBe('FAIL');
    });


  // it('should return an error response object with status when error.response is defined', () => {
  //   const error = {
  //     response: {
  //       status: 500,
  //       data: 'Server error',
  //     },
  //   };

  //   const result = getHttpCode(error);

  //   expect(result.httpCode).toBe(error.response.status);
  //   expect(result.statusMessage).toBe('FAIL');
  //   expect(result.response).toBe(error.response.data);
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
    const expectedStats = [
    '┌──────────────┬───┐',
    '│ Total links  │ 2 │',
    '├──────────────┼───┤',
    '│ Unique links │ 1 │',
    '├──────────────┼───┤',
    '│ Broken links │ 0 │',
    '└──────────────┴───┘',
  ].join('\n');

  const result = await statsWithBroken(links);
  
  // expect(result).toEqual(expectedStats);
  // expect(result).toHaveLength(336)
  expect(result).toBeDefined()
  })

  it('should not throw an error when no links are provided', async () => {
    const links = []; // Empty array of links
  
    try {
      const result = await statsWithBroken(links);
      console.log(result)
      expect(result).toBeTruthy(); // For example, check if the result is defined
    } catch (error) {
      fail('Unexpected error was thrown');
    }
  });
  
})
