const chalk = require('chalk');
const ora = require('ora');
const inquirer = require('inquirer');
const { getApi } = require('./api');
const { downloadFile } = require('../utils/download');
const { fetchJson, handleError, generateFilename, getSelectedOption, buildDownloadChoices } = require('../utils/functions');

async function downloadPinterest(url, basePath = 'resultdownload_preniv') {
  const spinner = ora(' Fetching Pinterest media data...').start();
  
  try {
    const data = await fetchJson(`${getApi.pinterest}${encodeURIComponent(url)}`, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.210 Mobile Safari/537.36'
      }
    });

    if (!data || !data.success) {
      spinner.fail(chalk.red(' Failed to fetch Pinterest media data'));
      console.log(chalk.gray('   • The API returned an error or invalid response'));
      return;
    }
    if (!data.data || !data.data.downloads || data.data.downloads.length === 0) {
      spinner.fail(chalk.red(' Invalid media data received'));
      console.log(chalk.gray('   • The pin may be unavailable or deleted'));
      return;
    }

    spinner.succeed(chalk.green(' Pinterest media data fetched successfully!'));
    console.log('');
    console.log(chalk.cyan(' Pin Information:'));
    if (data.data.title && data.data.title.trim()) {
      console.log(chalk.gray('   • ') + chalk.white(`Title: ${data.data.title}`));
    }
    console.log(chalk.gray('   • ') + chalk.white(`Found ${data.data.downloads.length} download option(s)`));
    console.log('');

    if (data.data.downloads.length === 1) {
      const media = data.data.downloads[0];
      const downloadSpinner = ora(' Downloading media...').start();
      const options = getSelectedOption('pinterest', media);
      const filename = generateFilename('pinterest', {
        quality: media.quality,
        ext: media.format.toLowerCase()
      });
      await downloadFile(options.url, filename, downloadSpinner, basePath);
    } else {
      const downloadChoices = buildDownloadChoices('pinterest', { downloads: data.data.downloads });
      downloadChoices.push({
        name: chalk.gray(' Cancel'),
        value: 'cancel'
      });

      const { selectedDownload } = await inquirer.prompt([
        {
          type: 'list',
          name: 'selectedDownload',
          message: 'Select quality to download:',
          choices: downloadChoices
        }
      ]);

      if (selectedDownload === 'cancel') {
        console.log(chalk.yellow('\n Download cancelled.'));
        return;
      }

      if (selectedDownload === 'all') {
        for (let i = 0; i < data.data.downloads.length; i++) {
          const media = data.data.downloads[i];
          const downloadSpinner = ora(` Downloading ${media.quality} (${i + 1}/${data.data.downloads.length})...`).start();
          const options = getSelectedOption('pinterest', media);
          const filename = generateFilename('pinterest', {
            quality: media.quality,
            ext: media.format.toLowerCase()
          });
          await downloadFile(options.url, filename, downloadSpinner, basePath);
        }
      } else {
        const downloadSpinner = ora(' Downloading selected media...').start();
        const options = getSelectedOption('pinterest', selectedDownload);
        const filename = generateFilename('pinterest', {
          quality: selectedDownload.quality,
          ext: selectedDownload.format.toLowerCase()
        });
        await downloadFile(options.url, filename, downloadSpinner, basePath);
      }
    }
  } catch (error) {
    handleError(error, spinner);
  }
}

module.exports = { downloadPinterest };
