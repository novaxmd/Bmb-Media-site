const chalk = require('chalk');
const ora = require('ora');
const { getApi } = require('./api');
const { downloadFile } = require('../utils/download');
const { fetchJson, handleError, generateFilename, getSelectedOption } = require('../utils/functions');

async function downloadThreads(url, basePath = 'resultdownload_preniv') {
  const spinner = ora(' Fetching Threads video data...').start();
  
  try {
    const data = await fetchJson(`${getApi.threads}${encodeURIComponent(url)}`, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.210 Mobile Safari/537.36'
      }
    });

    if (!data || !data.status) {
      spinner.fail(chalk.red(' Failed to fetch Threads video data'));
      console.log(chalk.gray('   • The API returned an error or invalid response'));
      return;
    }
    if (!data.data || !data.data.download) {
      spinner.fail(chalk.red(' Invalid video data received'));
      console.log(chalk.gray('   • The video may be unavailable or deleted'));
      return;
    }

    spinner.succeed(chalk.green(' Threads video data fetched successfully!'));
    console.log('');
    console.log(chalk.cyan(' Video Information:'));
    if (data.data.quality) {
      console.log(chalk.gray('   • ') + chalk.white(`Quality: ${data.data.quality}`));
    }
    console.log('');

    const downloadSpinner = ora(' Downloading video...').start();
    const options = getSelectedOption('threads', { url: data.data.download });
    const filename = generateFilename('threads');
    await downloadFile(options.url, filename, downloadSpinner, basePath);
  } catch (error) {
    handleError(error, spinner);
  }
}

module.exports = { downloadThreads };
