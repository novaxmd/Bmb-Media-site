const chalk = require('chalk');
const ora = require('ora');
const inquirer = require('inquirer');
const { getApi, normalizer } = require('./api');
const { downloadFile, getFileExtension } = require('../utils/download');
const { fetchJson, handleError, generateFilename, getSelectedOption, buildDownloadChoices } = require('../utils/functions');

async function downloadFacebook(url, basePath = 'resultdownload_preniv') {
  const spinner = ora(' Fetching Facebook video data...').start();
  
  try {
    const rawData = await fetchJson(`${getApi.facebook}${encodeURIComponent(url)}`, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.210 Mobile Safari/537.36'
      }
    });

    if (!rawData || !rawData.status) {
      spinner.fail(chalk.red(' Failed to fetch Facebook media data'));
      console.log(chalk.gray('   • The API returned an error or invalid response'));
      return;
    }

    const data = normalizer.normalizeFacebook(rawData.data, 'primary');

    if (!data.downloads || data.downloads.length === 0) {
      spinner.fail(chalk.red(' Invalid media data received'));
      console.log(chalk.gray('   • The media may be private or unavailable'));
      return;
    }

    spinner.succeed(chalk.green(' Facebook media data fetched successfully!'));
    console.log('');
    console.log(chalk.cyan(' Media Information:'));

    const downloadChoices = buildDownloadChoices('facebook', { downloads: data.downloads });
    
    downloadChoices.push({
      name: chalk.gray(' Cancel'),
      value: 'cancel'
    });
    const { selectedDownload } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedDownload',
        message: 'Select download option:',
        choices: downloadChoices
      }
    ]);

    if (selectedDownload === 'cancel') {
      console.log(chalk.yellow('\n Download cancelled.'));
      return;
    }

    const downloadSpinner = ora(` Downloading ${selectedDownload.resolution}...`).start();
    const options = getSelectedOption('facebook', selectedDownload);
    const filename = generateFilename('facebook', {
      resolution: selectedDownload.resolution,
      ext: selectedDownload.ext
    });
    await downloadFile(options.url, filename, downloadSpinner, basePath);
  } catch (error) {
    handleError(error, spinner);
  }
}

module.exports = { downloadFacebook };
