const chalk = require('chalk');
const ora = require('ora');
const inquirer = require('inquirer');
const { getApi, normalizer } = require('./api');
const { downloadFile, MAX_FILE_SIZE } = require('../utils/download');
const { fetchJson, handleError, generateFilename, getSelectedOption } = require('../utils/functions');

async function downloadSpotify(url, basePath = 'resultdownload_preniv') {
  const spinner = ora(' Fetching Spotify track data...').start();
  
  try {
    const rawData = await fetchJson(`${getApi.spotify}${encodeURIComponent(url)}`, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.210 Mobile Safari/537.36'
      }
    });

    if (!rawData || !rawData.status) {
      spinner.fail(chalk.red(' Failed to fetch Spotify track data'));
      console.log(chalk.gray('   • The API returned an error or invalid response'));
      return;
    }

    const data = normalizer.normalizeSpotify(rawData.data, 'primary');

    if (!data.downloads || data.downloads.length === 0) {
      spinner.fail(chalk.red(' Invalid track data received'));
      console.log(chalk.gray('   • The track may be unavailable'));
      return;
    }

    spinner.succeed(chalk.green(' Spotify track data fetched successfully!'));
    console.log('');
    console.log(chalk.cyan(' Track Information:'));
    console.log(chalk.gray('   • ') + chalk.white(`Title: ${data.title || 'No title'}`));
    console.log(chalk.gray('   • ') + chalk.white(`Artist: ${data.author || 'Unknown artist'}`));
    if (data.duration) {
      console.log(chalk.gray('   • ') + chalk.white(`Duration: ${Math.floor(data.duration / 1000)}s`));
    }
    if (data.album) {
      console.log(chalk.gray('   • ') + chalk.white(`Album: ${data.album}`));
    }
    console.log('');

    const downloadChoices = data.downloads.map((download, index) => ({
      name: ` ${download.quality} - ${download.format.toUpperCase()}`,
      value: { url: download.url, type: 'audio', format: download.format, quality: download.quality, index }
    }));

    if (data.thumbnail) {
      downloadChoices.push({
        name: ' Download Cover Image',
        value: { url: data.thumbnail, type: 'image', format: 'jpg' }
      });
    }

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

    const downloadSpinner = ora(` Downloading ${selectedDownload.type}...`).start();
    const options = getSelectedOption('spotify', selectedDownload);
    const filename = generateFilename('spotify', {
      title: data.title,
      type: selectedDownload.type,
      ext: selectedDownload.format
    });
    await downloadFile(options.url, filename, downloadSpinner, basePath, options.maxSize);
    
  } catch (error) {
    handleError(error, spinner);
  }
}

module.exports = { downloadSpotify };
