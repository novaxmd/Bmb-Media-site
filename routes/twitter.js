const chalk = require('chalk');
const ora = require('ora');
const inquirer = require('inquirer');
const { getApi } = require('./api');
const { downloadFile } = require('../utils/download');
const { fetchJson, handleError, generateFilename, getSelectedOption, buildDownloadChoices } = require('../utils/functions');

async function downloadTwitter(url, basePath = 'resultdownload_preniv') {
  const spinner = ora(' Fetching Twitter video data...').start();

  try {
    const data = await fetchJson(`${getApi.twitter}${encodeURIComponent(url)}`, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.210 Mobile Safari/537.36'
      }
    });

    if (!data || !data.status) {
      spinner.fail(chalk.red(' Failed to fetch Twitter video data'));
      console.log(chalk.gray('   • The API returned an error or invalid response'));
      return;
    }
    if (!data.media || data.media.length === 0) {
      spinner.fail(chalk.red(' Invalid video data received'));
      console.log(chalk.gray('   • The video may be private or unavailable'));
      return;
    }

    spinner.succeed(chalk.green(' Twitter video data fetched successfully!'));
    console.log('');
    console.log(chalk.cyan(' Video Information:'));
    console.log(chalk.gray('   • ') + chalk.white(`Type: ${data.type || 'video'}`));
    console.log(chalk.gray('   • ') + chalk.white(`Found ${data.media.length} quality option(s)`));
    console.log('');

    if (data.media.length === 1) {
      const downloadSpinner = ora(' Downloading video...').start();
      const options = getSelectedOption('twitter', { url: data.media[0].url, quality: data.media[0].quality });
      const filename = generateFilename('twitter', {
        quality: data.media[0].quality
      });
      await downloadFile(options.url, filename, downloadSpinner, basePath);
    } else {
      const downloadChoices = buildDownloadChoices('twitter', { media: data.media });
      
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
      
      const downloadSpinner = ora(` Downloading ${selectedDownload.quality}p video...`).start();
      const options = getSelectedOption('twitter', selectedDownload);
      const filename = generateFilename('twitter', {
        quality: selectedDownload.quality
      });
      await downloadFile(options.url, filename, downloadSpinner, basePath);
    }
  } catch (error) {
    handleError(error, spinner);
  }
}

module.exports = { downloadTwitter };
