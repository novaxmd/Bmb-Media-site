const { program } = require('commander');
const { version } = require('./package.json');
const { startInteractive, currentDownloadPath } = require('./utils/input');
const { showBanner, showStatusFooter } = require('./utils/helpers');
const { PLATFORM_CONFIG } = require('./utils/config');

program
  .name('prnvapp')
  .description('Social Media Downloader CLI')
  .version(version)
  .option('-p, --path <directory>', 'Custom download directory (default: "resultdownload_preniv")', 'resultdownload_preniv');

program
  .command('interactive')
  .alias('i')
  .description('Start interactive mode')
  .action(startInteractive);

PLATFORM_CONFIG.forEach(platform => {
  const cmd = program.command(`${platform.command} <url>`);
  
  if (platform.alias) {
    cmd.alias(platform.alias);
  }
  
  cmd
    .description(`Download from ${platform.name}`)
    .action(async (url) => {
      showBanner();
      await platform.handler(url, program.opts().path || currentDownloadPath);
      showStatusFooter();
    });
});

if (process.argv.length === 2) {
  startInteractive();
} else {
  program.parse();
}
