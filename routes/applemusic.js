const chalk = require('chalk');
const ora = require('ora');
const inquirer = require('inquirer');
const { getApi } = require('./api');
const { downloadFile, MAX_FILE_SIZE } = require('../utils/download');
const { fetchJson, handleError, generateFilename, getSelectedOption } = require('../utils/functions');

async function downloadAppleMusic(url, basePath = 'resultdownload_preniv') {
  const spinner = ora(' Fetching Apple Music track data...').start();
  
  try {
    const data = await fetchJson(`${getApi.applemusic}${encodeURIComponent(url)}`, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.210 Mobile Safari/537.36'
      }
    });

    if (!data || !data.status) {
      spinner.fail(chalk.red(' Failed to fetch Apple Music track data'));
      console.log(chalk.gray('   • The API returned an error or invalid response'));
      return;
    }
    if (!data.data || !data.data.mp3DownloadLink) {
      spinner.fail(chalk.red(' Invalid track data received'));
      console.log(chalk.gray('   • The track may be unavailable'));
      return;
    }

    spinner.succeed(chalk.green(' Apple Music track data fetched successfully!'));
    console.log('');
    console.log(chalk.cyan(' Track Information:'));
    console.log(chalk.gray('   • Song: ') + chalk.white(data.data.songTitle || 'No title'));
    console.log(chalk.gray('   • Artist: ') + chalk.white(data.data.artist || 'Unknown artist'));
    console.log(chalk.gray('   • Page: ') + chalk.white(data.data.pageTitle || 'N/A'));
    console.log('');

    const downloadChoices = [
      {
        name: '  Download MP3',
        value: { url: data.data.mp3DownloadLink, type: 'audio' }
      },
      {
        name: '  Download Cover Image',
        value: { url: data.data.coverDownloadLink, type: 'image' }
      },
      {
        name: chalk.gray(' Cancel'),
        value: 'cancel'
      }
    ];

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

    const downloadSpinner = ora(` Downloading ${selectedDownload.type}...`).start();
    const options = getSelectedOption('applemusic', selectedDownload);
    const filename = generateFilename('applemusic', {
      artist: data.data.artist,
      type: selectedDownload.type
    });
    await downloadFile(options.url, filename, downloadSpinner, basePath, options.maxSize);
    
  } catch (error) {
    handleError(error, spinner);
  }
}

module.exports = { downloadAppleMusic };
