import { load } from 'cheerio';

import got from '@/utils/got';

// Custom date parser for relative times like "7 hours ago"
function parseRelativeDate(relativeStr: string): Date {
    const now = new Date();
    const match = relativeStr.match(/(\d+)\s+(hour|minute|day)s?\s+ago/);
    if (!match) {
        return now;
    }
    const value = Number.parseInt(match[1]);
    const unit = match[2];
    if (unit === 'hour') {
        now.setHours(now.getHours() - value);
    }
    if (unit === 'minute') {
        now.setMinutes(now.getMinutes() - value);
    }
    if (unit === 'day') {
        now.setDate(now.getDate() - value);
    }
    return now;
}

export const route = {
    path: '/devtracker',
    radar: [
        {
            source: ['robertsspaceindustries.com/en/community/devtracker'],
            target: '/robertsspaceindustries/devtracker',
        },
    ],
    name: 'Star Citizen Dev Tracker',
    maintainers: ['xzcbvnm'],
    url: 'robertsspaceindustries.com/en/community/devtracker',
    description: 'Generates an RSS feed for the Star Citizen Dev Tracker.',
    async handler() {
        const link = 'https://robertsspaceindustries.com/en/community/devtracker';
        const response = await got(link);
        const $ = load(response.data);

        // Select each post container – <a> tag with class "devpost"
        const postItems = $('a.devpost').toArray();

        const items = postItems.map((item) => {
            const $item = $(item);

            // Extract data using the classes you provided
            const author = $item.find('.nickname').first().text().trim();
            const category = $item.find('.category').first().text().trim();
            const title = $item.find('.thread').first().text().trim();
            const dateText = $item.find('.time').first().text().trim();

            // Get the link from the <a> tag itself
            let postLink = $item.attr('href');
            if (postLink && !postLink.startsWith('http')) {
                postLink = `https://robertsspaceindustries.com${postLink}`;
            }

            // Build description (you can also use the full .topic text if you prefer)
            const description = `
                <strong>Category:</strong> ${category}<br>
                <strong>Title:</strong> ${title}<br>
                <strong>Author:</strong> ${author}<br>
                <strong>Posted:</strong> ${dateText}
            `;

            return {
                title: `${category}: ${title}`,
                link: postLink,
                description,
                author,
                pubDate: parseRelativeDate(dateText), // using custom parser
                guid: postLink,
            };
        });

        return {
            title: 'Star Citizen - Dev Tracker',
            link,
            description: 'Tracks developer posts from the Star Citizen Dev Tracker',
            item: items,
            language: 'en',
        };
    },
};
