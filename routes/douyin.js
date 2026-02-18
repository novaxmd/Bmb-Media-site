const chalk = require('chalk');
const ora = require('ora');
const inquirer = require('inquirer');
const { getApi } = require('./api');
const { downloadFile } = require('../utils/download');
const { fetchJson, handleError, generateFilename, getSelectedOption, buildDownloadChoices } = require('../utils/functions');

async function downloadDouyin(url, basePath = 'resultdownload_preniv') {
  const spinner = ora(' Fetching Douyin video data...').start();
  
  try {
    const data = await fetchJson(`${getApi.douyin}${encodeURIComponent(url)}`, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.210 Mobile Safari/537.36'
      }
    });

    if (!data || !data.status) {
      spinner.fail(chalk.red(' Failed to fetch Douyin video data'));
      console.log(chalk.gray('   • The API returned an error or invalid response'));
      return;
    }
    if (!data.data || !data.data.videoLinks || data.data.videoLinks.length === 0) {
      spinner.fail(chalk.red(' Invalid video data received'));
      console.log(chalk.gray('   • The video may be private or unavailable'));
      return;
    }

    spinner.succeed(chalk.green(' Douyin video data fetched successfully!'));
    console.log('');
    console.log(chalk.cyan(' Video Information:'));
    if (data.data.timestamp) {
      console.log(chalk.gray('   • ') + chalk.white(`Duration: ${data.data.timestamp}`));
    }
    console.log('');

    const downloadChoices = buildDownloadChoices('douyin', { downloads: data.data.downloads });
    
    downloadChoices.push({
      name: chalk.gray(' Cancel'),
      value: 'cancel'
    });

    const { selectedDownload } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedDownload',
        message: 'Select download quality:',
        choices: downloadChoices
      }
    ]);

    if (selectedDownload === 'cancel') {
      console.log(chalk.yellow('\n Download cancelled.'));
      return;
    }

    const downloadSpinner = ora(' Downloading video...').start();
    const options = getSelectedOption('douyin', selectedDownload);
    const filename = generateFilename('douyin', {
      quality: selectedDownload.label
    });
    await downloadFile(options.url, filename, downloadSpinner, basePath);
  } catch (error) {
    handleError(error, spinner);
  }
}

module.exports = { downloadDouyin };
