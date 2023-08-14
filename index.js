const fs = require('fs');
const path = require('path');
const colors = require('colors');
const Table = require('cli-table');
const markdownLinkExtractor = require('markdown-link-extractor');
const axios = require('axios');


colors.setTheme({
  ok:'green',
  fail: 'red',
  info: 'blue',
  warn: 'yellow',
});

const mdLinks = (route = process.argv[2], options = {validate: false, stats: false}) => {
  config = { 
    columns: {
      0: {
        width: 20    // Column 0 of width 1
      },
      1: {
        width: 20  // Column 1 of width 20
      },
      2: {
        width: 20   // Column 2 of width 5
      }
    }
  };
  function extractLinksFromMarkdown(content) {
    const linkRegex = /\[(.*?)\]\((.*?)\)/g;
    const links = [];
    let match;
    while ((match = linkRegex.exec(content)) !== null) {
      const [, text, url] = match;
      links.push({ text, url });
    }
    return links;
  }
  
  function extractMDFilesFromDir(dirPath) {
    const mdFiles = [];
  
    fs.readdirSync(dirPath).forEach((file) => {
      const href = path.join(dirPath, file);
  
      if (fs.statSync(href).isFile() && path.extname(href) === '.md') {
        const mdContent = fs.readFileSync(href, 'utf-8');
        if (typeof mdContent === 'string' && mdContent.trim() !== '') {
          const links = extractLinksFromMarkdown(mdContent); // Extraer los enlaces del archivo .md usando la función con expresión regular
          mdFiles.push({
            path: href,
            content: mdContent,
            links: links,
          });
        } else {
          console.fail(colors.fail(`El archivo "${href}" tiene contenido no válido o está vacío.`));
        }
      } else if (fs.statSync(href).isDirectory()) {
        mdFiles.push(...extractMDFilesFromDir(href));
      }
    });
  
    return mdFiles;
  }

  return new Promise((resolve, reject) => {
    const isAbsolute = path.isAbsolute(route);
    const absoluteRoute = isAbsolute ? route : path.resolve(route);

    if (!fs.existsSync(absoluteRoute)) {
      const errorMessage = colors.fail('La ruta no existe');
      console.error(colors.fail(`El archivo en la ruta ${absoluteRoute} no existe.`));
      reject(new Error(errorMessage));
    } else {
      console.log(colors.ok(`El archivo en la ruta ${absoluteRoute} existe.`));

      fs.stat(absoluteRoute, (error, stats) => {
        if (error) {
          console.error(colors.fail(`Error al obtener información de la ruta ${absoluteRoute}.`));
          reject(error);
        } else {
          if (stats.isFile()) {
            console.log(`La ruta "${absoluteRoute}" es un archivo.`);
            const mdContent = fs.readFileSync(absoluteRoute, 'utf-8');
            const links = markdownLinkExtractor.extract(mdContent); // Extract links from the .md file
            resolve({ type: 'file', path: absoluteRoute, content: mdContent, links: links });
          } else if (stats.isDirectory()) {
            console.log(colors.warn(`La ruta "${absoluteRoute}" es un directorio.`));

            const files = fs.readdirSync(absoluteRoute);
            if (!files.length) {
              console.log(colors.warn(`El directorio "${absoluteRoute}" está vacío.`));
              resolve({ type: 'directory', path: absoluteRoute, contents: [], links: [] });
            } else {
              const mdFiles = extractMDFilesFromDir(absoluteRoute);
              const allLinks = mdFiles.flatMap((file) => file.links); // Combine links from all .md files
              resolve({ type: 'directory', path: absoluteRoute, contents: mdFiles, links: allLinks });
            }
          } else {
            console.log(`La ruta "${absoluteRoute}" no es ni un archivo ni un directorio.`);
            reject(new Error('Ruta desconocida'));
          }
        }
      });
    }
  });
};

async function getHttpCode(url) {
  try {
    const response = await axios.get(url);
    return { httpCode: response.status, statusMessage:'OK', response: response.data };
  } catch (error) {
    return { httpCode: colors.fail('404'), statusMessage: colors.fail('FAIL'), response: error.response.data };
  }
}

const statsWithBroken = async (links) => {
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

  const statsTable = new Table();
  statsTable.push({ 'Total Links': totalLinks });
  statsTable.push({ 'Unique Links': uniqueValidLinks });
  statsTable.push({ 'Broken Links': brokenLinks });

  return statsTable.toString();
};



module.exports = {
  mdLinks,
  getHttpCode,
  statsWithBroken
};

