const chalk = require('chalk');
const ora = require('ora');
const inquirer = require('inquirer');
const { getApi, normalizer } = require('./api');
const { downloadFile } = require('../utils/download');
const { fetchJson, handleError, generateFilename, getSelectedOption, buildDownloadChoices } = require('../utils/functions');

async function downloadTikTok(url, basePath = 'resultdownload_preniv') {
  const spinner = ora(' Fetching TikTok video data...').start();
  
  let data = null;
  let apiVersion;
  
  try {
    try {
      const response = await fetchJson(`${getApi.tiktok}${encodeURIComponent(url)}`, {
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.210 Mobile Safari/537.36'
        }
      });
      
      if (response && response.status && response.data) {
        data = normalizer.normalizeTikTok(response.data, 'primary');
        apiVersion = 'default';
      } else {
        const errorMsg = response?.message || 'Invalid default response';
        throw new Error(errorMsg);
      }
    } catch (defaultError) {
      spinner.text = ' Fetching TikTok video data (v1 fallback)...';
      const response = await fetchJson(`${getApi.tiktokV1}${encodeURIComponent(url)}`, {
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.210 Mobile Safari/537.36'
        }
      });
      
      if (response && response.status && response.data) {
        data = normalizer.normalizeTikTok(response.data, 'v1');
        apiVersion = 'v1';
      } else {
        const errorMsg = response?.message || defaultError.message || 'Both default and v1 APIs failed';
        throw new Error(errorMsg);
      }
    }

    if (!data || (!data.downloads.video.length && !data.downloads.audio.length && !data.downloads.image.length)) {
      spinner.fail(chalk.red(' Failed to fetch TikTok video data'));
      console.log(chalk.gray('   • The API returned an error or invalid response'));
      return;
    }

    spinner.succeed(chalk.green(` TikTok video data fetched successfully! (using ${apiVersion})`));
    console.log('');
    console.log(chalk.cyan(' Video Information:'));
    console.log(chalk.gray('   • ') + chalk.white(`Title: ${data.title || 'No title'}`));
    if (data.author) {
      console.log(chalk.gray('   • ') + chalk.white(`Author: ${data.author}`));
    }
    if (data.metadata.audio_title) {
      console.log(chalk.gray('   • ') + chalk.white(`Audio: ${data.metadata.audio_title}`));
    }
    console.log('');

    const downloadChoices = buildDownloadChoices('tiktok', { 
      videos: data.downloads.video, 
      audios: data.downloads.audio, 
      images: data.downloads.image 
    });
    
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
    
    if (selectedDownload.type === 'all-images') {
      const downloadSpinner = ora(` Downloading all images...`).start();
      const timestamp = Date.now();
      
      for (let i = 0; i < selectedDownload.urls.length; i++) {
        const url = selectedDownload.urls[i];
        const urlLower = url.toLowerCase();
        let extension = 'jpg';
        
        if (urlLower.includes('.jpeg') || urlLower.includes('.jpg')) {
          extension = 'jpg';
        } else if (urlLower.includes('.png')) {
          extension = 'png';
        } else if (urlLower.includes('.webp')) {
          extension = 'webp';
        }
        
        const filename = `tiktok_${timestamp}_image_${i + 1}.${extension}`;
        await downloadFile(url, filename, downloadSpinner, basePath);
      }
      
      downloadSpinner.succeed(chalk.green(` Downloaded ${selectedDownload.urls.length} images successfully!`));
      return;
    }
    
    const downloadSpinner = ora(` Downloading ${selectedDownload.text}...`).start();
    const options = getSelectedOption('tiktok', selectedDownload);
    let extension = 'mp4';
    if (selectedDownload.type === 'audio') {
      extension = 'mp3';
    } else if (selectedDownload.type === 'image') {
      const url = selectedDownload.url.toLowerCase();
      if (url.includes('.jpeg') || url.includes('.jpg')) {
        extension = 'jpg';
      } else if (url.includes('.png')) {
        extension = 'png';
      } else if (url.includes('.webp')) {
        extension = 'webp';
      }
    }
    const filename = generateFilename('tiktok', {
      type: selectedDownload.type,
      ext: extension
    });
    await downloadFile(options.url, filename, downloadSpinner, basePath);
  } catch (error) {
    handleError(error, spinner);
  }
}

module.exports = { downloadTikTok };
