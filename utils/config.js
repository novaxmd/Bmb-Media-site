const { downloadTikTok } = require('../routes/tiktok');
const { downloadFacebook } = require('../routes/facebook');
const { downloadInstagram } = require('../routes/instagram');
const { downloadTwitter } = require('../routes/twitter');
const { downloadDouyin } = require('../routes/douyin');
const { downloadSpotify } = require('../routes/spotify');
const { downloadPinterest } = require('../routes/pinterest');
const { downloadAppleMusic } = require('../routes/applemusic');
const { downloadYouTube } = require('../routes/youtube');
const { downloadCapcut } = require('../routes/capcut');
const { downloadBluesky } = require('../routes/bluesky');
const { downloadRedNote } = require('../routes/rednote');
const { downloadThreads } = require('../routes/threads');
const { downloadKuaishou } = require('../routes/kuaishou');
const { downloadWeibo } = require('../routes/weibo');

const PLATFORM_CONFIG = [
  {
    name: 'TikTok',
    command: 'tiktok',
    domains: ['tiktok.com'],
    mediaType: 'video',
    handler: downloadTikTok,
    exampleUrl: 'https://www.tiktok.com/@username/video/1234567890'
  },
  {
    name: 'Facebook',
    command: 'facebook',
    alias: 'fb',
    domains: ['facebook.com', 'fb.watch'],
    mediaType: 'video',
    handler: downloadFacebook,
    exampleUrl: 'https://www.facebook.com/watch/?v=1234567890'
  },
  {
    name: 'Instagram',
    command: 'instagram',
    alias: 'ig',
    domains: ['instagram.com'],
    mediaType: 'media',
    handler: downloadInstagram,
    exampleUrl: 'https://www.instagram.com/p/ABC123/'
  },
  {
    name: 'Twitter',
    command: 'twitter',
    alias: 'tw',
    domains: ['twitter.com', 'x.com'],
    mediaType: 'video',
    handler: downloadTwitter,
    exampleUrl: 'https://twitter.com/user/status/1234567890'
  },
  {
    name: 'Douyin',
    command: 'douyin',
    alias: 'dy',
    domains: ['douyin.com'],
    mediaType: 'video',
    handler: downloadDouyin,
    exampleUrl: 'https://www.douyin.com/video/1234567890'
  },
  {
    name: 'Spotify',
    command: 'spotify',
    alias: 'sp',
    domains: ['spotify.com'],
    mediaType: 'track',
    handler: downloadSpotify,
    exampleUrl: 'https://open.spotify.com/track/ABC123'
  },
  {
    name: 'Pinterest',
    command: 'pinterest',
    alias: 'pin',
    domains: ['pinterest.com', 'pin.it'],
    mediaType: 'pin',
    handler: downloadPinterest,
    exampleUrl: 'https://www.pinterest.com/pin/1234567890/'
  },
  {
    name: 'Apple Music',
    command: 'applemusic',
    alias: 'am',
    domains: ['music.apple.com'],
    mediaType: 'track',
    handler: downloadAppleMusic,
    customMatch: (hostname, url) => hostname.includes('apple.com') && url.includes('music.apple.com'),
    exampleUrl: 'https://music.apple.com/id/album/song/123456'
  },
  {
    name: 'YouTube',
    command: 'youtube',
    alias: 'yt',
    domains: ['youtube.com', 'youtu.be'],
    mediaType: 'video',
    handler: downloadYouTube,
    exampleUrl: 'https://www.youtube.com/watch?v=ABC123'
  },
  {
    name: 'CapCut',
    command: 'capcut',
    alias: 'cc',
    domains: ['capcut.com'],
    mediaType: 'video',
    handler: downloadCapcut,
    exampleUrl: 'https://www.capcut.com/tv2/ABC123/'
  },
  {
    name: 'Bluesky',
    command: 'bluesky',
    alias: 'bsky',
    domains: ['bsky.app', 'bsky.social'],
    mediaType: 'post',
    handler: downloadBluesky,
    exampleUrl: 'https://bsky.app/profile/user.bsky.social/post/ABC123'
  },
  {
    name: 'RedNote/Xiaohongshu',
    command: 'rednote',
    alias: 'xhs',
    domains: ['xiaohongshu.com', 'xhslink.com'],
    mediaType: 'post',
    handler: downloadRedNote,
    exampleUrl: 'https://www.xiaohongshu.com/explore/ABC123'
  },
  {
    name: 'Threads',
    command: 'threads',
    domains: ['threads.net'],
    mediaType: 'video',
    handler: downloadThreads,
    exampleUrl: 'https://www.threads.net/@username/post/ABC123'
  },
  {
    name: 'Kuaishou',
    command: 'kuaishou',
    alias: 'ks',
    domains: ['kuaishou.com', 'ksurl.cn'],
    mediaType: 'media',
    handler: downloadKuaishou,
    exampleUrl: 'https://www.kuaishou.com/short-video/ABC123'
  },
  {
    name: 'Weibo',
    command: 'weibo',
    alias: 'wb',
    domains: ['weibo.com', 'weibo.cn'],
    mediaType: 'media',
    handler: downloadWeibo,
    exampleUrl: 'https://weibo.com/tv/show/ABC123'
  }
];

function matchPlatform(hostname, url) {
  for (const platform of PLATFORM_CONFIG) {
    if (platform.customMatch) {
      if (platform.customMatch(hostname, url)) {
        return platform;
      }
    } else {
      for (const domain of platform.domains) {
        if (hostname.endsWith(domain) || hostname === domain) {
          return platform;
        }
      }
    }
  }
  return null;
}

module.exports = { PLATFORM_CONFIG, matchPlatform };
