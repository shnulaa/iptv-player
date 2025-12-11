import { Channel } from '../types';

export function parseM3U(content: string): { channels: Partial<Channel>[]; groups: string[] } {
  const lines = content.split('\n').map(line => line.trim()).filter(line => line);
  const channels: Partial<Channel>[] = [];
  const groupsSet = new Set<string>();
  
  let currentChannel: Partial<Channel> | null = null;
  
  for (const line of lines) {
    if (line.startsWith('#EXTINF:')) {
      const extinf = line.substring(8);
      
      const tvgIdMatch = extinf.match(/tvg-id="([^"]*)"/);
      const tvgNameMatch = extinf.match(/tvg-name="([^"]*)"/);
      const tvgLogoMatch = extinf.match(/tvg-logo="([^"]*)"/);
      const groupMatch = extinf.match(/group-title="([^"]*)"/);
      const nameMatch = extinf.match(/,(.+)$/);
      
      const group = groupMatch ? groupMatch[1] : '未分类';
      groupsSet.add(group);
      
      currentChannel = {
        name: nameMatch ? nameMatch[1].trim() : 'Unknown',
        tvg_id: tvgIdMatch ? tvgIdMatch[1] : undefined,
        tvg_name: tvgNameMatch ? tvgNameMatch[1] : undefined,
        logo: tvgLogoMatch ? tvgLogoMatch[1] : undefined,
        group_title: group,
        status: 'unknown',
      };
    } else if (!line.startsWith('#') && currentChannel) {
      currentChannel.url = line;
      channels.push(currentChannel);
      currentChannel = null;
    }
  }
  
  return { channels, groups: Array.from(groupsSet).sort() };
}

export function exportM3U(channels: Channel[]): string {
  let content = '#EXTM3U\n';
  
  for (const ch of channels) {
    let extinf = '#EXTINF:-1';
    if (ch.tvg_id) extinf += ` tvg-id="${ch.tvg_id}"`;
    if (ch.tvg_name) extinf += ` tvg-name="${ch.tvg_name}"`;
    if (ch.logo) extinf += ` tvg-logo="${ch.logo}"`;
    if (ch.group_title) extinf += ` group-title="${ch.group_title}"`;
    extinf += `,${ch.name}`;
    content += extinf + '\n' + ch.url + '\n';
  }
  
  return content;
}
