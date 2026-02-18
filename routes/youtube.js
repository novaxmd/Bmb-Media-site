const chalk = require('chalk');
const ora = require('ora');
const inquirer = require('inquirer');
const { getApi, normalizer } = require('./api');
const { downloadFile, MAX_FILE_SIZE } = require('../utils/download');
const { fetchJson, handleError, generateFilename, getSelectedOption, buildDownloadChoices } = require('../utils/functions');

async function downloadYoutube(url, basePath = 'resultdownload_preniv') {
  const spinner = ora(' Fetching YouTube video data...').start();
  
  try {
    const rawData = await fetchJson(`${getApi.youtube}${encodeURIComponent(url)}`, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.210 Mobile Safari/537.36'
      }
    });

    if (!rawData || !rawData.status) {
      spinner.fail(chalk.red(' Failed to fetch YouTube video data'));
      console.log(chalk.gray('   • The API returned an error or invalid response'));
      return;
    }

    const data = normalizer.normalizeYouTube(rawData.data, 'primary');

    if (!data.downloads.video.length && !data.downloads.audio.length) {
      spinner.fail(chalk.red(' No download formats available'));
      console.log(chalk.gray('   • The video may be unavailable or restricted'));
      return;
    }

    spinner.succeed(chalk.green(' YouTube video data fetched successfully!'));
    console.log('');
    console.log(chalk.cyan(' Video Information:'));
    console.log(chalk.gray('   • ') + chalk.white(`Title: ${data.title || 'No title'}`));
    if (data.duration) {
      console.log(chalk.gray('   • ') + chalk.white(`Duration: ${Math.floor(data.duration / 60)}:${String(data.duration % 60).padStart(2, '0')}`));
    }
    console.log('');

    const videoWithAudio = data.downloads.video.filter(f => f.type === 'video_with_audio');
    const videoOnly = data.downloads.video.filter(f => f.type === 'video');
    const audioOnly = data.downloads.audio;

    const downloadChoices = buildDownloadChoices('youtube', { videoWithAudio, videoOnly, audioOnly });
    
    downloadChoices.push({
      name: chalk.gray(' Cancel'),
      value: 'cancel'
    });

    const { selectedDownload } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedDownload',
        message: 'Select download option:',
        choices: downloadChoices,
        pageSize: 15
      }
    ]);

    if (selectedDownload === 'cancel') {
      console.log(chalk.yellow('\n Download cancelled.'));
      return;
    }

    const downloadSpinner = ora(` Downloading ${selectedDownload.type}...`).start();
    const options = getSelectedOption('youtube', selectedDownload);
    const filename = generateFilename('youtube', {
      title: data.title,
      quality: selectedDownload.quality,
      ext: selectedDownload.format
    });
    await downloadFile(options.url, filename, downloadSpinner, basePath, options.maxSize);

  } catch (error) {
    handleError(error, spinner);
  }
}

module.exports = { downloadYouTube: downloadYoutube };
