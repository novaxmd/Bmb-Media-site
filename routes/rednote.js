const ora = require('ora');
const inquirer = require('inquirer');
const { getApi } = require('./api');
const { downloadFile } = require('../utils/download');
const { fetchJson, handleError, generateFilename, getSelectedOption, buildDownloadChoices } = require('../utils/functions');

async function downloadRedNote(url, basePath = 'resultdownload_preniv') {
  const spinner = ora(' Fetching RedNote/Xiaohongshu media data...').start();
  
  try {
    const data = await fetchJson(`${getApi.rednote}${encodeURIComponent(url)}`, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.210 Mobile Safari/537.36'
      }
    });

    if (!data || !data.status || data.status !== 200) {
      spinner.fail(chalk.red(' Failed to fetch RedNote media data'));
      console.log(chalk.gray('   • The API returned an error or invalid response'));
      return;
    }
    if (!data.data) {
      console.log(chalk.gray('   • The post may be private or unavailable'));
      return;
    }

    spinner.succeed(chalk.green(' RedNote media data fetched successfully!'));
    console.log('');
    console.log(chalk.cyan(' Post Information:'));
    if (data.data.title && data.data.title.trim()) {
      console.log(chalk.gray('   • ') + chalk.white(`Title: ${data.data.title}`));
    }
    if (data.data.nickname && data.data.nickname.trim()) {
      console.log(chalk.gray('   • ') + chalk.white(`Creator: ${data.data.nickname}`));
    }
    if (data.data.desc && data.data.desc.trim()) {
      console.log(chalk.gray('   • ') + chalk.white(`Description: ${data.data.desc}`));
    }
    if (data.data.duration) {
      console.log(chalk.gray('   • ') + chalk.white(`Duration: ${data.data.duration}`));
    }
    if (data.data.engagement) {
      console.log(chalk.gray('   • ') + chalk.white(`Likes: ${data.data.engagement.likes} | Comments: ${data.data.engagement.comments} | Collects: ${data.data.engagement.collects}`));
    }
    console.log('');

    const hasImages = data.data.images && data.data.images.length > 0;

    if (!hasVideos && !hasImages) {
      console.log(chalk.yellow(' No downloadable media found in this post.'));
      return;
    }

    const downloadChoices = buildDownloadChoices('rednote', { 
      videos: hasVideos ? data.data.downloads : [], 
      images: hasImages ? data.data.images : [] 
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

    if (selectedDownload === 'all') {
      let downloadIndex = 0;
      const totalItems = (hasVideos ? data.data.downloads.length : 0) + (hasImages ? data.data.images.length : 0);
      if (hasVideos) {
        for (let i = 0; i < data.data.downloads.length; i++) {
          downloadIndex++;
          const video = data.data.downloads[i];
          const downloadSpinner = ora(` Downloading video ${video.quality} (${downloadIndex}/${totalItems})...`).start();
          const options = getSelectedOption('rednote', { url: video.url, type: 'video', data: video });
          const filename = generateFilename('rednote', {
            type: 'video',
            quality: video.quality,
            index: i
          });
          await downloadFile(options.url, filename, downloadSpinner, basePath);
        }
      }
      
      if (hasImages) {
        for (let i = 0; i < data.data.images.length; i++) {
          downloadIndex++;
          const image = data.data.images[i];
          const downloadSpinner = ora(` Downloading image ${i + 1} (${downloadIndex}/${totalItems})...`).start();
          const options = getSelectedOption('rednote', { url: image, type: 'image', data: image });
          const filename = generateFilename('rednote', {
            type: 'image',
            index: i
          });
          await downloadFile(options.url, filename, downloadSpinner, basePath);
        }
      }
    } else {
      const downloadSpinner = ora(' Downloading media...').start();
      const options = getSelectedOption('rednote', selectedDownload);
      if (selectedDownload.type === 'video') {
        const video = selectedDownload.data;
        const filename = generateFilename('rednote', {
          type: 'video',
          quality: video.quality
        });
        await downloadFile(options.url, filename, downloadSpinner, basePath);
      } else if (selectedDownload.type === 'image') {
        const filename = generateFilename('rednote', { type: 'image' });
        await downloadFile(options.url, filename, downloadSpinner, basePath);
      }
    }
  } catch (error) {
    handleError(error, spinner);
  }
}

module.exports = { downloadRedNote };
