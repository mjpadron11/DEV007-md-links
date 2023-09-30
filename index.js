const fs = require('fs');
const path = require('path');
const colors = require('colors');
const Table = require('cli-table');
// const markdownLinkExtractor = require('markdown-link-extractor');
const axios = require('axios');


colors.setTheme({
  ok:'green',
  fail: 'red',
  info: 'blue',
  warn: 'yellow',
});

function extractLinksFromMarkdown(content) {
  const linkRegex = /\[(.*?)\]\((.*?)\)/g;
  const links = [];
  let match;
  while ((match = linkRegex.exec(content)) !== null) {
    const [, text, url] = match;//Destructures the match in three parts, the whole coincidence will be 'match',
    //the text inside [] and url will be the link inside ()
    links.push({ text, url });
  }
  return links;
}

function extractMDFilesFromDir(dirPath) { 
const mdFiles = [];

  fs.readdirSync(dirPath).forEach((file) => { // Reads the content inside the directory and process each file and directory that could be within it.
    const href = path.join(dirPath, file); // For each element(file or directoy) it creates the complete route

    if (fs.statSync(href).isFile() && path.extname(href) === '.md') {
      const mdContent = fs.readFileSync(href, 'utf-8');
      if (typeof mdContent === 'string' && mdContent.trim() !== '') {
        const links = extractLinksFromMarkdown(mdContent); // Extracts links from .md file using regex
        mdFiles.push({
          path: href,
          content: mdContent,
          links: links,
        });
      } else {
        console.fail(colors.fail(`The file "${href}" contains unvalid content`));
      }
    } else if (fs.statSync(href).isDirectory()) {
      mdFiles.push(...extractMDFilesFromDir(href));
    }
  });

  return mdFiles;
}

const mdLinks = (route = process.argv[2], options = {validate: false, stats: false}) => {
  config = { 
    columns: {
      0: {
        width: 20    // Column 0 of width 1
      },
      1: {
        width: 20 
      },
      2: {
        width: 20 
      }
    }
  };
  

  return new Promise((resolve, reject) => {
    const isAbsolute = path.isAbsolute(route);
    const absoluteRoute = isAbsolute ? route : path.resolve(route);

    if (!fs.existsSync(absoluteRoute)) {
      const errorMessage = colors.fail('The route does not exist');
      console.error(colors.fail(`The file in the route ${colors.info(absoluteRoute)} does not exist.`));
      reject(new Error(errorMessage));
    } else {
      console.log(colors.ok(`The file in the route ${colors.info(absoluteRoute)} exists.`));

      fs.stat(absoluteRoute, (error, stats) => {
        if (error) {
          console.error(colors.fail(`Error when obtaining information from route ${absoluteRoute}.`));
          reject(error);
        } else {
          if (stats.isFile()) {
            console.log(`The route "${absoluteRoute}" is a file.`);
            const mdContent = fs.readFileSync(absoluteRoute, 'utf-8');
            // const links = markdownLinkExtractor.extract(mdContent); // Extract links from the .md file with a different
            const links = extractLinksFromMarkdown(mdContent);
            resolve({ type: 'file', path: absoluteRoute, content: mdContent, links: links });
          } else if (stats.isDirectory()) {
            console.log(colors.warn(`The route "${absoluteRoute}" is a directory.`));

            const files = fs.readdirSync(absoluteRoute);
            if (!files.length) {
              console.log(colors.warn(`The directory "${absoluteRoute}" is empty.`));
              resolve({ type: 'directory', path: absoluteRoute, contents: [], links: [] });
            } else {
              const mdFiles = extractMDFilesFromDir(absoluteRoute);
              const allLinks = mdFiles.flatMap((file) => file.links); // Combine links from all .md files
              resolve({ type: 'directory', path: absoluteRoute, contents: mdFiles, links: allLinks });
            }
          } else {
            console.log(`The route "${absoluteRoute}" is not a file nor a directory`);
            reject(new Error('Unknown route'));
          }
        }
      });
    }
  });
};

async function getHttpCode(url) {
  try {
    const response = await axios.get(url);
    return { httpCode: response.status, statusMessage: 'OK', response: response.data };
  } catch (error) {
    if (error.response) {
      // Verify if error.response is defined before acceding its properties
      return { httpCode: colors.fail(error.response.status), statusMessage: colors.fail('FAIL'), response: error.response.data };
    } else {
      return { httpCode: colors.fail('404'), statusMessage: colors.fail('FAIL'), response: 'Error without response' };
    }
  }
}

const statsWithBroken = async (links) => {
  if (links.length === 0) { //Validation in case no links were found 
    return colors.fail('No links were found.');
  }

  const totalLinks = links.length;
  const uniqueValidLinksSet = new Set();
  const brokenLinksSet = new Set();

  for (const link of links) {
    const { httpCode } = await getHttpCode(link.url);
    const parsedHttpCode = parseInt(httpCode);

    if (parsedHttpCode >= 200 && parsedHttpCode < 300) {
      uniqueValidLinksSet.add(link.url);
    } else {
      brokenLinksSet.add(link.url);
    }
  }

  const uniqueValidLinks = uniqueValidLinksSet.size;
  const brokenLinks = brokenLinksSet.size;

  // Define properties names and its values
  console.log('Stats found:');
  const statsData = [
    { name: 'Total links', value: totalLinks },
    { name: 'Unique links', value: uniqueValidLinks },
    { name: 'Broken links', value: brokenLinks },
];

const statsTable = new Table(config);

// Adds each property and value into the table
statsData.forEach(({ name, value }) => {
  const styledName = colors.info(name);
  statsTable.push({ [styledName]: value });
});
  return statsTable.toString();
};

module.exports = {
  mdLinks,
  extractLinksFromMarkdown, 
  extractMDFilesFromDir,
  getHttpCode,
  statsWithBroken
};

