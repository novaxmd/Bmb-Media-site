const chalk = require('chalk');
const ora = require('ora');
const { getApi } = require('./api');
const { downloadFile } = require('../utils/download');
const { fetchJson, handleError, generateFilename, getSelectedOption } = require('../utils/functions');

async function downloadBluesky(url, basePath = 'resultdownload_preniv') {
  const spinner = ora(' Fetching Bluesky post data...').start();
  
  try {
    const data = await fetchJson(`${getApi.bluesky}${encodeURIComponent(url)}`, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.210 Mobile Safari/537.36'
      }
    });

    if (!data || !data.status) {
      spinner.fail(chalk.red(' Failed to fetch Bluesky post data'));
      console.log(chalk.gray('   • The API returned an error or invalid response'));
      return;
    }
    if (!data.data || !data.data.downloadLink) {
      spinner.fail(chalk.red(' Invalid post data received'));
      console.log(chalk.gray('   • The post may be private or unavailable'));
      return;
    }

    spinner.succeed(chalk.green(' Bluesky post data fetched successfully!'));
    console.log('');
    console.log(chalk.cyan(' Post Information:'));
    if (data.data.profile) {
      console.log(chalk.gray('   • ') + chalk.white(`Author: ${data.data.profile.name} (${data.data.profile.handle})`));
    }
    if (data.data.caption && data.data.caption.trim()) {
      const shortCaption = data.data.caption.length > 100 
        ? data.data.caption.substring(0, 100) + '...' 
        : data.data.caption;
      console.log(chalk.gray('   • ') + chalk.white(`Caption: ${shortCaption}`));
    }
    
    const mediaType = data.data.videoUrl ? 'video' : 'image';
    console.log(chalk.gray('   • ') + chalk.white(`Media Type: ${mediaType}`));
    console.log('');

    const downloadSpinner = ora(` Downloading ${mediaType}...`).start();
    const options = getSelectedOption('bluesky', { downloadLink: data.data.downloadLink, type: mediaType });
    const filename = generateFilename('bluesky', {
      handle: data.data.profile?.handle,
      type: mediaType
    });
    await downloadFile(options.url, filename, downloadSpinner, basePath);
    
  } catch (error) {
    handleError(error, spinner);
  }
}

module.exports = { downloadBluesky };
