const chalk = require('chalk');
const ora = require('ora');
const inquirer = require('inquirer');
const { getApi } = require('./api');
const { downloadFile } = require('../utils/download');
const { fetchJson, handleError, generateFilename, getSelectedOption, buildDownloadChoices } = require('../utils/functions');

async function downloadCapcut(url, basePath = 'resultdownload_preniv') {
  const spinner = ora(' Fetching CapCut video data...').start();
  
  try {
    const data = await fetchJson(`${getApi.capcut}${encodeURIComponent(url)}`, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.210 Mobile Safari/537.36'
      }
    });

    if (!data || !data.status) {
      spinner.fail(chalk.red(' Failed to fetch CapCut video data'));
      console.log(chalk.gray('   • The API returned an error or invalid response'));
      return;
    }
    if (!data.data || !data.data.medias || data.data.medias.length === 0) {
      spinner.fail(chalk.red(' Invalid video data received'));
      console.log(chalk.gray('   • The video may be private or unavailable'));
      return;
    }

    spinner.succeed(chalk.green(' CapCut video data fetched successfully!'));
    console.log('');
    console.log(chalk.cyan(' Video Information:'));
    console.log(chalk.gray('   • ') + chalk.white(`Title: ${data.data.title || 'No title'}`));
    console.log(chalk.gray('   • ') + chalk.white(`Author: ${data.data.author || 'Unknown'}`));
    console.log(chalk.gray('   • ') + chalk.white(`Duration: ${Math.floor(data.data.duration / 1000)}s`));
    console.log(chalk.gray('   • ') + chalk.white(`ID: ${data.data.id}`));
    console.log('');

    if (data.data.medias.length === 1) {
      const media = data.data.medias[0];
      const downloadSpinner = ora(` Downloading ${media.quality}...`).start();
      const options = getSelectedOption('capcut', media);
      const filename = generateFilename('capcut', {
        id: data.data.unique_id,
        quality: media.quality,
        ext: media.extension
      });
      await downloadFile(options.url, filename, downloadSpinner, basePath);
    } else {
      const downloadChoices = buildDownloadChoices('capcut', { medias: data.data.medias });
      
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

      const downloadSpinner = ora(` Downloading ${selectedDownload.quality}...`).start();
      const options = getSelectedOption('capcut', selectedDownload);
      const filename = generateFilename('capcut', {
        id: data.data.unique_id,
        quality: selectedDownload.quality,
        ext: selectedDownload.extension
      });
      await downloadFile(options.url, filename, downloadSpinner, basePath);
    }
  } catch (error) {
    handleError(error, spinner);
  }
}

module.exports = { downloadCapcut };
